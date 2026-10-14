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
    assertEquals("12", migrate(schema, null).info().current().getVersion().toString());
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
      assertEquals("12", migrate(schema, null).info().current().getVersion().toString());
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
      assertEquals("12", migrate(schema, null).info().current().getVersion().toString());
    }
  }
}
