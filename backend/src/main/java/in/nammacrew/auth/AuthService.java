package in.nammacrew.auth;

import in.nammacrew.user.User;
import in.nammacrew.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final OtpChallengeRepository otpRepository;
  private final RefreshTokenRepository tokenRepository;
  private final AuthSessionRepository sessions;
  private final UserRepository users;
  private final JwtTokenProvider jwt;
  private final OtpProvider otpProvider;
  private final PasswordEncoder encoder;
  private final JdbcTemplate sql;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public AuthService(
      OtpChallengeRepository otpRepository,
      RefreshTokenRepository tokenRepository,
      AuthSessionRepository sessions,
      UserRepository users,
      JwtTokenProvider jwt,
      OtpProvider otpProvider,
      PasswordEncoder encoder,
      JdbcTemplate sql,
      Clock clock) {
    this.otpRepository = otpRepository;
    this.tokenRepository = tokenRepository;
    this.sessions = sessions;
    this.users = users;
    this.jwt = jwt;
    this.otpProvider = otpProvider;
    this.encoder = encoder;
    this.sql = sql;
    this.clock = clock;
  }

  private java.time.Instant now() {
    return clock.instant().truncatedTo(ChronoUnit.MICROS);
  }

  private void lockPhone(String phone) {
    if (phone == null || !phone.matches("\\+[1-9][0-9]{7,14}"))
      throw new AuthFailure(400, "Enter a valid international phone number.");
    sql.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", phone);
  }

  @Transactional
  public void requestOtp(String phone) {
    lockPhone(phone);
    var now = now();
    otpRepository
        .findFirstByPhoneOrderByCreatedAtDesc(phone)
        .ifPresent(
            c -> {
              if (c.getCreatedAt().isAfter(now.minus(60, ChronoUnit.SECONDS)))
                throw new AuthFailure(
                    429, "Please wait 60 seconds before requesting another code.");
            });
    String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
    var challenge =
        new OtpChallenge(phone, encoder.encode(code), now.plus(5, ChronoUnit.MINUTES), now);
    otpRepository.save(challenge);
    otpProvider.sendOtp(phone, code);
  }

  @Transactional(noRollbackFor = AuthFailure.class)
  public AuthTokens verifyOtp(String phone, String code) {
    lockPhone(phone);
    if (code == null || !code.matches("[0-9]{6}"))
      throw new AuthFailure(400, "Enter the six-digit code.");
    var challenge =
        otpRepository
            .findFirstByPhoneOrderByCreatedAtDesc(phone)
            .orElseThrow(() -> new AuthFailure(400, "Code is invalid, expired or already used."));
    if (challenge.isVerified() || !challenge.getExpiresAt().isAfter(now()))
      throw new AuthFailure(400, "Code is invalid, expired or already used.");
    if (challenge.getAttempts() >= challenge.getMaxAttempts())
      throw new AuthFailure(429, "Maximum verification attempts reached. Request a new code.");
    challenge.incrementAttempts();
    if (!otpProvider.verifyOtp(code, challenge.getCodeHash(), encoder))
      throw new AuthFailure(400, "Code is invalid, expired or already used.");
    challenge.setVerified(true);
    var user = users.findByPhone(phone).orElseGet(() -> users.save(new User(phone)));
    if (isDisabled(user)) throw new AuthFailure(403, "This account is unavailable.");
    var session = sessions.save(new AuthSession(user, now(), now().plus(30, ChronoUnit.DAYS)));
    return tokens(session);
  }

  @Transactional(noRollbackFor = AuthFailure.class)
  public AuthTokens refreshToken(String raw) {
    var token = token(raw);
    var session =
        sessions
            .lockById(token.getSession().getId())
            .orElseThrow(() -> new AuthFailure(401, "Session unavailable."));
    // Refresh the token state after acquiring the family lock (another transaction may have rotated
    // it).
    boolean revoked =
        Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT revoked FROM refresh_tokens WHERE id=?", Boolean.class, token.getId()));
    if (revoked) {
      session.revoke();
      throw new AuthFailure(401, "Refresh token reuse detected. Sign in again.");
    }
    if (session.isRevoked()
        || !session.getExpiresAt().isAfter(now())
        || !token.getExpiresAt().isAfter(now())
        || isDisabled(session.getUser()))
      throw new AuthFailure(401, "Session expired or revoked. Sign in again.");
    token.setRevoked(true);
    return tokens(session);
  }

  @Transactional
  public void logout(String raw) {
    if (raw == null || raw.length() > 200) return;
    tokenRepository
        .findByTokenHash(hashToken(raw))
        .ifPresent(t -> sessions.lockById(t.getSession().getId()).ifPresent(AuthSession::revoke));
  }

  private RefreshToken token(String raw) {
    if (raw == null || !raw.matches("[A-Za-z0-9_-]{43}"))
      throw new AuthFailure(401, "Invalid session credential.");
    return tokenRepository
        .findByTokenHash(hashToken(raw))
        .orElseThrow(() -> new AuthFailure(401, "Invalid session credential."));
  }

  private AuthTokens tokens(AuthSession session) {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    tokenRepository.save(new RefreshToken(session, hashToken(raw), now()));
    return new AuthTokens(jwt.generateAccessToken(session.getUser(), session.getId()), raw);
  }

  @Transactional(readOnly = true)
  public Authentication authenticate(String token) {
    var claims = jwt.validateAndParseToken(token);
    if (claims == null) return null;
    var session = sessions.findById(UUID.fromString(claims.get("sid", String.class))).orElse(null);
    if (session == null || session.isRevoked() || !session.getExpiresAt().isAfter(now()))
      return null;
    var user = session.getUser();
    if (!user.getId().toString().equals(claims.getSubject()) || isDisabled(user)) return null;
    var authorities =
        user.getRoles().stream()
            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getCode()))
            .toList();
    return new UsernamePasswordAuthenticationToken(user.getId().toString(), null, authorities);
  }

  private boolean isDisabled(User user) {
    return "SUSPENDED".equals(user.getStatus()) || "DEACTIVATED".equals(user.getStatus());
  }

  static String hashToken(String token) {
    try {
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(
              MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 unavailable", ex);
    }
  }
}
