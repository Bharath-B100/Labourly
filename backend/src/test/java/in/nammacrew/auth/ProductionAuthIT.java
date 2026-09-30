package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import in.nammacrew.auth.dev.DevelopmentOtpProvider;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"prod", "dev"})
@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
class ProductionAuthIT {
  @Container
  static final PostgreSQLContainer<?> DB =
      new PostgreSQLContainer<>(
          DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", DB::getJdbcUrl);
    r.add("spring.datasource.username", DB::getUsername);
    r.add("spring.datasource.password", DB::getPassword);
    String key =
        Base64.getEncoder()
            .encodeToString(io.jsonwebtoken.Jwts.SIG.HS256.key().build().getEncoded());
    r.add("jwt.secret", () -> key);
  }

  @Autowired MockMvc mvc;
  @Autowired ApplicationContext context;
  @Autowired JdbcTemplate sql;

  @Test
  void productionApiNeverReturnsOrLogsDevelopmentOtp(CapturedOutput output) throws Exception {
    assertTrue(context.getBeansOfType(DevelopmentOtpProvider.class).isEmpty());
    var response =
        mvc.perform(
                post("/api/v1/auth/otp/request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"+919199999990\"}"))
            .andExpect(status().isServiceUnavailable())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertFalse(response.contains("code\""));
    assertFalse(response.contains("token\""));
    assertFalse(output.getAll().contains("Sending OTP"));
    assertFalse(output.getAll().contains("+919199999990"));
    assertEquals(0, sql.queryForObject("SELECT count(*) FROM otp_challenges", Integer.class));
  }
}
