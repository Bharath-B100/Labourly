package in.nammacrew.auth.dev;

import in.nammacrew.auth.OtpProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("dev & !prod & !production")
public class DevelopmentOtpProvider implements OtpProvider {
  private static final Logger log = LoggerFactory.getLogger(DevelopmentOtpProvider.class);

  public DevelopmentOtpProvider(org.springframework.core.env.Environment environment) {
    if (!environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))
        || environment.acceptsProfiles(
            org.springframework.core.env.Profiles.of("prod", "production"))) {
      throw new IllegalStateException("Development OTP is forbidden outside isolated dev profile.");
    }
  }

  @Override
  public void sendOtp(String phone, String otpCode) {
    log.warn("=================================================");
    log.warn("DEVELOPMENT OTP MODE - DO NOT ENABLE IN PRODUCTION");
    log.warn("Sending OTP {} to {}", otpCode, phone);
    log.warn("=================================================");
  }

  @Override
  public boolean verifyOtp(
      String inputCode,
      String actualCodeHash,
      org.springframework.security.crypto.password.PasswordEncoder encoder) {
    if ("123456".equals(inputCode)) {
      return true;
    }
    return OtpProvider.super.verifyOtp(inputCode, actualCodeHash, encoder);
  }
}
