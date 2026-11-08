package in.nammacrew.chat;

import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

/**
 * Disposable jdbc:tc database only; outer transactions must not hide fixtures from racing callers.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///labourly_chat_test")
@ActiveProfiles("test")
class ChatConcurrencyIT {
  @Autowired JdbcTemplate sql;
  @Autowired ChatService chats;
  @Autowired ChatSafetyService safety;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;
  UUID customer;
  UUID worker;
  UUID outsider;
  UUID booking;

  @BeforeEach
  void fixture() {
    customer = user();
    worker = user();
    outsider = user();
    UUID trade = UUID.randomUUID(), requirement = UUID.randomUUID(), quote = UUID.randomUUID();
    booking = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_categories(id,code,name) VALUES(?,?, 'Fictional trade')",
        trade,
        "CHAT" + trade);
    sql.update(
        "INSERT INTO customer_profiles(user_id,customer_type) VALUES(?,'HOMEOWNER')", customer);
    sql.update("INSERT INTO worker_profiles(user_id,primary_trade_id) VALUES(?,?)", worker, trade);
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,state_code,city,status,title,description,worker_count,site_location,starts_at,ends_at) VALUES(?,?,?,'KA','Bengaluru','OPEN','Fictional chat test','Test',1,ST_SetSRID(ST_MakePoint(77.59,12.97),4326),now()+interval '1 day',now()+interval '2 days')",
        requirement,
        customer,
        trade);
    sql.update(
        "INSERT INTO quotations(id,requirement_id,worker_id,amount,pricing_basis,starts_at,duration_days,status) VALUES(?,?,?,100,'FIXED_TOTAL',now()+interval '1 day',1,'ACCEPTED')",
        quote,
        requirement,
        worker);
    sql.update(
        "INSERT INTO bookings(id,quotation_id,starts_at,ends_at,status) VALUES(?,?,now()+interval '1 day',now()+interval '2 days','PENDING')",
        booking,
        quote);
    sql.update("INSERT INTO booking_workers(booking_id,worker_id) VALUES(?,?)", booking, worker);
    sql.update("UPDATE bookings SET status='CONFIRMED' WHERE id=?", booking);
  }

  private UUID user() {
    UUID id = UUID.randomUUID();
    String phone = "+" + Long.toUnsignedString(id.getLeastSignificantBits()).substring(0, 14);
    sql.update(
        "INSERT INTO users(id,phone,display_name,status) VALUES(?,?,'Fictional chat participant','ACTIVE')",
        id,
        phone);
    return id;
  }

  @Test
  void simultaneousParticipantsReceiveExactlyOneThread() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      var ready = new CountDownLatch(2);
      var start = new CountDownLatch(1);
      var first =
          pool.submit(
              () -> {
                ready.countDown();
                assertTrue(start.await(5, TimeUnit.SECONDS));
                return chats.getOrCreateThread(booking, customer).getId();
              });
      var second =
          pool.submit(
              () -> {
                ready.countDown();
                assertTrue(start.await(5, TimeUnit.SECONDS));
                return chats.getOrCreateThread(booking, worker).getId();
              });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      assertEquals(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS));
      assertEquals(
          1,
          sql.queryForObject(
              "SELECT count(*) FROM chat_threads WHERE booking_id=?", Integer.class, booking));
    }
  }

  @Test
  void messageIsVisibleToBothParticipantsButNotOtherAccounts() {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    var sent = chats.sendMessage(thread, customer, "Fictional test message");
    assertEquals(sent.id(), chats.getThreadMessages(thread, worker).messages().getFirst().id());
    assertEquals(sent.id(), chats.getThreadMessages(thread, customer).messages().getFirst().id());
    assertThrows(ResponseStatusException.class, () -> chats.getOrCreateThread(booking, outsider));
    assertThrows(ResponseStatusException.class, () -> chats.getThreadMessages(thread, outsider));
    assertThrows(
        ResponseStatusException.class, () -> chats.sendMessage(thread, outsider, "Not allowed"));
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM chat_messages WHERE thread_id=?", Integer.class, thread));
  }

  @Test
  void concurrentMessageRetryCreatesOneMessage() throws Exception {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    String key = UUID.randomUUID().toString();
    try (var pool = Executors.newFixedThreadPool(2)) {
      var gate = new java.util.concurrent.CyclicBarrier(2);
      java.util.concurrent.Callable<UUID> send =
          () -> {
            gate.await(5, TimeUnit.SECONDS);
            return chats.sendMessage(thread, customer, "Arrival time?", key).id();
          };
      var a = pool.submit(send);
      var b = pool.submit(send);
      assertEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
    }
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM chat_messages WHERE thread_id=?", Integer.class, thread));
    assertThrows(
        ResponseStatusException.class,
        () -> chats.sendMessage(thread, customer, "Different body", key));
    assertThrows(
        ResponseStatusException.class,
        () -> chats.sendMessage(thread, outsider, "Arrival time?", key));
  }

  @Test
  void blockingStopsNewMessagesButPreservesHistoryAndOwnUnblock() {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    var sent = chats.sendMessage(thread, customer, "Already sent", UUID.randomUUID().toString());
    safety.block(thread, customer, true);
    safety.block(thread, customer, true);
    assertTrue(safety.state(thread, worker).messagingBlocked());
    assertFalse(safety.state(thread, worker).blockedByMe());
    assertThrows(
        ResponseStatusException.class, () -> chats.sendMessage(thread, worker, "Blocked message"));
    assertThrows(
        ResponseStatusException.class, () -> chats.sendMessage(thread, customer, "Also blocked"));
    safety.block(thread, worker, false);
    assertTrue(safety.state(thread, worker).messagingBlocked());
    assertEquals(sent.id(), chats.getThreadMessages(thread, worker).messages().getFirst().id());
    safety.block(thread, customer, false);
    assertDoesNotThrow(() -> chats.sendMessage(thread, worker, "Allowed again"));
    assertEquals(
        "CONFIRMED",
        sql.queryForObject("SELECT status FROM bookings WHERE id=?", String.class, booking));
  }

  @Test
  void reportsArePrivateAndUnauthorizedActionsRejected() {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    var report = safety.report(thread, customer, "Threatening behavior");
    assertEquals(report.id(), safety.report(thread, customer, "Threatening behavior").id());
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> safety.report(thread, customer, "Different incident"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> safety.report(thread, outsider, "Not my conversation"));
    assertThrows(in.nammacrew.auth.AuthFailure.class, () -> safety.block(thread, outsider, true));
    assertThrows(in.nammacrew.auth.AuthFailure.class, () -> safety.state(thread, outsider));
  }

  @Test
  void replayPreservesSenderLabelAndIsAllowedAfterBlockWithoutNewMessage() {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    String key = UUID.randomUUID().toString();
    var first = chats.sendMessage(thread, customer, "Original message", key);
    safety.block(thread, worker, true);
    var replay = chats.sendMessage(thread, customer, "Original message", key);
    assertEquals(first.id(), replay.id());
    assertEquals(first.body(), replay.body());
    assertEquals(first.senderName(), replay.senderName());
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM chat_messages WHERE thread_id=?", Integer.class, thread));
  }

  @Test
  void retryKeysAreSenderScopedAndLegacySendsStillWork() {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    String key = UUID.randomUUID().toString();
    var a = chats.sendMessage(thread, customer, "Customer message", key);
    var b = chats.sendMessage(thread, worker, "Worker message", key);
    assertNotEquals(a.id(), b.id());
    assertEquals(a.id(), chats.sendMessage(thread, customer, "Customer message", key).id());
    assertEquals(b.id(), chats.sendMessage(thread, worker, "Worker message", key).id());
    assertNotEquals(
        chats.sendMessage(thread, customer, "Legacy").id(),
        chats.sendMessage(thread, customer, "Legacy").id());
    assertEquals(
        4,
        sql.queryForObject(
            "SELECT count(*) FROM chat_messages WHERE thread_id=?", Integer.class, thread));
  }

  @Test
  void concurrentSendAndBlockSerializeWithoutPostBlockInsert() throws Exception {
    UUID thread = chats.getOrCreateThread(booking, customer).getId();
    try (var pool = Executors.newFixedThreadPool(2)) {
      var gate = new java.util.concurrent.CyclicBarrier(2);
      var send =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                try {
                  chats.sendMessage(
                      thread, customer, "Racing message", UUID.randomUUID().toString());
                  return true;
                } catch (ResponseStatusException e) {
                  assertEquals(409, e.getStatusCode().value());
                  return false;
                }
              });
      var block =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                return safety.block(thread, worker, true);
              });
      boolean sent = send.get(15, TimeUnit.SECONDS);
      assertTrue(block.get(15, TimeUnit.SECONDS).messagingBlocked());
      assertEquals(
          sent ? 1 : 0,
          sql.queryForObject(
              "SELECT count(*) FROM chat_messages WHERE thread_id=?", Integer.class, thread));
      assertThrows(
          ResponseStatusException.class, () -> chats.sendMessage(thread, customer, "After block"));
      assertThrows(
          ResponseStatusException.class, () -> chats.sendMessage(thread, worker, "After block"));
    }
  }
}
