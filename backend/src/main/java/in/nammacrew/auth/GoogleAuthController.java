package in.nammacrew.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class GoogleAuthController {
  private final GoogleAuthService google;

  public GoogleAuthController(GoogleAuthService google) {
    this.google = google;
  }

  public record LoginRequest(
      @NotBlank @Size(max = 16384) String idToken, @NotBlank @Size(max = 2048) String challenge) {}

  @PostMapping("/auth/google/challenge")
  public JwtTokenProvider.GoogleChallenge challenge() {
    return google.challenge();
  }

  @PostMapping("/auth/google")
  public AuthTokens login(@Valid @RequestBody LoginRequest request) {
    return google.login(request.idToken(), request.challenge());
  }

  @PostMapping("/users/me/google")
  @PreAuthorize("isAuthenticated()")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void link(
      Authentication auth,
      @RequestHeader("Authorization") String authorization,
      @Valid @RequestBody LoginRequest request) {
    google.link(
        UUID.fromString(auth.getName()),
        request.idToken(),
        request.challenge(),
        authorization.substring(7));
  }
}
