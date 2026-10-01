package in.nammacrew.marketplace;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/requirements")
public class RequirementController {

  private final RequirementService service;
  private final MatchingEngine matchingEngine;

  public RequirementController(RequirementService service, MatchingEngine matchingEngine) {
    this.service = service;
    this.matchingEngine = matchingEngine;
  }

  @org.springframework.web.bind.annotation.GetMapping
  public String status() {
    return "OK";
  }

  @PostMapping
  public UUID postRequirement(@RequestBody MarketplaceDTOs.RequirementForm form, org.springframework.security.core.Authentication auth) {
    UUID customerId = UUID.fromString(auth.getName());
    return service.postRequirement(customerId, form);
  }

  @GetMapping("/{id}/matches")
  public java.util.List<MarketplaceDTOs.MatchedWorker> getMatches(
      @org.springframework.web.bind.annotation.PathVariable UUID id) {
    // Return deterministic matches for a posted requirement.
    return matchingEngine.findMatches(id);
  }

  @GetMapping("/me")
  public MarketplaceDTOs.Paginated<MarketplaceDTOs.RequirementView> getMyRequirements(
      @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
      @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size,
      org.springframework.security.core.Authentication auth) {
    UUID customerId = UUID.fromString(auth.getName());
    return service.getMyRequirements(customerId, page, size);
  }

  @org.springframework.web.bind.annotation.PatchMapping("/{id}/status")
  public void updateStatus(
      @org.springframework.web.bind.annotation.PathVariable UUID id,
      @org.springframework.web.bind.annotation.RequestParam String status,
      org.springframework.security.core.Authentication auth) {
    UUID customerId = UUID.fromString(auth.getName());
    service.updateStatus(id, customerId, status);
  }

  @GetMapping("/{id}")
  public MarketplaceDTOs.RequirementView getRequirement(
      @org.springframework.web.bind.annotation.PathVariable UUID id) {
    return service.getRequirementById(id);
  }
}
