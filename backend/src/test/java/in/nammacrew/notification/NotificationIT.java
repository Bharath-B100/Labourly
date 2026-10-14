package in.nammacrew.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import in.nammacrew.marketplace.QuotationDTOs;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(
    properties = "spring.datasource.url=jdbc:tc:postgis:17-3.5:///phase4_validation")
class NotificationIT {

  @Autowired JdbcTemplate sql;
  @Autowired NotificationService notifications;
  @Autowired in.nammacrew.marketplace.QuotationService quotations;
  @Autowired in.nammacrew.booking.BookingService bookings;
  @Autowired MockMvc mvc;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  UUID customerId, workerId, categoryId, reqId;

  @Test
  void competingAcceptanceNotifiesLoserExactlyOnce() {
    UUID other = person("+918888888887", "Losing worker", "WORKER");
    sql.update(
        "INSERT INTO worker_profiles(user_id,primary_trade_id,experience_years,worker_type,availability_status,visibility_enabled) VALUES (?,?,5,'INDIVIDUAL','AVAILABLE',true)",
        other,
        categoryId);
    sql.update("INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,true)", other);
    UUID winner = quotations.submitQuote(workerId, reqId, validQuote());
    quotations.submitQuote(other, reqId, validQuote());
    UUID booking = quotations.acceptQuote(customerId, winner);
    assertEquals(booking, quotations.acceptQuote(customerId, winner));
    var notes = notifications.getNotifications(other, 10, 0).items();
    assertEquals(1, notes.size());
    assertEquals("QUOTE_REJECTED", notes.get(0).type());
    assertEquals(reqId, notes.get(0).referenceId());
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM booking_workers WHERE worker_id=?", Integer.class, other));
  }

