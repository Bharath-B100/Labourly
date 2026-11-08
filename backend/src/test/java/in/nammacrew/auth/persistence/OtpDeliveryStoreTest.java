package in.nammacrew.auth.persistence;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import in.nammacrew.auth.foundation.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

class OtpDeliveryStoreTest {
  static OtpDeliveryStore.Intent intent() {
    return new OtpDeliveryStore.Intent(
        "+919000000001",
        "$2a$10$" + "a".repeat(53),
        new OtpContext(
            UUID.randomUUID(), UUID.randomUUID(), "MSG91", "v1", Instant.now().plusSeconds(290)),
        "test",
        new OtpCipher.Envelope("test", new byte[12], new byte[22]),
        new byte[32]);
  }

  @Test
  void intentDefensivelyCopiesAndRedacts() {
    var i = intent();
    var hash = i.requestHash();
    hash[0] = 1;
    assertEquals(0, i.requestHash()[0]);
    assertFalse(i.toString().contains(i.phone()));
    assertFalse(i.toString().contains(i.codeHash()));
  }

  @Test
  void plaintextAndMalformedInputsRejected() {
    var i = intent();
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new OtpDeliveryStore.Intent(
                i.phone(), "123456", i.context(), i.templateKey(), i.encrypted(), null));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new OtpDeliveryStore.Intent(
                "invalid", i.codeHash(), i.context(), i.templateKey(), i.encrypted(), null));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new OtpDeliveryStore.Intent(
                i.phone(), i.codeHash(), i.context(), i.templateKey(), i.encrypted(), new byte[1]));
  }

  @Test
  void failedDatabaseOperationRollsBack() {
    var db = mock(JdbcTemplate.class);
    var manager = mock(PlatformTransactionManager.class);
    var status = new SimpleTransactionStatus();
    when(manager.getTransaction(any())).thenReturn(status);
    when(db.queryForList(anyString(), any(Object[].class)))
        .thenThrow(new IllegalStateException("database unavailable"));
    var store = new OtpDeliveryStore(db, manager);
    assertThrows(RuntimeException.class, () -> store.enqueue(intent(), UUID.randomUUID()));
    verify(manager).rollback(status);
    verify(manager, never()).commit(any());
  }

  @Test
  void malformedCallbackNeverStartsTransaction() {
    var manager = mock(PlatformTransactionManager.class);
    var store = new OtpDeliveryStore(mock(JdbcTemplate.class), manager);
    assertThrows(
        IllegalArgumentException.class,
        () -> store.callback("MSG91", new byte[1], "id", "DELIVERED", Instant.now(), "SIGNATURE"));
    verifyNoInteractions(manager);
  }

  @Test
  void callbackCommitAndDuplicateResult() {
    var db = mock(JdbcTemplate.class);
    var manager = mock(PlatformTransactionManager.class);
    var status = new SimpleTransactionStatus();
    when(manager.getTransaction(any())).thenReturn(status);
    var store = new OtpDeliveryStore(db, manager);
    assertFalse(
        store.callback("MSG91", new byte[32], "test", "DELIVERED", Instant.now(), "SIGNATURE"));
    verify(manager).commit(status);
  }
}
