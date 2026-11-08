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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999991', 'W1', 'ACTIVE', 'COMPLETED')",
        w1);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        w1,
        tradeId);

    // Setup User & Worker 2 (Verified)
    UUID w2 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999992', 'W2', 'ACTIVE', 'COMPLETED')",
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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999993', 'W3', 'ACTIVE', 'COMPLETED')",
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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+918888888888', 'Customer 1', 'ACTIVE', 'COMPLETED')",
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
            77.5946,
            "GPS",
            null,
            null);

    UUID reqId = requirementService.postRequirement(c1, form);
    assertNotNull(reqId);

    var myReqs = requirementService.getMyRequirements(c1, 0, 10);
    assertEquals(1, myReqs.total());
    assertEquals("DRAFT", myReqs.items().get(0).status());

    requirementService.updateStatus(reqId, c1, "OPEN");
    myReqs = requirementService.getMyRequirements(c1, 0, 10);
    assertEquals("OPEN", myReqs.items().get(0).status());

    // Test forbidden OPEN -> DRAFT
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId, c1, "DRAFT"));

    // Test OPEN -> CLOSED
    requirementService.updateStatus(reqId, c1, "CLOSED");
    myReqs = requirementService.getMyRequirements(c1, 0, 10);
    assertEquals("CLOSED", myReqs.items().get(0).status());

    // Test terminal state rules (CLOSED)
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId, c1, "OPEN"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId, c1, "DRAFT"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId, c1, "CANCELLED"));

    // Test DRAFT -> CANCELLED -> terminal rules
    UUID reqId2 = requirementService.postRequirement(c1, form);
    requirementService.updateStatus(reqId2, c1, "CANCELLED");
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId2, c1, "OPEN"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId2, c1, "DRAFT"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> requirementService.updateStatus(reqId2, c1, "CLOSED"));
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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999901', 'W1', 'ACTIVE', 'COMPLETED')",
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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999902', 'W2', 'ACTIVE', 'COMPLETED')",
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
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999903', 'W3', 'ACTIVE', 'COMPLETED')",
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

  @Test
  void testGetOpportunitiesAvailability() {
    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'OPP_CARPENTER', 'Carpenter')",
        tradeId);

    // Setup User & Worker 1 (Available)
    UUID w1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999981', 'W1', 'ACTIVE', 'COMPLETED')",
        w1);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        w1,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 30)",
        w1);

    // Setup User & Worker 2 (Unavailable)
    UUID w2 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999982', 'W2', 'ACTIVE', 'COMPLETED')",
        w2);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'UNAVAILABLE')",
        w2,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 30)",
        w2);

    UUID c1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+918888888889', 'Customer OPP', 'ACTIVE', 'COMPLETED')",
        c1);
    sql.update("INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')", c1);

    var form =
        new MarketplaceDTOs.RequirementForm(
            "Opp Req",
            "Opp desc",
            tradeId,
            List.of(),
            1,
            Instant.now().plus(1, ChronoUnit.DAYS),
            Instant.now().plus(2, ChronoUnit.DAYS),
            "Test City",
            "Test Dist",
            "KA",
            12.9716,
            77.5946,
            "GPS",
            null,
            null);

    UUID reqId = requirementService.postRequirement(c1, form);
    requirementService.updateStatus(reqId, c1, "OPEN");

    var opps1 = discoveryService.getOpportunities(w1, 0, 10);
    assertEquals(1, opps1.total(), "Available worker should see opportunity");

    var opps2 = discoveryService.getOpportunities(w2, 0, 10);
    assertEquals(0, opps2.total(), "Unavailable worker should NOT see opportunity");
  }

  @Test
  void nearbyFiltersBeforePaginationAndIncludesUnavailableWhenRequested() {
    UUID trade = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id,code,name) VALUES (?,'NEARBY_TEST','Nearby test')",
        trade);
    UUID near = UUID.randomUUID(), far = UUID.randomUUID();
    for (UUID worker : List.of(near, far)) {
      sql.update(
          "INSERT INTO users(id,phone,display_name,status,onboarding_state) VALUES (?,?,?,'ACTIVE','COMPLETED')",
          worker,
          worker.equals(near) ? "+919000007701" : "+919000007702",
          "Fictional worker");
      sql.update(
          "INSERT INTO worker_profiles(user_id,primary_trade_id,visibility_enabled,availability_status) VALUES (?,?,true,?)",
          worker,
          trade,
          worker.equals(near) ? "UNAVAILABLE" : "AVAILABLE");
      sql.update(
          "INSERT INTO worker_service_locations(worker_id,state_code,district,city,center,radius_km) VALUES (?,'KA','Test district','Test city',ST_SetSRID(ST_MakePoint(?,12.97),4326)::geography,100)",
          worker,
          worker.equals(near) ? 77.59 : 77.89);
    }
    var all = discoveryService.searchWorkers(trade, "ALL", 12.97, 77.59, 5.0, 0, 1, null, false);
    assertEquals(2, all.total());
    var nearby = discoveryService.searchWorkers(trade, "ALL", 12.97, 77.59, 5.0, 0, 1, null, true);
    assertEquals(1, nearby.total());
    assertEquals(near, nearby.items().get(0).id());
    assertEquals("UNAVAILABLE", nearby.items().get(0).availability());
    assertEquals(
        0,
        discoveryService
            .searchWorkers(trade, "AVAILABLE", 12.97, 77.59, 5.0, 0, 20, null, true)
            .total());
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () ->
            discoveryService.searchWorkers(
                trade, "ALL", 12.97, 77.59, Double.NaN, 0, 20, null, true));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () ->
            discoveryService.searchWorkers(
                trade, "TOMORROW", 12.97, 77.59, 5.0, 0, 20, null, true));
  }
}
