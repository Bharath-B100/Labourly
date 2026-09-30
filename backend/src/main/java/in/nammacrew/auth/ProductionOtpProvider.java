package in.nammacrew.auth;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("(!dev & !test) | prod | production")
public class ProductionOtpProvider implements OtpProvider {
  @Override
  public void sendOtp(String phone, String otpCode) {
    throw new AuthFailure(503, "Production SMS Provider is not yet configured for Phase 2.");
  }
}
