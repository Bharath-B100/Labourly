package in.nammacrew.support;

import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SupportController {
  private final SupportService service;

  public SupportController(SupportService service) {
    this.service = service;
  }

  public record NewRequest(String kind, String details) {}

  public record Review(String status, String note) {}

  @PostMapping("/support/requests")
  public SupportService.Request create(Authentication auth, @RequestBody NewRequest r) {
    return service.create(UUID.fromString(auth.getName()), r.kind(), r.details());
  }

  @GetMapping("/support/requests")
  public List<SupportService.Request> mine(Authentication auth) {
    return service.mine(UUID.fromString(auth.getName()));
  }

  @GetMapping("/admin/support/requests")
  public List<SupportService.Request> queue() {
    return service.queue();
  }

  @PatchMapping("/admin/support/requests/{id}")
  public void review(Authentication auth, @PathVariable UUID id, @RequestBody Review r) {
    service.review(UUID.fromString(auth.getName()), id, r.status(), r.note());
  }
}
