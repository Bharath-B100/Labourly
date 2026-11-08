package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import in.nammacrew.auth.dev.DevelopmentOtpProvider;
import in.nammacrew.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** No Boot application, database, HTTP delivery, or Testcontainers is started. */
class OtpSecurityTest {
  private static final Instant NOW = Instant.parse("2026-01-01T12:00:00Z");
  private static final String PHONE = "+919000000001";
  private final OtpChallengeRepository challenges = mock(OtpChallengeRepository.class);
  private final OtpProvider provider = mock(OtpProvider.class);
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
  private final JdbcTemplate sql = mock(JdbcTemplate.class);
  private final AuthService auth =
      new AuthService(
          challenges,
          mock(RefreshTokenRepository.class),
          mock(AuthSessionRepository.class),
          mock(UserRepository.class),
          mock(JwtTokenProvider.class),
          provider,
          encoder,
          sql,
          Clock.fixed(NOW, ZoneOffset.UTC));

  static Stream<Arguments> productionProfiles() {
    return Stream.of(
            new String[] {},
            new String[] {"prod"},
            new String[] {"production"},
            new String[] {"dev", "prod"},
            new String[] {"dev", "production"},
            new String[] {"test", "prod"},
            new String[] {"test", "production"})
        .map(profiles -> Arguments.of((Object) profiles));
  }

  @ParameterizedTest
  @MethodSource("productionProfiles")
  void productionNeverRegistersDevelopmentProvider(String[] profiles) {
    try (var context = new AnnotationConfigApplicationContext()) {
      context.getEnvironment().setActiveProfiles(profiles);
      context.register(ProductionOtpProvider.class, DevelopmentOtpProvider.class);
      context.refresh();
      assertTrue(context.getBeansOfType(DevelopmentOtpProvider.class).isEmpty());
      var production = context.getBean(OtpProvider.class);
      assertInstanceOf(ProductionOtpProvider.class, production);
      assertEquals(
          503, assertThrows(AuthFailure.class, () -> production.sendOtp(PHONE, "654321")).status());
      assertFalse(production.verifyOtp("123456", encoder.encode("654321"), encoder));
      assertTrue(production.verifyOtp("654321", encoder.encode("654321"), encoder));
      var environment = new MockEnvironment();
      environment.setActiveProfiles(profiles);
      assertThrows(IllegalStateException.class, () -> new DevelopmentOtpProvider(environment));
      assertThrows(
          IllegalStateException.class,
          () -> new JwtTokenProvider("", 15, environment, Clock.systemUTC()));
    }
  }

  @Test
  void isolatedDevelopmentRegistersOnlyDevelopmentProvider() {
    try (var context = new AnnotationConfigApplicationContext()) {
      context.getEnvironment().setActiveProfiles("dev");
      context.register(ProductionOtpProvider.class, DevelopmentOtpProvider.class);
      context.refresh();
      assertInstanceOf(DevelopmentOtpProvider.class, context.getBean(OtpProvider.class));
      assertTrue(context.getBeansOfType(ProductionOtpProvider.class).isEmpty());
    }
  }

  @Test
  void generationStoresOnlyHashAndFiveMinuteExpiry() {
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(Optional.empty());
    auth.requestOtp(PHONE);
    var code = org.mockito.ArgumentCaptor.forClass(String.class);
    verify(provider).sendOtp(eq(PHONE), code.capture());
    assertTrue(code.getValue().matches("[0-9]{6}"));
    var saved = org.mockito.ArgumentCaptor.forClass(OtpChallenge.class);
    verify(challenges).save(saved.capture());
    assertNotEquals(code.getValue(), saved.getValue().getCodeHash());
    assertTrue(encoder.matches(code.getValue(), saved.getValue().getCodeHash()));
    assertEquals(NOW.plusSeconds(300), saved.getValue().getExpiresAt());
    assertEquals(3, saved.getValue().getMaxAttempts());
  }

  @Test
  void resendWithinCooldownDoesNotSendOrSave() {
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE))
        .thenReturn(
            Optional.of(
                new OtpChallenge(PHONE, "hash", NOW.plusSeconds(300), NOW.minusSeconds(59))));
    assertEquals(429, assertThrows(AuthFailure.class, () -> auth.requestOtp(PHONE)).status());
    verifyNoInteractions(provider);
    verify(challenges, never()).save(any());
  }

  @Test
  void resendAtSixtySecondsCreatesFreshChallenge() {
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE))
        .thenReturn(
            Optional.of(
                new OtpChallenge(PHONE, "hash", NOW.plusSeconds(240), NOW.minusSeconds(60))));
    auth.requestOtp(PHONE);
    verify(provider).sendOtp(eq(PHONE), anyString());
    verify(challenges).save(any());
  }

  @Test
  void invalidPhoneIsRejectedBeforeDatabaseOrDelivery() {
    assertEquals(
        400, assertThrows(AuthFailure.class, () -> auth.requestOtp("9000000001")).status());
    verifyNoInteractions(sql, challenges, provider);
  }

  @Test
  void expiredAndUsedChallengesNeverReachVerificationProvider() {
    var expired = new OtpChallenge(PHONE, "hash", NOW, NOW.minusSeconds(300));
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(Optional.of(expired));
    assertEquals(
        400, assertThrows(AuthFailure.class, () -> auth.verifyOtp(PHONE, "654321")).status());
    var used = new OtpChallenge(PHONE, "hash", NOW.plusSeconds(300), NOW);
    used.setVerified(true);
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(Optional.of(used));
    assertEquals(
        400, assertThrows(AuthFailure.class, () -> auth.verifyOtp(PHONE, "654321")).status());
    verifyNoInteractions(provider);
  }

  @Test
  void threeWrongAttemptsBlockFourthWithoutProviderVerification() {
    var challenge = new OtpChallenge(PHONE, "hash", NOW.plusSeconds(300), NOW);
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(Optional.of(challenge));
    for (int i = 0; i < 3; i++)
      assertEquals(
          400, assertThrows(AuthFailure.class, () -> auth.verifyOtp(PHONE, "654321")).status());
    assertEquals(
        429, assertThrows(AuthFailure.class, () -> auth.verifyOtp(PHONE, "654321")).status());
    assertEquals(3, challenge.getAttempts());
    verify(provider, times(3)).verifyOtp(eq("654321"), eq("hash"), same(encoder));
  }

  @Test
  void providerFailurePropagatesRatherThanClaimingDelivery() {
    when(challenges.findFirstByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(Optional.empty());
    doThrow(new AuthFailure(503, "Unavailable")).when(provider).sendOtp(eq(PHONE), anyString());
    assertEquals(503, assertThrows(AuthFailure.class, () -> auth.requestOtp(PHONE)).status());
    // Transaction rollback/persistence is deliberately NOT asserted by this mocked unit test.
  }
}
