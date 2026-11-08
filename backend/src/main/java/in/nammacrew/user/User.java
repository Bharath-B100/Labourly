package in.nammacrew.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(unique = true, length = 16)
  private String phone;

  @Column(name = "contact_phone", length = 16)
  private String contactPhone;

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String value) {
    contactPhone = value;
  }

  @Column(name = "display_name", length = 120)
  private String displayName;

  @Column(nullable = false, length = 16)
  private String status = "PENDING";

  @Column(name = "onboarding_state", nullable = false, length = 16)
  private String onboardingState = "NOT_STARTED";

  @Column(name = "onboarding_step", length = 32)
  private String onboardingStep;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "user_roles",
      joinColumns = @JoinColumn(name = "user_id"),
      inverseJoinColumns = @JoinColumn(name = "role_code"))
  private Set<Role> roles = new java.util.HashSet<>();

  protected User() {}

  public User(String phone) {
    this.phone = phone;
  }

  public UUID getId() {
    return id;
  }

  public String getPhone() {
    return phone;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getOnboardingState() {
    return onboardingState;
  }

  public void setOnboardingState(String onboardingState) {
    this.onboardingState = onboardingState;
  }

  public String getOnboardingStep() {
    return onboardingStep;
  }

  public void setOnboardingStep(String onboardingStep) {
    this.onboardingStep = onboardingStep;
  }

  public Set<Role> getRoles() {
    return roles;
  }

  public void setRoles(Set<Role> roles) {
    this.roles = roles;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
