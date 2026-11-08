package in.nammacrew.auth.foundation;

import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Caller supplies separately managed keys and canonical context/AAD. No defaults or persisted keys.
 */
public final class OtpCipher {
  public interface Keys {
    SecretKey resolve(String id);
  }

  public static final class Envelope {
    private final String keyId;
    private final byte[] nonce, ciphertext;

    public Envelope(String keyId, byte[] nonce, byte[] ciphertext) {
      if (keyId == null
          || !keyId.matches("[a-zA-Z0-9_-]{1,64}")
          || nonce == null
          || nonce.length != 12
          || ciphertext == null
          || ciphertext.length < 16
          || ciphertext.length > 4096)
        throw new IllegalArgumentException("Invalid encrypted payload");
      this.keyId = keyId;
      this.nonce = nonce.clone();
      this.ciphertext = ciphertext.clone();
    }

    public String keyId() {
      return keyId;
    }

    public byte[] nonce() {
      return nonce.clone();
    }

    public byte[] ciphertext() {
      return ciphertext.clone();
    }

    @Override
    public String toString() {
      return "EncryptedOtp[redacted]";
    }
  }

  private final Keys keys;
  private final SecureRandom random = new SecureRandom();

  public OtpCipher(Keys keys) {
    this.keys = Objects.requireNonNull(keys);
  }

  public Envelope encrypt(String id, byte[] plaintext, byte[] aad) {
    if (plaintext == null || plaintext.length == 0 || plaintext.length > 4080)
      throw new IllegalArgumentException("Invalid payload length");
    byte[] nonce = new byte[12];
    random.nextBytes(nonce);
    return new Envelope(id, nonce, crypt(Cipher.ENCRYPT_MODE, id, nonce, plaintext, aad));
  }

  public byte[] decrypt(Envelope value, byte[] aad) {
    Objects.requireNonNull(value);
    return crypt(Cipher.DECRYPT_MODE, value.keyId(), value.nonce(), value.ciphertext(), aad);
  }

  private byte[] crypt(int mode, String id, byte[] nonce, byte[] input, byte[] aad) {
    if (aad == null || aad.length == 0 || aad.length > 4096)
      throw new IllegalArgumentException("Context required");
    try {
      SecretKey key = keys.resolve(id);
      if (key == null
          || !"AES".equals(key.getAlgorithm())
          || key.getEncoded() == null
          || key.getEncoded().length != 32) throw new GeneralSecurityException();
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(mode, key, new GCMParameterSpec(128, nonce));
      cipher.updateAAD(aad);
      return cipher.doFinal(input);
    } catch (GeneralSecurityException | RuntimeException e) {
      throw new IllegalStateException("OTP cryptographic operation failed");
    }
  }
}
