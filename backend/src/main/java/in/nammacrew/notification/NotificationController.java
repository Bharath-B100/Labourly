package in.nammacrew.notification;

import in.nammacrew.notification.NotificationDTOs.NotificationListResponse;
import in.nammacrew.notification.NotificationDTOs.UnreadCountResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

  private final NotificationService notifications;

  public NotificationController(NotificationService notifications) {
    this.notifications = notifications;
  }

  @GetMapping
  public NotificationListResponse getNotifications(
      Authentication auth,
      @RequestParam(defaultValue = "20") int limit,
      @RequestParam(defaultValue = "0") int offset) {
    UUID userId = UUID.fromString(auth.getName());
    return notifications.getNotifications(userId, limit, offset);
  }

  @GetMapping("/unread-count")
  public UnreadCountResponse getUnreadCount(Authentication auth) {
    UUID userId = UUID.fromString(auth.getName());
    return notifications.getUnreadCount(userId);
  }

  @PostMapping("/{id}/read")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void markAsRead(Authentication auth, @PathVariable UUID id) {
    UUID userId = UUID.fromString(auth.getName());
    notifications.markAsRead(userId, id);
  }

  @PostMapping("/read-all")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void markAllAsRead(Authentication auth) {
    UUID userId = UUID.fromString(auth.getName());
    notifications.markAllAsRead(userId);
  }
}
