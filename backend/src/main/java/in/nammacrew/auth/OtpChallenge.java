package in.nammacrew.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "otp_challenges")
public class OtpChallenge {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 16)
  private String phone;

  @Column(name = "code_hash", nullable = false)
  private String codeHash;

  @Column(nullable = false)
  private short attempts = 0;

  @Column(name = "max_attempts", nullable = false)
  private short maxAttempts = 3;

  @Column(nullable = false)
  private boolean verified = false;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected OtpChallenge() {}

  public OtpChallenge(String phone, String codeHash, Instant expiresAt, Instant now) {
    this.phone = phone;
    this.codeHash = codeHash;
    this.expiresAt = expiresAt;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public UUID getId() {
    return id;
  }

  public String getPhone() {
    return phone;
  }

  public String getCodeHash() {
    return codeHash;
  }

  public short getAttempts() {
    return attempts;
  }

  public void incrementAttempts() {
    this.attempts++;
  }

  public short getMaxAttempts() {
    return maxAttempts;
  }

  public boolean isVerified() {
    return verified;
  }

  public void setVerified(boolean verified) {
    this.verified = verified;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
