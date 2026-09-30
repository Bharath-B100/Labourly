package in.nammacrew.auth;

import in.nammacrew.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {
  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User user;

  private boolean revoked;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected AuthSession() {}

  public AuthSession(User user, Instant now, Instant expiresAt) {
    this.id = UUID.randomUUID();
    this.user = user;
    this.createdAt = now;
    this.updatedAt = now;
    this.expiresAt = expiresAt;
  }

  public UUID getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public void revoke() {
    revoked = true;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }
}
