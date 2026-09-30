package in.nammacrew.user;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {
  private final ProfileService profiles;

  public ProfileController(ProfileService profiles) {
    this.profiles = profiles;
  }

  public record DraftRequest(int step, ProfileData data) {}

  @GetMapping("/onboarding/catalogue")
  public ProfileService.Catalogue catalogue() {
    return profiles.catalogue();
  }

  @GetMapping({"/onboarding", "/profile"})
  public ProfileService.Draft draft(Authentication auth) {
    return profiles.draft(id(auth));
  }

  @PutMapping("/onboarding")
  public ProfileService.Draft save(Authentication auth, @RequestBody DraftRequest request) {
    return profiles.saveDraft(id(auth), request.step(), request.data());
  }

  @PostMapping("/onboarding/complete")
  public UserView complete(Authentication auth) {
    return profiles.complete(id(auth));
  }

  @PostMapping("/profile/customer")
  @PreAuthorize("hasRole('CUSTOMER')")
  public UserView customer(Authentication auth, @RequestBody ProfileData request) {
    return profiles.edit(id(auth), "CUSTOMER", request);
  }

  @PostMapping("/profile/worker")
  @PreAuthorize("hasRole('WORKER')")
  public UserView worker(Authentication auth, @RequestBody ProfileData request) {
    return profiles.edit(id(auth), "WORKER", request);
  }

  private UUID id(Authentication auth) {
    return UUID.fromString(auth.getName());
  }
}
