package in.nammacrew.booking;

import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///labourly_lifecycle_test")
@ActiveProfiles("test")
class BookingLifecycleIT {
  @Autowired JdbcTemplate sql;
  @Autowired BookingLifecycleService lifecycle;
  @Autowired BookingService bookings;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otp;
  UUID customer, worker, outsider, booking;

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
        "INSERT INTO labour_requirements(id,customer_id,category_id,state_code,city,status,title,description,worker_count,site_location,starts_at,ends_at) VALUES(?,?,?,'KA','Bengaluru','OPEN','Fictional chat test','Test',1,ST_SetSRID(ST_MakePoint(77.59,12.97),4326),now()-interval '1 day',now()+interval '2 days')",
        requirement,
        customer,
        trade);
    sql.update(
        "INSERT INTO quotations(id,requirement_id,worker_id,amount,pricing_basis,starts_at,duration_days,status) VALUES(?,?,?,100,'FIXED_TOTAL',now()-interval '1 day',1,'ACCEPTED')",
        quote,
        requirement,
        worker);
    sql.update(
        "INSERT INTO bookings(id,quotation_id,starts_at,ends_at,status) VALUES(?,?,now()-interval '1 day',now()+interval '2 days','PENDING')",
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
  void twoParticipantsMustConfirmEachStage() {
    var first = lifecycle.confirm(booking, customer, "START");
    assertEquals("CONFIRMED", first.status());
    assertTrue(first.confirmedByMe());
    assertEquals("CONFIRMED", lifecycle.confirm(booking, customer, "START").status());
    assertEquals("IN_PROGRESS", lifecycle.confirm(booking, worker, "START").status());
    assertEquals("IN_PROGRESS", lifecycle.confirm(booking, customer, "COMPLETE").status());
    assertEquals("COMPLETED", lifecycle.confirm(booking, worker, "COMPLETE").status());
    assertEquals("COMPLETED", lifecycle.confirm(booking, worker, "COMPLETE").status());
    assertEquals(
        4,
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=?",
            Integer.class,
            booking));
    assertEquals(
        4,
        sql.queryForObject(
            "SELECT count(*) FROM notifications WHERE reference_id=? AND type='BOOKING_UPDATED'",
            Integer.class,
            booking));
  }

  @Test
  void outsidersAndPrematureCompletionCannotMutate() {
    assertThrows(in.nammacrew.auth.AuthFailure.class, () -> lifecycle.state(booking, outsider));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class, () -> lifecycle.confirm(booking, outsider, "START"));
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> lifecycle.confirm(booking, customer, "COMPLETE"));
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=?",
            Integer.class,
            booking));
  }

  @Test
  void simultaneousConfirmationsTransitionOnce() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      var gate = new CyclicBarrier(2);
      var a =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                return lifecycle.confirm(booking, customer, "START");
              });
      var b =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                return lifecycle.confirm(booking, worker, "START");
              });
      a.get(15, TimeUnit.SECONDS);
      b.get(15, TimeUnit.SECONDS);
    }
    assertEquals("IN_PROGRESS", lifecycle.state(booking, customer).status());
    assertEquals(
        2,
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=?",
            Integer.class,
            booking));
  }

  @Test
  void cancellationAfterOneConfirmationPreventsStart() {
    lifecycle.confirm(booking, customer, "START");
    bookings.cancelBooking(customer, booking, "Fictional cancellation");
    assertThrows(
        in.nammacrew.auth.AuthFailure.class, () -> lifecycle.confirm(booking, worker, "START"));
    assertEquals("CANCELLED", lifecycle.state(booking, worker).status());
  }

  @Test
  void futureBookingCannotStart() {
    UUID futureQuote = UUID.randomUUID(), futureBooking = UUID.randomUUID();
    UUID futureRequirement = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,state_code,city,status,title,description,worker_count,site_location,starts_at,ends_at) SELECT ?,lr.customer_id,lr.category_id,lr.state_code,lr.city,'OPEN','Fictional future job','Test',1,lr.site_location,now()+interval '10 days',now()+interval '11 days' FROM labour_requirements lr JOIN quotations q ON q.requirement_id=lr.id JOIN bookings b ON b.quotation_id=q.id WHERE b.id=?",
        futureRequirement,
        booking);
    sql.update(
        "INSERT INTO quotations(id,requirement_id,worker_id,amount,pricing_basis,starts_at,duration_days,status) SELECT ?,?,q.worker_id,100,'FIXED_TOTAL',now()+interval '10 days',1,'ACCEPTED' FROM quotations q JOIN bookings b ON b.quotation_id=q.id WHERE b.id=?",
        futureQuote,
        futureRequirement,
        booking);
    sql.update(
        "INSERT INTO bookings(id,quotation_id,starts_at,ends_at,status) VALUES(?,?,now()+interval '10 days',now()+interval '11 days','PENDING')",
        futureBooking,
        futureQuote);
    sql.update(
        "INSERT INTO booking_workers(booking_id,worker_id) VALUES(?,?)", futureBooking, worker);
    sql.update("UPDATE bookings SET status='CONFIRMED' WHERE id=?", futureBooking);
    assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> lifecycle.confirm(futureBooking, customer, "START"));
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=?",
            Integer.class,
            futureBooking));
  }

  private int updates() {
    return sql.queryForObject(
        "SELECT count(*) FROM notifications WHERE reference_id=? AND type='BOOKING_UPDATED'",
        Integer.class,
        booking);
  }

  @Test
  void onlyCommittedTransitionsNotifyAndRollbackLeavesNoVotes() {
    lifecycle.confirm(booking, customer, "START");
    assertEquals(0, updates());
    new org.springframework.transaction.support.TransactionTemplate(transactions)
        .executeWithoutResult(
            tx -> {
              lifecycle.confirm(booking, worker, "START");
              assertEquals(2, updates());
              tx.setRollbackOnly();
            });
    assertEquals("CONFIRMED", lifecycle.state(booking, customer).status());
    assertEquals(0, updates());
    assertFalse(lifecycle.state(booking, worker).confirmedByMe());
    lifecycle.confirm(booking, worker, "START");
    lifecycle.confirm(booking, worker, "START");
    assertEquals(2, updates());
  }

  @Test
  void scheduledDatesCannotChangeAndReuseVotes() {
    lifecycle.confirm(booking, customer, "START");
    assertThrows(
        org.springframework.dao.DataAccessException.class,
        () ->
            sql.update(
                "UPDATE bookings SET starts_at=starts_at+interval '1 hour' WHERE id=?", booking));
    assertTrue(lifecycle.state(booking, customer).confirmedByMe());
    assertEquals("CONFIRMED", lifecycle.state(booking, customer).status());
  }

  @Test
  void concurrentCancelAndSecondConfirmationHaveOneWinner() throws Exception {
    lifecycle.confirm(booking, customer, "START");
    try (var pool = Executors.newFixedThreadPool(2)) {
      var gate = new CyclicBarrier(2);
      var start =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                try {
                  lifecycle.confirm(booking, worker, "START");
                  return true;
                } catch (in.nammacrew.auth.AuthFailure e) {
                  return false;
                }
              });
      var cancel =
          pool.submit(
              () -> {
                gate.await(5, TimeUnit.SECONDS);
                try {
                  bookings.cancelBooking(customer, booking, "Fictional cancellation");
                  return true;
                } catch (in.nammacrew.auth.AuthFailure e) {
                  return false;
                }
              });
      boolean started = start.get(15, TimeUnit.SECONDS);
      boolean cancelled = cancel.get(15, TimeUnit.SECONDS);
      assertNotEquals(started, cancelled);
      assertEquals(
          started ? "IN_PROGRESS" : "CANCELLED", lifecycle.state(booking, customer).status());
      assertEquals(started ? 2 : 0, updates());
    }
  }

  @Test
  void historicalRequestBookingCannotInferLifecycleParticipants() {
    UUID request = UUID.randomUUID(), historical = UUID.randomUUID();
    sql.update(
        "INSERT INTO booking_requests(id,requirement_id,worker_id) SELECT ?,q.requirement_id,q.worker_id FROM quotations q JOIN bookings b ON b.quotation_id=q.id WHERE b.id=?",
        request,
        booking);
    sql.update(
        "INSERT INTO bookings(id,request_id,starts_at,ends_at) VALUES (?,?,now()+interval '20 days',now()+interval '21 days')",
        historical,
        request);
    for (UUID actor : new UUID[] {customer, worker, outsider}) {
      assertThrows(in.nammacrew.auth.AuthFailure.class, () -> lifecycle.state(historical, actor));
      assertThrows(
          in.nammacrew.auth.AuthFailure.class, () -> lifecycle.confirm(historical, actor, "START"));
    }
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=?",
            Integer.class,
            historical));
  }
}
