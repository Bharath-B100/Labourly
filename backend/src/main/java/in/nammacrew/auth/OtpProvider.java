package in.nammacrew.auth;

public interface OtpProvider {
  void sendOtp(String phone, String otpCode);
}
