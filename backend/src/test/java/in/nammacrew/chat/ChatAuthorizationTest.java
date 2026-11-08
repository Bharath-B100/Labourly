package in.nammacrew.chat;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import in.nammacrew.booking.BookingDTOs.BookingView;
import in.nammacrew.booking.BookingQueryService;
import in.nammacrew.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class ChatAuthorizationTest {
  private final ChatThreadRepository threads = mock(ChatThreadRepository.class);
  private final BookingQueryService bookings = mock(BookingQueryService.class);
  private final JdbcTemplate sql = mock(JdbcTemplate.class);
  private final ChatService service =
      new ChatService(
          threads, mock(ChatMessageRepository.class), bookings, mock(UserRepository.class), sql);
  private final UUID bookingId = UUID.randomUUID();
  private final UUID caller = UUID.randomUUID();

  @Test
  void inaccessibleBookingCannotReturnAnExistingThread() {
    when(bookings.getBookingForUser(bookingId, caller)).thenReturn(Optional.empty());
    when(threads.findByBookingId(bookingId)).thenReturn(Optional.of(new ChatThread()));
    var error =
        assertThrows(
            ResponseStatusException.class, () -> service.getOrCreateThread(bookingId, caller));
    assertEquals(404, error.getStatusCode().value());
    verifyNoInteractions(threads, sql);
  }

  @Test
  void authorizedParticipantReusesExistingThreadWithoutWriting() {
    when(bookings.getBookingForUser(bookingId, caller))
        .thenReturn(Optional.of(mock(BookingView.class)));
    var existing = new ChatThread();
    when(threads.findByBookingId(bookingId)).thenReturn(Optional.of(existing));
    assertSame(existing, service.getOrCreateThread(bookingId, caller));
    var order = inOrder(bookings, sql, threads);
    order.verify(bookings).getBookingForUser(bookingId, caller);
    order.verify(sql).queryForList("SELECT id FROM bookings WHERE id = ? FOR UPDATE", bookingId);
    order.verify(threads).findByBookingId(bookingId);
    verify(threads, never()).save(any());
  }

  @Test
  void newThreadUsesParticipantsFromAuthorizedBooking() {
    var booking = mock(BookingView.class);
    var worker = UUID.randomUUID();
    when(booking.customerId()).thenReturn(caller);
    when(booking.workerId()).thenReturn(worker);
    when(bookings.getBookingForUser(bookingId, caller)).thenReturn(Optional.of(booking));
    when(threads.findByBookingId(bookingId)).thenReturn(Optional.empty());
    when(threads.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    var created = service.getOrCreateThread(bookingId, caller);
    assertEquals(bookingId, created.getBookingId());
    assertEquals(caller, created.getCustomerId());
    assertEquals(worker, created.getWorkerId());
  }
}
