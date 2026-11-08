package in.nammacrew.auth.foundation;

import java.time.*;
import java.util.*;

/** Not an OtpProvider bean. No implementation is registered with authentication. */
public interface SmsAdapter {
  enum Outcome {
    ACCEPTED,
    DEFINITELY_NOT_SENT,
    REJECTED,
    UNKNOWN
  }

  record Result(Outcome outcome, String providerMessageId, boolean retryable) {
    public Result {
      Objects.requireNonNull(outcome);
      if (outcome == Outcome.ACCEPTED && (providerMessageId == null || providerMessageId.isBlank()))
        throw new IllegalArgumentException("Missing message ID");
      if (retryable && outcome != Outcome.DEFINITELY_NOT_SENT)
        throw new IllegalArgumentException("Unsafe retry");
      if (providerMessageId != null && providerMessageId.length() > 200)
        throw new IllegalArgumentException("Invalid message ID");
    }

    @Override
    public String toString() {
      return "SmsResult[" + outcome + ",redacted]";
    }
  }

  final class Command {
    private final UUID deliveryId, attemptId;
    private final String phone, code, template;
    private final Instant expiresAt;

    public Command(
        UUID deliveryId,
        UUID attemptId,
        String phone,
        String code,
        String template,
        Instant expiresAt) {
      this.deliveryId = Objects.requireNonNull(deliveryId);
      this.attemptId = Objects.requireNonNull(attemptId);
      this.expiresAt = Objects.requireNonNull(expiresAt);
      if (phone == null
          || !phone.matches("\\+[1-9][0-9]{7,14}")
          || code == null
          || !code.matches("[0-9]{6}")
          || template == null
          || !template.matches("[a-zA-Z0-9_-]{1,64}"))
        throw new IllegalArgumentException("Invalid SMS command");
      this.phone = phone;
      this.code = code;
      this.template = template;
    }

    public UUID deliveryId() {
      return deliveryId;
    }

    public UUID attemptId() {
      return attemptId;
    }

    public String phone() {
      return phone;
    }

    public String code() {
      return code;
    }

    public String template() {
      return template;
    }

    public Instant expiresAt() {
      return expiresAt;
    }

    @Override
    public String toString() {
      return "SmsCommand[redacted]";
    }
  }

  Result send(Command command);

  enum Lookup {
    PENDING,
    DELIVERED,
    UNDELIVERED,
    DEFINITIVELY_ABSENT,
    UNKNOWN
  }

  Lookup lookup(String providerMessageId);

  record Callback(String messageId, String eventId, Lookup status, Instant occurredAt) {
    public Callback {
      Objects.requireNonNull(messageId);
      Objects.requireNonNull(eventId);
      Objects.requireNonNull(occurredAt);
      Objects.requireNonNull(status);
      if (messageId.isBlank()
          || eventId.isBlank()
          || messageId.length() > 200
          || eventId.length() > 200)
        throw new IllegalArgumentException("Invalid callback identity");
    }

    @Override
    public String toString() {
      return "SmsCallback[redacted]";
    }
  }

  Callback authenticateCallback(byte[] rawBody, Map<String, String> headers, String externalUrl);
}
