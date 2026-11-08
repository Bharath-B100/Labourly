package in.nammacrew.auth.persistence;

import in.nammacrew.auth.foundation.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/** Explicitly constructed only. No Spring bean, scheduler, provider I/O or live auth callers. */
public final class OtpDeliveryStore {
  private final JdbcTemplate db;
  private final TransactionTemplate tx;

  public OtpDeliveryStore(JdbcTemplate db, PlatformTransactionManager manager) {
    this.db = Objects.requireNonNull(db);
    tx = new TransactionTemplate(Objects.requireNonNull(manager));
    tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    tx.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
  }

  public record Intent(
      String phone,
      String codeHash,
      OtpContext context,
      String templateKey,
      OtpCipher.Envelope encrypted,
      byte[] requestHash) {
    public Intent {
      if (phone == null
          || !phone.matches("\\+[1-9][0-9]{7,14}")
          || codeHash == null
          || !codeHash.matches("\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}"))
        throw new IllegalArgumentException("Invalid challenge");
      Objects.requireNonNull(context);
      Objects.requireNonNull(encrypted);
      if (!Set.of("MSG91", "TWILIO").contains(context.provider())
          || templateKey == null
          || !templateKey.matches("[a-zA-Z0-9_-]{1,64}"))
        throw new IllegalArgumentException("Invalid template");
      if (requestHash != null && requestHash.length != 32)
        throw new IllegalArgumentException("Invalid binding");
      requestHash = requestHash == null ? null : requestHash.clone();
    }

    @Override
    public byte[] requestHash() {
      return requestHash == null ? null : requestHash.clone();
    }

    @Override
    public String toString() {
      return "OtpIntent[redacted]";
    }
  }

  public record Claim(UUID id, UUID owner, long fence, UUID generation, Instant expiresAt) {}

  private static Timestamp time(Instant value) {
    return Timestamp.from(value);
  }

  private Instant now() {
    return db.queryForObject("SELECT clock_timestamp()", Timestamp.class).toInstant();
  }

  private void phoneLock(String phone) {
    db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", phone);
  }

  private void budgetLock() {
    db.queryForList("SELECT pg_advisory_xact_lock(178611,17)");
  }

  private RecoveryPolicy control(UUID generation, Instant now) {
    var rows =
        db.queryForList("SELECT * FROM otp_operational_control WHERE singleton=true FOR SHARE");
    if (rows.size() != 1) throw new IllegalStateException("OTP control unavailable");
    var row = rows.getFirst();
    var mode = RecoveryPolicy.Mode.valueOf((String) row.get("mode"));
    var q = (Timestamp) row.get("quiesced_at");
    var a = (Timestamp) row.get("approved_at");
    var until = (Timestamp) row.get("restricted_until");
    if (mode == RecoveryPolicy.Mode.CLOSED || q == null || a == null || a.toInstant().isAfter(now))
      throw new IllegalStateException("OTP control closed");
    var policy =
        new RecoveryPolicy(
            mode,
            (UUID) row.get("generation"),
            q.toInstant(),
            a.toInstant(),
            until == null ? null : until.toInstant());
    // External Redis readiness/history evidence is a later activation gate; this checks durable
    // mode only.
    if (!policy.permits(now, generation, true, true, true))
      throw new IllegalStateException("OTP generation unavailable");
    return policy;
  }

  private void caps(String table, String timestamp, Instant now, int[] caps, String phone) {
    int[] seconds = phone == null ? new int[] {60, 3600, 86400} : new int[] {60, 900, 3600, 86400};
    for (int i = 0; i < seconds.length; i++) {
      String sql =
          "SELECT count(*) FROM "
              + table
              + " WHERE "
              + timestamp
              + ">?"
              + (phone == null ? "" : " AND phone=?");
      Long count =
          phone == null
              ? db.queryForObject(sql, Long.class, time(now.minusSeconds(seconds[i])))
              : db.queryForObject(sql, Long.class, time(now.minusSeconds(seconds[i])), phone);
      if (count == null || count >= caps[i])
        throw new IllegalStateException("OTP quota unavailable");
    }
  }

