package in.nammacrew.auth.redis;

import in.nammacrew.auth.foundation.*;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Dormant coordinator. No authentication callers or automatic readiness creation. */
public final class OtpAdmission {
  public interface Transport {
    List<?> evaluate(String script, List<String> keys, List<String> args, Duration timeout)
        throws Exception;
  }

  public record Health(
      RecoveryPolicy recovery, boolean approved, boolean redisHealthy, boolean historyComplete) {}

  public static final class Operation {
    private final List<String> keys, args;
    private final UUID generation;
    private final Instant deadline;
    private final String token;

    private Operation(List<String> k, List<String> a, UUID g, Instant d, String t) {
      keys = List.copyOf(k);
      args = List.copyOf(a);
      generation = g;
      deadline = d;
      token = t;
    }

    public List<String> keys() {
      return keys;
    }

    public List<String> arguments() {
      return args;
    }

    @Override
    public String toString() {
      return "OtpOperation[redacted]";
    }
  }

  private final java.util.concurrent.atomic.AtomicBoolean quarantined =
      new java.util.concurrent.atomic.AtomicBoolean();
  private final Transport transport;
  private final byte[] identityKey;
  private final String namespace;
  private final Clock clock;

  public OtpAdmission(Transport transport, byte[] identityKey, String namespace, Clock clock) {
    this.transport = Objects.requireNonNull(transport);
    this.clock = Objects.requireNonNull(clock);
    if (identityKey == null
        || identityKey.length < 32
        || namespace == null
        || !namespace.matches("[a-z0-9_-]{1,32}"))
      throw new IllegalArgumentException("Invalid admission configuration");
    this.identityKey = identityKey.clone();
    this.namespace = namespace;
  }

  private String digest(String value, boolean keyed) {
    try {
      byte[] result;
      if (keyed) {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(identityKey, "HmacSHA256"));
        result = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
      } else
        result =
            MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(result);
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("Identity derivation unavailable");
    }
  }

  /** IP must be the resolved socket peer, never an untrusted forwarded-header string. */
  public Operation prepare(
      OtpPolicy policy,
      OtpPolicy.Gate gate,
      String canonicalPhone,
      InetAddress socketPeer,
      RecoveryPolicy recovery) {
    Objects.requireNonNull(policy);
    Objects.requireNonNull(gate);
    Objects.requireNonNull(recovery);
    if (canonicalPhone != null && !canonicalPhone.matches("\\+[1-9][0-9]{7,14}"))
      throw new IllegalArgumentException("Noncanonical phone");
    if (recovery.mode() == RecoveryPolicy.Mode.CLOSED)
      throw new IllegalStateException("Recovery closed");
    var limits =
        policy.limits().stream()
            .filter(l -> l.gate() == gate)
            .sorted(Comparator.comparing(l -> l.dimension() + ":" + l.window().toMillis()))
            .toList();
    if (limits.isEmpty()) throw new IllegalArgumentException("Missing gate policy");
    String policyDigest =
        digest(
            policy.version()
                + "|"
                + policy.limits().stream()
                    .map(
                        l ->
                            l.gate()
                                + ":"
                                + l.dimension()
                                + ":"
                                + l.window().toMillis()
                                + ":"
                                + l.capacity())
                    .sorted()
                    .toList(),
            false);
    String token = recovery.generation() + ":" + policyDigest + ":" + recovery.mode();
    String base = namespace + ":{otp-prod}:" + recovery.generation();
    String id = UUID.randomUUID().toString();
    Instant deadline = clock.instant().plusSeconds(60);
    var keys =
        new ArrayList<String>(
            List.of(base + ":ready", base + ":" + gate + ":op:" + id, base + ":clock"));
    var values = new ArrayList<String>();
    for (var l : limits) {
      String subject =
          switch (l.dimension()) {
            case PHONE -> {
              if (canonicalPhone == null) throw new IllegalArgumentException("Phone required");
              yield digest("phone:" + canonicalPhone, true);
            }
            case IP -> {
              if (socketPeer == null) throw new IllegalArgumentException("Socket peer required");
              yield digest("ip:" + HexFormat.of().formatHex(socketPeer.getAddress()), true);
            }
            case GLOBAL -> "global";
            case DEVICE -> throw new IllegalArgumentException("Device identity not supported");
          };
      int cap = l.capacity();
      if (recovery.mode() == RecoveryPolicy.Mode.RESTRICTED) {
        if (l.dimension() == OtpPolicy.Dimension.GLOBAL
            && (gate == OtpPolicy.Gate.CHALLENGE || gate == OtpPolicy.Gate.DISPATCH))
          cap = Math.min(cap, recovery.dispatchCap(l.window()));
        if (gate == OtpPolicy.Gate.VERIFY && l.dimension() == OtpPolicy.Dimension.PHONE) {
          if (l.window().equals(Duration.ofMinutes(15))) cap = Math.min(cap, 5);
          else if (l.window().equals(Duration.ofHours(1))) cap = Math.min(cap, 10);
          else throw new IllegalArgumentException("Unsupported restricted verification window");
        }
      }
      keys.add(
          base + ":" + gate + ":" + l.dimension() + ":" + subject + ":" + l.window().toMillis());
      values.add(Long.toString(l.window().toMillis()));
      values.add(Integer.toString(cap));
    }
    String binding =
        digest(token + "|" + id + "|" + deadline.toEpochMilli() + "|" + keys + "|" + values, false);
    var args =
        new ArrayList<String>(List.of(token, binding, id, Long.toString(deadline.toEpochMilli())));
    args.addAll(values);
    return new Operation(keys, args, recovery.generation(), deadline, token);
  }

  public RedisLimiter.Result admit(Operation op, Health health) {
    var unavailable = new RedisLimiter.Result(RedisLimiter.Status.UNAVAILABLE, 0);
    try {
      Instant now = clock.instant();
      if (quarantined.get()) return unavailable;
      if (!now.isBefore(op.deadline)
          || !health
              .recovery()
              .permits(
                  now,
                  op.generation,
                  health.approved(),
                  health.redisHealthy(),
                  health.historyComplete())
          || !op.token.endsWith(":" + health.recovery().mode())) return unavailable;
      long started = System.nanoTime();
      var result =
          RedisLimiter.parse(
              transport.evaluate(RedisLimiter.script(), op.keys, op.args, Duration.ofMillis(200)));
      if (System.nanoTime() - started > 200_000_000L
          || result.status() == RedisLimiter.Status.UNAVAILABLE) {
        quarantined.set(true);
        return unavailable;
      }
      return result;
    } catch (Exception e) {
      quarantined.set(true);
      if (e instanceof InterruptedException) Thread.currentThread().interrupt();
      return unavailable;
    }
  }
}
