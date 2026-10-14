package in.nammacrew.notification;

import in.nammacrew.marketplace.MatchingEngine;
import in.nammacrew.notification.NotificationDTOs.NotificationListResponse;
import in.nammacrew.notification.NotificationDTOs.NotificationView;
import in.nammacrew.notification.NotificationDTOs.UnreadCountResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private final JdbcTemplate sql;
  private final MatchingEngine matchingEngine;

  public NotificationService(JdbcTemplate sql, @Lazy MatchingEngine matchingEngine) {
    this.sql = sql;
    this.matchingEngine = matchingEngine;
  }

  @Transactional
  public UUID sendNotification(
      UUID userId, String title, String message, String type, UUID referenceId) {
    return sql.queryForObject(
        "INSERT INTO notifications(user_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
        UUID.class,
        userId,
        title,
        message,
        type,
        referenceId);
  }

  @Transactional(readOnly = true)
  public NotificationListResponse getNotifications(UUID userId, int limit, int offset) {
    int safeLimit = limit > 0 && limit <= 100 ? limit : 20;
    int safeOffset = Math.max(offset, 0);

    List<NotificationView> items =
        sql.query(
            "SELECT id, user_id, title, message, type, reference_id, read_at, created_at "
                + "FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            this::map,
            userId,
            safeLimit,
            safeOffset);

    Long unread =
        sql.queryForObject(
            "SELECT count(*) FROM notifications WHERE user_id = ? AND read_at IS NULL",
            Long.class,
            userId);

    return new NotificationListResponse(items, unread != null ? unread : 0L);
  }

  @Transactional(readOnly = true)
  public UnreadCountResponse getUnreadCount(UUID userId) {
    Long unread =
        sql.queryForObject(
            "SELECT count(*) FROM notifications WHERE user_id = ? AND read_at IS NULL",
            Long.class,
            userId);
    return new UnreadCountResponse(unread != null ? unread : 0L);
  }

  @Transactional
  public void markAsRead(UUID userId, UUID notificationId) {
    sql.update(
        "UPDATE notifications SET read_at = now() WHERE id = ? AND user_id = ? AND read_at IS NULL",
        notificationId,
        userId);
  }

  @Transactional
  public void markAllAsRead(UUID userId) {
    sql.update(
        "UPDATE notifications SET read_at = now() WHERE user_id = ? AND read_at IS NULL", userId);
  }

  @Transactional
  public void notifyMatchingWorkers(
      UUID requirementId, UUID customerId, String title, String tradeName, String city) {
    try {
      // Serialize retries for this event and require a currently published job.
      var states =
          sql.queryForList(
              "SELECT status FROM labour_requirements WHERE id=? AND customer_id=? FOR UPDATE",
              String.class,
              requirementId,
              customerId);
      if (states.isEmpty() || !"OPEN".equals(states.get(0))) return;
      var matches = matchingEngine.findOpportunityMatches(requirementId, customerId);
      int count = 0;
      for (var match : matches) {
        if (count >= 20) break;
        if (!"AVAILABLE".equals(match.worker().availability())) continue;
        UUID workerId = match.worker().id();

        Boolean alreadyNotified =
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM notifications WHERE user_id = ? AND type = 'WORK_AVAILABLE' AND reference_id = ?)",
                Boolean.class,
                workerId,
                requirementId);
        if (Boolean.TRUE.equals(alreadyNotified)) continue;

        sendNotification(
            workerId,
            "New Job Opportunity",
            "New "
                + tradeName
                + " job in "
                + (city != null ? city : "your area")
                + ": '"
                + title
                + "'. Check details and submit a quote.",
            "WORK_AVAILABLE",
            requirementId);
        count++;
      }
    } catch (Exception e) {
      // Don't fail the primary transaction if broadcast fails
    }
  }

  private NotificationView map(ResultSet rs, int rowNum) throws SQLException {
    var readTimestamp = rs.getTimestamp("read_at");
    return new NotificationView(
        rs.getObject("id", UUID.class),
        rs.getObject("user_id", UUID.class),
        rs.getString("title"),
        rs.getString("message"),
        rs.getString("type"),
        rs.getObject("reference_id", UUID.class),
        readTimestamp != null ? readTimestamp.toInstant() : null,
        rs.getTimestamp("created_at").toInstant());
  }
}