  private int[] globalCaps(RecoveryPolicy p) {
    return new int[] {
      p.dispatchCap(Duration.ofMinutes(1)),
      p.dispatchCap(Duration.ofHours(1)),
      p.dispatchCap(Duration.ofDays(1))
    };
  }

  public UUID enqueue(Intent intent, UUID generation) {
    Objects.requireNonNull(intent);
    Objects.requireNonNull(generation);
    return tx.execute(
        status -> {
          phoneLock(intent.phone());
          budgetLock();
          Instant n = now();
          var policy = control(generation, n);
          n = now();
          policy = control(generation, n);
          if (!intent.context().expiresAt().isAfter(n)
              || intent.context().expiresAt().isAfter(n.plusSeconds(300)))
            throw new IllegalArgumentException("Invalid expiry");
          // No automatic replay acknowledgement: caller must perform state-aware replay under a
          // later API integration.
          caps("otp_challenges", "created_at", n, new int[] {1, 3, 6, 10}, intent.phone());
          caps("otp_challenges", "created_at", n, globalCaps(policy), null);
          db.update(
              "UPDATE otp_sms_outbox o SET state='CANCELLED',payload_ciphertext=NULL,payload_nonce=NULL,lease_owner=NULL,lease_until=NULL WHERE o.challenge_id IN (SELECT id FROM otp_challenges WHERE phone=? AND verified=false) AND o.state IN ('PENDING','CLAIMED','RETRY_WAIT')",
              intent.phone());
          db.update(
              "UPDATE otp_challenges SET invalidated_at=?,invalidation_reason='SUPERSEDED',updated_at=? WHERE phone=? AND verified=false AND invalidated_at IS NULL",
              time(n),
              time(n),
              intent.phone());
          db.update(
              "INSERT INTO otp_challenges(id,phone,code_hash,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?)",
              intent.context().challengeId(),
              intent.phone(),
              intent.codeHash(),
              time(intent.context().expiresAt()),
              time(n),
              time(n));
          db.update(
              "INSERT INTO otp_sms_outbox(id,challenge_id,provider,template_key,template_version,state,payload_ciphertext,payload_nonce,key_id,expires_at,available_at,request_key_hash,created_at,updated_at) VALUES(?,?,?,?,?,'PENDING',?,?,?,?,?,?,?,?)",
              intent.context().deliveryId(),
              intent.context().challengeId(),
              intent.context().provider(),
              intent.templateKey(),
              intent.context().templateVersion(),
              intent.encrypted().ciphertext(),
              intent.encrypted().nonce(),
              intent.encrypted().keyId(),
              time(intent.context().expiresAt()),
              time(n),
              intent.requestHash(),
              time(n),
              time(n));
          return intent.context().deliveryId();
        });
  }

  private String phone(UUID id) {
    return db.queryForObject(
        "SELECT c.phone FROM otp_challenges c JOIN otp_sms_outbox o ON o.challenge_id=c.id WHERE o.id=?",
        String.class,
        id);
  }

  private Map<String, Object> locked(UUID id) {
    return db.queryForMap(
        "SELECT o.*,c.phone,c.verified,c.attempts,c.max_attempts,c.invalidated_at FROM otp_sms_outbox o JOIN otp_challenges c ON c.id=o.challenge_id WHERE o.id=? FOR UPDATE OF o",
        id);
  }

  private boolean current(Map<String, Object> row) {
    UUID latest =
        db.queryForObject(
            "SELECT id FROM otp_challenges WHERE phone=? ORDER BY created_at DESC,id DESC LIMIT 1",
            UUID.class,
            row.get("phone"));
    return latest.equals(row.get("challenge_id"))
        && Boolean.FALSE.equals(row.get("verified"))
        && row.get("invalidated_at") == null
        && ((Number) row.get("attempts")).intValue()
            < ((Number) row.get("max_attempts")).intValue();
  }

