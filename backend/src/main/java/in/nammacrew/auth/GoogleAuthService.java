package in.nammacrew.auth;

import in.nammacrew.user.*;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class GoogleAuthService {
  private final GoogleTokenVerifier verifier;
  private final JwtTokenProvider jwt;
  private final JdbcTemplate sql;
  private final UserRepository users;
  private final AuthService auth;
  private final TransactionTemplate tx;

  public GoogleAuthService(
      GoogleTokenVerifier verifier,
      JwtTokenProvider jwt,
      JdbcTemplate sql,
      UserRepository users,
      AuthService auth,
      PlatformTransactionManager manager) {
    this.verifier = verifier;
    this.jwt = jwt;
    this.sql = sql;
    this.users = users;
    this.auth = auth;
    this.tx = new TransactionTemplate(manager);
  }

  public JwtTokenProvider.GoogleChallenge challenge() {
    return jwt.googleChallenge();
  }

  public AuthTokens login(String token, String challenge) {
    var c = jwt.verifyGoogleChallenge(challenge);
    // Signature verification/JWKS HTTP must happen before the database transaction.
    var identity = verifier.verify(token, c.get("nonce", String.class));
    return tx.execute(
        status -> {
          redeem(c);
          sql.queryForList(
              "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
              "google:" + identity.subject());
          var ids =
              sql.queryForList(
                  "SELECT user_id FROM external_identities WHERE provider='GOOGLE' AND subject=?",
                  UUID.class,
                  identity.subject());
          User user;
          if (ids.isEmpty()) {
            user = new User(null);
            user.setDisplayName(identity.name());
            user = users.saveAndFlush(user);
            sql.update(
                "INSERT INTO external_identities(provider,subject,user_id) VALUES('GOOGLE',?,?)",
                identity.subject(),
                user.getId());
          } else
            user =
                users
                    .findById(ids.getFirst())
                    .orElseThrow(() -> new AuthFailure(401, "Account unavailable."));
          return auth.createProviderSession(user);
        });
  }

  public void link(UUID userId, String token, String challenge, String accessToken) {
    auth.requireRecentSession(userId, accessToken);
    var c = jwt.verifyGoogleChallenge(challenge);
    var identity = verifier.verify(token, c.get("nonce", String.class));
    tx.executeWithoutResult(
        status -> {
          redeem(c);
          sql.queryForList(
              "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
              "google:" + identity.subject());
          auth.lockRecentSession(userId, accessToken);
          var existing =
              sql.queryForList(
                  "SELECT user_id FROM external_identities WHERE provider='GOOGLE' AND subject=?",
                  UUID.class,
                  identity.subject());
          if (!existing.isEmpty() && !existing.getFirst().equals(userId))
            throw new AuthFailure(409, "This Google account is already linked to another account.");
          var subjects =
              sql.queryForList(
                  "SELECT subject FROM external_identities WHERE provider='GOOGLE' AND user_id=?",
                  String.class,
                  userId);
          if (!subjects.isEmpty() && !subjects.getFirst().equals(identity.subject()))
            throw new AuthFailure(409, "A different Google account is already linked.");
          sql.update(
              "INSERT INTO external_identities(provider,subject,user_id) VALUES('GOOGLE',?,?) ON CONFLICT DO NOTHING",
              identity.subject(),
              userId);
        });
  }

  private void redeem(io.jsonwebtoken.Claims c) {
    // Recheck expiry at the transactional boundary after network verification.
    int count =
        sql.update(
            "INSERT INTO google_login_redemptions(challenge_id,expires_at) SELECT ?,? WHERE ? > now() ON CONFLICT DO NOTHING",
            UUID.fromString(c.getId()),
            new Timestamp(c.getExpiration().getTime()),
            new Timestamp(c.getExpiration().getTime()));
    if (count != 1)
      throw new AuthFailure(401, "Google sign-in expired or already used. Try again.");
    sql.update(
        "DELETE FROM google_login_redemptions WHERE challenge_id IN (SELECT challenge_id FROM google_login_redemptions WHERE expires_at < now() ORDER BY expires_at LIMIT 100)");
  }
}
