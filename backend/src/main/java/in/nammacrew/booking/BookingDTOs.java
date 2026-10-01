package in.nammacrew.booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface BookingDTOs {
  record BookingView(
      UUID id,
      UUID requirementId,
      String requirementTitle,
      UUID workerId,
      String workerName,
      BigDecimal amount,
      String currency,
      String pricingBasis,
      Instant startsAt,
      Instant endsAt,
      String status) {}
}
