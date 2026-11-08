package in.nammacrew.chat;

import in.nammacrew.support.SupportService;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat/threads/{threadId}")
@PreAuthorize("hasAnyRole('CUSTOMER','WORKER')")
public class ChatSafetyController {
  private final ChatSafetyService service;

  public ChatSafetyController(ChatSafetyService service) {
    this.service = service;
  }

  public record Block(boolean blocked) {}

  public record Report(String reason) {}

  @GetMapping("/safety")
  public ChatSafetyService.Safety state(Authentication a, @PathVariable UUID threadId) {
    return service.state(threadId, UUID.fromString(a.getName()));
  }

  @PutMapping("/block")
  public ChatSafetyService.Safety block(
      Authentication a, @PathVariable UUID threadId, @RequestBody Block r) {
    return service.block(threadId, UUID.fromString(a.getName()), r.blocked());
  }

  @PostMapping("/report")
  public SupportService.Request report(
      Authentication a, @PathVariable UUID threadId, @RequestBody Report r) {
    return service.report(threadId, UUID.fromString(a.getName()), r.reason());
  }
}
