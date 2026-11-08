package in.nammacrew.auth.redis;

import static org.junit.jupiter.api.Assertions.*;

import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LoopbackRedisTransportTest {
  private Object parse(String response) throws IOException {
    // An unconnected socket supplies timeout configuration only; no service or network is used.
    try (var socket = new Socket()) {
      return new LoopbackRedisTransport(56379)
          .read(
              socket,
              new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8)),
              System.nanoTime() + 5_000_000_000L,
              0);
    }
  }

  @Test
  void nullBulk() throws Exception {
    assertNull(parse("$-1\r\n"));
  }

  @Test
  void emptyBulk() throws Exception {
    assertEquals("", parse("$0\r\n\r\n"));
  }

  @Test
  void nestedNullDoesNotConsumeNextResponse() throws Exception {
    var result = (List<?>) parse("*3\r\n$-1\r\n$0\r\n\r\n$2\r\nok\r\n");
    assertEquals(3, result.size());
    assertNull(result.get(0));
    assertEquals("", result.get(1));
    assertEquals("ok", result.get(2));
  }

  @Test
  void maximumBulk() throws Exception {
    String payload = "x".repeat(65536);
    assertEquals(payload, parse("$65536\r\n" + payload + "\r\n"));
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "$-2\r\n",
        "$-0\r\n",
        "$-01\r\n",
        "$65537\r\n",
        "$2147483648\r\n",
        "$abc\r\n",
        "$+1\r\na\r\n",
        "$ 1\r\na\r\n",
        "$\r\n",
        "$1\n",
        "$1\r\n",
        "$2\r\na",
        "$1\r\na\r",
        "$1\r\naXX",
        "$0\r\n",
        "_\r\n",
        "?0\r\n",
        ""
      })
  void rejectsInvalidResponses(String response) {
    assertThrows(IOException.class, () -> parse(response));
  }
}
