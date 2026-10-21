package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.nammacrew.auth.dev.DevelopmentOtpProvider;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@Import(AuthenticationIT.Configuration.class)
class AuthenticationIT {
  @Test
  void savedWorkersArePrivateIdempotentAndDoNotGrantProfileAccess() throws Exception {
    var customer = login("+919100000091");
    var other = login("+919100000092");
    var workerToken = login("+919100000093");
    postJson("/api/v1/users/me/roles", customer, Map.of("role", "CUSTOMER"));
    postJson("/api/v1/users/me/roles", other, Map.of("role", "CUSTOMER"));
    postJson("/api/v1/users/me/roles", workerToken, Map.of("role", "WORKER"));
    for (int step = 1; step <= 3; step++) save(workerToken, step, worker());
    postJson("/api/v1/onboarding/complete", workerToken, Map.of());
    UUID workerId = UUID.fromString(getJson("/api/v1/users/me", workerToken).get("id").asText());
    sql.update("UPDATE worker_profiles SET visibility_enabled=true WHERE user_id=?", workerId);
    String path = "/api/v1/saved-workers/" + workerId;
    mvc.perform(put(path)).andExpect(status().isUnauthorized());
    mvc.perform(put(path).header("Authorization", "Bearer " + workerToken.accessToken()))
        .andExpect(status().isForbidden());
    for (int i = 0; i < 2; i++)
      mvc.perform(put(path).header("Authorization", "Bearer " + customer.accessToken()))
          .andExpect(status().isOk());
    assertEquals(1, getJson("/api/v1/saved-workers", customer).size());
    assertEquals(0, getJson("/api/v1/saved-workers", other).size());
    mvc.perform(delete(path).header("Authorization", "Bearer " + other.accessToken()))
        .andExpect(status().isOk());
    assertTrue(getJson(path, customer).get("saved").asBoolean());
    sql.update("UPDATE worker_profiles SET visibility_enabled=false WHERE user_id=?", workerId);
    mvc.perform(
            get("/api/v1/marketplace/workers/" + workerId)
                .header("Authorization", "Bearer " + customer.accessToken()))
        .andExpect(status().isNotFound());
    mvc.perform(put(path).header("Authorization", "Bearer " + other.accessToken()))
        .andExpect(status().isNotFound());
    for (int i = 0; i < 2; i++)
      mvc.perform(delete(path).header("Authorization", "Bearer " + customer.accessToken()))
          .andExpect(status().isOk());
    assertFalse(getJson(path, customer).get("saved").asBoolean());
  }

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

  static class TestClock extends Clock {
    final AtomicReference<Instant> now = new AtomicReference<>(Instant.now());

    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    public Clock withZone(ZoneId zone) {
      return this;
    }

    public Instant instant() {
      return now.get();
    }

    void advance(Duration duration) {
      now.updateAndGet(t -> t.plus(duration));
    }
  }

  static class CapturingOtp implements OtpProvider {
    final Map<String, String> codes = new ConcurrentHashMap<>();

    public void sendOtp(String phone, String code) {
      codes.put(phone, code);
    }
  }

  @TestConfiguration
  static class Configuration {
    @Bean
    @Primary
    TestClock testClock() {
      return new TestClock();
    }

    @Bean
    CapturingOtp capture() {
      return new CapturingOtp();
    }
  }

  @Autowired AuthService auth;
  @Autowired JwtTokenProvider jwt;
  @Autowired CapturingOtp otp;
  @Autowired TestClock clock;
  @Autowired PasswordEncoder encoder;
  @Autowired JdbcTemplate sql;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;

  @BeforeEach
  void reset() {
    sql.execute("TRUNCATE users,otp_challenges CASCADE");
    clock.now.set(Instant.now());
    otp.codes.clear();
  }

  AuthTokens login(String phone) {
    auth.requestOtp(phone);
    return auth.verifyOtp(phone, otp.codes.get(phone));
  }

