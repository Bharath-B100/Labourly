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
      @RequestParam(required = false, defaultValue = "15.0") Double radiusKm,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return discovery.searchWorkers(tradeId, availability, lat, lng, radiusKm, page, size);
  }

  @org.springframework.web.bind.annotation.PatchMapping("/workers/me/availability")
  public void updateAvailability(@RequestParam String availability) {
    UUID dummyWorkerId = UUID.randomUUID(); // TODO: inject
    discovery.updateAvailability(dummyWorkerId, availability);
  }

  @GetMapping("/workers/{id}")
  public MarketplaceDTOs.WorkerCard getWorker(
      @org.springframework.web.bind.annotation.PathVariable UUID id) {
    return discovery.getWorkerDetails(id);
  }

  @GetMapping("/opportunities")
  public MarketplaceDTOs.Paginated<MarketplaceDTOs.RequirementView> getOpportunities(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    UUID dummyWorkerId = UUID.randomUUID(); // TODO
    return discovery.getOpportunities(dummyWorkerId, page, size);
  }
}
