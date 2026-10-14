package in.nammacrew.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class NotificationDTOs {

  public record NotificationView(
      UUID id,
      UUID userId,
      String title,
      String message,
      String type,
      UUID referenceId,
      Instant readAt,
      Instant createdAt) {}

  public record UnreadCountResponse(long unreadCount) {}

  public record NotificationListResponse(List<NotificationView> items, long unreadCount) {}
}
