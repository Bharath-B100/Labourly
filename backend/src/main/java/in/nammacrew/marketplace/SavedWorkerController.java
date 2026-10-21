package in.nammacrew.marketplace;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/saved-workers")
@PreAuthorize("hasRole('CUSTOMER')")
public class SavedWorkerController {
  private final JdbcTemplate sql;

  public SavedWorkerController(JdbcTemplate sql) {
    this.sql = sql;
  }

  public record SavedState(boolean saved) {}

  @GetMapping
  @Transactional(readOnly = true)
  public List<UUID> list(Authentication auth, @RequestParam(defaultValue = "0") int page) {
    if (page < 0 || page > 100000) throw new IllegalArgumentException("Invalid page");
    return sql.query(
        "SELECT worker_id FROM saved_workers WHERE customer_id=? ORDER BY created_at DESC,worker_id LIMIT 20 OFFSET ?",
        (rs, n) -> rs.getObject(1, UUID.class),
        id(auth),
        page * 20);
  }

  @GetMapping("/{workerId}")
  @Transactional(readOnly = true)
  public SavedState state(Authentication auth, @PathVariable UUID workerId) {
    return new SavedState(
        Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM saved_workers WHERE customer_id=? AND worker_id=?)",
                Boolean.class,
                id(auth),
                workerId)));
  }

  @PutMapping("/{workerId}")
  @Transactional
  public SavedState save(Authentication auth, @PathVariable UUID workerId) {
    // Saving is not a grant to see hidden profiles or bypass hiring eligibility.
    var eligible =
        sql.queryForList(
            "SELECT w.user_id FROM worker_profiles w JOIN users u ON u.id=w.user_id WHERE w.user_id=? AND w.visibility_enabled=true AND u.status='ACTIVE' AND u.onboarding_state='COMPLETED' FOR SHARE OF w,u",
            UUID.class,
            workerId);
    if (eligible.isEmpty()) throw new in.nammacrew.auth.AuthFailure(404, "Worker unavailable");
    sql.update(
        "INSERT INTO saved_workers(customer_id,worker_id) VALUES (?,?) ON CONFLICT DO NOTHING",
        id(auth),
        workerId);
    return new SavedState(true);
  }

  @DeleteMapping("/{workerId}")
  @Transactional
  public SavedState remove(Authentication auth, @PathVariable UUID workerId) {
    sql.update("DELETE FROM saved_workers WHERE customer_id=? AND worker_id=?", id(auth), workerId);
    return new SavedState(false);
  }

  private UUID id(Authentication auth) {
    return UUID.fromString(auth.getName());
  }
}
