package in.nammacrew.marketplace;

import in.nammacrew.auth.AuthFailure;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceCoverage {
  private final JdbcTemplate sql;

  public ServiceCoverage(JdbcTemplate sql) {
    this.sql = sql;
  }

  public record Form(
      boolean nationwide,
      List<String> stateIds,
      List<String> districtIds,
      String baseCityId,
      Double radiusKm) {}

  public record View(
      boolean configured,
      boolean nationwide,
      List<String> stateIds,
      List<String> districtIds,
      String baseCityId,
      Double radiusKm) {}

  @Transactional(readOnly = true)
  public View get(UUID worker) {
    var flags =
        sql.query(
            "SELECT nationwide FROM worker_service_coverage WHERE worker_id=?",
            (r, n) -> r.getBoolean(1),
            worker);
    var radii =
        sql.queryForList(
            "SELECT base_city_id,radius_km FROM worker_coverage_radii WHERE worker_id=?", worker);
    return new View(
        !flags.isEmpty(),
        !flags.isEmpty() && flags.get(0),
        sql.queryForList(
            "SELECT state_id FROM worker_coverage_states WHERE worker_id=? ORDER BY state_id",
            String.class,
            worker),
        sql.queryForList(
            "SELECT district_id FROM worker_coverage_districts WHERE worker_id=? ORDER BY district_id",
            String.class,
            worker),
        radii.isEmpty() ? null : (String) radii.get(0).get("base_city_id"),
        radii.isEmpty() ? null : ((Number) radii.get(0).get("radius_km")).doubleValue());
  }

  @Transactional
  public View save(UUID worker, Form f) {
    lockWorker(worker);
    if (!Boolean.TRUE.equals(
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM worker_profiles w JOIN users u ON u.id=w.user_id WHERE w.user_id=? AND u.status='ACTIVE' AND u.onboarding_state='COMPLETED')",
            Boolean.class,
            worker))) throw new AuthFailure(403, "A completed active worker profile is required.");
    if (f == null
        || f.stateIds() == null
        || f.districtIds() == null
        || f.stateIds().size() > 36
        || f.districtIds().size() > 800) throw new AuthFailure(400, "Select valid service areas.");
    if ((f.baseCityId() == null) != (f.radiusKm() == null)
        || f.radiusKm() != null
            && (!Double.isFinite(f.radiusKm()) || f.radiusKm() <= 0 || f.radiusKm() > 500))
      throw new AuthFailure(400, "Choose a base city and radius between 0 and 500 km.");
    for (String id : f.stateIds()) require("location_states", id);
    for (String id : f.districtIds()) require("location_districts", id);
    if (f.baseCityId() != null) require("location_cities", f.baseCityId());
    sql.update(
        "INSERT INTO worker_service_coverage(worker_id,nationwide) VALUES (?,?) ON CONFLICT(worker_id) DO UPDATE SET nationwide=EXCLUDED.nationwide,updated_at=now()",
        worker,
        f.nationwide());
    // The parent upsert serializes concurrent saves for this worker.
    sql.update("DELETE FROM worker_coverage_states WHERE worker_id=?", worker);
    sql.update("DELETE FROM worker_coverage_districts WHERE worker_id=?", worker);
    sql.update("DELETE FROM worker_coverage_radii WHERE worker_id=?", worker);
    for (String id : f.stateIds().stream().distinct().toList())
      sql.update("INSERT INTO worker_coverage_states VALUES (?,?,now())", worker, id);
    for (String id : f.districtIds().stream().distinct().toList())
      sql.update("INSERT INTO worker_coverage_districts VALUES (?,?,now())", worker, id);
    if (f.baseCityId() != null)
      sql.update(
          "INSERT INTO worker_coverage_radii(worker_id,base_city_id,center,radius_km) SELECT ?,id,ST_SetSRID(ST_MakePoint(longitude,latitude),4326),? FROM location_cities WHERE id=?",
          worker,
          f.radiusKm(),
          f.baseCityId());
    return get(worker);
  }

  private void require(String table, String id) {
    if (id == null
        || !Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM " + table + " WHERE id=?)", Boolean.class, id)))
      throw new AuthFailure(400, "Unknown canonical location identifier.");
  }

  // Expressions are internal SQL identifiers, never client values. All callers share this
  // predicate.
  public static String geographic(String worker, String point, String state, String city) {
    String identified =
        "EXISTS(SELECT 1 FROM location_cities target_city WHERE target_city.id="
            + city
            + " AND target_city.state_id="
            + state
            + " AND ST_DWithin(ST_SetSRID(ST_MakePoint(target_city.longitude,target_city.latitude),4326)::geography,"
            + point
            + ",1))";
    return "("
        + point
        + " IS NOT NULL AND ("
        + "EXISTS(SELECT 1 FROM worker_service_coverage cov WHERE cov.worker_id="
        + worker
        + " AND (("
        + identified
        + " AND (cov.nationwide"
        + " OR EXISTS(SELECT 1 FROM worker_coverage_states cs WHERE cs.worker_id=cov.worker_id AND cs.state_id="
        + state
        + ")"
        + " OR EXISTS(SELECT 1 FROM worker_coverage_districts cd JOIN location_city_districts lc ON lc.district_id=cd.district_id JOIN location_cities ci ON ci.id=lc.city_id WHERE cd.worker_id=cov.worker_id AND lc.city_id="
        + city
        + " AND ci.district_resolution='SOURCE_VERIFIED' AND (SELECT count(*) FROM location_city_districts z WHERE z.city_id=ci.id)=1)))"
        + " OR EXISTS(SELECT 1 FROM worker_coverage_radii cr WHERE cr.worker_id=cov.worker_id AND ST_DWithin(cr.center,"
        + point
        + ",cr.radius_km*1000))))"
        + " OR (NOT EXISTS(SELECT 1 FROM worker_service_coverage cov WHERE cov.worker_id="
        + worker
        + ")"
        + " AND EXISTS(SELECT 1 FROM worker_service_locations old WHERE old.worker_id="
        + worker
        + " AND old.center IS NOT NULL AND ST_DWithin(old.center,"
        + point
        + ",COALESCE(old.radius_km,30)*1000)))))";
  }

  public static String profile(String w, String u) {
    return w
        + ".visibility_enabled AND "
        + u
        + ".status='ACTIVE' AND "
        + u
        + ".onboarding_state='COMPLETED'";
  }

  public static String freeSchedule(String worker, String start, String end) {
    return "NOT EXISTS(SELECT 1 FROM booking_workers busy WHERE busy.worker_id="
        + worker
        + " AND busy.reserved AND busy.starts_at<"
        + end
        + " AND busy.ends_at>"
        + start
        + ")";
  }

  // Coverage edits and first acceptance serialize on the same worker identity/profile.
  public void lockWorker(UUID worker) {
    sql.queryForList(
        "SELECT u.id FROM users u JOIN worker_profiles w ON w.user_id=u.id WHERE u.id=? FOR UPDATE OF u,w",
        worker);
  }

  public void requireQuotation(UUID worker, UUID requirement, java.time.Instant start, int days) {
    if (start == null || !start.isAfter(java.time.Instant.now()))
      throw new AuthFailure(400, "Quotation must start in the future.");
    var end = start.plus(days, java.time.temporal.ChronoUnit.DAYS);
    Boolean ok =
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM worker_profiles w JOIN users u ON u.id=w.user_id CROSS JOIN labour_requirements r WHERE w.user_id=? AND r.id=? AND r.status='OPEN' AND w.primary_trade_id=r.category_id AND "
                + profile("w", "u")
                + " AND w.availability_status='AVAILABLE' AND "
                + geographic(
                    "w.user_id", "r.site_location", "r.location_state_id", "r.location_city_id")
                + " AND "
                + freeSchedule("w.user_id", "?::timestamptz", "?::timestamptz")
                + ")",
            Boolean.class,
            worker,
            requirement,
            java.sql.Timestamp.from(end),
            java.sql.Timestamp.from(start));
    if (!Boolean.TRUE.equals(ok))
      throw new AuthFailure(
          403, "This job is outside your service coverage, availability or permitted schedule.");
  }
}
