package in.nammacrew.user;

import java.util.List;
import java.util.UUID;

public record UserView(
    UUID id,
    String phone,
    String fullName,
    List<String> roles,
    String onboardingState,
    String onboardingStep) {
  public static UserView from(User user) {
    return new UserView(
        user.getId(),
        user.getPhone(),
        user.getDisplayName(),
        user.getRoles().stream().map(Role::getCode).sorted().toList(),
        user.getOnboardingState(),
        user.getOnboardingStep());
  }
}
