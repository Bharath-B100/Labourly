package in.nammacrew.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_profiles")
public class WorkerProfile {
  @Id
  @Column(name = "user_id")
  private UUID userId;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @MapsId
  @JoinColumn(name = "user_id")
  private User user;

  @Column(length = 1200)
  private String bio;

  @Column(name = "experience_years", nullable = false)
  private short experienceYears = 0;

  @Column(name = "worker_type", length = 16)
  private String workerType = "INDIVIDUAL";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected WorkerProfile() {}

  public WorkerProfile(User user) {
    this.user = user;
  }

  public User getUser() {
    return user;
  }

  public String getBio() {
    return bio;
  }

  public void setBio(String bio) {
    this.bio = bio;
  }

  public short getExperienceYears() {
    return experienceYears;
  }

  public void setExperienceYears(short experienceYears) {
    this.experienceYears = experienceYears;
  }

  public String getWorkerType() {
    return workerType;
  }

  public void setWorkerType(String workerType) {
    this.workerType = workerType;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