  JsonNode getJson(String path, AuthTokens tokens) throws Exception {
    return mapper.readTree(
        mvc.perform(get(path).header("Authorization", "Bearer " + tokens.accessToken()))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  JsonNode postJson(String path, AuthTokens tokens, Object body) throws Exception {
    return mapper.readTree(
        mvc.perform(
                post(path)
                    .header("Authorization", "Bearer " + tokens.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  Map<String, Object> customer() {
    return new HashMap<>(
        Map.of(
            "fullName",
            "Synthetic Customer",
            "customerType",
            "OTHER",
            "state",
            "KA",
            "district",
            "Bengaluru Urban",
            "city",
            "Bengaluru",
            "postalCode",
            "560001"));
  }

  Map<String, Object> worker() {
    UUID trade =
        sql.queryForObject("SELECT id FROM labour_categories WHERE code='CARPENTER'", UUID.class);
    UUID skill =
        sql.queryForObject(
            "SELECT id FROM trade_skills WHERE code='CARPENTRY_FURNITURE'", UUID.class);
    var d = new HashMap<String, Object>();
    d.put("fullName", "Synthetic Worker");
    d.put("workerType", "TEAM");
    d.put("teamName", "Synthetic Crew");
    d.put("teamSize", 3);
    d.put("tradeId", trade);
    d.put("skillIds", List.of(skill));
    d.put("experienceYears", 5);
    d.put("availability", "AVAILABLE");
    d.put("state", "KA");
    d.put("district", "Bengaluru Urban");
    d.put("city", "Bengaluru");
    d.put("postalCode", "560001");
    return d;
  }

  void save(AuthTokens tokens, int step, Map<String, Object> data) throws Exception {
    mvc.perform(
            put("/api/v1/onboarding")
                .header("Authorization", "Bearer " + tokens.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("step", step, "data", data))))
        .andExpect(status().isOk());
  }

  @Test
  void otpIsSixDigitsHashedAndNotReturned() throws Exception {
    mvc.perform(
            post("/api/v1/auth/otp/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"+919100000001\"}"))
        .andExpect(status().isNoContent())
        .andExpect(content().string(""));
    String code = otp.codes.get("+919100000001");
    assertTrue(code.matches("[0-9]{6}"));
    String hash = sql.queryForObject("SELECT code_hash FROM otp_challenges", String.class);
    assertNotEquals(code, hash);
    assertTrue(encoder.matches(code, hash));
  }

  @Test
  void wrongAttemptsPersistAndLimitCannotBeBypassed() {
    String phone = "+919100000002";
    auth.requestOtp(phone);
    String bad = otp.codes.get(phone).equals("000000") ? "111111" : "000000";
    for (int i = 1; i <= 3; i++) {
      assertEquals(400, assertThrows(AuthFailure.class, () -> auth.verifyOtp(phone, bad)).status());
      assertEquals(
          i,
          sql.queryForObject(
              "SELECT attempts FROM otp_challenges WHERE phone=?", Integer.class, phone));
    }
    assertEquals(
        429,
        assertThrows(AuthFailure.class, () -> auth.verifyOtp(phone, otp.codes.get(phone)))
            .status());
  }

  @Test
  void otpExpiryResendThrottleAndReuseAreEnforced() {
    String phone = "+919100000003";
    auth.requestOtp(phone);
    String first = otp.codes.get(phone);
    assertEquals(429, assertThrows(AuthFailure.class, () -> auth.requestOtp(phone)).status());
    clock.advance(Duration.ofMinutes(5));
    assertThrows(AuthFailure.class, () -> auth.verifyOtp(phone, first));
    auth.requestOtp(phone);
    var token = auth.verifyOtp(phone, otp.codes.get(phone));
    assertNotNull(token.accessToken());
    assertThrows(AuthFailure.class, () -> auth.verifyOtp(phone, otp.codes.get(phone)));
    assertEquals(429, assertThrows(AuthFailure.class, () -> auth.requestOtp(phone)).status());
  }

  @Test
  void concurrentOtpVerificationHasOneWinner() throws Exception {
    String phone = "+919100000004";
    auth.requestOtp(phone);
    String code = otp.codes.get(phone);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var barrier = new CyclicBarrier(2);
      Callable<Boolean> call =
          () -> {
            barrier.await();
            try {
              auth.verifyOtp(phone, code);
              return true;
            } catch (AuthFailure e) {
              return false;
            }
          };
      var a = pool.submit(call);
      var b = pool.submit(call);
      assertNotEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
    }
    assertEquals(1, sql.queryForObject("SELECT count(*) FROM auth_sessions", Integer.class));
  }

  @Test
  void concurrentOtpRequestsAreThrottled() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      var barrier = new CyclicBarrier(2);
      Callable<Integer> call =
          () -> {
            barrier.await();
            try {
              auth.requestOtp("+919100000005");
              return 204;
            } catch (AuthFailure e) {
              return e.status();
            }
          };
      var a = pool.submit(call);
      var b = pool.submit(call);
      assertEquals(
          Set.of(204, 429), Set.of(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS)));
    }
  }

  @Test
  void accessTokensRejectExpiredMalformedAndWrongSignatures() throws Exception {
    var tokens = login("+919100000006");
    assertNotNull(jwt.validateAndParseToken(tokens.accessToken()).getExpiration());
    assertNull(jwt.validateAndParseToken("not.a.jwt"));
    String[] parts = tokens.accessToken().split("\\.");
    String changed =
        parts[0]
            + "."
            + parts[1]
            + "."
            + (parts[2].startsWith("A") ? "B" : "A")
            + parts[2].substring(1);
    assertNull(jwt.validateAndParseToken(changed));
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + changed))
        .andExpect(status().isUnauthorized());
    clock.advance(Duration.ofMinutes(15));
    assertNull(jwt.validateAndParseToken(tokens.accessToken()));
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + tokens.accessToken()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void refreshIsHashedRotatedAndReplayRevokesFamily() throws Exception {
    var first = login("+919100000007");
    assertTrue(first.refreshToken().matches("[A-Za-z0-9_-]{43}"));
    assertEquals(
        AuthService.hashToken(first.refreshToken()),
        sql.queryForObject("SELECT token_hash FROM refresh_tokens", String.class));
    assertFalse(first.toString().contains(first.refreshToken()));
    var next = auth.refreshToken(first.refreshToken());
    assertNotEquals(first.refreshToken(), next.refreshToken());
    assertThrows(AuthFailure.class, () -> auth.refreshToken(first.refreshToken()));
    assertThrows(AuthFailure.class, () -> auth.refreshToken(next.refreshToken()));
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + next.accessToken()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void refreshExpirationAndLogoutInvalidateSession() throws Exception {
    var expired = login("+919100000008");
    clock.advance(Duration.ofDays(30));
    assertThrows(AuthFailure.class, () -> auth.refreshToken(expired.refreshToken()));
    var tokens = login("+919100000009");
    mvc.perform(
            post("/api/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("refreshToken", tokens.refreshToken()))))
        .andExpect(status().isNoContent());
    assertThrows(AuthFailure.class, () -> auth.refreshToken(tokens.refreshToken()));
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + tokens.accessToken()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void concurrentRefreshHasOneWinnerAndReplayClosesSession() throws Exception {
    var initial = login("+919100000010");
    try (var pool = Executors.newFixedThreadPool(2)) {
      var barrier = new CyclicBarrier(2);
      Callable<AuthTokens> call =
          () -> {
            barrier.await();
            try {
              return auth.refreshToken(initial.refreshToken());
            } catch (AuthFailure e) {
              return null;
            }
          };
      var a = pool.submit(call);
      var b = pool.submit(call);
      var first = a.get(15, TimeUnit.SECONDS);
      var second = b.get(15, TimeUnit.SECONDS);
      assertNotEquals(first == null, second == null);
      var winning = first == null ? second : first;
      assertThrows(AuthFailure.class, () -> auth.refreshToken(winning.refreshToken()));
    }
  }

  @Test
  void authorizationComesFromServerAndCannotEscalate() throws Exception {
    mvc.perform(get("/api/v1/profile")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/users/me/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"ADMIN\"}"))
        .andExpect(status().isUnauthorized());
    var customer = login("+919100000011");
    var worker = login("+919100000012");
    postJson("/api/v1/users/me/roles", customer, Map.of("role", "CUSTOMER"));
    postJson("/api/v1/users/me/roles", worker, Map.of("role", "WORKER"));
    for (var t : List.of(customer, worker))
      mvc.perform(
              post("/api/v1/users/me/roles")
                  .header("Authorization", "Bearer " + t.accessToken())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"role\":\"ADMIN\"}"))
          .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/v1/profile/worker")
                .header("Authorization", "Bearer " + customer.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/profile/customer")
                .header("Authorization", "Bearer " + worker.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isForbidden());
    assertEquals(
        List.of("CUSTOMER"),
        mapper.convertValue(getJson("/api/v1/users/me", customer).get("roles"), List.class));
    mvc.perform(
            post("/api/v1/users/me/roles")
                .header("Authorization", "Bearer " + customer.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"WORKER\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void customerFieldsPersistAndOwnershipCannotBeSupplied() throws Exception {
    var t = login("+919100000013");
    assertEquals("NOT_STARTED", getJson("/api/v1/users/me", t).get("onboardingState").asText());
    postJson("/api/v1/users/me/roles", t, Map.of("role", "CUSTOMER"));
    var d = customer();
    save(t, 1, d);
    assertEquals("IN_PROGRESS", getJson("/api/v1/users/me", t).get("onboardingState").asText());
    save(t, 2, d);
    postJson("/api/v1/onboarding/complete", t, Map.of());
    assertEquals("COMPLETED", getJson("/api/v1/users/me", t).get("onboardingState").asText());
    var another = login("+919100000014");
    postJson("/api/v1/users/me/roles", another, Map.of("role", "CUSTOMER"));
    var originalId = getJson("/api/v1/users/me", t).get("id").asText();
    d.put("userId", originalId);
    mvc.perform(
            post("/api/v1/profile/customer")
                .header("Authorization", "Bearer " + another.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(d)))
        .andExpect(status().isBadRequest());
    assertEquals("Synthetic Customer", getJson("/api/v1/users/me", t).get("fullName").asText());
    d.remove("userId");
    d.put("fullName", "Edited Customer");
    postJson("/api/v1/profile/customer", t, d);
    assertEquals(
        "Edited Customer",
        sql.queryForObject(
            "SELECT display_name FROM users WHERE id=?",
            String.class,
            UUID.fromString(originalId)));
    assertEquals(
        "560001",
        sql.queryForObject(
            "SELECT location->>'postalCode' FROM customer_profiles WHERE user_id=?",
            String.class,
            UUID.fromString(originalId)));
  }

  @Test
  void workerDraftResumesAfterLogoutAndRequiresReview() throws Exception {
    String phone = "+919100000015";
    var t = login(phone);
    postJson("/api/v1/users/me/roles", t, Map.of("role", "WORKER"));
    var d = worker();
    save(t, 1, d);
    auth.logout(t.refreshToken());
    clock.advance(Duration.ofMinutes(1));
    var again = login(phone);
    var saved = getJson("/api/v1/onboarding", again);
    assertEquals(1, saved.get("step").asInt());
    assertEquals("Synthetic Crew", saved.get("data").get("teamName").asText());
    mvc.perform(
            post("/api/v1/onboarding/complete")
                .header("Authorization", "Bearer " + again.accessToken()))
        .andExpect(status().isBadRequest());
    save(again, 2, d);
    save(again, 3, d);
    postJson("/api/v1/onboarding/complete", again, Map.of());
    var restored = auth.refreshToken(again.refreshToken());
    assertEquals(
        "COMPLETED", getJson("/api/v1/users/me", restored).get("onboardingState").asText());
    assertEquals(3, sql.queryForObject("SELECT team_size FROM worker_profiles", Integer.class));
    assertEquals(1, sql.queryForObject("SELECT count(*) FROM worker_subskills", Integer.class));
    assertEquals(
        1, sql.queryForObject("SELECT count(*) FROM worker_service_locations", Integer.class));
    var other = login("+919100000016");
    postJson("/api/v1/users/me/roles", other, Map.of("role", "WORKER"));
    d.put("userId", getJson("/api/v1/users/me", again).get("id").asText());
    mvc.perform(
            post("/api/v1/profile/worker")
                .header("Authorization", "Bearer " + other.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(d)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void requiredWorkerFieldsAndSkillTradeRelationshipAreValidated() throws Exception {
    var t = login("+919100000017");
    postJson("/api/v1/users/me/roles", t, Map.of("role", "WORKER"));
    var d = worker();
    d.remove("teamSize");
    mvc.perform(
            put("/api/v1/onboarding")
                .header("Authorization", "Bearer " + t.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("step", 1, "data", d))))
        .andExpect(status().isBadRequest());
    d.put("teamSize", 3);
    save(t, 1, d);
    d.put(
        "skillIds",
        List.of(
            sql.queryForObject(
                "SELECT id FROM trade_skills WHERE code='PLUMBING_PIPES'", UUID.class)));
    mvc.perform(
            put("/api/v1/onboarding")
                .header("Authorization", "Bearer " + t.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("step", 2, "data", d))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void productionCannotInstantiateOrUseDevelopmentProviderEvenWithDevEnabled() {
    for (String[] profiles :
        List.of(
            new String[] {"prod"},
            new String[] {"production"},
            new String[] {"prod", "dev"},
            new String[] {"production", "test"})) {
      var environment = new MockEnvironment();
      environment.setActiveProfiles(profiles);
      assertThrows(IllegalStateException.class, () -> new DevelopmentOtpProvider(environment));
      try (var context = new AnnotationConfigApplicationContext()) {
        context.getEnvironment().setActiveProfiles(profiles);
        context.register(DevelopmentOtpProvider.class, ProductionOtpProvider.class);
        context.refresh();
        assertTrue(context.getBeansOfType(DevelopmentOtpProvider.class).isEmpty());
        assertThrows(
            AuthFailure.class,
            () -> context.getBean(OtpProvider.class).sendOtp("+919100000018", "123456"));
      }
      assertThrows(
          IllegalStateException.class, () -> new JwtTokenProvider("", 15, environment, clock));
    }
  }

  @Test
  void explicitProfileReadsAreAuthorizedAndDoNotLeakAnotherUsersData() throws Exception {
    var t = login("+919100000081");
    postJson("/api/v1/users/me/roles", t, Map.of("role", "CUSTOMER"));
    save(t, 1, customer());
    save(t, 2, customer());
    postJson("/api/v1/onboarding/complete", t, Map.of());
    assertEquals("OTHER", getJson("/api/v1/profile/customer", t).at("/data/customerType").asText());
    mvc.perform(get("/api/v1/profile/worker").header("Authorization", "Bearer " + t.accessToken()))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/profile/customer")).andExpect(status().isUnauthorized());
    var stranger = login("+919100000082");
    mvc.perform(
            get("/api/v1/profile/customer")
                .header("Authorization", "Bearer " + stranger.accessToken()))
        .andExpect(status().isForbidden());
  }

  @Test
  void dualRoleProfilesRemainIndependentAndOriginalDraftKeepsItsRole() throws Exception {
    var t = login("+919100000083");
    postJson("/api/v1/users/me/roles", t, Map.of("role", "CUSTOMER"));
    save(t, 1, customer());
    save(t, 2, customer());
    postJson("/api/v1/onboarding/complete", t, Map.of());
    UUID id = UUID.fromString(getJson("/api/v1/users/me", t).get("id").asText());
    // Fixture only, in this test's disposable Testcontainers database. No public role bypass.
    sql.update("INSERT INTO user_roles(user_id,role_code) VALUES (?, 'WORKER')", id);
    String before =
        sql.queryForObject(
            "SELECT data::text FROM onboarding_drafts WHERE user_id=?", String.class, id);
    postJson("/api/v1/profile/worker", t, worker());
    assertEquals(
        before,
        sql.queryForObject(
            "SELECT data::text FROM onboarding_drafts WHERE user_id=?", String.class, id));
    assertEquals("CUSTOMER", getJson("/api/v1/onboarding", t).get("role").asText());
    assertEquals("OTHER", getJson("/api/v1/profile/customer", t).at("/data/customerType").asText());
    assertEquals("TEAM", getJson("/api/v1/profile/worker", t).at("/data/workerType").asText());
    var update = customer();
    update.put("customerType", "ARCHITECT");
    postJson("/api/v1/profile/customer", t, update);
    assertEquals(
        "ARCHITECT", getJson("/api/v1/profile/customer", t).at("/data/customerType").asText());
    assertEquals(
        "Synthetic Crew", getJson("/api/v1/profile/worker", t).at("/data/teamName").asText());
    assertTrue(getJson("/api/v1/profile/customer", t).at("/data/workerType").isNull());
    assertTrue(getJson("/api/v1/profile/worker", t).at("/data/customerType").isNull());
  }
}
