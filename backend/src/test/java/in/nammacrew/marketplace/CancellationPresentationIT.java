package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class CancellationPresentationIT extends QuotationTestSupport {
  @Test
  void cancellationMetadataAndQuoteBookingStatusAreVisibleOnlyToParticipants() throws Exception {
    UUID quote = quotations.submitQuote(worker1Id, reqId, request());
    UUID booking = quotations.acceptQuote(customerId, quote);
    UUID unaffected =
        quotations.acceptQuote(
            customerId, quotations.submitQuote(worker2Id, requirement(), request()));
    assertEquals("CONFIRMED", quotations.getMyQuotes(worker1Id).get(0).bookingStatus());
    mvc.perform(
            post("/api/v1/bookings/" + booking + "/cancel")
                .with(user(customerId.toString()).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"  Plans changed  \"}"))
        .andExpect(status().isNoContent());
    for (UUID participant : new UUID[] {customerId, worker1Id}) {
      String role = participant.equals(customerId) ? "CUSTOMER" : "WORKER";
      mvc.perform(get("/api/v1/bookings/" + booking).with(user(participant.toString()).roles(role)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("CANCELLED"))
          .andExpect(jsonPath("$.cancelReason").value("Plans changed"))
          .andExpect(jsonPath("$.cancelledByName").value("Customer"))
          .andExpect(jsonPath("$.cancelledByRole").value("CUSTOMER"))
          .andExpect(jsonPath("$.cancelledAt").isNotEmpty());
    }
    for (UUID outsider : new UUID[] {outsiderId, worker2Id})
      mvc.perform(
              get("/api/v1/bookings/" + booking).with(user(outsider.toString()).roles("WORKER")))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.cancelReason").doesNotExist());
    mvc.perform(get("/api/v1/bookings/" + booking)).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/quotes/me").with(user(worker1Id.toString()).roles("WORKER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("ACCEPTED"))
        .andExpect(jsonPath("$[0].bookingId").value(booking.toString()))
        .andExpect(jsonPath("$[0].bookingStatus").value("CANCELLED"));
    assertEquals(
        "CANCELLED", quotations.getRequirementQuotes(customerId, reqId).get(0).bookingStatus());
    assertEquals("CONFIRMED", queries.getBookingDetails(customerId, unaffected).status());
    assertNull(queries.getBookingDetails(customerId, unaffected).cancelReason());
    assertFalse(
        sql.queryForObject(
            "SELECT reserved FROM booking_workers WHERE booking_id=?", Boolean.class, booking));
    assertTrue(
        sql.queryForObject(
            "SELECT reserved FROM booking_workers WHERE booking_id=?", Boolean.class, unaffected));
    assertEquals(booking, quotations.acceptQuote(customerId, quote));
    assertEquals(2, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
    assertEquals("CANCELLED", queries.getBookingDetails(customerId, booking).status());
  }

  @Test
  void workerActorAndLegacyMissingAuditAreRepresentedWithoutInventedMetadata() {
    UUID booking =
        quotations.acceptQuote(customerId, quotations.submitQuote(worker1Id, reqId, request()));
    bookings.cancelBooking(worker1Id, booking, "Worker unavailable");
    var details = queries.getBookingDetails(customerId, booking);
    assertEquals("WORKER", details.cancelledByRole());
    assertEquals("Worker One", details.cancelledByName());
    assertNotNull(details.cancelledAt());
    UUID legacy =
        quotations.acceptQuote(
            customerId, quotations.submitQuote(worker2Id, requirement(), request()));
    // Isolated legacy fixture: valid old status transition with no audit fields.
    bookings.transitionInternal(legacy, in.nammacrew.booking.BookingState.CANCELLED);
    var old = queries.getBookingDetails(worker2Id, legacy);
    assertEquals("CANCELLED", old.status());
    assertNull(old.cancelReason());
    assertNull(old.cancelledAt());
    assertNull(old.cancelledByRole());
    assertNull(old.cancelledByName());
  }
}