  private List<DeliveryRules.AttemptResult> history(UUID id) {
    return db.query(
        "SELECT state,retryable FROM otp_sms_attempts WHERE outbox_id=? ORDER BY attempt_no",
        (r, i) ->
            new DeliveryRules.AttemptResult(
                DeliveryRules.Attempt.valueOf(r.getString(1)), r.getBoolean(2)),
        id);
  }

  /** Candidate lookup owns no lease. Claim rechecks under the shared phone lock. */
  public List<UUID> candidates() {
    return db.query(
        "SELECT id FROM otp_sms_outbox WHERE state IN ('PENDING','RETRY_WAIT') AND available_at<=clock_timestamp() AND expires_at>clock_timestamp() ORDER BY available_at,id LIMIT 100",
        (r, i) -> r.getObject(1, UUID.class));
  }

  public Optional<Claim> claim(UUID id, UUID owner, UUID generation) {
    Objects.requireNonNull(owner);
    return tx.execute(
        status -> {
          phoneLock(phone(id));
          budgetLock();
          Instant n = now();
          control(generation, n);
          var row = locked(id);
          n = now();
          control(generation, n);
          if (!DeliveryRules.claimable(
                  DeliveryRules.State.valueOf((String) row.get("state")), history(id))
              || !current(row)
              || !((Timestamp) row.get("expires_at")).toInstant().isAfter(n.plusSeconds(15))
              || ((Timestamp) row.get("available_at")).toInstant().isAfter(n))
            return Optional.empty();
          long fence = ((Number) row.get("fence")).longValue() + 1;
          db.update(
              "UPDATE otp_sms_outbox SET state='CLAIMED',lease_owner=?,lease_until=?,fence=?,control_generation=? WHERE id=?",
              owner,
              time(n.plusSeconds(30)),
              fence,
              generation,
              id);
          return Optional.of(
              new Claim(
                  id, owner, fence, generation, ((Timestamp) row.get("expires_at")).toInstant()));
        });
  }

  public UUID startAttempt(Claim claim) {
    return tx.execute(
        status -> {
          phoneLock(phone(claim.id()));
          budgetLock();
          Instant n = now();
          var policy = control(claim.generation(), n);
          var row = locked(claim.id());
          n = now();
          policy = control(claim.generation(), n);
          if (!"CLAIMED".equals(row.get("state"))) throw new IllegalStateException("Not claimed");
          var permit =
              new DeliveryRules.Permit(
                  (UUID) row.get("lease_owner"),
                  ((Number) row.get("fence")).longValue(),
                  (UUID) row.get("control_generation"),
                  ((Timestamp) row.get("lease_until")).toInstant(),
                  ((Timestamp) row.get("expires_at")).toInstant());
          if (!permit.eligible(
                  claim.owner(), claim.fence(), claim.generation(), n, current(row), true, true)
              || !DeliveryRules.claimable(DeliveryRules.State.RETRY_WAIT, history(claim.id())))
            throw new IllegalStateException("Stale dispatch permit");
          caps("otp_sms_attempts", "started_at", n, globalCaps(policy), null);
          UUID attempt = UUID.randomUUID();
          int count = ((Number) row.get("attempt_count")).intValue() + 1;
          db.update(
              "INSERT INTO otp_sms_attempts(id,outbox_id,attempt_no,fence,state,provider,started_at) VALUES(?,?,?,?,'STARTED',?,?)",
              attempt,
              claim.id(),
              count,
              claim.fence(),
              row.get("provider"),
              time(n));
          db.update(
              "UPDATE otp_sms_outbox SET state='SENDING',attempt_count=? WHERE id=?",
              count,
              claim.id());
          return attempt;
        });
  }

