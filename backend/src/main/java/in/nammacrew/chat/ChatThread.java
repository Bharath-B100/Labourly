package in.nammacrew.chat;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_threads")
public class ChatThread {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "booking_id", nullable = false, unique = true)
  private UUID bookingId;

  @Column(name = "customer_id", nullable = false)
  private UUID customerId;

  @Column(name = "worker_id", nullable = false)
  private UUID workerId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public UUID getBookingId() {
    return bookingId;
  }

  public UUID getCustomerId() {
    return customerId;
  }

  public UUID getWorkerId() {
    return workerId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setBookingId(UUID bookingId) {
    this.bookingId = bookingId;
  }

  public void setCustomerId(UUID customerId) {
    this.customerId = customerId;
  }

  public void setWorkerId(UUID workerId) {
    this.workerId = workerId;
  }
}
