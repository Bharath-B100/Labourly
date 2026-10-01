package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MarketplaceIT {

  @Autowired JdbcTemplate sql;

  @Autowired MarketplaceDiscoveryService discoveryService;

  @Autowired RequirementService requirementService;

  @Autowired MatchingEngine matchingEngine;

  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  @Test
  void testWorkerDiscoveryWithVerificationStatus() {
    // Setup trade
    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'TEST_CARPENTER', 'Carpenter')",
        tradeId);

    // Setup User & Worker 1 (Not Verified)
    UUID w1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999991', 'W1', 'ACTIVE')",
        w1);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        w1,
        tradeId);

    // Setup User & Worker 2 (Verified)
    UUID w2 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999992', 'W2', 'ACTIVE')",
        w2);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        w2,
        tradeId);
    sql.update(
        "INSERT INTO worker_verifications(worker_id, status, verification_type, reviewer_id, reviewed_at) VALUES (?, 'APPROVED', 'SYNTHETIC_REVIEW', ?, now())",
        w2,
        w2);

    // Setup User & Worker 3 (Hidden)
    UUID w3 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999993', 'W3', 'ACTIVE')",
        w3);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled) VALUES (?, ?, false)",
        w3,
        tradeId);

    var page = discoveryService.searchWorkers(tradeId, null, null, null, null, 0, 10);

    // W3 should not be in the list
    assertEquals(2, page.total());

    // W2 should have 'APPROVED', W1 should have 'NOT_VERIFIED'
    boolean foundW1 = false;
    boolean foundW2 = false;

    for (var card : page.items()) {
      if (card.id().equals(w1)) {
        assertEquals("NOT_VERIFIED", card.verificationStatus());
        foundW1 = true;
      } else if (card.id().equals(w2)) {
        assertEquals("APPROVED", card.verificationStatus());
        foundW2 = true;
      }
    }

    assertTrue(foundW1);
    assertTrue(foundW2);
  }

  @Test
  void testRequirementLifecycle() {
    UUID c1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+918888888888', 'Customer 1', 'ACTIVE')",
        c1);
    sql.update("INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')", c1);

    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'TEST_PLUMBER', 'Plumber')",
        tradeId);

    var form =
        new MarketplaceDTOs.RequirementForm(
            "Fix leak",
            "Need urgent leak fix",
            tradeId,
            List.of(),
            1,
            Instant.now().plus(1, ChronoUnit.DAYS),
            Instant.now().plus(2, ChronoUnit.DAYS),
            "Test City",
            "Test Dist",
            "KA",
            12.9716,
            77.5946);

    UUID reqId = requirementService.postRequirement(c1, form);
    assertNotNull(reqId);

    var myReqs = requirementService.getMyRequirements(c1, 0, 10);
    assertEquals(1, myReqs.total());
    assertEquals("DRAFT", myReqs.items().get(0).status());

    requirementService.updateStatus(reqId, c1, "OPEN");
    myReqs = requirementService.getMyRequirements(c1, 0, 10);
    assertEquals("OPEN", myReqs.items().get(0).status());
  }

  @Test
  void testPostGISRadiusMatching() {
    UUID carpenterId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'POSTGIS_CARPENTER', 'Carpenter')",
        carpenterId);
    UUID electricianId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'POSTGIS_ELECTRICIAN', 'Electrician')",
        electricianId);

    // Search Center: Bangalore Center (77.5946, 12.9716)

    // W1: Carpenter, AVAILABLE, Inside Radius (exact same location, 10km radius)
    UUID w1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999901', 'W1', 'ACTIVE')",
        w1);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, availability_status, visibility_enabled) VALUES (?, ?, 'AVAILABLE', true)",
        w1,
        carpenterId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 10)",
        w1);

    // W2: Carpenter, AVAILABLE, Outside Radius (Mysore: 76.6393, 12.2958, ~130km away, 10km radius)
    UUID w2 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999902', 'W2', 'ACTIVE')",
        w2);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, availability_status, visibility_enabled) VALUES (?, ?, 'AVAILABLE', true)",
        w2,
        carpenterId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Mys', 'Mys', ST_SetSRID(ST_MakePoint(76.6393, 12.2958), 4326), 10)",
        w2);

    // W3: Electrician, AVAILABLE, Inside Radius (same location, 10km radius)
    UUID w3 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999903', 'W3', 'ACTIVE')",
        w3);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, availability_status, visibility_enabled) VALUES (?, ?, 'AVAILABLE', true)",
        w3,
        electricianId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 10)",
        w3);

    var page = discoveryService.searchWorkers(carpenterId, null, 12.9716, 77.5946, 10.0, 0, 10);

    // Only W1 should be included
    assertEquals(1, page.total());
    assertEquals(w1, page.items().get(0).id());
  }
}
