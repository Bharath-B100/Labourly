package in.nammacrew.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.*;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Only the pinned Google JWKS endpoint is trusted. No token-controlled URLs or shared secrets. */
@Component
public class GoogleTokenVerifier {
  public record Identity(String subject, String name) {}

  private final String audience;
  private final Clock clock;
  private final ObjectMapper mapper;
  private HttpClient http;
  private Map<String, RSAPublicKey> keys = Map.of();
  private Instant fetched = Instant.EPOCH;
  private Instant attempted = Instant.EPOCH;

  public GoogleTokenVerifier(
      @Value(
              "${auth.google.client-id:208033395266-ejqs8vqco559j25r4bugo2kj6co45bvl.apps.googleusercontent.com}")
          String audience,
      Clock clock,
      ObjectMapper mapper) {
    this.audience = audience;
    this.clock = clock;
    this.mapper = mapper;
  }

  public Identity verify(String token, String nonce) {
    if (audience.isBlank()) throw new AuthFailure(503, "Google sign-in is not configured.");
    try {
      if (token == null || token.length() > 16384) throw new IllegalArgumentException();
      var parts = token.split("\\.", -1);
      if (parts.length != 3) throw new IllegalArgumentException();
      var header = mapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
      if (!"RS256".equals(header.path("alg").asText())) throw new IllegalArgumentException();
      String kid = header.path("kid").asText();
      if (kid.isBlank() || kid.length() > 128) throw new IllegalArgumentException();
      return verifyWithKey(token, nonce, key(kid));
    } catch (AuthFailure ex) {
      throw ex;
    } catch (Exception ex) {
      throw new AuthFailure(401, "Google sign-in could not be verified.");
    }
  }

  Identity verifyWithKey(String token, String nonce, RSAPublicKey key) {
    try {
      var signed =
          Jwts.parser()
              .verifyWith(key)
              .clock(() -> Date.from(clock.instant()))
              .build()
              .parseSignedClaims(token);
      var c = signed.getPayload();
      if (!"RS256".equals(signed.getHeader().getAlgorithm())
          || !Set.of("accounts.google.com", "https://accounts.google.com").contains(c.getIssuer())
          || c.getAudience() == null
          || c.getAudience().size() != 1
          || !c.getAudience().contains(audience)
          || c.getExpiration() == null
          || !c.getExpiration().toInstant().isAfter(clock.instant())
          || c.getIssuedAt() == null
          || c.getIssuedAt().toInstant().isAfter(clock.instant().plusSeconds(30))
          || c.getSubject() == null
          || c.getSubject().isBlank()
          || c.getSubject().length() > 255
          || nonce == null
          || !nonce.equals(c.get("nonce", String.class))) throw new IllegalArgumentException();
      String name = c.get("name", String.class);
      return new Identity(
          c.getSubject(),
          name == null ? null : name.strip().substring(0, Math.min(name.strip().length(), 120)));
    } catch (RuntimeException ex) {
      throw new AuthFailure(401, "Google sign-in could not be verified.");
    }
  }

  private synchronized RSAPublicKey key(String kid) {
    var now = clock.instant();
    if (keys.containsKey(kid) && fetched.plusSeconds(3600).isAfter(now)) return keys.get(kid);
    if (attempted.plusSeconds(60).isAfter(now))
      throw new AuthFailure(503, "Google sign-in is temporarily unavailable. Try again shortly.");
    attempted = now;
    try {
      var request =
          HttpRequest.newBuilder(URI.create("https://www.googleapis.com/oauth2/v3/certs"))
              .timeout(Duration.ofSeconds(8))
              .GET()
              .build();
      if (http == null)
        http =
            HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
      var response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
      try (var body = response.body()) {
        if (response.statusCode() != 200) throw new IllegalStateException();
        byte[] bytes = body.readNBytes(131073);
        if (bytes.length > 131072) throw new IllegalStateException();
        var next = new HashMap<String, RSAPublicKey>();
        for (var item : mapper.readTree(bytes).path("keys")) {
          if (!"RSA".equals(item.path("kty").asText())
              || !"RS256".equals(item.path("alg").asText())
              || !"sig".equals(item.path("use").asText())) continue;
          var n = new BigInteger(1, Base64.getUrlDecoder().decode(item.path("n").asText()));
          var e = new BigInteger(1, Base64.getUrlDecoder().decode(item.path("e").asText()));
          if (n.bitLength() < 2048) continue;
          next.put(
              item.path("kid").asText(),
              (RSAPublicKey)
                  KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(n, e)));
        }
        if (next.isEmpty()) throw new IllegalStateException();
        keys = Map.copyOf(next);
        fetched = now;
      }
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new AuthFailure(503, "Google sign-in is temporarily unavailable.");
    } catch (Exception ex) {
      throw new AuthFailure(503, "Google sign-in is temporarily unavailable.");
    }
    if (!keys.containsKey(kid)) throw new AuthFailure(401, "Google sign-in could not be verified.");
    return keys.get(kid);
  }
}