  /** A result never authorizes HTTP. UNKNOWN can be resolved, never retried. */
  public void complete(UUID attemptId, SmsAdapter.Result result) {
    Objects.requireNonNull(result);
    tx.executeWithoutResult(
        status -> {
          UUID id =
              db.queryForObject(
                  "SELECT outbox_id FROM otp_sms_attempts WHERE id=?", UUID.class, attemptId);
          phoneLock(phone(id));
          var row = locked(id);
          var attempt =
              db.queryForMap("SELECT * FROM otp_sms_attempts WHERE id=? FOR UPDATE", attemptId);
          Instant n = now();
          String previous = (String) attempt.get("state");
          if (!Set.of("STARTED", "UNKNOWN").contains(previous)) return;
          var from = DeliveryRules.State.valueOf((String) row.get("state"));
          boolean quarantine = previous.equals("UNKNOWN") || from == DeliveryRules.State.UNKNOWN;
          if (quarantine && result.outcome() != SmsAdapter.Outcome.ACCEPTED) return;
          boolean retry =
              result.outcome() == SmsAdapter.Outcome.DEFINITELY_NOT_SENT
                  && result.retryable()
                  && ((Number) row.get("attempt_count")).intValue() < 3
                  && current(row)
                  && ((Timestamp) row.get("expires_at")).toInstant().isAfter(n.plusSeconds(15));
          DeliveryRules.State to =
              switch (result.outcome()) {
                case ACCEPTED -> DeliveryRules.State.ACCEPTED;
                case UNKNOWN -> DeliveryRules.State.UNKNOWN;
                case DEFINITELY_NOT_SENT ->
                    retry ? DeliveryRules.State.RETRY_WAIT : DeliveryRules.State.FAILED;
                case REJECTED -> DeliveryRules.State.FAILED;
              };
          if (!DeliveryRules.permits(from, to))
            throw new IllegalStateException("Invalid delivery transition");
          db.update(
              "UPDATE otp_sms_attempts SET state=?,retryable=?,provider_message_id=?,completed_at=? WHERE id=?",
              result.outcome().name(),
              retry,
              result.providerMessageId(),
              time(n),
              attemptId);
          db.update(
              "UPDATE otp_sms_outbox SET state=?,available_at=?,payload_ciphertext=CASE WHEN ? THEN payload_ciphertext ELSE NULL END,payload_nonce=CASE WHEN ? THEN payload_nonce ELSE NULL END,lease_owner=NULL,lease_until=NULL WHERE id=?",
              to.name(),
              time(n.plusSeconds(5)),
              retry,
              retry,
              id);
          if (to == DeliveryRules.State.FAILED)
            db.update(
                "UPDATE otp_challenges SET invalidated_at=?,invalidation_reason='DELIVERY_REJECTED',updated_at=? WHERE id=? AND verified=false AND invalidated_at IS NULL",
                time(n),
                time(n),
                row.get("challenge_id"));
        });
  }

  public boolean callback(
      String provider,
      byte[] dedupe,
      String message,
      String normalized,
      Instant occurred,
      String authenticationMode) {
    if (!Set.of("MSG91", "TWILIO").contains(provider)
        || dedupe == null
        || dedupe.length != 32
        || message == null
        || message.isBlank()
        || message.length() > 200
        || !Set.of("PENDING", "DELIVERED", "UNDELIVERED", "UNKNOWN").contains(normalized)
        || !Set.of("SIGNATURE", "SECRET_HEADER", "API_RECONCILED").contains(authenticationMode))
      throw new IllegalArgumentException("Invalid authenticated callback");
    return tx.execute(
        status ->
            db.update(
                    "INSERT INTO otp_sms_callback_events(id,provider,dedupe_hash,provider_message_id,status,provider_occurred_at,authentication_mode) VALUES(?,?,?,?,?,?,?) ON CONFLICT(provider,dedupe_hash) DO NOTHING",
                    UUID.randomUUID(),
                    provider,
                    dedupe.clone(),
                    message,
                    normalized,
                    occurred == null ? null : time(occurred),
                    authenticationMode)
                == 1);
  }

