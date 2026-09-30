package in.nammacrew.auth;

/** Expected security rejection; committed attempt/revocation state must survive it. */
public class AuthFailure extends RuntimeException {
  private final int status;

  public AuthFailure(int status, String message) {
    super(message);
    this.status = status;
  }

  public int status() {
    return status;
  }
}
