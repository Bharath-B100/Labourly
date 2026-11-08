package in.nammacrew.support;

import in.nammacrew.auth.AuthFailure;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportService {
  private final JdbcTemplate sql;

  public SupportService(JdbcTemplate sql) {
    this.sql = sql;
  }

  public record Request(
      UUID id, String kind, String details, String status, String resolution, Instant createdAt) {}

  private static final String COLUMNS = "id,kind,details,status,resolution,created_at";
  private final org.springframework.jdbc.core.RowMapper<Request> mapper =
      (r, n) ->
          new Request(
              r.getObject("id", UUID.class),
              r.getString("kind"),
              r.getString("details"),
              r.getString("status"),
              r.getString("resolution"),
              r.getTimestamp("created_at").toInstant());

  @Transactional
  public Request create(UUID user, String kind, String details) {
    if (!List.of("SUPPORT", "ACCOUNT_DELETION").contains(kind == null ? "" : kind))
      throw new AuthFailure(400, "Choose a valid request type.");
    if (details == null || details.isBlank() || details.length() > 2000)
      throw new AuthFailure(400, "Enter details of 1–2000 characters.");
    sql.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", user);
    var existing =
        sql.query(
            "SELECT "
                + COLUMNS
                + " FROM support_requests WHERE user_id=? AND kind=? AND status<>'RESOLVED'",
            mapper,
            user,
            kind);
    if (!existing.isEmpty()) return existing.getFirst();
    int recent =
        sql.queryForObject(
            "SELECT count(*) FROM support_requests WHERE user_id=? AND created_at>now()-interval '24 hours'",
            Integer.class,
            user);
    if (recent >= 5)
      throw new AuthFailure(429, "Too many requests. Please contact labourly.work@gmail.com.");
    UUID id = UUID.randomUUID();
    sql.update(
        "INSERT INTO support_requests(id,user_id,kind,details) VALUES(?,?,?,?)",
        id,
        user,
        kind,
        details.trim());
    sql.update(
        "INSERT INTO support_request_events(request_id,actor_id,status,note) VALUES(?,?,'OPEN','Request submitted')",
        id,
        user);
    return sql.queryForObject(
        "SELECT " + COLUMNS + " FROM support_requests WHERE id=?", mapper, id);
  }

  @Transactional(readOnly = true)
  public List<Request> mine(UUID user) {
    return sql.query(
        "SELECT "
            + COLUMNS
            + " FROM support_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
        mapper,
        user);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public List<Request> queue() {
    return sql.query(
        "SELECT "
            + COLUMNS
            + " FROM support_requests WHERE status<>'RESOLVED' ORDER BY created_at LIMIT 100",
        mapper);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public void review(UUID actor, UUID id, String status, String note) {
    if (!List.of("IN_REVIEW", "RESOLVED").contains(status == null ? "" : status)
        || note == null
        || note.isBlank()
        || note.length() > 2000)
      throw new AuthFailure(400, "Choose a valid status and provide a review note.");
    var rows =
        sql.queryForList("SELECT kind,status FROM support_requests WHERE id=? FOR UPDATE", id);
    if (rows.isEmpty()) throw new AuthFailure(404, "Request not found.");
    var current = rows.getFirst();
    if ("RESOLVED".equals(current.get("status")))
      throw new AuthFailure(409, "Request already resolved.");
    // Request intake is not erasure. Never allow an operator to mark deletion complete
    // until a separately approved retention/erasure workflow has actually run.
    if ("ACCOUNT_DELETION".equals(current.get("kind")) && "RESOLVED".equals(status))
      throw new AuthFailure(
          409, "Account deletion requires the verified erasure workflow; request remains open.");
    sql.update(
        "UPDATE support_requests SET status=?,resolution=?,reviewed_by=?,updated_at=now() WHERE id=?",
        status,
        note.trim(),
        actor,
        id);
    sql.update(
        "INSERT INTO support_request_events(request_id,actor_id,status,note) VALUES(?,?,?,?)",
        id,
        actor,
        status,
        note.trim());
  }
}
