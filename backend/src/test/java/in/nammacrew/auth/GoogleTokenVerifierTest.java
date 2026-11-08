package in.nammacrew.auth;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.time.*;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class GoogleTokenVerifierTest {
  static final Instant NOW = Instant.parse("2026-11-02T12:00:00Z");
  final KeyPair pair = Jwts.SIG.RS256.keyPair().build();
  final GoogleTokenVerifier verifier =
      new GoogleTokenVerifier("web-client", Clock.fixed(NOW, ZoneOffset.UTC), new ObjectMapper());

  String token(String field) {
    var builder =
        Jwts.builder()
            .issuer(
                field.equals("issuer") ? "https://attacker.example" : "https://accounts.google.com")
            .subject(field.equals("subject") ? "" : "google-subject")
            .audience()
            .add(field.equals("audience") ? "other-client" : "web-client")
            .and()
            .claim("nonce", field.equals("nonce") ? "wrong" : "nonce")
            .claim("name", "Fictional User")
            .issuedAt(
                Date.from(field.equals("future") ? NOW.plusSeconds(3600) : NOW.minusSeconds(5)));
    if (!field.equals("missing-exp"))
      builder.expiration(
          Date.from(field.equals("expired") ? NOW.minusSeconds(1) : NOW.plusSeconds(300)));
    return builder.signWith(pair.getPrivate(), Jwts.SIG.RS256).compact();
  }

  @Test
  void validSignatureAndClaimsProduceStableSubject() {
    var identity = verifier.verifyWithKey(token("valid"), "nonce", (RSAPublicKey) pair.getPublic());
    assertEquals("google-subject", identity.subject());
  }

  @ParameterizedTest
  @ValueSource(
      strings = {"issuer", "audience", "nonce", "expired", "missing-exp", "future", "subject"})
  void invalidClaimsAreRejected(String field) {
    assertThrows(
        AuthFailure.class,
        () -> verifier.verifyWithKey(token(field), "nonce", (RSAPublicKey) pair.getPublic()));
  }

  @Test
  void forgedSignatureIsRejected() {
    var other = Jwts.SIG.RS256.keyPair().build();
    assertThrows(
        AuthFailure.class,
        () -> verifier.verifyWithKey(token("valid"), "nonce", (RSAPublicKey) other.getPublic()));
  }

  @Test
  void malformedInputRejectedWithoutKeyFetch() {
    assertThrows(AuthFailure.class, () -> verifier.verify("invalid", "nonce"));
    assertThrows(AuthFailure.class, () -> verifier.verify("x".repeat(16385), "nonce"));
  }
}
