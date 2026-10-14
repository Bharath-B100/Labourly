package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import in.nammacrew.auth.AuthFailure;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;

class QuotationIT extends QuotationTestSupport {
  @Test
  void testSubmitAndAcceptQuote() {
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());
    var views = quotations.getRequirementQuotes(customerId, reqId);
    assertEquals(1, views.size());
    assertEquals("Worker One", views.get(0).workerName());
    assertEquals("Carpenter", views.get(0).primaryTrade());
    assertEquals("SUBMITTED", views.get(0).status());
    assertEquals(1, quotations.getMyQuotes(worker1Id).size());
    UUID booking = quotations.acceptQuote(customerId, quote);
    assertEquals(booking, quotations.acceptQuote(customerId, quote));
    assertEquals(
        "CLOSED",
        sql.queryForObject(
            "SELECT status FROM labour_requirements WHERE id=?", String.class, reqId));
    assertEquals(
        "ACCEPTED",
        sql.queryForObject("SELECT status FROM quotations WHERE id=?", String.class, quote));
    assertEquals("CONFIRMED", queries.getBookingDetails(customerId, booking).status());
    assertEquals(1, queries.getWorkerBookings(worker1Id).size());
    assertThrows(AuthFailure.class, () -> quotations.editQuote(worker1Id, quote, request()));
    assertThrows(
        DataIntegrityViolationException.class,
        () -> sql.update("UPDATE quotations SET amount=2000 WHERE id=?", quote));
    assertThrows(
        DataIntegrityViolationException.class,
        () -> sql.update("UPDATE bookings SET amount=2000 WHERE id=?", booking));
  }

  @Test
  void validatesQuotationInputAndEligibility() {
    for (var bad :
        new QuotationDTOs.SubmitQuoteRequest[] {
          new QuotationDTOs.SubmitQuoteRequest(null, "PER_DAY", request().startsAt(), 2, null),
          new QuotationDTOs.SubmitQuoteRequest(
              new BigDecimal("-1"), "PER_DAY", request().startsAt(), 2, null),
          new QuotationDTOs.SubmitQuoteRequest(
              new BigDecimal("1.234"), "PER_DAY", request().startsAt(), 2, null),
          new QuotationDTOs.SubmitQuoteRequest(
              BigDecimal.ONE, "INVALID", request().startsAt(), 2, null),
          new QuotationDTOs.SubmitQuoteRequest(BigDecimal.ONE, "PER_DAY", null, 2, null),
          new QuotationDTOs.SubmitQuoteRequest(
              BigDecimal.ONE, "PER_DAY", request().startsAt(), 0, null)
        })
      assertEquals(
          400,
          assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, reqId, bad))
              .status());
    sql.update("UPDATE users SET onboarding_state='IN_PROGRESS' WHERE id=?", worker1Id);
    assertEquals(
        403,
        assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, reqId, request()))
            .status());

    // Restore state, make unavailable
    sql.update("UPDATE users SET onboarding_state='COMPLETED' WHERE id=?", worker1Id);
    sql.update(
        "UPDATE worker_profiles SET availability_status='UNAVAILABLE' WHERE user_id=?", worker1Id);
    assertEquals(
        403,
        assertThrows(AuthFailure.class, () -> quotations.submitQuote(worker1Id, reqId, request()))
            .status());

    assertEquals(0, sql.queryForObject("SELECT count(*) FROM quotations", Integer.class));
  }

  @Test
  void editingWithdrawalRejectionAndOwnershipAreEnforced() {
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());
    assertThrows(AuthFailure.class, () -> quotations.editQuote(worker2Id, quote, request()));
    assertThrows(AuthFailure.class, () -> quotations.acceptQuote(outsiderId, quote));
    assertThrows(AuthFailure.class, () -> quotations.getRequirementQuotes(outsiderId, reqId));
    var edited =
        new QuotationDTOs.SubmitQuoteRequest(
            new BigDecimal("2000"), "FIXED_TOTAL", request().startsAt(), 3, "Updated");
    quotations.editQuote(worker1Id, quote, edited);
    assertEquals(
        0, new BigDecimal("2000").compareTo(quotations.getMyQuotes(worker1Id).get(0).amount()));
    quotations.withdrawQuote(worker1Id, quote);
    assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, quote));
    UUID next = quotations.submitQuote(worker1Id, reqId, request());
    quotations.rejectQuote(customerId, next);
    assertThrows(AuthFailure.class, () -> quotations.editQuote(worker1Id, next, request()));
  }

  @Test
  void cancellationRequiresParticipantReasonAndConfirmedStateAndReleasesOverlap() {
    UUID first = quotations.submitQuote(worker1Id, reqId, request());
    UUID secondRequirement = requirement();
    UUID second = quotations.submitQuote(worker1Id, secondRequirement, request());
    UUID booking = quotations.acceptQuote(customerId, first);
    assertThrows(AuthFailure.class, () -> queries.getBookingDetails(outsiderId, booking));
    assertEquals(
        404,
        assertThrows(AuthFailure.class, () -> bookings.cancelBooking(outsiderId, booking, "No"))
            .status());
    assertEquals(
        400,
        assertThrows(AuthFailure.class, () -> bookings.cancelBooking(customerId, booking, " "))
            .status());
    assertThrows(
        AuthFailure.class, () -> quotations.submitQuote(worker1Id, requirement(), request()));
    assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, second));
    assertEquals(
        "OPEN",
        sql.queryForObject(
            "SELECT status FROM labour_requirements WHERE id=?", String.class, secondRequirement));
    assertEquals(
        "SUBMITTED",
        sql.queryForObject("SELECT status FROM quotations WHERE id=?", String.class, second));
    bookings.cancelBooking(worker1Id, booking, " Plans changed ");
    assertEquals("CANCELLED", queries.getBookingDetails(customerId, booking).status());
    assertEquals(
        "Plans changed",
        sql.queryForObject("SELECT cancel_reason FROM bookings WHERE id=?", String.class, booking));
    assertEquals(
        worker1Id,
        sql.queryForObject("SELECT cancelled_by FROM bookings WHERE id=?", UUID.class, booking));
    assertFalse(
        sql.queryForObject(
            "SELECT reserved FROM booking_workers WHERE booking_id=?", Boolean.class, booking));
    assertEquals(
        409,
        assertThrows(AuthFailure.class, () -> bookings.cancelBooking(customerId, booking, "Again"))
            .status());
    assertThrows(
        DataIntegrityViolationException.class,
        () -> sql.update("UPDATE bookings SET cancel_reason='changed' WHERE id=?", booking));
    assertNotNull(quotations.acceptQuote(customerId, second));
  }

  @Test
  void httpAuthorizationAndMissingFieldsFailClosed() throws Exception {
    String path = "/api/v1/requirements/" + reqId + "/quotes";
    mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post(path)
                .with(user(customerId.toString()).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post(path)
                .with(user(worker1Id.toString()).roles("WORKER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());
    mvc.perform(
            post("/api/v1/quotes/" + quote + "/accept")
                .with(user(outsiderId.toString()).roles("CUSTOMER")))
        .andExpect(status().isNotFound());
    UUID booking = quotations.acceptQuote(customerId, quote);
    mvc.perform(
            post("/api/v1/bookings/" + booking + "/cancel")
                .with(user(customerId.toString()).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testAcceptanceEligibilityChanges() {
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());

    // worker becomes unavailable
    sql.update(
        "UPDATE worker_profiles SET availability_status='UNAVAILABLE' WHERE user_id=?", worker1Id);

    var ex = assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, quote));
    assertEquals(403, ex.status());

    sql.update(
        "UPDATE worker_profiles SET availability_status='AVAILABLE' WHERE user_id=?", worker1Id);

    // Change schedule to past
    sql.update("UPDATE quotations SET starts_at = now() - interval '1 day' WHERE id=?", quote);
    ex = assertThrows(AuthFailure.class, () -> quotations.acceptQuote(customerId, quote));
    assertEquals(403, ex.status());
  }
}
