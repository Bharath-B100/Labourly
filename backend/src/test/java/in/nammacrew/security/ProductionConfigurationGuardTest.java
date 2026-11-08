package in.nammacrew.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class ProductionConfigurationGuardTest {
  private MockEnvironment valid() {
    var e = new MockEnvironment();
    e.setActiveProfiles("production");
    return e.withProperty(
            "spring.datasource.url",
            "jdbc:postgresql://db.example.invalid/labourly?sslmode=verify-full")
        .withProperty("spring.datasource.username", "app")
        .withProperty("spring.datasource.password", "test-only-non-default")
        .withProperty("jwt.secret", "test-only-value")
        .withProperty("auth.google.client-id", "test.apps.googleusercontent.com");
  }

  @Test
  void acceptsExplicitTlsConfiguration() {
    assertDoesNotThrow(() -> new ProductionConfigurationGuard(valid()));
  }

  @Test
  void rejectsMissingFieldsWithoutLeakingValues() {
    var e = valid();
    e.setProperty("jwt.secret", "");
    assertThrows(IllegalStateException.class, () -> new ProductionConfigurationGuard(e));
  }

  @Test
  void rejectsInsecureDatabaseTls() {
    for (String mode : new String[] {"disable", "require", "verify-ca"})
      assertThrows(
          IllegalStateException.class,
          () ->
              new ProductionConfigurationGuard(
                  valid()
                      .withProperty(
                          "spring.datasource.url", "jdbc:postgresql://db/app?sslmode=" + mode)));
  }

  @Test
  void rejectsMixedProfiles() {
    var e = valid();
    e.setActiveProfiles("production", "dev");
    assertThrows(IllegalStateException.class, () -> new ProductionConfigurationGuard(e));
  }

  @Test
  void rejectsDefaultPasswordAndPublicDocs() {
    assertThrows(
        IllegalStateException.class,
        () ->
            new ProductionConfigurationGuard(
                valid().withProperty("spring.datasource.password", "password")));
    assertThrows(
        IllegalStateException.class,
        () ->
            new ProductionConfigurationGuard(
                valid().withProperty("springdoc.api-docs.enabled", "true")));
  }
}
