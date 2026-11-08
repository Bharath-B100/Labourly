package in.nammacrew.support;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///labourly_support_test")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SupportIT {
  @Autowired SupportService service;
  @Autowired JdbcTemplate sql;
  @Autowired MockMvc mvc;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otp;
  UUID owner;

  @BeforeEach
  void setup() {
    owner = UUID.randomUUID();
    sql.update("INSERT INTO users(id,status) VALUES(?,'ACTIVE')", owner);
  }

  @Test
  void requestIsDurableAndDuplicateDoesNotOverwrite() {
    var a = service.create(owner, "SUPPORT", "Need help with a booking");
    var b = service.create(owner, "SUPPORT", "Duplicate retry");
    assertEquals(a.id(), b.id());
    assertEquals(a.details(), b.details());
    assertEquals(1, service.mine(owner).size());
  }

  @Test
  void deletionRequestDoesNotDeleteOrClaimErasure() {
    var r = service.create(owner, "ACCOUNT_DELETION", "Please delete my account");
    assertEquals("OPEN", r.status());
    assertEquals(
        1, sql.queryForObject("SELECT count(*) FROM users WHERE id=?", Integer.class, owner));
  }

  @Test
  void concurrentRetryCreatesOneRequest() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      var gate = new CyclicBarrier(2);
      Callable<UUID> call =
          () -> {
            gate.await(5, TimeUnit.SECONDS);
            return service.create(owner, "SUPPORT", "Concurrent request").id();
          };
      var a = pool.submit(call);
      var b = pool.submit(call);
      assertEquals(a.get(10, TimeUnit.SECONDS), b.get(10, TimeUnit.SECONDS));
    }
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM support_request_events e JOIN support_requests r ON e.request_id=r.id WHERE r.user_id=?",
            Integer.class,
            owner));
  }

  @Test
  void authenticatedListCannotExposeAnotherAccount() throws Exception {
    service.create(owner, "SUPPORT", "Private details");
    mvc.perform(
            get("/api/v1/support/requests")
                .with(user(UUID.randomUUID().toString()).roles("CUSTOMER")))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
    mvc.perform(get("/api/v1/support/requests")).andExpect(status().isUnauthorized());
  }

  @Test
  void normalUserCannotAccessAdminQueue() throws Exception {
    mvc.perform(
            get("/api/v1/admin/support/requests").with(user(owner.toString()).roles("CUSTOMER")))
        .andExpect(status().isForbidden());
  }

  @Test
  void invalidInputRejected() {
    assertThrows(in.nammacrew.auth.AuthFailure.class, () -> service.create(owner, "SUPPORT", " "));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class, () -> service.create(owner, "OTHER", "Details"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> service.create(owner, "SUPPORT", "x".repeat(2001)));
    assertTrue(service.mine(owner).isEmpty());
  }

  @Test
  void adminCanReviewButCannotPretendDeletionComplete() throws Exception {
    var r = service.create(owner, "ACCOUNT_DELETION", "Delete request");
    mvc.perform(
            patch("/api/v1/admin/support/requests/" + r.id())
                .with(user(owner.toString()).roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"IN_REVIEW\",\"note\":\"Checking retention obligations\"}"))
        .andExpect(status().isOk());
    mvc.perform(
            patch("/api/v1/admin/support/requests/" + r.id())
                .with(user(owner.toString()).roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RESOLVED\",\"note\":\"Completed\"}"))
        .andExpect(status().isConflict());
    assertEquals("IN_REVIEW", service.mine(owner).getFirst().status());
  }
}
