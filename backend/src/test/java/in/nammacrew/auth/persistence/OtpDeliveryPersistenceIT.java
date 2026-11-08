package in.nammacrew.auth.persistence;

import static org.junit.jupiter.api.Assertions.*;

import in.nammacrew.auth.foundation.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.spec.SecretKeySpec;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/** Manual opt-in only, no Testcontainers and no application context/services. */
@EnabledIfEnvironmentVariable(named = "LABOURLY_OTP_DB_TEST_APPROVED", matches = "YES")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OtpDeliveryPersistenceIT {
  JdbcTemplate db;
  OtpDeliveryStore store;
  UUID generation;

  @BeforeAll
  void migrateEmptyDisposableDatabase() {
    String url = System.getenv("LABOURLY_OTP_TEST_JDBC_URL");
    assertNotNull(url);
    assertEquals("jdbc:postgresql://127.0.0.1:55484/labourly_otp_test_b15_20261027", url);
    assertEquals("otp_fixture", System.getenv("LABOURLY_OTP_TEST_USER"));
    var ds =
        new DriverManagerDataSource(
            url,
            System.getenv("LABOURLY_OTP_TEST_USER"),
            System.getenv("LABOURLY_OTP_TEST_PASSWORD"));
    db = new JdbcTemplate(ds);
    assertEquals(
        "labourly_otp_test_b15_20261027",
        db.queryForObject("SELECT current_database()", String.class));
    assertEquals("otp_fixture", db.queryForObject("SELECT current_user", String.class));
    for (String catalog : List.of("pg_class", "pg_proc", "pg_type")) {
      String namespaceColumn =
          switch (catalog) {
            case "pg_class" -> "relnamespace";
            case "pg_proc" -> "pronamespace";
            default -> "typnamespace";
          };
      assertEquals(
          0,
          db.queryForObject(
              "SELECT count(*) FROM "
                  + catalog
                  + " c JOIN pg_namespace n ON n.oid=c."
                  + namespaceColumn
                  + " WHERE n.nspname='public'",
              Integer.class),
          "Refuse nonempty public schema");
    }
    var flyway = Flyway.configure().dataSource(ds).locations("classpath:db/migration").load();
    assertEquals(14, flyway.migrate().migrationsExecuted);
    flyway.validate();
    assertEquals(
        java.util.stream.IntStream.rangeClosed(1, 14).mapToObj(Integer::toString).toList(),
        db.queryForList(
            "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank",
            String.class));
    assertEquals(
        "CLOSED", db.queryForObject("SELECT mode FROM otp_operational_control", String.class));
    for (String index :
        List.of(
            "otp_challenges_created_idx",
            "otp_outbox_request_key_idx",
            "otp_outbox_poll_idx",
            "otp_outbox_lease_idx",
            "otp_attempt_message_idx",
            "otp_attempt_started_idx",
            "otp_callback_unresolved_idx",
            "otp_outbox_retention_idx",
            "otp_callback_received_idx",
            "otp_callback_attempt_idx"))
      assertEquals(
          true,
          db.queryForObject(
              "SELECT i.indisvalid AND i.indisready FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=?",
              Boolean.class,
              index));
    assertEquals(
        true,
        db.queryForObject(
            "SELECT convalidated FROM pg_constraint WHERE conrelid='otp_challenges'::regclass AND conname='otp_invalidation_pair'",
            Boolean.class));
    store = new OtpDeliveryStore(db, new DataSourceTransactionManager(ds));
  }

  @BeforeEach
  void isolatedFixtures() {
    db.execute("TRUNCATE otp_sms_callback_events,otp_sms_attempts,otp_sms_outbox,otp_challenges");
    generation = UUID.randomUUID();
    db.update(
        "UPDATE otp_operational_control SET mode='NORMAL',generation=?,quiesced_at=clock_timestamp()-interval '25 hours',approved_at=clock_timestamp(),incident_ref='synthetic-test',restricted_until=NULL",
        generation);
  }

  OtpDeliveryStore.Intent intent(String phone, byte[] binding) {
    var context =
        new OtpContext(
            UUID.randomUUID(), UUID.randomUUID(), "MSG91", "v1", Instant.now().plusSeconds(290));
    var cipher = new OtpCipher(id -> new SecretKeySpec(new byte[32], "AES"));
    return new OtpDeliveryStore.Intent(
        phone,
        "$2a$10$" + "a".repeat(53),
        context,
        "test",
        cipher.encrypt("test-only", "654321".getBytes(), context.aad()),
        binding);
  }

  UUID enqueue() {
    return store.enqueue(intent("+919000000001", null), generation);
  }

  @Test
  void migrationsAndClosedDefaultConstraint() {
    assertEquals(
        "14",
        db.queryForObject(
            "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1",
            String.class));
    db.update("UPDATE otp_operational_control SET mode='CLOSED'");
    assertDomain("OTP control closed", this::enqueue);
    assertEquals(0, db.queryForObject("SELECT count(*) FROM otp_challenges", Integer.class));
  }

  @Test
  void atomicRollbackOnUniqueBinding() {
    byte[] binding = new byte[32];
    store.enqueue(intent("+919000000001", binding), generation);
    assertSql(
        "23505",
        "otp_outbox_request_key_idx",
        () -> store.enqueue(intent("+919000000002", binding), generation));
    assertEquals(1, db.queryForObject("SELECT count(*) FROM otp_challenges", Integer.class));
    assertEquals(1, db.queryForObject("SELECT count(*) FROM otp_sms_outbox", Integer.class));
  }

  @Test
  void concurrentPhoneCooldown() {
    try (var executor = Executors.newFixedThreadPool(2)) {
      var ready = new CountDownLatch(2);
      var start = new CountDownLatch(1);
      Callable<Boolean> call =
          () -> {
            ready.countDown();
            start.await();
            try {
              enqueue();
              return true;
            } catch (IllegalStateException e) {
              assertEquals("OTP quota unavailable", e.getMessage());
              return false;
            }
          };
      var a = executor.submit(call);
      var b = executor.submit(call);
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      assertEquals(
          1, (a.get(20, TimeUnit.SECONDS) ? 1 : 0) + (b.get(20, TimeUnit.SECONDS) ? 1 : 0));
    } catch (Exception e) {
      throw new AssertionError(e);
    }
  }

  @Test
  void fencingAndUnknownNeverResent() {
    UUID id = enqueue();
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    var stale =
        new OtpDeliveryStore.Claim(
            id, claim.owner(), claim.fence() + 1, generation, claim.expiresAt());
    assertDomain("Stale dispatch permit", () -> store.startAttempt(stale));
    UUID attempt = store.startAttempt(claim);
    assertDomain("Not claimed", () -> store.startAttempt(claim));
    store.complete(attempt, new SmsAdapter.Result(SmsAdapter.Outcome.UNKNOWN, null, false));
    store.complete(
        attempt, new SmsAdapter.Result(SmsAdapter.Outcome.DEFINITELY_NOT_SENT, null, true));
    assertEquals(
        "UNKNOWN",
        db.queryForObject("SELECT state FROM otp_sms_outbox WHERE id=?", String.class, id));
    assertTrue(store.claim(id, UUID.randomUUID(), generation).isEmpty());
  }

  @Test
  void claimLeaseRecoveryChangesFence() {
    UUID id = enqueue();
    var old = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    db.update(
        "UPDATE otp_sms_outbox SET lease_until=clock_timestamp()-interval '1 second' WHERE id=?",
        id);
    store.sweep();
    var next = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    assertTrue(next.fence() > old.fence());
    assertDomain("Stale dispatch permit", () -> store.startAttempt(old));
  }

  @Test
  void globalAdmissionCountsExistingHistory() {
    for (int i = 0; i < 100; i++)
      db.update(
          "INSERT INTO otp_challenges(phone,code_hash,expires_at) VALUES(?, 'test-hash',clock_timestamp()+interval '5 minutes')",
          "+91800" + String.format("%07d", i));
    assertDomain("OTP quota unavailable", this::enqueue);
  }

  @Test
  void restrictedDispatchCountsNormalHistory() {
    UUID id = enqueue();
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    // Durable history is retained across mode transitions; no fresh budget.
    db.update(
        "UPDATE otp_operational_control SET mode='RESTRICTED',restricted_until=approved_at+interval '1 hour'");
    for (int i = 0; i < 10; i++) {
      UUID c = UUID.randomUUID(), o = UUID.randomUUID();
      db.update(
          "INSERT INTO otp_challenges(id,phone,code_hash,expires_at) VALUES(?, '+919000000009','test',clock_timestamp()+interval '5 minutes')",
          c);
      db.update(
          "INSERT INTO otp_sms_outbox(id,challenge_id,provider,template_key,template_version,state,key_id,expires_at,available_at) VALUES(?,?,'MSG91','test','v1','UNKNOWN','test',clock_timestamp()+interval '5 minutes',clock_timestamp())",
          o,
          c);
      db.update(
          "INSERT INTO otp_sms_attempts(id,outbox_id,attempt_no,fence,state,provider,completed_at) VALUES(?,?,1,1,'UNKNOWN','MSG91',clock_timestamp())",
          UUID.randomUUID(),
          o);
    }
    assertDomain("OTP quota unavailable", () -> store.startAttempt(claim));
  }

  @Test
  void callbackDeduplicationAndCleanupOrdering() {
    UUID id = enqueue();
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    UUID attempt = store.startAttempt(claim);
    store.complete(
        attempt, new SmsAdapter.Result(SmsAdapter.Outcome.ACCEPTED, "test-message", false));
    assertTrue(
        store.callback(
            "MSG91", new byte[32], "test-message", "DELIVERED", Instant.now(), "SIGNATURE"));
    assertFalse(
        store.callback(
            "MSG91", new byte[32], "test-message", "DELIVERED", Instant.now(), "SIGNATURE"));
    assertEquals(0, store.purge());
    db.update(
        "UPDATE otp_sms_callback_events SET attempt_id=?,received_at=clock_timestamp()-interval '31 days'",
        attempt);
    db.update(
        "UPDATE otp_sms_outbox SET created_at=clock_timestamp()-interval '32 days',expires_at=clock_timestamp()-interval '31 days' WHERE id=?",
        id);
    assertEquals(1, store.purge());
    assertEquals(0, db.queryForObject("SELECT count(*) FROM otp_sms_attempts", Integer.class));
    assertEquals(0, db.queryForObject("SELECT count(*) FROM otp_challenges", Integer.class));
  }

  @Test
  void expiredSendingLeaseQuarantinesAndErasesCiphertext() {
    UUID id = enqueue();
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    store.startAttempt(claim);
    db.update(
        "UPDATE otp_sms_outbox SET lease_until=clock_timestamp()-interval '1 second' WHERE id=?",
        id);
    store.sweep();
    assertEquals(
        "UNKNOWN",
        db.queryForObject(
            "SELECT state FROM otp_sms_attempts WHERE outbox_id=?", String.class, id));
    assertNull(
        db.queryForObject(
            "SELECT payload_ciphertext FROM otp_sms_outbox WHERE id=?", byte[].class, id));
    assertTrue(store.claim(id, UUID.randomUUID(), generation).isEmpty());
  }

  @Test
  void constraintPairsAndAttemptUniqueness() {
    UUID id = enqueue();
    UUID challenge =
        db.queryForObject("SELECT challenge_id FROM otp_sms_outbox WHERE id=?", UUID.class, id);
    assertSql(
        "23514",
        "otp_invalidation_pair",
        () ->
            db.update(
                "UPDATE otp_challenges SET invalidated_at=clock_timestamp(),invalidation_reason=NULL WHERE id=?",
                challenge));
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    store.startAttempt(claim);
    assertSql(
        "23505",
        "otp_sms_attempts_outbox_id_attempt_no_key",
        () ->
            db.update(
                "INSERT INTO otp_sms_attempts(id,outbox_id,attempt_no,fence,state,provider) VALUES(?,?,1,1,'STARTED','MSG91')",
                UUID.randomUUID(),
                id));
    assertSql(
        "23514",
        "otp_sms_outbox_check",
        () -> db.update("UPDATE otp_sms_outbox SET payload_nonce=NULL WHERE id=?", id));
  }

  @Test
  void retryRequiresDefiniteNonAcceptanceAndHasCeiling() {
    UUID id = enqueue();
    for (int i = 1; i <= 3; i++) {
      var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
      UUID attempt = store.startAttempt(claim);
      store.complete(
          attempt, new SmsAdapter.Result(SmsAdapter.Outcome.DEFINITELY_NOT_SENT, null, true));
      db.update("UPDATE otp_sms_outbox SET available_at=clock_timestamp() WHERE id=?", id);
    }
    assertEquals(
        "FAILED",
        db.queryForObject("SELECT state FROM otp_sms_outbox WHERE id=?", String.class, id));
    assertTrue(store.claim(id, UUID.randomUUID(), generation).isEmpty());
    assertEquals(
        3,
        db.queryForObject(
            "SELECT count(*) FROM otp_sms_attempts WHERE outbox_id=?", Integer.class, id));
  }

  @Test
  void callbackDedupeSurvivesAttemptRetentionPurge() {
    UUID id = enqueue();
    var claim = store.claim(id, UUID.randomUUID(), generation).orElseThrow();
    UUID attempt = store.startAttempt(claim);
    store.complete(attempt, new SmsAdapter.Result(SmsAdapter.Outcome.ACCEPTED, "retained", false));
    store.callback("MSG91", new byte[32], "retained", "DELIVERED", Instant.now(), "SIGNATURE");
    db.update(
        "UPDATE otp_sms_callback_events SET attempt_id=?,received_at=clock_timestamp()-interval '3 days'",
        attempt);
    db.update(
        "UPDATE otp_sms_outbox SET created_at=clock_timestamp()-interval '4 days',expires_at=clock_timestamp()-interval '3 days' WHERE id=?",
        id);
    assertEquals(1, store.purge());
    assertEquals(
        1, db.queryForObject("SELECT count(*) FROM otp_sms_callback_events", Integer.class));
    assertFalse(
        store.callback("MSG91", new byte[32], "retained", "DELIVERED", Instant.now(), "SIGNATURE"));
    store.purge();
    assertEquals(
        1, db.queryForObject("SELECT count(*) FROM otp_sms_callback_events", Integer.class));
  }

  private static void assertDomain(
      String message, org.junit.jupiter.api.function.Executable action) {
    var failure = assertThrowsExactly(IllegalStateException.class, action);
    assertEquals(message, failure.getMessage());
  }

  private static void assertSql(
      String state, String constraint, org.junit.jupiter.api.function.Executable action) {
    var failure =
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, action);
    Throwable cause = failure;
    while (cause != null && !(cause instanceof org.postgresql.util.PSQLException))
      cause = cause.getCause();
    assertNotNull(cause, "Expected PostgreSQL constraint failure");
    var pg = (org.postgresql.util.PSQLException) cause;
    assertEquals(state, pg.getSQLState());
    assertNotNull(pg.getServerErrorMessage());
    assertEquals(constraint, pg.getServerErrorMessage().getConstraint());
  }
}
