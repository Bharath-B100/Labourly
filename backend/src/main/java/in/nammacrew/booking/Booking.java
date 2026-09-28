package in.nammacrew.booking;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {
  @Id private UUID id;

  @Column(name = "request_id", nullable = false)
  private UUID requestId;

  @Column(name = "starts_at", nullable = false)
  private Instant startsAt;

  @Column(name = "ends_at", nullable = false)
  private Instant endsAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookingState status;

  @Version private long version;

  protected Booking() {}

  public BookingState getStatus() {
    return status;
  }

  void transitionTo(BookingState next) {
    if (!status.canTransitionTo(next))
      throw new IllegalStateException("Invalid booking transition");
    status = next;
  }
}
