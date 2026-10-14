package in.nammacrew.marketplace;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MarketplaceControllerIT {

  @Autowired private MockMvc mvc;
  @Autowired private JdbcTemplate sql;

  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  @Test
  void testGetOpportunitiesAuthenticationAndFiltering() throws Exception {
    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'CONTROLLER_TEST_CARPENTER', 'Carpenter')",
        tradeId);

    // Customer
    UUID customerId = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999911', 'Customer', 'ACTIVE')",
        customerId);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')",
        customerId);

    // Requirement
    UUID reqId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id, customer_id, category_id, state_code, city, status, title, description, worker_count, site_location, starts_at, ends_at) "
            + "VALUES (?, ?, ?, 'KA', 'Bengaluru', 'OPEN', 'Controller Test Carpenter Req', 'Desc', 1, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), now(), now() + interval '2 days')",
        reqId,
        customerId,
        tradeId);

    // Worker A (Available, Eligible)
    UUID workerA = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999991', 'W_A', 'ACTIVE', 'COMPLETED')",
        workerA);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        workerA,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(id, worker_id, state_code, district, city, center, radius_km) VALUES (gen_random_uuid(), ?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerA);

    // Worker C (Unavailable, Not Eligible)
    UUID workerC = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999993', 'W_C', 'ACTIVE', 'COMPLETED')",
        workerC);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'UNAVAILABLE')",
        workerC,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(id, worker_id, state_code, district, city, center, radius_km) VALUES (gen_random_uuid(), ?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerC);

    // Worker E (Available, Eligible)
    UUID workerE = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999995', 'W_E', 'ACTIVE', 'COMPLETED')",
        workerE);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        workerE,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(id, worker_id, state_code, district, city, center, radius_km) VALUES (gen_random_uuid(), ?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerE);

    // Unauthenticated -> 401
    mvc.perform(get("/api/v1/marketplace/opportunities")).andExpect(status().isUnauthorized());

    // Customer authenticated -> 403 Forbidden
    mvc.perform(
            get("/api/v1/marketplace/opportunities")
                .with(user(customerId.toString()).roles("CUSTOMER")))
        .andExpect(status().isForbidden());

    // Worker A -> 200 OK, finds requirement
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.items[0].id").value(reqId.toString()));

    // Worker E -> 200 OK, finds requirement
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerE.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.items[0].id").value(reqId.toString()));

    // Worker C (UNAVAILABLE) -> 200 OK, empty results
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerC.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void testUpdateAvailabilityAndDefect03Regression() throws Exception {
    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'CONTROLLER_TEST_UPDATE', 'Update Test Trade')",
        tradeId);

    // Customer
    UUID customerId = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999981', 'Customer', 'ACTIVE')",
        customerId);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')",
        customerId);

    // Requirement
    UUID reqId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id, customer_id, category_id, state_code, city, status, title, description, worker_count, site_location, starts_at, ends_at) "
            + "VALUES (?, ?, ?, 'KA', 'Bengaluru', 'OPEN', 'Update Test Req', 'Desc', 1, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), now(), now() + interval '2 days')",
        reqId,
        customerId,
        tradeId);

    // Worker A-test (Available)
    UUID workerA = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999971', 'W_A_Test', 'ACTIVE', 'COMPLETED')",
        workerA);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        workerA,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(id, worker_id, state_code, district, city, center, radius_km) VALUES (gen_random_uuid(), ?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerA);

    // Worker B-test (Available)
    UUID workerB = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999972', 'W_B_Test', 'ACTIVE', 'COMPLETED')",
        workerB);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, true, 'AVAILABLE')",
        workerB,
        tradeId);
    sql.update(
        "INSERT INTO worker_service_locations(id, worker_id, state_code, district, city, center, radius_km) VALUES (gen_random_uuid(), ?, 'KA', 'Blr', 'Blr', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerB);

    // Unauthenticated -> 401
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/v1/marketplace/workers/me/availability")
                .param("availability", "UNAVAILABLE"))
        .andExpect(status().isUnauthorized());

    // Customer authenticated -> 403 Forbidden
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/v1/marketplace/workers/me/availability")
                .param("availability", "UNAVAILABLE")
                .with(user(customerId.toString()).roles("CUSTOMER")))
        .andExpect(status().isForbidden());

    // Invalid state -> 400 Bad Request
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/v1/marketplace/workers/me/availability")
                .param("availability", "INVALID_STATE")
                .with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isBadRequest());

    // Verify database unchanged for Worker A
    String statusA =
        sql.queryForObject(
            "SELECT availability_status FROM worker_profiles WHERE user_id = ?",
            String.class,
            workerA);
    org.junit.jupiter.api.Assertions.assertEquals("AVAILABLE", statusA);

    // 1. Worker A is AVAILABLE -> sees opportunity
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)));

    // 2. Worker A updates to UNAVAILABLE
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/v1/marketplace/workers/me/availability")
                .param("availability", "UNAVAILABLE")
                .with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk());

    // Identity Isolation: Verify Worker B is still AVAILABLE
    String statusB =
        sql.queryForObject(
            "SELECT availability_status FROM worker_profiles WHERE user_id = ?",
            String.class,
            workerB);
    org.junit.jupiter.api.Assertions.assertEquals("AVAILABLE", statusB);

    // 3. Worker A is UNAVAILABLE -> opportunity disappears
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(0)));

    // 4. Worker A attempts new quotation -> server rejects
    String quotePayload =
        """
        {
          "dailyRate": 1000,
          "estimatedDays": 2,
          "coverLetter": "Hello"
        }
        """;
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                    "/api/v1/requirements/" + reqId + "/quotes")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(quotePayload)
                .with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isBadRequest()); // Expect 400 because worker is UNAVAILABLE

    // 5. Worker A changes back to AVAILABLE
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                    "/api/v1/marketplace/workers/me/availability")
                .param("availability", "AVAILABLE")
                .with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk());

    // 6. Worker A sees opportunity again
    mvc.perform(
            get("/api/v1/marketplace/opportunities").with(user(workerA.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)));
  }

  @Test
  void testDirectReadAuthorization() throws Exception {
    UUID tradeId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id, code, name) VALUES(?, 'TRADE', 'Trade')", tradeId);

    UUID customer1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999901', 'C1', 'ACTIVE')",
        customer1);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')", customer1);

    UUID customer2 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status) VALUES (?, '+919999999902', 'C2', 'ACTIVE')",
        customer2);
    sql.update(
        "INSERT INTO customer_profiles(user_id, customer_type) VALUES (?, 'HOMEOWNER')", customer2);

    UUID reqId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id, customer_id, category_id, state_code, city, status, title, description, worker_count, site_location, starts_at, ends_at) "
            + "VALUES (?, ?, ?, 'KA', 'Bengaluru', 'DRAFT', 'Test', 'Desc', 1, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), now(), now() + interval '2 days')",
        reqId,
        customer1,
        tradeId);

    // Customer 1 reads their own requirement -> 200
    mvc.perform(
            get("/api/v1/requirements/" + reqId).with(user(customer1.toString()).roles("CUSTOMER")))
        .andExpect(status().isOk());

    // Customer 2 reads Customer 1's requirement -> 404/403
    mvc.perform(
            get("/api/v1/requirements/" + reqId).with(user(customer2.toString()).roles("CUSTOMER")))
        .andExpect(status().isNotFound()); // Or whatever AuthFailure maps to, presumably 404

    UUID worker1 = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id, phone, display_name, status, onboarding_state) VALUES (?, '+919999999903', 'W1', 'ACTIVE', 'COMPLETED')",
        worker1);
    sql.update(
        "INSERT INTO worker_profiles(user_id, primary_trade_id, visibility_enabled, availability_status) VALUES (?, ?, false, 'AVAILABLE')",
        worker1,
        tradeId);

    // Customer 1 reads hidden worker profile -> 404
    mvc.perform(
            get("/api/v1/marketplace/workers/" + worker1)
                .with(user(customer1.toString()).roles("CUSTOMER")))
        .andExpect(status().isNotFound());

    // Worker reads their own hidden profile -> 200
    mvc.perform(
            get("/api/v1/marketplace/workers/" + worker1)
                .with(user(worker1.toString()).roles("WORKER")))
        .andExpect(status().isOk());

    // Update req to OPEN
    sql.update("UPDATE labour_requirements SET status = 'OPEN' WHERE id = ?", reqId);

    // Worker 1 can read OPEN requirement
    mvc.perform(get("/api/v1/requirements/" + reqId).with(user(worker1.toString()).roles("WORKER")))
        .andExpect(status().isOk());

    // Update req to CLOSED
    sql.update("UPDATE labour_requirements SET status = 'CLOSED' WHERE id = ?", reqId);

    // Worker 1 cannot read CLOSED requirement since they have no quote
    mvc.perform(get("/api/v1/requirements/" + reqId).with(user(worker1.toString()).roles("WORKER")))
        .andExpect(status().isNotFound());
  }
}
