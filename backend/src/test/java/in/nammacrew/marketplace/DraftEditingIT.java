package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import in.nammacrew.auth.AuthFailure;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class DraftEditingIT extends QuotationTestSupport {
  @Autowired RequirementService service;

  MarketplaceDTOs.RequirementForm form() {
    return new MarketplaceDTOs.RequirementForm(
        "Updated carpenter job",
        "Isolated draft editing",
        categoryId,
        List.of(),
        2,
        request().startsAt(),
        request().startsAt().plusSeconds(172800),
        "ignored",
        "ignored",
        "ignored",
        12.51921,
        78.21382,
        "CITY_CENTRE",
        "lgd:33",
        "1265863");
  }

  UUID draft() {
    UUID id = requirement();
    sql.update("UPDATE labour_requirements SET status='DRAFT' WHERE id=?", id);
    return id;
  }

  @Test
  void ownedDraftIsUpdatedWithoutDuplicateAndLocationRequiresExplicitIdentity() {
    UUID id = draft();
    int count = sql.queryForObject("SELECT count(*) FROM labour_requirements", Integer.class);
    assertEquals(
        id,
        service.editDraft(
            customerId,
            id,
            new RequirementService.DraftEdit(form(), 0L, new BigDecimal("5000.00"))));
    var saved = service.getDraft(customerId, id);
    assertEquals("DRAFT", saved.get("status"));
    assertEquals("lgd:33", saved.get("location_state_id"));
    assertEquals("Krishnagiri", saved.get("city"));
    assertEquals(78.21382, ((Number) saved.get("lng")).doubleValue());
    assertEquals(1L, ((Number) saved.get("edit_version")).longValue());
    assertEquals(
        count, sql.queryForObject("SELECT count(*) FROM labour_requirements", Integer.class));
    assertThrows(
        AuthFailure.class,
        () ->
            service.editDraft(customerId, id, new RequirementService.DraftEdit(form(), 0L, null)));
  }

  @Test
  void ownershipAndStateFailClosed() throws Exception {
    UUID id = draft();
    assertThrows(AuthFailure.class, () -> service.getDraft(outsiderId, id));
    assertThrows(
        AuthFailure.class,
        () ->
            service.editDraft(outsiderId, id, new RequirementService.DraftEdit(form(), 0L, null)));
    for (String status : List.of("OPEN", "CLOSED", "CANCELLED")) {
      sql.update("UPDATE labour_requirements SET status=? WHERE id=?", status, id);
      assertThrows(
          AuthFailure.class,
          () ->
              service.editDraft(
                  customerId, id, new RequirementService.DraftEdit(form(), 0L, null)));
    }
    mvc.perform(
            get("/api/v1/requirements/" + id + "/draft")
                .with(user(worker1Id.toString()).roles("WORKER")))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/requirements/" + id + "/draft")).andExpect(status().isUnauthorized());
  }

  @Test
  void invalidInputCannotChangeTheDraft() {
    UUID id = draft();
    assertThrows(
        AuthFailure.class,
        () ->
            service.editDraft(
                customerId,
                id,
                new RequirementService.DraftEdit(form(), 0L, new BigDecimal("-1"))));
    var bad =
        new MarketplaceDTOs.RequirementForm(
            "Valid title",
            "Description",
            categoryId,
            List.of(),
            0,
            request().startsAt(),
            request().startsAt().minusSeconds(1),
            "x",
            "x",
            "x",
            Double.NaN,
            77.0,
            "GPS",
            null,
            null);
    assertThrows(
        AuthFailure.class,
        () -> service.editDraft(customerId, id, new RequirementService.DraftEdit(bad, 0L, null)));
    assertEquals(0L, ((Number) service.getDraft(customerId, id).get("edit_version")).longValue());
  }

  @Test
  void pendingQuotesDoNotReserveTimeOrCreateBookings() {
    UUID other = requirement();
    quotations.submitQuote(worker1Id, reqId, request());
    quotations.submitQuote(worker1Id, other, request());
    assertEquals(2, quotations.getMyQuotes(worker1Id).size());
    assertEquals(0, sql.queryForObject("SELECT count(*) FROM bookings", Integer.class));
    assertEquals(
        0,
        sql.queryForObject("SELECT count(*) FROM booking_workers WHERE reserved", Integer.class));
  }
}
