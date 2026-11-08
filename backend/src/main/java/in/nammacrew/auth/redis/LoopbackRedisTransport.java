package in.nammacrew.auth.redis;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/**
 * Isolated test transport only: loopback, RESP2, no redirects or retries. Not a production TLS
 * client.
 */
public final class LoopbackRedisTransport implements OtpAdmission.Transport {
  private final int port;

  public LoopbackRedisTransport(int port) {
    if (port < 1024 || port > 65535) throw new IllegalArgumentException("Invalid port");
    this.port = port;
  }

  public List<?> evaluate(String script, List<String> keys, List<String> args, Duration timeout)
      throws IOException {
    var command = new ArrayList<String>(List.of("EVAL", script, Integer.toString(keys.size())));
    command.addAll(keys);
    command.addAll(args);
    Object value = command(command, timeout);
    if (!(value instanceof List<?> list)) throw new IOException("Invalid Redis result");
    return list;
  }

  public Object command(List<String> command, Duration timeout) throws IOException {
    if (timeout.isNegative() || timeout.isZero() || timeout.toMillis() > 200)
      throw new IllegalArgumentException("Invalid timeout");
    long end = System.nanoTime() + timeout.toNanos();
    try (var socket = new Socket()) {
      int connectBudget = (int) Math.max(1, (end - System.nanoTime()) / 1_000_000);
      socket.connect(new InetSocketAddress(InetAddress.getLoopbackAddress(), port), connectBudget);
      int readBudget = (int) Math.max(1, (end - System.nanoTime()) / 1_000_000);
      socket.setSoTimeout(readBudget);
      var out = socket.getOutputStream();
      out.write(("*" + command.size() + "\r\n").getBytes(StandardCharsets.US_ASCII));
      for (String word : command) {
        byte[] b = word.getBytes(StandardCharsets.UTF_8);
        if (b.length > 65536) throw new IOException("Command too large");
        out.write(("$" + b.length + "\r\n").getBytes(StandardCharsets.US_ASCII));
        out.write(b);
        out.write(new byte[] {13, 10});
      }
      out.flush();
      if (System.nanoTime() >= end) throw new SocketTimeoutException("Redis deadline");
      return read(socket, new BufferedInputStream(socket.getInputStream()), end, 0);
    }
  }

  Object read(Socket s, InputStream in, long end, int depth) throws IOException {
    if (depth > 3) throw new IOException("Invalid nesting");
    long left = end - System.nanoTime();
    if (left <= 0) throw new SocketTimeoutException("Redis deadline");
    s.setSoTimeout((int) Math.max(1, left / 1_000_000));
    int type = in.read();
    var line = new ByteArrayOutputStream();
    int previous = -1;
    while (true) {
      if (System.nanoTime() >= end) throw new SocketTimeoutException("Redis deadline");
      int c = in.read();
      if (c < 0 || line.size() > 65536) throw new IOException("Invalid response");
      if (previous == 13 && c == 10) break;
      line.write(c);
      previous = c;
    }
    String value = line.toString(StandardCharsets.UTF_8);
    value = value.substring(0, value.length() - 1);
    if (type == '-') throw new IOException("Redis command failed: " + value);
    if (type == '+') return value;
    if (type == ':') return Long.parseLong(value);
    if (type == '*') {
      int count = Integer.parseInt(value);
      if (count < 0 || count > 128) throw new IOException("Invalid array");
      var list = new ArrayList<>();
      for (int i = 0; i < count; i++) list.add(read(s, in, end, depth + 1));
      return list;
    }
    if (type == '$') {
      if (value.equals("-1")) return null;
      if (!value.matches("[0-9]{1,5}")) throw new IOException("Invalid bulk");
      int count = Integer.parseInt(value);
      if (count > 65536) throw new IOException("Invalid bulk");
      byte[] b = in.readNBytes(count);
      if (b.length != count || in.read() != 13 || in.read() != 10)
        throw new IOException("Truncated bulk");
      return new String(b, StandardCharsets.UTF_8);
    }
    throw new IOException("Unknown response");
  }
}
