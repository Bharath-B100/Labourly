package in.nammacrew.security;

import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** Fail closed for explicitly selected production profiles; never prints secret values. */
@Component
@Profile("prod | production")
public class ProductionConfigurationGuard {
  public ProductionConfigurationGuard(Environment env) {
    if (env.acceptsProfiles(Profiles.of("dev", "test")))
      throw new IllegalStateException("Do not combine production and development/test profiles.");
    String db = required(env, "spring.datasource.url");
    if (!db.startsWith("jdbc:postgresql://") || !db.matches(".*[?&]sslmode=verify-full(?:&.*)?$"))
      throw new IllegalStateException(
          "Production PostgreSQL requires sslmode=verify-full and a trusted server certificate.");
    required(env, "spring.datasource.username");
    String password = required(env, "spring.datasource.password");
    if (password.equals("password") || password.equals("test"))
      throw new IllegalStateException(
          "Development database passwords are not allowed in production.");
    required(env, "jwt.secret");
    if (!required(env, "auth.google.client-id").endsWith(".apps.googleusercontent.com"))
      throw new IllegalStateException("An approved Google client ID is required.");
    if (Boolean.parseBoolean(env.getProperty("springdoc.api-docs.enabled", "false")))
      throw new IllegalStateException(
          "Public API documentation must remain disabled in production.");
  }

  private static String required(Environment env, String name) {
    String value = env.getProperty(name);
    if (value == null || value.isBlank() || value.contains("${"))
      throw new IllegalStateException("Missing required production configuration: " + name);
    return value;
  }
}
