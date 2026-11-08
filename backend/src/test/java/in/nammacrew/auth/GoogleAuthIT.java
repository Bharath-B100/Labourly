package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import in.nammacrew.user.*;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///labourly_google_test")
@ActiveProfiles("test")
class GoogleAuthIT {
  @Autowired GoogleAuthService google;
  @Autowired AuthService auth;
  @Autowired UserRepository users;
  @Autowired ProfileService profiles;
  @Autowired JdbcTemplate sql;
  @Autowired JwtTokenProvider jwt;
  @org.springframework.boot.test.mock.mockito.MockBean GoogleTokenVerifier verifier;
  @org.springframework.boot.test.mock.mockito.MockBean OtpProvider otp;
  String subject;

  @BeforeEach
  void setup() {
    subject = UUID.randomUUID().toString();
    when(verifier.verify(anyString(), anyString()))
        .thenReturn(new GoogleTokenVerifier.Identity(subject, "Fictional Google User"));
  }

  AuthTokens login() {
    return google.login("test-id-token", google.challenge().challenge());
  }

  UUID userId(AuthTokens tokens) {
    return UUID.fromString(auth.authenticate(tokens.accessToken()).getName());
  }

  @Test
  void signInUsesExistingSessionsAndStableSubject() {
    var tokens = login();
    var id = userId(tokens);
    assertEquals(id, userId(login()));
    assertNull(users.findById(id).orElseThrow().getPhone());
    assertTrue(profiles.me(id).roles().isEmpty());
    assertEquals(id, userId(auth.refreshToken(tokens.refreshToken())));
    auth.logout(tokens.refreshToken());
    assertNull(auth.authenticate(tokens.accessToken()));
  }

  @Test
  void replayAndAccessTokenConfusionFailClosed() {
    var challenge = google.challenge();
    assertNull(jwt.validateAndParseToken(challenge.challenge()));
    google.login("test-id-token", challenge.challenge());
    assertThrows(AuthFailure.class, () -> google.login("test-id-token", challenge.challenge()));
  }

  @Test
  void typedPhoneDoesNotLinkOrVerifyAnotherAccount() {
    var legacy = users.saveAndFlush(new User("+919800000001"));
    var id = userId(login());
    profiles.contact(id, legacy.getPhone());
    assertNotEquals(legacy.getId(), id);
    assertEquals("", profiles.me(id).phone());
    assertEquals(legacy.getPhone(), profiles.me(id).contactPhone());
    assertEquals(legacy.getId(), users.findByPhone(legacy.getPhone()).orElseThrow().getId());
  }

  @Test
  void explicitLinkPreservesExistingUserAndRejectsOtherOwners() {
    var legacy = users.saveAndFlush(new User("+919800000002"));
    var session = auth.createProviderSession(legacy);
    google.link(
        legacy.getId(), "test-id-token", google.challenge().challenge(), session.accessToken());
    assertEquals(legacy.getId(), userId(login()));
    var other = users.saveAndFlush(new User("+919800000003"));
    var otherSession = auth.createProviderSession(other);
    assertThrows(
        AuthFailure.class,
        () ->
            google.link(
                other.getId(),
                "test-id-token",
                google.challenge().challenge(),
                otherSession.accessToken()));
  }

  @Test
  void staleSessionCannotLinkAndDisabledAccountCannotSignIn() {
    var tokens = login();
    var id = userId(tokens);
    sql.update("UPDATE auth_sessions SET created_at=now()-interval '1 hour' WHERE user_id=?", id);
    assertThrows(
        AuthFailure.class,
        () ->
            google.link(id, "test-id-token", google.challenge().challenge(), tokens.accessToken()));
    sql.update("UPDATE users SET status='SUSPENDED' WHERE id=?", id);
    assertThrows(AuthFailure.class, () -> login());
  }

  @Test
  void concurrentFirstLoginsCreateOneIdentityAndAccount() throws Exception {
    var a = google.challenge();
    var b = google.challenge();
    var barrier = new CyclicBarrier(2);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var first =
          pool.submit(
              () -> {
                barrier.await(5, TimeUnit.SECONDS);
                return google.login("test-id-token", a.challenge());
              });
      var second =
          pool.submit(
              () -> {
                barrier.await(5, TimeUnit.SECONDS);
                return google.login("test-id-token", b.challenge());
              });
      assertEquals(
          userId(first.get(15, TimeUnit.SECONDS)), userId(second.get(15, TimeUnit.SECONDS)));
    }
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM external_identities WHERE subject=?", Integer.class, subject));
  }

  @Test
  void logoutDuringProviderVerificationPreventsLink() {
    var user = users.saveAndFlush(new User(null));
    var session = auth.createProviderSession(user);
    when(verifier.verify(anyString(), anyString()))
        .thenAnswer(
            invocation -> {
              auth.logout(session.refreshToken());
              return new GoogleTokenVerifier.Identity(subject, "Fictional User");
            });
    assertThrows(
        AuthFailure.class,
        () ->
            google.link(
                user.getId(),
                "test-id-token",
                google.challenge().challenge(),
                session.accessToken()));
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM external_identities WHERE user_id=?",
            Integer.class,
            user.getId()));
  }

  @Test
  void suspensionDuringProviderVerificationPreventsLink() {
    var user = users.saveAndFlush(new User(null));
    var session = auth.createProviderSession(user);
    when(verifier.verify(anyString(), anyString()))
        .thenAnswer(
            invocation -> {
              sql.update("UPDATE users SET status='SUSPENDED' WHERE id=?", user.getId());
              return new GoogleTokenVerifier.Identity(subject, "Fictional User");
            });
    assertThrows(
        AuthFailure.class,
        () ->
            google.link(
                user.getId(),
                "test-id-token",
                google.challenge().challenge(),
                session.accessToken()));
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM external_identities WHERE user_id=?",
            Integer.class,
            user.getId()));
  }
}
