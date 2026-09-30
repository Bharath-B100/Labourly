package in.nammacrew.auth;

public record AuthTokens(String accessToken, String refreshToken) {
  @Override
  public String toString() {
    return "AuthTokens[REDACTED]";
  }
}
