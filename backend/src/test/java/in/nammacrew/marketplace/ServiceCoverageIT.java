package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import in.nammacrew.auth.AuthFailure;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class ServiceCoverageIT extends QuotationTestSupport {
  @Autowired ServiceCoverage coverage;
  @Autowired RequirementService requirements;
  @Autowired MarketplaceDiscoveryService discovery;
  @Autowired MatchingEngine matching;

  UUID job(String city) {
    var row = sql.queryForMap("SELECT * FROM location_cities WHERE id=?", city);
    UUID id =
        requirements.postRequirement(
            customerId,
            new MarketplaceDTOs.RequirementForm(
                "Coverage test",
                "Isolated location test",
                categoryId,
                List.of(),
                1,
                request().startsAt(),
                request().startsAt().plusSeconds(172800),
                "ignored",
                "ignored",
                "ignored",
                ((Number) row.get("latitude")).doubleValue(),
                ((Number) row.get("longitude")).doubleValue(),
                "CITY_CENTRE",
                (String) row.get("state_id"),
                city));
    requirements.updateStatus(id, customerId, "OPEN");
    return id;
  }

  ServiceCoverage.Form empty() {
    return new ServiceCoverage.Form(false, List.of(), List.of(), null, null);
  }

  @ParameterizedTest
  @ValueSource(strings = {"district", "state", "multi-state", "nationwide", "radius"})
  void explicitCoverageIncludesOutstationWorkersAcrossEveryMode(String mode) {
    UUID id = job("1277333");
    sql.update(
        "INSERT INTO worker_service_locations(worker_id,city,district,state_code) VALUES (?,'Krishnagiri','Krishnagiri','TN')",
        worker1Id);
    coverage.save(
        worker1Id,
        new ServiceCoverage.Form(
            mode.equals("nationwide"),
            mode.equals("state")
                ? List.of("lgd:29")
                : mode.equals("multi-state") ? List.of("lgd:33", "lgd:29") : List.of(),
            mode.equals("district") ? List.of("geonames:1277331") : List.of(),
            mode.equals("radius") ? "1277333" : null,
            mode.equals("radius") ? 15.0 : null));
    assertTrue(
        discovery.getOpportunities(worker1Id, 0, 50).items().stream()
            .anyMatch(r -> r.id().equals(id)));
    assertTrue(
        matching.findMatches(id, customerId).stream()
            .anyMatch(w -> w.worker().id().equals(worker1Id)));
    assertNotNull(quotations.submitQuote(worker1Id, id, request()));
    assertEquals(
        "Krishnagiri",
        sql.queryForObject(
            "SELECT city FROM worker_service_locations WHERE worker_id=?",
            String.class,
            worker1Id));
  }

  @Test
  void missingCoverageRejectsDirectQuoteAndNationwideCanBeDisabled() {
    UUID id = job("1277333");
    coverage.save(worker1Id, empty());
    assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
    assertTrue(discovery.getOpportunities(worker1Id, 0, 50).items().isEmpty());
    coverage.save(worker1Id, new ServiceCoverage.Form(true, List.of(), List.of(), null, null));
    assertFalse(discovery.getOpportunities(worker1Id, 0, 50).items().isEmpty());
    coverage.save(worker1Id, empty());
    assertTrue(discovery.getOpportunities(worker1Id, 0, 50).items().isEmpty());
  }

  @Test
  void unavailableWorkerIsInformationalOnly() {
    UUID id = job("1277333");
    discovery.updateAvailability(worker1Id, "UNAVAILABLE");
    assertTrue(
        matching.findMatches(id, customerId).stream()
            .anyMatch(w -> w.worker().id().equals(worker1Id)));
    assertTrue(discovery.getOpportunities(worker1Id, 0, 50).items().isEmpty());
    assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
    discovery.updateAvailability(worker1Id, "AVAILABLE");
    assertFalse(discovery.getOpportunities(worker1Id, 0, 50).items().isEmpty());
  }

  @ParameterizedTest
  @ValueSource(strings = {"1277333", "1265863"})
  void manualCoordinatesPersistAndRejectDifferentCity(String city) {
    UUID id = job(city);
    assertTrue(
        sql.queryForObject(
            "SELECT ST_Y(r.site_location::geometry)=c.latitude AND ST_X(r.site_location::geometry)=c.longitude FROM labour_requirements r JOIN location_cities c ON c.id=r.location_city_id WHERE r.id=?",
            Boolean.class,
            id));
    assertThrows(
        AuthFailure.class,
        () ->
            requirements.postRequirement(
                customerId,
                new MarketplaceDTOs.RequirementForm(
                    "Invalid city",
                    "Mismatched coordinates",
                    categoryId,
                    List.of(),
                    1,
                    request().startsAt(),
                    request().startsAt().plusSeconds(172800),
                    "x",
                    "x",
                    "x",
                    0.0,
                    0.0,
                    "CITY_CENTRE",
                    "lgd:33",
                    city)));
  }

  @Test
  void unresolvedAndMultiDistrictCitiesNeverGrantUnverifiedDistrictCoverage() {
    UUID id = job("1275339"); // Mumbai is explicitly unresolved in the local source.
    coverage.save(
        worker1Id,
        new ServiceCoverage.Form(false, List.of(), List.of("geonames:1277331"), null, null));
    assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
    coverage.save(
        worker1Id, new ServiceCoverage.Form(false, List.of("lgd:27"), List.of(), null, null));
    assertNotNull(quotations.submitQuote(worker1Id, id, request()));
    UUID blr = job("1277333");
    sql.update(
        "UPDATE location_cities SET district_resolution='MULTI_DISTRICT' WHERE id='1277333'");
    try {
      coverage.save(
          worker1Id,
          new ServiceCoverage.Form(false, List.of(), List.of("geonames:1277331"), null, null));
      assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, blr, request()));
    } finally {
      sql.update(
          "UPDATE location_cities SET district_resolution='SOURCE_VERIFIED' WHERE id='1277333'");
    }
  }

  @Test
  void invalidIdentifiersAndUnauthorizedCoverageUpdatesAreRejected() throws Exception {
    assertThrows(
        AuthFailure.class,
        () ->
            coverage.save(
                worker1Id, new ServiceCoverage.Form(false, List.of("29"), List.of(), null, null)));
    assertThrows(
        AuthFailure.class,
        () ->
            coverage.save(
                worker1Id,
                new ServiceCoverage.Form(false, List.of(), List.of("made-up"), null, null)));
    mvc.perform(
            put("/api/v1/workers/me/service-coverage")
                .with(user(customerId.toString()).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nationwide\":true,\"stateIds\":[],\"districtIds\":[]}"))
        .andExpect(status().isForbidden());
    coverage.save(worker2Id, empty());
    mvc.perform(
            put("/api/v1/workers/me/service-coverage")
                .with(user(worker1Id.toString()).roles("WORKER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"workerId\":\""
                        + worker2Id
                        + "\",\"nationwide\":true,\"stateIds\":[],\"districtIds\":[]}"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            put("/api/v1/workers/me/service-coverage")
                .with(user(worker1Id.toString()).roles("WORKER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nationwide\":true,\"stateIds\":[],\"districtIds\":[]}"))
        .andExpect(status().isOk());
    assertFalse(coverage.get(worker2Id).nationwide());
  }

  @Test
  void gpsCoordinatesArePreservedWithoutUnverifiedAdministrativeLabels() {
    UUID id =
        requirements.postRequirement(
            customerId,
            new MarketplaceDTOs.RequirementForm(
                "GPS job",
                "GPS test",
                categoryId,
                List.of(),
                1,
                request().startsAt(),
                request().startsAt().plusSeconds(172800),
                "Bengaluru",
                "Bengaluru",
                "KA",
                12.51921,
                78.21382,
                "GPS",
                null,
                null));
    assertEquals(
        78.21382,
        sql.queryForObject(
            "SELECT ST_X(site_location::geometry) FROM labour_requirements WHERE id=?",
            Double.class,
            id));
    assertNull(
        sql.queryForObject(
            "SELECT location_state_id FROM labour_requirements WHERE id=?", String.class, id));
    assertNull(
        sql.queryForObject(
            "SELECT district FROM labour_requirements WHERE id=?", String.class, id));
  }

  @ParameterizedTest
  @ValueSource(strings = {"radius", "district", "state", "nationwide"})
  void gpsOnlyUsesDistanceAndManualFallbackRestoresAdministrativeCoverage(String mode) {
    UUID id = job("1277333");
    coverage.save(
        worker1Id,
        new ServiceCoverage.Form(
            mode.equals("nationwide"),
            mode.equals("state") ? List.of("lgd:29", "lgd:33") : List.of(),
            mode.equals("district") ? List.of("geonames:1277331") : List.of(),
            mode.equals("radius") ? "1277333" : null,
            mode.equals("radius") ? 15.0 : null));
    sql.update(
        "UPDATE labour_requirements SET location_source='GPS',location_city_id=NULL,location_state_id=NULL WHERE id=?",
        id);
    boolean allowed = mode.equals("radius");
    assertEquals(
        allowed,
        matching.findMatches(id, customerId).stream()
            .anyMatch(w -> w.worker().id().equals(worker1Id)));
    assertEquals(
        allowed,
        discovery.getOpportunities(worker1Id, 0, 50).items().stream()
            .anyMatch(r -> r.id().equals(id)));
    assertEquals(
        allowed,
        discovery
            .searchWorkers(categoryId, "AVAILABLE", 12.97194, 77.59369, 15.0, 0, 50, null)
            .items()
            .stream()
            .anyMatch(w -> w.id().equals(worker1Id)));
    if (allowed) {
      UUID quote = quotations.submitQuote(worker1Id, id, request());
      assertNotNull(quotations.acceptQuote(customerId, quote));
    } else {
      assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
      sql.update(
          "UPDATE labour_requirements SET location_source='CITY_CENTRE',location_city_id='1277333',location_state_id='lgd:29' WHERE id=?",
          id);
      assertTrue(
          discovery
              .searchWorkers(categoryId, "AVAILABLE", 12.97194, 77.59369, 15.0, 0, 50, "1277333")
              .items()
              .stream()
              .anyMatch(w -> w.id().equals(worker1Id)));
      assertNotNull(
          quotations.acceptQuote(customerId, quotations.submitQuote(worker1Id, id, request())));
    }
  }

  @Test
  void nationwideNeverGrantsForeignMissingOrMismatchedLocation() {
    UUID id = job("1277333");
    sql.update(
        "UPDATE labour_requirements SET site_location=ST_SetSRID(ST_MakePoint(-0.12,51.5),4326) WHERE id=?",
        id);
    assertTrue(matching.findMatches(id, customerId).isEmpty());
    assertTrue(
        discovery.getOpportunities(worker1Id, 0, 50).items().stream()
            .noneMatch(r -> r.id().equals(id)));
    assertTrue(
        discovery
            .searchWorkers(categoryId, "AVAILABLE", 51.5, -0.12, 15.0, 0, 50, null)
            .items()
            .isEmpty());
    assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
    sql.update(
        "UPDATE labour_requirements SET site_location=NULL,location_source=NULL,location_city_id=NULL,location_state_id=NULL WHERE id=?",
        id);
    assertTrue(matching.findMatches(id, customerId).isEmpty());
    assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, id, request()));
  }

  @Test
  void multiStateWorkerCanAcceptJobsInBothStatesWithoutMovingHome() {
    coverage.save(
        worker1Id,
        new ServiceCoverage.Form(false, List.of("lgd:29", "lgd:33"), List.of(), null, null));
    for (String city : List.of("1277333", "1265863")) {
      UUID id = job(city);
      assertTrue(
          discovery.getOpportunities(worker1Id, 0, 50).items().stream()
              .anyMatch(r -> r.id().equals(id)));
      UUID quote = quotations.submitQuote(worker1Id, id, request());
      UUID booking = quotations.acceptQuote(customerId, quote);
      bookings.cancelBooking(customerId, booking, "Isolated test release");
    }
  }

  @ParameterizedTest
  @ValueSource(strings = {"coverage", "visibility", "availability", "account"})
  void firstAcceptanceRechecksChangedWorkerEligibility(String change) {
    UUID id = job("1277333");
    UUID quote = quotations.submitQuote(worker1Id, id, request());
    switch (change) {
      case "coverage" -> coverage.save(worker1Id, empty());
      case "visibility" ->
          sql.update(
              "UPDATE worker_profiles SET visibility_enabled=false WHERE user_id=?", worker1Id);
      case "availability" -> discovery.updateAvailability(worker1Id, "UNAVAILABLE");
      case "account" -> sql.update("UPDATE users SET status='SUSPENDED' WHERE id=?", worker1Id);
    }
    assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, quote));
    assertEquals(0, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
    assertEquals(
        "SUBMITTED",
        sql.queryForObject("SELECT status FROM quotations WHERE id=?", String.class, quote));
    assertEquals(
        "OPEN",
        sql.queryForObject("SELECT status FROM labour_requirements WHERE id=?", String.class, id));
  }

  @Test
  void acceptanceRejectsLocationLosingCanonicalIdentityButRetryRemainsIdempotent() {
    UUID id = job("1277333");
    UUID quote = quotations.submitQuote(worker1Id, id, request());
    sql.update(
        "UPDATE labour_requirements SET location_source='GPS',location_city_id=NULL,location_state_id=NULL WHERE id=?",
        id);
    assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, quote));
    assertEquals(0, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
    sql.update(
        "UPDATE labour_requirements SET location_source='CITY_CENTRE',location_city_id='1277333',location_state_id='lgd:29' WHERE id=?",
        id);
    UUID booking = quotations.acceptQuote(customerId, quote);
    coverage.save(worker1Id, empty());
    assertEquals(booking, quotations.acceptQuote(customerId, quote));
    assertEquals(1, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
  }

  @Test
  void legacyRadiusStillMatchesGpsWithoutAdministrativeInference() {
    UUID id = job("1277333");
    sql.update("DELETE FROM worker_service_coverage WHERE worker_id=?", worker1Id);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id,city,district,state_code,center,radius_km) VALUES (?,'Base','Base','KA',ST_SetSRID(ST_MakePoint(77.59369,12.97194),4326),15)",
        worker1Id);
    sql.update(
        "UPDATE labour_requirements SET location_source='GPS',location_city_id=NULL,location_state_id=NULL WHERE id=?",
        id);
    assertTrue(
        matching.findMatches(id, customerId).stream()
            .anyMatch(w -> w.worker().id().equals(worker1Id)));
    assertTrue(
        discovery.getOpportunities(worker1Id, 0, 50).items().stream()
            .anyMatch(r -> r.id().equals(id)));
    assertNotNull(
        quotations.acceptQuote(customerId, quotations.submitQuote(worker1Id, id, request())));
  }
}
