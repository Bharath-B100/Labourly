package in.nammacrew.chat;

import in.nammacrew.auth.AuthFailure;
import in.nammacrew.support.SupportService;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatSafetyService {
  private final JdbcTemplate sql;
  private final SupportService support;

  public ChatSafetyService(JdbcTemplate sql, SupportService support) {
    this.sql = sql;
    this.support = support;
  }

  public record Safety(boolean blockedByMe, boolean messagingBlocked) {}

  private void participant(UUID thread, UUID user) {
    if (!Boolean.TRUE.equals(
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM chat_threads WHERE id=? AND (customer_id=? OR worker_id=?))",
            Boolean.class,
            thread,
            user,
            user))) throw new AuthFailure(404, "Conversation not found.");
  }

  @Transactional(readOnly = true)
  public Safety state(UUID thread, UUID user) {
    participant(thread, user);
    return new Safety(
        Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM chat_thread_blocks WHERE thread_id=? AND blocker_id=?)",
                Boolean.class,
                thread,
                user)),
        Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM chat_thread_blocks WHERE thread_id=?)",
                Boolean.class,
                thread)));
  }

  @Transactional
  public Safety block(UUID thread, UUID user, boolean blocked) {
    participant(thread, user);
    sql.queryForList("SELECT id FROM chat_threads WHERE id=? FOR UPDATE", thread);
    if (blocked)
      sql.update(
          "INSERT INTO chat_thread_blocks(thread_id,blocker_id) VALUES(?,?) ON CONFLICT DO NOTHING",
          thread,
          user);
    else
      sql.update("DELETE FROM chat_thread_blocks WHERE thread_id=? AND blocker_id=?", thread, user);
    return state(thread, user);
  }

  @Transactional
  public SupportService.Request report(UUID thread, UUID user, String reason) {
    participant(thread, user);
    if (reason == null || reason.isBlank() || reason.length() > 1500)
      throw new AuthFailure(400, "Enter a report reason of 1–1500 characters.");
    String details = "Conversation report: " + thread + "\n" + reason.trim();
    var request = support.create(user, "SUPPORT", details);
    if (!request.details().equals(details))
      throw new AuthFailure(
          409,
          "You already have an open support request. Contact support with this conversation reference to add another report.");
    return request;
  }
}
