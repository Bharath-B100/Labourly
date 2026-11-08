package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.DriverManager;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
class MigrationIT {
  @Container
  static final PostgreSQLContainer<?> DB =
      new PostgreSQLContainer<>(
          DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));

  Flyway migrate(String schema, String target) {
    var config =
        Flyway.configure()
            .dataSource(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())
            .schemas(schema)
            .defaultSchema(schema)
            .locations("classpath:db/migration");
    if (target != null) config.target(target);
    var flyway = config.load();
    flyway.migrate();
    return flyway;
  }

  @Test
  void emptyDatabaseAppliesV1ThroughV4ThenForwardCorrection() {
    String schema = "empty_" + UUID.randomUUID().toString().replace("-", "");
    assertEquals("4", migrate(schema, "4").info().current().getVersion().toString());
    assertEquals("19", migrate(schema, null).info().current().getVersion().toString());
  }

  @Test
  void existingPhaseOneDataSurvivesUpgradeToV4AndV5() throws Exception {
    String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
    migrate(schema, "3");
    UUID id = UUID.randomUUID();
    try (var c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var st = c.createStatement()) {
      st.execute("SET search_path TO " + schema + ",public");
      try (var insert =
          c.prepareStatement(
              "INSERT INTO users(id,phone,display_name) VALUES (?,'+919199999999','Existing Phase One')")) {
        insert.setObject(1, id);
        insert.executeUpdate();
      }
      assertEquals("4", migrate(schema, "4").info().current().getVersion().toString());
      try (var rs = st.executeQuery("SELECT onboarding_state FROM users")) {
        assertTrue(rs.next());
        assertEquals("NOT_STARTED", rs.getString(1));
      }
      migrate(schema, null);
      try (var rs = st.executeQuery("SELECT id,display_name FROM users")) {
        assertTrue(rs.next());
        assertEquals(id, rs.getObject(1, UUID.class));
        assertEquals("Existing Phase One", rs.getString(2));
      }
      assertThrows(
          java.sql.SQLException.class,
          () ->
              st.execute(
                  "INSERT INTO otp_challenges(phone,code_hash,attempts,max_attempts,expires_at) VALUES ('+919199999998','hash',4,3,now()+interval '5 minutes')"));
    }
  }

  @Test
  void existingPhaseTwoDataSurvivesUpgradeToV6() throws Exception {
    String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
    migrate(schema, "5");
    UUID id = UUID.randomUUID();
    try (var c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var st = c.createStatement()) {
      st.execute("SET search_path TO " + schema + ",public");
      try (var insert =
          c.prepareStatement(
              "INSERT INTO users(id,phone,display_name,status,onboarding_state) VALUES (?,'+919199999997','Existing Phase Two','ACTIVE','COMPLETED')")) {
        insert.setObject(1, id);
        insert.executeUpdate();
      }
      assertEquals("19", migrate(schema, null).info().current().getVersion().toString());
      try (var rs =
          st.executeQuery(
              "SELECT id,display_name,onboarding_state FROM users WHERE phone='+919199999997'")) {
        assertTrue(rs.next());
        assertEquals(id, rs.getObject(1, UUID.class));
        assertEquals("Existing Phase Two", rs.getString(2));
        assertEquals("COMPLETED", rs.getString(3));
      }
    }
  }

  @Test
  void existingPhaseThreeDataSurvivesUpgradeToV8() throws Exception {
    String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
    migrate(schema, "6");
    UUID id = UUID.randomUUID();
    try (var c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var st = c.createStatement()) {
      st.execute("SET search_path TO " + schema + ",public");
      assertEquals("19", migrate(schema, null).info().current().getVersion().toString());
    }
  }

  @Test
  void v17ChatAndHistoricalBookingSurviveV18AndV19() throws Exception {
    String schema = "v17_" + UUID.randomUUID().toString().replace("-", "");
    migrate(schema, "17");
    try (var c = DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword());
        var st = c.createStatement()) {
      st.execute("SET search_path TO " + schema + ",public");
      st.execute(
          "INSERT INTO users(id,phone,display_name,status) VALUES ('00000000-0000-0000-0000-000000000001','+919100000001','Fictional customer','ACTIVE'),('00000000-0000-0000-0000-000000000002','+919100000002','Fictional worker','ACTIVE')");
      st.execute(
          "INSERT INTO customer_profiles(user_id,customer_type) VALUES ('00000000-0000-0000-0000-000000000001','HOMEOWNER')");
      st.execute(
          "INSERT INTO labour_categories(id,code,name) VALUES ('00000000-0000-0000-0000-000000000003','FIXTURE','Fixture')");
      st.execute(
          "INSERT INTO worker_profiles(user_id,primary_trade_id) VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003')");
      st.execute(
          "INSERT INTO labour_requirements(id,customer_id,category_id,state_code,city,status,title,description,worker_count,site_location,starts_at,ends_at) VALUES ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','KA','Bengaluru','OPEN','Fixture','Fixture',1,ST_SetSRID(ST_MakePoint(77.59,12.97),4326),now(),now()+interval '1 day')");
      st.execute(
          "INSERT INTO booking_requests(id,requirement_id,worker_id) VALUES ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000002')");
      st.execute(
          "INSERT INTO bookings(id,request_id,starts_at,ends_at) VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000005',now(),now()+interval '1 day')");
      st.execute(
          "INSERT INTO chat_threads(id,booking_id,customer_id,worker_id) VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002')");
      st.execute(
          "INSERT INTO chat_messages(thread_id,sender_id,body) VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Historical message')");
      String before;
      try (var rs = st.executeQuery("SELECT row_to_json(b)::text FROM bookings b")) {
        assertTrue(rs.next());
        before = rs.getString(1);
      }
      assertEquals("19", migrate(schema, null).info().current().getVersion().toString());
      try (var rs = st.executeQuery("SELECT row_to_json(b)::text FROM bookings b")) {
        assertTrue(rs.next());
        assertEquals(before, rs.getString(1));
      }
      try (var rs = st.executeQuery("SELECT body,client_message_id FROM chat_messages")) {
        assertTrue(rs.next());
        assertEquals("Historical message", rs.getString(1));
        assertNull(rs.getString(2));
      }
      try (var rs = st.executeQuery("SELECT count(*) FROM booking_lifecycle_confirmations")) {
        assertTrue(rs.next());
        assertEquals(0, rs.getInt(1));
      }
      st.execute(
          "INSERT INTO chat_messages(thread_id,sender_id,body) VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Legacy client after upgrade')");
      String keyed =
          "INSERT INTO chat_messages(thread_id,sender_id,body,client_message_id) VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Retry','fixture-key-123456')";
      st.execute(keyed);
      assertEquals(
          "23505",
          assertThrows(java.sql.SQLException.class, () -> st.execute(keyed)).getSQLState());
      assertEquals(
          "23503",
          assertThrows(
                  java.sql.SQLException.class,
                  () ->
                      st.execute(
                          "INSERT INTO chat_thread_blocks(thread_id,blocker_id) VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000001')"))
              .getSQLState());
      assertEquals(
          "23503",
          assertThrows(
                  java.sql.SQLException.class,
                  () ->
                      st.execute(
                          "INSERT INTO booking_lifecycle_confirmations(booking_id,actor_id,action) VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','START')"))
              .getSQLState());
      st.execute(
          "INSERT INTO booking_lifecycle_confirmations(booking_id,actor_id,action) VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','START')");
      assertEquals(
          "23505",
          assertThrows(
                  java.sql.SQLException.class,
                  () ->
                      st.execute(
                          "INSERT INTO booking_lifecycle_confirmations(booking_id,actor_id,action) VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','START')"))
              .getSQLState());
    }
  }
}
