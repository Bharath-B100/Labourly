package in.nammacrew.auth;

import in.nammacrew.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {
  private final SecretKey key;
  private final long expirationMinutes;
  private final Clock clock;

  public JwtTokenProvider(
      @Value("${jwt.secret:}") String secret,
      @Value("${jwt.access.expiration.minutes:15}") long expirationMinutes,
      Environment environment,
      Clock clock) {
    boolean development =
        environment.acceptsProfiles(Profiles.of("dev", "test"))
            && !environment.acceptsProfiles(Profiles.of("prod", "production"));
    if (secret.isBlank()) {
      if (!development) throw new IllegalStateException("JWT_SECRET is required outside dev/test.");
      this.key = Jwts.SIG.HS256.key().build();
    } else {
      this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
    }
    if (expirationMinutes < 1 || expirationMinutes > 60)
      throw new IllegalArgumentException("Invalid access token lifetime");
    this.expirationMinutes = expirationMinutes;
    this.clock = clock;
  }

  public String generateAccessToken(User user, UUID sessionId) {
    var now = clock.instant();
    return Jwts.builder()
        .id(UUID.randomUUID().toString())
        .issuer("nammacrew")
        .subject(user.getId().toString())
        .claim("sid", sessionId.toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
        .signWith(key, Jwts.SIG.HS256)
        .compact();
  }

  public record GoogleChallenge(String challenge, String nonce) {}

  public GoogleChallenge googleChallenge() {
    var nonce =
        UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", "");
    var now = clock.instant();
    var challenge =
        Jwts.builder()
            .issuer("nammacrew-google-challenge")
            .id(UUID.randomUUID().toString())
            .claim("nonce", nonce)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(5, ChronoUnit.MINUTES)))
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    return new GoogleChallenge(challenge, nonce);
  }

  Claims verifyGoogleChallenge(String token) {
    try {
      if (token == null || token.length() > 2048) throw new IllegalArgumentException();
      var signed =
          Jwts.parser()
              .verifyWith(key)
              .requireIssuer("nammacrew-google-challenge")
              .clock(() -> Date.from(clock.instant()))
              .build()
              .parseSignedClaims(token);
      var claims = signed.getPayload();
      UUID.fromString(claims.getId());
      if (!"HS256".equals(signed.getHeader().getAlgorithm())
          || claims.getExpiration() == null
          || !claims.getExpiration().toInstant().isAfter(clock.instant())
          || !claims.get("nonce", String.class).matches("[a-f0-9]{64}"))
        throw new IllegalArgumentException();
      return claims;
    } catch (RuntimeException ex) {
      throw new AuthFailure(401, "Google sign-in expired. Try again.");
    }
  }

  public Claims validateAndParseToken(String token) {
    try {
      var signed =
          Jwts.parser()
              .verifyWith(key)
              .requireIssuer("nammacrew")
              .clock(() -> Date.from(clock.instant()))
              .build()
              .parseSignedClaims(token);
      var claims = signed.getPayload();
      if (!"HS256".equals(signed.getHeader().getAlgorithm())
          || claims.getExpiration() == null
          || claims.getIssuedAt() == null
          || !claims.getExpiration().after(Date.from(clock.instant()))) return null;
      UUID.fromString(claims.getSubject());
      UUID.fromString(claims.get("sid", String.class));
      return claims;
    } catch (JwtException | IllegalArgumentException | NullPointerException e) {
      return null;
    }
  }
}