  @Test
  void opportunityNotificationsExcludeReservedSchedulesButAllowAdjacentWork() {
    UUID quote = quotations.submitQuote(workerId, reqId, validQuote());
    UUID booking = quotations.acceptQuote(customerId, quote);
    UUID previous = reqId;
    reqId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code,status,location_source,location_city_id,location_state_id,site_location) SELECT ?,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code,'OPEN',location_source,location_city_id,location_state_id,site_location FROM labour_requirements WHERE id=?",
        reqId,
        previous);
    notifications.notifyMatchingWorkers(
        reqId, customerId, "Schedule check", "Carpenter", "Bengaluru");
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM notifications WHERE user_id=? AND type='WORK_AVAILABLE'",
            Integer.class,
            workerId));
    sql.update(
        "UPDATE labour_requirements SET starts_at=ends_at, ends_at=ends_at + interval '2 days' WHERE id=?",
        reqId);
    notifications.notifyMatchingWorkers(
        reqId, customerId, "Adjacent check", "Carpenter", "Bengaluru");
    notifications.notifyMatchingWorkers(reqId, customerId, "Retry", "Carpenter", "Bengaluru");
    assertEquals(
        1,
        sql.queryForObject(
            "SELECT count(*) FROM notifications WHERE user_id=? AND type='WORK_AVAILABLE'",
            Integer.class,
            workerId));
  }

  @Test
  void opportunityNotificationsExcludeOutOfCoverageAndUnpublishedJobs() {
    sql.update("UPDATE worker_service_coverage SET nationwide=false WHERE worker_id=?", workerId);
    notifications.notifyMatchingWorkers(reqId, customerId, "No coverage", "Carpenter", "Bengaluru");
    assertEquals(0, notifications.getUnreadCount(workerId).unreadCount());
    sql.update("UPDATE worker_service_coverage SET nationwide=true WHERE worker_id=?", workerId);
    sql.update("UPDATE labour_requirements SET status='CLOSED' WHERE id=?", reqId);
    notifications.notifyMatchingWorkers(reqId, customerId, "Closed", "Carpenter", "Bengaluru");
    assertEquals(0, notifications.getUnreadCount(workerId).unreadCount());
  }

  @Test
  void rolledBackAcceptanceLeavesNoNotificationsOrBooking() {
    var transaction =
        new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    org.junit.jupiter.api.Assertions.assertThrows(
        IllegalStateException.class,
        () ->
            transaction.executeWithoutResult(
                status -> {
                  UUID quote = quotations.submitQuote(workerId, reqId, validQuote());
                  quotations.acceptQuote(customerId, quote);
                  assertEquals(
                      2, sql.queryForObject("SELECT count(*) FROM notifications", Integer.class));
                  throw new IllegalStateException("Force rollback after both notification inserts");
                }));
    for (String table :
        java.util.List.of("notifications", "quotations", "bookings", "booking_workers")) {
      assertEquals(0, sql.queryForObject("SELECT count(*) FROM " + table, Integer.class), table);
    }
    assertEquals(
        "OPEN",
        sql.queryForObject(
            "SELECT status FROM labour_requirements WHERE id=?", String.class, reqId));
  }

  @Test
  void unauthorizedAcceptanceAndRepeatedCancellationDoNotNotify() {
    UUID quote = quotations.submitQuote(workerId, reqId, validQuote());
    org.junit.jupiter.api.Assertions.assertThrows(
        in.nammacrew.auth.AuthFailure.class, () -> quotations.acceptQuote(workerId, quote));
    assertEquals(0, notifications.getUnreadCount(workerId).unreadCount());
    assertEquals(1, notifications.getUnreadCount(customerId).unreadCount());
    UUID booking = quotations.acceptQuote(customerId, quote);
    bookings.cancelBooking(customerId, booking, "Isolated test cancellation");
    org.junit.jupiter.api.Assertions.assertThrows(
        in.nammacrew.auth.AuthFailure.class,
        () -> bookings.cancelBooking(customerId, booking, "Repeated cancellation"));
    assertEquals(2, notifications.getUnreadCount(workerId).unreadCount());
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM booking_workers WHERE booking_id=? AND reserved",
            Integer.class,
            booking));
  }

  private QuotationDTOs.SubmitQuoteRequest validQuote() {
    return new QuotationDTOs.SubmitQuoteRequest(
        new BigDecimal("1500.00"),
        "PER_DAY",
        Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS),
        2,
        "Isolated gate test");
  }

  @BeforeEach
  void fixture() {
    sql.execute("TRUNCATE users CASCADE");
    categoryId =
        sql.queryForObject("SELECT id FROM labour_categories WHERE code='CARPENTER'", UUID.class);
    customerId = person("+918888888881", "Customer", "CUSTOMER");
    workerId = person("+918888888882", "Worker One", "WORKER");

    sql.update(
        "INSERT INTO customer_profiles(user_id,customer_type,created_at) VALUES (?,'HOMEOWNER',now())",
        customerId);
    sql.update(
        "INSERT INTO worker_profiles(user_id,primary_trade_id,experience_years,worker_type,availability_status,visibility_enabled) VALUES (?,?,5,'INDIVIDUAL','AVAILABLE',true)",
        workerId,
        categoryId);
    sql.update(
        "INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,true)", workerId);
    sql.update(
        "INSERT INTO worker_service_locations(worker_id,state_code,district,city,radius_km,center) VALUES (?,'KA','Bengaluru','Bengaluru',50,ST_SetSRID(ST_MakePoint(77.5946,12.9716),4326))",
        workerId);

    reqId = UUID.randomUUID();
    sql.update(
        "INSERT INTO labour_requirements(id,customer_id,category_id,title,description,worker_count,starts_at,ends_at,city,state_code,status,location_source,location_city_id,location_state_id,site_location) VALUES (?,?,?,?,'Wooden doors',2,now() + interval '2 days',now() + interval '4 days','Bengaluru','KA','OPEN','CITY_CENTRE','1277333','lgd:29',ST_SetSRID(ST_MakePoint(77.59369,12.97194),4326))",
        reqId,
        customerId,
        categoryId,
        "Carpentry Work");
  }

  UUID person(String phone, String name, String role) {
    UUID id = UUID.randomUUID();
    sql.update(
        "INSERT INTO users(id,phone,display_name,status,onboarding_state) VALUES (?,?,?,'ACTIVE','COMPLETED')",
        id,
        phone,
        name);
    sql.update("INSERT INTO user_roles(user_id,role_code) VALUES (?,?)", id, role);
    return id;
  }

  @Test
  void testNotificationFlowOnQuoteAndAcceptance() throws Exception {
    // 1. Worker submits quote
    QuotationDTOs.SubmitQuoteRequest req =
        new QuotationDTOs.SubmitQuoteRequest(
            new BigDecimal("1500.00"),
            "PER_DAY",
            Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS),
            2,
            "Available immediately");
    UUID quoteId = quotations.submitQuote(workerId, reqId, req);

    // Customer should have received QUOTE_RECEIVED notification
    var customerNotes = notifications.getNotifications(customerId, 10, 0);
    assertEquals(1, customerNotes.items().size());
    assertEquals("QUOTE_RECEIVED", customerNotes.items().get(0).type());
    assertEquals(1, customerNotes.unreadCount());

    // Check REST endpoint for unread count
    mvc.perform(
            get("/api/v1/notifications/unread-count")
                .with(user(customerId.toString()).roles("CUSTOMER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unreadCount").value(1));

    // Check REST endpoint for notifications list
    mvc.perform(get("/api/v1/notifications").with(user(customerId.toString()).roles("CUSTOMER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unreadCount").value(1))
        .andExpect(jsonPath("$.items[0].type").value("QUOTE_RECEIVED"));

    // Customer accepts quote
    UUID bookingId = quotations.acceptQuote(customerId, quoteId);
    assertNotNull(bookingId);

    // Worker should have received QUOTE_ACCEPTED notification
    var workerNotes = notifications.getNotifications(workerId, 10, 0);
    assertEquals(1, workerNotes.items().size());
    assertEquals("QUOTE_ACCEPTED", workerNotes.items().get(0).type());
    assertEquals(1, workerNotes.unreadCount());

    // Worker marks notification as read via API
    UUID workerNotificationId = workerNotes.items().get(0).id();
    mvc.perform(
            post("/api/v1/notifications/" + workerNotificationId + "/read")
                .with(user(workerId.toString()).roles("WORKER")))
        .andExpect(status().isNoContent());

    assertEquals(0, notifications.getUnreadCount(workerId).unreadCount());

    // Worker cancels booking
    bookings.cancelBooking(workerId, bookingId, "Emergency occurred");

    // Customer should now have a BOOKING_CANCELLED notification
    var updatedCustomerNotes = notifications.getNotifications(customerId, 10, 0);
    assertEquals(2, updatedCustomerNotes.items().size());
    assertEquals("BOOKING_CANCELLED", updatedCustomerNotes.items().get(0).type());

    // Mark all as read via API
    mvc.perform(
            post("/api/v1/notifications/read-all")
                .with(user(customerId.toString()).roles("CUSTOMER")))
        .andExpect(status().isNoContent());

    assertEquals(0, notifications.getUnreadCount(customerId).unreadCount());
  }

  @Test
  void testUserIsolationAndAuthorization() throws Exception {
    UUID customerB = person("+918888888889", "Customer B", "CUSTOMER");
    sql.update(
        "INSERT INTO customer_profiles(user_id,customer_type,created_at) VALUES (?,'HOMEOWNER',now())",
        customerB);

    UUID noteA =
        notifications.sendNotification(
            customerId, "Alert A", "Private message for Customer A", "SYSTEM", null);

    // Customer B calls GET /api/v1/notifications -> returns 0 items
    mvc.perform(get("/api/v1/notifications").with(user(customerB.toString()).roles("CUSTOMER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unreadCount").value(0))
        .andExpect(jsonPath("$.items").isEmpty());

    // Customer B attempts to mark Customer A's notification as read
    mvc.perform(
            post("/api/v1/notifications/" + noteA + "/read")
                .with(user(customerB.toString()).roles("CUSTOMER")))
        .andExpect(status().isNoContent());

    // Customer A's notification MUST still be unread
    assertEquals(1, notifications.getUnreadCount(customerId).unreadCount());
    var customerANotes = notifications.getNotifications(customerId, 10, 0);
    assertEquals(1, customerANotes.items().size());
    org.junit.jupiter.api.Assertions.assertNull(customerANotes.items().get(0).readAt());
  }

  @Test
  void testWorkAvailableEligibilityAndDeduplication() {
    UUID electricianCategoryId =
        sql.queryForObject("SELECT id FROM labour_categories WHERE code='ELECTRICIAN'", UUID.class);

    // Worker 1 is already created in fixture: Carpenter, AVAILABLE, Bengaluru KA -> eligible
    // Worker 2: Carpenter, BUSY, Bengaluru KA -> ineligible due to availability
    UUID workerBusyId = person("+918888888883", "Worker Busy", "WORKER");
    sql.update(
        "INSERT INTO worker_profiles(user_id,primary_trade_id,experience_years,worker_type,availability_status,visibility_enabled) VALUES (?,?,5,'INDIVIDUAL','BUSY',true)",
        workerBusyId,
        categoryId);
    sql.update(
        "INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,true)", workerBusyId);

    // Worker 3: Electrician, AVAILABLE, Bengaluru KA -> ineligible due to trade mismatch
    UUID workerElectricianId = person("+918888888884", "Worker Electrician", "WORKER");
    sql.update(
        "INSERT INTO worker_profiles(user_id,primary_trade_id,experience_years,worker_type,availability_status,visibility_enabled) VALUES (?,?,5,'INDIVIDUAL','AVAILABLE',true)",
        workerElectricianId,
        electricianCategoryId);
    sql.update(
        "INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,true)",
        workerElectricianId);

    // Notify matching workers for Carpenter requirement
    notifications.notifyMatchingWorkers(
        reqId, customerId, "Carpentry Work", "Carpenter", "Bengaluru");

    // Worker 1 (Available Carpenter) MUST receive notification
    assertEquals(1, notifications.getUnreadCount(workerId).unreadCount());
    var w1Notes = notifications.getNotifications(workerId, 10, 0);
    assertEquals("WORK_AVAILABLE", w1Notes.items().get(0).type());

    // Worker 2 (Busy Carpenter) MUST NOT receive notification
    assertEquals(0, notifications.getUnreadCount(workerBusyId).unreadCount());

    // Worker 3 (Available Electrician) MUST NOT receive notification
    assertEquals(0, notifications.getUnreadCount(workerElectricianId).unreadCount());

    // Call notifyMatchingWorkers again -> Deduplication check ensures Worker 1 still has only 1
    // notification
    notifications.notifyMatchingWorkers(
        reqId, customerId, "Carpentry Work", "Carpenter", "Bengaluru");
    assertEquals(1, notifications.getNotifications(workerId, 10, 0).items().size());
  }

  @Test
  void testIdempotentQuoteAcceptanceDoesNotDuplicateNotification() {
    QuotationDTOs.SubmitQuoteRequest req =
        new QuotationDTOs.SubmitQuoteRequest(
            new BigDecimal("1500.00"),
            "PER_DAY",
            Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS),
            2,
            "Available immediately");
    UUID quoteId = quotations.submitQuote(workerId, reqId, req);

    UUID bookingId1 = quotations.acceptQuote(customerId, quoteId);
    assertNotNull(bookingId1);

    // Worker has 1 QUOTE_ACCEPTED notification
    var notes1 = notifications.getNotifications(workerId, 10, 0);
    assertEquals(1, notes1.items().size());
    assertEquals("QUOTE_ACCEPTED", notes1.items().get(0).type());

    // Idempotent second accept
    UUID bookingId2 = quotations.acceptQuote(customerId, quoteId);
    assertEquals(bookingId1, bookingId2);

    // Worker still has only 1 notification (no duplicates!)
    var notes2 = notifications.getNotifications(workerId, 10, 0);
    assertEquals(1, notes2.items().size());
  }
}