  /** Bounded sweep. Phone-before-row lock ordering also serializes with enqueue/start. */
  public int sweep() {
    var ids =
        db.query(
            "SELECT id FROM otp_sms_outbox WHERE (state IN ('CLAIMED','SENDING') AND lease_until<=clock_timestamp()) OR (expires_at<=clock_timestamp() AND payload_ciphertext IS NOT NULL) ORDER BY id LIMIT 100",
            (r, i) -> r.getObject(1, UUID.class));
    for (UUID id : ids)
      tx.executeWithoutResult(
          status -> {
            phoneLock(phone(id));
            var row = locked(id);
            Instant n = now();
            String state = (String) row.get("state");
            Timestamp lease = (Timestamp) row.get("lease_until");
            boolean lost = lease != null && !lease.toInstant().isAfter(n);
            boolean expired = !((Timestamp) row.get("expires_at")).toInstant().isAfter(n);
            if (state.equals("SENDING") && (lost || expired)) {
              db.update(
                  "UPDATE otp_sms_attempts SET state='UNKNOWN',retryable=false,completed_at=? WHERE outbox_id=? AND state='STARTED'",
                  time(n),
                  id);
              db.update(
                  "UPDATE otp_sms_outbox SET state='UNKNOWN',payload_ciphertext=NULL,payload_nonce=NULL,lease_owner=NULL,lease_until=NULL WHERE id=?",
                  id);
            } else if (expired) {
              db.update(
                  "UPDATE otp_sms_outbox SET state=CASE WHEN state IN ('PENDING','RETRY_WAIT','CLAIMED') THEN 'EXPIRED' ELSE state END,payload_ciphertext=NULL,payload_nonce=NULL,lease_owner=NULL,lease_until=NULL WHERE id=?",
                  id);
            } else if (state.equals("CLAIMED")
                && lost
                && history(id).stream()
                    .allMatch(
                        a ->
                            a.outcome() == DeliveryRules.Attempt.DEFINITELY_NOT_SENT
                                && a.retryable())) {
              db.update(
                  "UPDATE otp_sms_outbox SET state='PENDING',lease_owner=NULL,lease_until=NULL WHERE id=?",
                  id);
            }
          });
    return ids.size();
  }

  /** 48-hour metadata retention; never deletes legacy/non-outbox challenges. */
  public int purge() {
    return tx.execute(
        status -> {
          budgetLock();
          Instant cutoff = now().minus(Duration.ofHours(48));
          db.update(
              "DELETE FROM otp_sms_callback_events WHERE received_at<? OR (attempt_id IS NULL AND processed_at IS NULL AND received_at<?)",
              time(now().minus(Duration.ofDays(7))),
              time(now().minus(Duration.ofHours(24))));
          var ids =
              db.query(
                  "SELECT id FROM otp_sms_outbox WHERE created_at<? AND expires_at<? AND payload_ciphertext IS NULL AND state IN ('ACCEPTED','DELIVERED','FAILED','UNKNOWN','EXPIRED','CANCELLED') ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED",
                  (r, i) -> r.getObject(1, UUID.class),
                  time(cutoff),
                  time(cutoff));
          int removed = 0;
          for (UUID id : ids) {
            db.update(
                "UPDATE otp_sms_callback_events SET attempt_id=NULL,processed_at=COALESCE(processed_at,clock_timestamp()) WHERE attempt_id IN (SELECT id FROM otp_sms_attempts WHERE outbox_id=?)",
                id);
            UUID challenge =
                db.queryForObject(
                    "SELECT challenge_id FROM otp_sms_outbox WHERE id=?", UUID.class, id);
            db.update("DELETE FROM otp_sms_attempts WHERE outbox_id=?", id);
            db.update("DELETE FROM otp_sms_outbox WHERE id=?", id);
            db.update("DELETE FROM otp_challenges WHERE id=?", challenge);
            removed++;
          }
          return removed;
        });
  }
}
