package in.nammacrew.marketplace;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {

  private final MarketplaceDiscoveryService discovery;

  public MarketplaceController(MarketplaceDiscoveryService discovery) {
    this.discovery = discovery;
  }

  @GetMapping("/workers")
  public MarketplaceDTOs.Paginated<MarketplaceDTOs.WorkerCard> searchWorkers(
      @RequestParam(required = false) UUID tradeId,
      @RequestParam(required = false) String availability,
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng,
      @RequestParam(required = false) String cityId,
      @RequestParam(required = false, defaultValue = "15.0") Double radiusKm,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return discovery.searchWorkers(tradeId, availability, lat, lng, radiusKm, page, size, cityId);
  }

  @org.springframework.web.bind.annotation.PatchMapping("/workers/me/availability")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('WORKER')")
  public void updateAvailability(
      @RequestParam String availability, org.springframework.security.core.Authentication auth) {
    if (!java.util.List.of("AVAILABLE", "BUSY", "UNAVAILABLE").contains(availability)) {
      throw new IllegalArgumentException("Invalid availability status");
    }
    discovery.updateAvailability(UUID.fromString(auth.getName()), availability);
  }

  @GetMapping("/workers/{id}")
  public MarketplaceDTOs.WorkerCard getWorker(
      @org.springframework.web.bind.annotation.PathVariable UUID id,
      org.springframework.security.core.Authentication auth) {
    boolean isCustomer =
        auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
    return discovery.getWorkerDetails(id, UUID.fromString(auth.getName()), isCustomer);
  }

  @GetMapping("/opportunities")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('WORKER')")
  public MarketplaceDTOs.Paginated<MarketplaceDTOs.RequirementView> getOpportunities(
      org.springframework.security.core.Authentication auth,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return discovery.getOpportunities(UUID.fromString(auth.getName()), page, size);
  }
}
