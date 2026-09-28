package in.nammacrew.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  UserDetailsService noBootstrapUsers() {
    return username -> {
      throw new UsernameNotFoundException("Authentication is not provisioned");
    };
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, ObjectMapper mapper) throws Exception {
    return http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers(
                        "/api/v1/admin/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                    .hasRole("ADMIN")
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (req, res, ex) -> problem(mapper, res, 401, "Authentication required"))
                    .accessDeniedHandler(
                        (req, res, ex) -> problem(mapper, res, 403, "Access denied")))
        .build();
  }

  private static void problem(
      ObjectMapper mapper, HttpServletResponse response, int status, String title)
      throws IOException {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    mapper.writeValue(
        response.getOutputStream(),
        Map.of("type", "about:blank", "title", title, "status", status));
  }
}
