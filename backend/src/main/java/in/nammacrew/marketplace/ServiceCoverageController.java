package in.nammacrew.marketplace;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workers/me/service-coverage")
@PreAuthorize("hasRole('WORKER')")
public class ServiceCoverageController {
  private final ServiceCoverage coverage;

  public ServiceCoverageController(ServiceCoverage coverage) {
    this.coverage = coverage;
  }

  @GetMapping
  public ServiceCoverage.View get(Authentication auth) {
    return coverage.get(UUID.fromString(auth.getName()));
  }

  @PutMapping
  public ServiceCoverage.View save(Authentication auth, @RequestBody ServiceCoverage.Form form) {
    return coverage.save(UUID.fromString(auth.getName()), form);
  }
}
