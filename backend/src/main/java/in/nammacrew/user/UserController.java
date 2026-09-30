package in.nammacrew.user;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
  private final ProfileService profiles;

  public UserController(ProfileService profiles) {
    this.profiles = profiles;
  }

  public record RoleRequest(String role) {}

  @GetMapping("/me")
  public UserView me(Authentication auth) {
    return profiles.me(UUID.fromString(auth.getName()));
  }

  @PostMapping("/me/roles")
  public UserView select(Authentication auth, @RequestBody RoleRequest request) {
    return profiles.selectRole(UUID.fromString(auth.getName()), request.role());
  }
}
