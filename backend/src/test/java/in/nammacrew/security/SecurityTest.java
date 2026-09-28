package in.nammacrew.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SecurityTest.class)
@Import(SecurityConfig.class)
class SecurityTest {
  @Autowired MockMvc mvc;

  @Test
  void anonymousCannotReadAdminOrApiDocs() throws Exception {
    mvc.perform(get("/api/v1/admin/workers"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
    mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(roles = "CUSTOMER")
  void customersCannotAccessAdministrativeResources() throws Exception {
    mvc.perform(get("/api/v1/admin/workers")).andExpect(status().isForbidden());
    mvc.perform(get("/v3/api-docs")).andExpect(status().isForbidden());
  }

  @Test
  void csrfRejectsUntrustedMutation() throws Exception {
    mvc.perform(post("/api/v1/bookings")).andExpect(status().isForbidden());
  }
}
