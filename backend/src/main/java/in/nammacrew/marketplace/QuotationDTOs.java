package in.nammacrew.marketplace;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface QuotationDTOs {

  record SubmitQuoteRequest(
      BigDecimal amount,
      String pricingBasis,
      Instant startsAt,
      int durationDays,
      String workerNote) {}

  record QuoteView(
      UUID id,
      UUID requirementId,
      UUID workerId,
      BigDecimal amount,
      String currency,
      String pricingBasis,
      Instant startsAt,
      int durationDays,
      String workerNote,
      String status,
      Instant createdAt,
      // Joined fields
      String workerName,
      String primaryTrade,
      String requirementTitle,
      UUID bookingId,
      String bookingStatus) {}
}
