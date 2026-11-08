package in.nammacrew.chat;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER')")
public class ChatController {

  private final ChatService service;

  public ChatController(ChatService service) {
    this.service = service;
  }

  /** List all chat threads for the calling user */
  @GetMapping("/threads")
  public List<ChatDTOs.ThreadSummary> listThreads(Authentication auth) {
    return service.listThreads(UUID.fromString(auth.getName()));
  }

  /** Get or create a thread for a booking */
  @PostMapping("/threads/booking/{bookingId}")
  @ResponseStatus(HttpStatus.CREATED)
  public ChatDTOs.ThreadDetail openThread(Authentication auth, @PathVariable UUID bookingId) {
    var callerId = UUID.fromString(auth.getName());
    var thread = service.getOrCreateThread(bookingId, callerId);
    return service.getThreadMessages(thread.getId(), callerId);
  }

  /** Get messages in a thread */
  @GetMapping("/threads/{threadId}")
  public ChatDTOs.ThreadDetail getThread(Authentication auth, @PathVariable UUID threadId) {
    return service.getThreadMessages(threadId, UUID.fromString(auth.getName()));
  }

  /** Send a message */
  @PostMapping("/threads/{threadId}/messages")
  @ResponseStatus(HttpStatus.CREATED)
  public ChatDTOs.MessageView sendMessage(
      Authentication auth,
      @PathVariable UUID threadId,
      @RequestBody ChatDTOs.SendMessageRequest request) {
    return service.sendMessage(
        threadId, UUID.fromString(auth.getName()), request.body(), request.clientMessageId());
  }
}
