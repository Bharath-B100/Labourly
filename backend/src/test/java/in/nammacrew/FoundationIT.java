package in.nammacrew;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import in.nammacrew.booking.BookingService;
import in.nammacrew.booking.BookingState;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@AutoConfigureMockMvc
@Testcontainers
class FoundationIT {
  @org.springframework.test.context.bean.override.mockito.MockitoBean
  in.nammacrew.auth.OtpProvider otpProvider;

  @Container
  static final PostgreSQLContainer<?> DB =
      new PostgreSQLContainer<>(
          DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", DB::getJdbcUrl);
    r.add("spring.datasource.username", DB::getUsername);
    r.add("spring.datasource.password", DB::getPassword);
    r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
  }

  @Autowired JdbcTemplate sql;
  @Autowired MockMvc mvc;
  @Autowired BookingService bookings;
  UUID worker;
  UUID requirement;

  @BeforeEach
  void seedSyntheticData() {
    sql.execute("TRUNCATE users,labour_categories CASCADE");
    UUID customer = UUID.randomUUID();
    worker = UUID.randomUUID();
    UUID category = UUID.randomUUID();
    requirement = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id,phone,display_name) VALUES (?, '+919000000001','Synthetic customer'), (?, '+919000000002','Synthetic worker')",
        customer,
        worker);
    sql.update(
        "INSERT INTO customer_profiles(user_id,customer_type) VALUES (?,'HOMEOWNER')", customer);
    sql.update("INSERT INTO worker_profiles(user_id) VALUES (?)", worker);
    sql.update(
        "INSERT INTO labour_categories(id,code,name) VALUES (?,'TEST','Synthetic category')",
        category);
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code) VALUES (?,?,?,'Test Requirement','Synthetic requirement',1,'2030-01-01T09:00Z','2030-01-01T17:00Z','Test city','KA')",
        requirement,
        customer,
        category);
  }

  UUID pending(String start, String end) {
    // Separate requirements permit independent legitimate requests for the same worker.
    UUID req = UUID.randomUUID();
    UUID booking = UUID.randomUUID();
    sql.update(
        "INSERT INTO booking_requests(id,requirement_id,worker_id,status) VALUES (?,?,?,'ACCEPTED')",
        req,
        requirement,
        worker);
    sql.update(
        "INSERT INTO bookings(id,request_id,starts_at,ends_at) VALUES (?,?,?::timestamptz,?::timestamptz)",
        booking,
        req,
        start,
        end);
    sql.update("INSERT INTO booking_workers(booking_id,worker_id) VALUES (?,?)", booking, worker);
    // Retain the accepted request; next booking uses another requirement.
    UUID next = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code) SELECT ?,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code FROM labour_requirements WHERE id=?",
        next,
        requirement);
    requirement = next;
    return booking;
  }

  @Test
  void contextMigrationsAndHealthInitialize() throws Exception {
    mvc.perform(get("/actuator/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.components").doesNotExist());
    assertNotNull(sql.queryForObject("SELECT postgis_version()", String.class));
    assertEquals(
        19,
        sql.queryForObject(
            "SELECT count(*) FROM flyway_schema_history WHERE success AND version IS NOT NULL",
            Integer.class));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void transactionalServiceAndDatabaseEnforceBookingLifecycle() {
    UUID first = pending("2030-01-01T09:00Z", "2030-01-01T12:00Z");
    UUID overlap = pending("2030-01-01T11:00Z", "2030-01-01T14:00Z");
    UUID adjacent = pending("2030-01-01T12:00Z", "2030-01-01T15:00Z");
    bookings.transition(first, BookingState.CONFIRMED);
    assertThrows(
        org.springframework.dao.DataIntegrityViolationException.class,
        () -> bookings.transition(overlap, BookingState.CONFIRMED));
    bookings.transition(adjacent, BookingState.CONFIRMED);
    assertThrows(
        org.springframework.dao.DataIntegrityViolationException.class,
        () -> sql.update("DELETE FROM booking_workers WHERE booking_id=?", first));
    sql.update("UPDATE booking_workers SET reserved=false WHERE booking_id=?", first);
    assertEquals(
        Boolean.TRUE,
        sql.queryForObject(
            "SELECT reserved FROM booking_workers WHERE booking_id=?", Boolean.class, first));
    bookings.transition(first, BookingState.CANCELLED);
    bookings.transition(adjacent, BookingState.CANCELLED);
    bookings.transition(overlap, BookingState.CONFIRMED);
    assertThrows(
        IllegalStateException.class, () -> bookings.transition(first, BookingState.CONFIRMED));
  }

  @RepeatedTest(10)
  void concurrentConfirmationsHaveExactlyOneWinner() throws Exception {
    UUID one = pending("2030-01-01T09:00Z", "2030-01-01T12:00Z");
    UUID two = pending("2030-01-01T10:00Z", "2030-01-01T13:00Z");
    CyclicBarrier barrier = new CyclicBarrier(2);
    try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
      Future<Boolean> a = executor.submit(() -> confirm(one, barrier));
      Future<Boolean> b = executor.submit(() -> confirm(two, barrier));
      assertNotEquals(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
      assertEquals(
          1,
          sql.queryForObject(
              "SELECT count(*) FROM bookings WHERE status='CONFIRMED'", Integer.class));
      assertEquals(
          1,
          sql.queryForObject("SELECT count(*) FROM booking_workers WHERE reserved", Integer.class));
    }
  }

  private boolean confirm(UUID id, CyclicBarrier barrier) throws Exception {
    try (Connection connection =
        DriverManager.getConnection(DB.getJdbcUrl(), DB.getUsername(), DB.getPassword())) {
      connection.setAutoCommit(false);
      barrier.await(10, TimeUnit.SECONDS);
      try (var statement =
          connection.prepareStatement("UPDATE bookings SET status='CONFIRMED' WHERE id=?")) {
        statement.setObject(1, id);
        statement.executeUpdate();
        connection.commit();
        return true;
      } catch (SQLException ex) {
        connection.rollback();
        if (!"23P01".equals(ex.getSQLState())) throw ex;
        return false;
      }
    }
  }
}
