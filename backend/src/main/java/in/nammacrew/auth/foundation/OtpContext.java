package in.nammacrew.auth.foundation;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** Canonical versioned AAD. Restricted identifiers cannot inject separators. */
public record OtpContext(
    UUID deliveryId, UUID challengeId, String provider, String templateVersion, Instant expiresAt) {
  public OtpContext {
    Objects.requireNonNull(deliveryId);
    Objects.requireNonNull(challengeId);
    Objects.requireNonNull(expiresAt);
    if (provider == null
        || !provider.matches("[a-zA-Z0-9_-]{1,64}")
        || templateVersion == null
        || !templateVersion.matches("[a-zA-Z0-9_-]{1,64}"))
      throw new IllegalArgumentException("Invalid encryption context");
  }

  public byte[] aad() {
    return ("otp-v1|"
            + deliveryId
            + "|"
            + challengeId
            + "|"
            + provider
            + "|"
            + templateVersion
            + "|"
            + expiresAt)
        .getBytes(StandardCharsets.UTF_8);
  }

  @Override
  public String toString() {
    return "OtpContext[redacted]";
  }
}
