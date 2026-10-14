package in.nammacrew.auth;

public interface OtpProvider {
  void sendOtp(String phone, String otpCode);

  default boolean verifyOtp(
      String inputCode,
      String actualCodeHash,
      org.springframework.security.crypto.password.PasswordEncoder encoder) {
    return encoder.matches(inputCode, actualCodeHash);
  }
}
