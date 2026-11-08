package in.nammacrew.booking;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{id}/lifecycle")
@PreAuthorize("hasAnyRole('CUSTOMER','WORKER')")
public class BookingLifecycleController {
  private final BookingLifecycleService service;

  public BookingLifecycleController(BookingLifecycleService service) {
    this.service = service;
  }

  public record Confirmation(String action) {}

  @GetMapping
  public BookingLifecycleService.State state(Authentication a, @PathVariable UUID id) {
    return service.state(id, UUID.fromString(a.getName()));
  }

  @PostMapping
  public BookingLifecycleService.State confirm(
      Authentication a, @PathVariable UUID id, @RequestBody Confirmation r) {
    return service.confirm(id, UUID.fromString(a.getName()), r.action());
  }
}
