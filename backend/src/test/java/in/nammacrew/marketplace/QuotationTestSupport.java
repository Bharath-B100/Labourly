package in.nammacrew.marketplace;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(
    properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///phase4_validation")
abstract class QuotationTestSupport {
  @Autowired JdbcTemplate sql;
  @Autowired QuotationService quotations;
  @Autowired in.nammacrew.booking.BookingService bookings;
  @Autowired in.nammacrew.booking.BookingQueryService queries;
  @Autowired MockMvc mvc;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;
  UUID customerId, worker1Id, worker2Id, outsiderId, categoryId, reqId;

  @BeforeEach
  void fixture() {
    // This URL creates a disposable Testcontainers database. TRUNCATE needs no trigger bypass.
    sql.execute("TRUNCATE users CASCADE");
    categoryId =
        sql.queryForObject("SELECT id FROM labour_categories WHERE code='CARPENTER'", UUID.class);
    customerId = person("+918888888881", "Customer", "CUSTOMER");
    outsiderId = person("+918888888884", "Other customer", "CUSTOMER");
    worker1Id = person("+918888888882", "Worker One", "WORKER");
    worker2Id = person("+918888888883", "Worker Two", "WORKER");
    reqId = requirement();
  }

  UUID person(String phone, String name, String role) {
    UUID id = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id,phone,display_name,status,onboarding_state) VALUES (?,?,?,'ACTIVE','COMPLETED')",
        id,
        phone,
        name);
    sql.update("INSERT INTO user_roles(user_id,role_code) VALUES (?,?)", id, role);
    if (role.equals("CUSTOMER"))
      sql.update("INSERT INTO customer_profiles(user_id,customer_type) VALUES (?,'HOMEOWNER')", id);
    else {
      sql.update(
          "INSERT INTO worker_profiles(user_id,primary_trade_id,visibility_enabled,availability_status) VALUES (?,?,true,'AVAILABLE')",
          id,
          categoryId);
      sql.update("INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,true)", id);
    }
    return id;
  }

  UUID requirement() {
    UUID id = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,state_code,city,status,title,description,starts_at,ends_at,worker_count) VALUES (?,?,?,'KA','Bengaluru','OPEN','Phase 4 validation','Synthetic fixture','2031-01-01T00:00:00Z','2031-01-03T00:00:00Z',1)",
        id,
        customerId,
        categoryId);
    sql.update(
        "UPDATE labour_requirements SET location_source='CITY_CENTRE',location_city_id='1277333',location_state_id='lgd:29',site_location=ST_SetSRID(ST_MakePoint(77.59369,12.97194),4326) WHERE id=?",
        id);
    return id;
  }

  QuotationDTOs.SubmitQuoteRequest request() {
    return new QuotationDTOs.SubmitQuoteRequest(
        new BigDecimal("1500.00"),
        "PER_DAY",
        Instant.parse("2031-01-01T00:00:00Z"),
        2,
        "Synthetic quote");
  }
}
