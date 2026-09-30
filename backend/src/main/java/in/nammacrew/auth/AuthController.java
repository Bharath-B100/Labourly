package in.nammacrew.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  public record OtpRequest(@NotBlank @Pattern(regexp = "\\+[1-9][0-9]{7,14}") String phone) {}

  public record VerifyRequest(
      @NotBlank @Pattern(regexp = "\\+[1-9][0-9]{7,14}") String phone,
      @NotBlank @Pattern(regexp = "[0-9]{6}") String code) {}

  public record RefreshRequest(@NotBlank @Size(max = 200) String refreshToken) {}

  @PostMapping("/otp/request")
  public ResponseEntity<Void> request(@Valid @RequestBody OtpRequest request) {
    auth.requestOtp(request.phone());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/otp/verify")
  public AuthTokens verify(@Valid @RequestBody VerifyRequest request) {
    return auth.verifyOtp(request.phone(), request.code());
  }

  @PostMapping("/refresh")
  public AuthTokens refresh(@Valid @RequestBody RefreshRequest request) {
    return auth.refreshToken(request.refreshToken());
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
    auth.logout(request.refreshToken());
    return ResponseEntity.noContent().build();
  }
}
