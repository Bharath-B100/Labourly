package in.nammacrew.marketplace;

import in.nammacrew.marketplace.QuotationDTOs.QuoteView;
import in.nammacrew.marketplace.QuotationDTOs.SubmitQuoteRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class QuotationController {

  private final QuotationService quotations;

  public QuotationController(QuotationService quotations) {
    this.quotations = quotations;
  }

  @PostMapping("/requirements/{id}/quotes")
  @PreAuthorize("hasRole('WORKER')")
  @ResponseStatus(HttpStatus.CREATED)
  public UUID submitQuote(
      Authentication auth, @PathVariable UUID id, @RequestBody SubmitQuoteRequest req) {
    return quotations.submitQuote(UUID.fromString(auth.getName()), id, req);
  }

  @GetMapping("/requirements/{id}/quotes")
  @PreAuthorize("hasRole('CUSTOMER')")
  public List<QuoteView> getRequirementQuotes(Authentication auth, @PathVariable UUID id) {
    return quotations.getRequirementQuotes(UUID.fromString(auth.getName()), id);
  }

  @GetMapping("/quotes/me")
  @PreAuthorize("hasRole('WORKER')")
  public List<QuoteView> getMyQuotes(Authentication auth) {
    return quotations.getMyQuotes(UUID.fromString(auth.getName()));
  }

  @PostMapping("/quotes/{id}/accept")
  @PreAuthorize("hasRole('CUSTOMER')")
  public UUID acceptQuote(Authentication auth, @PathVariable UUID id) {
    return quotations.acceptQuote(UUID.fromString(auth.getName()), id);
  }

  @PostMapping("/quotes/{id}/reject")
  @PreAuthorize("hasRole('CUSTOMER')")
  public void rejectQuote(Authentication auth, @PathVariable UUID id) {
    quotations.rejectQuote(UUID.fromString(auth.getName()), id);
  }

  @PostMapping("/quotes/{id}/withdraw")
  @PreAuthorize("hasRole('WORKER')")
  public void withdrawQuote(Authentication auth, @PathVariable UUID id) {
    quotations.withdrawQuote(UUID.fromString(auth.getName()), id);
  }
}
