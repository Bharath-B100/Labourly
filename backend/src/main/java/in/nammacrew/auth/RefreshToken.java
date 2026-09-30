package in.nammacrew.auth;

import in.nammacrew.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private AuthSession session;

  @Column(name = "token_hash", nullable = false, unique = true)
  private String tokenHash;

  @Column(nullable = false)
  private boolean revoked = false;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected RefreshToken() {}

  public RefreshToken(AuthSession session, String tokenHash, Instant now) {
    this.session = session;
    this.user = session.getUser();
    this.tokenHash = tokenHash;
    this.expiresAt = session.getExpiresAt();
    this.createdAt = now;
    this.updatedAt = now;
  }

  public AuthSession getSession() {
    return session;
  }

  public UUID getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public void setRevoked(boolean revoked) {
    this.revoked = revoked;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
