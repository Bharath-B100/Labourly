package in.nammacrew.booking;

import in.nammacrew.auth.AuthFailure;
import in.nammacrew.notification.NotificationService;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingLifecycleService {
  private final JdbcTemplate sql;
  private final NotificationService notifications;

  public BookingLifecycleService(JdbcTemplate sql, NotificationService notifications) {
    this.sql = sql;
    this.notifications = notifications;
  }

  public record State(
      String status, String nextAction, boolean confirmedByMe, boolean confirmedByOther) {}

  private record Participants(UUID customer, UUID worker) {}

  private Participants participants(UUID id, UUID actor) {
    var rows =
        sql.query(
            "SELECT lr.customer_id,q.worker_id FROM bookings b JOIN quotations q ON q.id=b.quotation_id JOIN labour_requirements lr ON lr.id=q.requirement_id WHERE b.id=?",
            (r, n) -> new Participants(r.getObject(1, UUID.class), r.getObject(2, UUID.class)),
            id);
    if (rows.isEmpty()
        || (!actor.equals(rows.getFirst().customer()) && !actor.equals(rows.getFirst().worker())))
      throw new AuthFailure(404, "Booking not found.");
    return rows.getFirst();
  }

  @Transactional(readOnly = true)
  public State state(UUID id, UUID actor) {
    var p = participants(id, actor);
    String status = sql.queryForObject("SELECT status FROM bookings WHERE id=?", String.class, id);
    String action =
        "CONFIRMED".equals(status) ? "START" : "IN_PROGRESS".equals(status) ? "COMPLETE" : null;
    if (action == null) return new State(status, null, false, false);
    var votes =
        sql.queryForList(
            "SELECT actor_id FROM booking_lifecycle_confirmations WHERE booking_id=? AND action=?",
            UUID.class,
            id,
            action);
    UUID other = actor.equals(p.customer()) ? p.worker() : p.customer();
    return new State(status, action, votes.contains(actor), votes.contains(other));
  }

  @Transactional
  public State confirm(UUID id, UUID actor, String action) {
    if (!"START".equals(action) && !"COMPLETE".equals(action))
      throw new AuthFailure(400, "Choose START or COMPLETE.");
    var p = participants(id, actor);
    var row =
        sql.queryForMap(
            "SELECT status,starts_at<=now() AS can_start FROM bookings WHERE id=? FOR UPDATE", id);
    String status = (String) row.get("status");
    boolean exists =
        Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM booking_lifecycle_confirmations WHERE booking_id=? AND actor_id=? AND action=?)",
                Boolean.class,
                id,
                actor,
                action));
    if (exists) return state(id, actor);
    if (("START".equals(action) && !"CONFIRMED".equals(status))
        || ("COMPLETE".equals(action) && !"IN_PROGRESS".equals(status)))
      throw new AuthFailure(409, "Booking status changed. Refresh before confirming.");
    if ("START".equals(action) && !Boolean.TRUE.equals(row.get("can_start")))
      throw new AuthFailure(409, "Work cannot start before the scheduled start time.");
    if (p.customer().equals(p.worker()))
      throw new AuthFailure(409, "A booking needs two distinct participants.");
    sql.update(
        "INSERT INTO booking_lifecycle_confirmations(booking_id,actor_id,action) VALUES(?,?,?)",
        id,
        actor,
        action);
    int count =
        sql.queryForObject(
            "SELECT count(*) FROM booking_lifecycle_confirmations WHERE booking_id=? AND action=? AND actor_id IN (?,?)",
            Integer.class,
            id,
            action,
            p.customer(),
            p.worker());
    if (count == 2) {
      String next = "START".equals(action) ? "IN_PROGRESS" : "COMPLETED";
      sql.update("UPDATE bookings SET status=?,version=version+1 WHERE id=?", next, id);
      String message =
          "Both participants confirmed. Booking is now "
              + next.toLowerCase().replace('_', ' ')
              + ".";
      // Both inserts participate in the status transaction; rollback sends neither update.
      notifications.sendNotification(
          p.customer(), "Booking update", message, "BOOKING_UPDATED", id);
      notifications.sendNotification(p.worker(), "Booking update", message, "BOOKING_UPDATED", id);
    }
    return state(id, actor);
  }
}
