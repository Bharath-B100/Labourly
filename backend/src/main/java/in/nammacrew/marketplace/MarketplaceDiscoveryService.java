package in.nammacrew.marketplace;

import in.nammacrew.marketplace.MarketplaceDTOs.Paginated;
import in.nammacrew.marketplace.MarketplaceDTOs.WorkerCard;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketplaceDiscoveryService {

  private final JdbcTemplate sql;

  public MarketplaceDiscoveryService(JdbcTemplate sql) {
    this.sql = sql;
  }

  @Transactional(readOnly = true)
  public Paginated<WorkerCard> searchWorkers(
      UUID tradeId,
      String availability,
      Double lat,
      Double lng,
      Double radiusKm,
      int page,
      int size) {
    return searchWorkers(tradeId, availability, lat, lng, radiusKm, page, size, null);
  }

  public Paginated<WorkerCard> searchWorkers(
      UUID tradeId,
      String availability,
      Double lat,
      Double lng,
      Double radiusKm,
      int page,
      int size,
      String cityId) {
    int limit = size > 0 && size <= 100 ? size : 20;
    int offset = page >= 0 ? page * limit : 0;

    List<Object> args = new java.util.ArrayList<>();
    StringBuilder where = new StringBuilder(" WHERE " + ServiceCoverage.profile("w", "u"));

    if (tradeId != null) {
      where.append(" AND w.primary_trade_id = ?");
      args.add(tradeId);
    }

    if (availability != null && !availability.isBlank()) {
      if (!availability.equalsIgnoreCase("ALL")) {
        where.append(" AND w.availability_status = ?");
        args.add(availability);
      }
    } else {
      where.append(" AND w.availability_status = 'AVAILABLE'");
    }

    if (lat != null || lng != null || cityId != null) {
      if (lat == null
          || lng == null
          || !Double.isFinite(lat)
          || !Double.isFinite(lng)
          || Math.abs(lat) > 90
          || Math.abs(lng) > 180)
        throw new in.nammacrew.auth.AuthFailure(400, "Invalid search coordinates.");
      String stateId = null;
      if (cityId != null) {
        var cities = sql.queryForList("SELECT * FROM location_cities WHERE id=?", cityId);
        if (cities.isEmpty()
            || Math.abs(((Number) cities.get(0).get("latitude")).doubleValue() - lat) > 0.000001
            || Math.abs(((Number) cities.get(0).get("longitude")).doubleValue() - lng) > 0.000001)
          throw new in.nammacrew.auth.AuthFailure(400, "Search city and coordinates disagree.");
        stateId = (String) cities.get(0).get("state_id");
      }
      where.append(
          " AND EXISTS(SELECT 1 FROM (SELECT ST_SetSRID(ST_MakePoint(?,?),4326)::geography point,?::varchar state_id,?::varchar city_id) target WHERE "
              + ServiceCoverage.geographic(
                  "w.user_id", "target.point", "target.state_id", "target.city_id")
              + ")");
      args.add(lng);
      args.add(lat);
      args.add(stateId);
      args.add(cityId);
    }

    String countQuery =
        "SELECT count(w.user_id) FROM worker_profiles w JOIN users u ON w.user_id = u.id LEFT JOIN worker_service_locations l ON w.user_id = l.worker_id"
            + where;
    int total = sql.queryForObject(countQuery, Integer.class, args.toArray());

    String query =
        """
            SELECT w.user_id, u.display_name, w.profile_photo_url, w.worker_type, c.name as trade_name,
                   w.experience_years, w.team_size, w.availability_status,
                   l.district, l.city, l.state_code,
                   (SELECT string_agg(ts.name, ',') FROM worker_subskills ws JOIN trade_skills ts ON ws.skill_id = ts.id WHERE ws.worker_id = w.user_id) as skills,
                   COALESCE((SELECT status FROM worker_verifications wv WHERE wv.worker_id = w.user_id ORDER BY created_at DESC LIMIT 1), 'NOT_VERIFIED') as verification_status
            FROM worker_profiles w
            JOIN users u ON w.user_id = u.id
            JOIN labour_categories c ON w.primary_trade_id = c.id
            LEFT JOIN worker_service_locations l ON w.user_id = l.worker_id
            """
            + where
            + " ORDER BY w.created_at DESC LIMIT ? OFFSET ?";

    args.add(limit);
    args.add(offset);

    List<WorkerCard> items = sql.query(query, this::mapWorkerCard, args.toArray());

    return new Paginated<>(items, total, page, limit);
  }

  private WorkerCard mapWorkerCard(ResultSet rs, int rowNum) throws SQLException {
    String skillsStr = rs.getString("skills");
    List<String> skills =
        skillsStr != null && !skillsStr.isBlank() ? Arrays.asList(skillsStr.split(",")) : List.of();

    Integer teamSize = rs.getObject("team_size", Integer.class);

    return new WorkerCard(
        rs.getObject("user_id", UUID.class),
        rs.getString("display_name"),
        rs.getString("profile_photo_url"),
        rs.getString("worker_type"),
        rs.getString("trade_name"),
        skills,
        rs.getShort("experience_years"),
        teamSize,
        rs.getString("availability_status"),
        rs.getString("district"),
        rs.getString("city"),
        rs.getString("state_code"),
        rs.getString("verification_status"));
  }

  @Transactional
  public void updateAvailability(UUID workerId, String availability) {
    int rows =
        sql.update(
            "UPDATE worker_profiles SET availability_status = ?, updated_at = now() WHERE user_id = ?",
            availability,
            workerId);
    if (rows == 0) {
      throw new IllegalArgumentException("Worker profile not found");
    }
  }

  @Transactional(readOnly = true)
  public WorkerCard getWorkerDetails(UUID workerId, UUID callerId, boolean isCustomer) {
    String accessCheck =
        """
        AND (
            w.user_id = ?
            OR (w.visibility_enabled = true AND u.status = 'ACTIVE' AND u.onboarding_state = 'COMPLETED')
            OR EXISTS (
                SELECT 1 FROM quotations q
                JOIN labour_requirements r ON q.requirement_id = r.id
                WHERE q.worker_id = w.user_id AND r.customer_id = ?
            )
        )
        """;

    String query =
        """
            SELECT w.user_id, u.display_name, w.profile_photo_url, w.worker_type, c.name as trade_name,
                   w.experience_years, w.team_size, w.availability_status,
                   l.district, l.city, l.state_code,
                   (SELECT string_agg(ts.name, ',') FROM worker_subskills ws JOIN trade_skills ts ON ws.skill_id = ts.id WHERE ws.worker_id = w.user_id) as skills,
                   COALESCE((SELECT status FROM worker_verifications wv WHERE wv.worker_id = w.user_id ORDER BY created_at DESC LIMIT 1), 'NOT_VERIFIED') as verification_status
            FROM worker_profiles w
            JOIN users u ON w.user_id = u.id
            JOIN labour_categories c ON w.primary_trade_id = c.id
            LEFT JOIN worker_service_locations l ON w.user_id = l.worker_id
            WHERE w.user_id = ?
            """
            + accessCheck;
    try {
      return sql.queryForObject(
          query, this::mapWorkerCard, workerId, callerId, isCustomer ? callerId : null);
    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
      throw new in.nammacrew.auth.AuthFailure(404, "Worker not found or access denied");
    }
  }

  @Transactional(readOnly = true)
  public Paginated<in.nammacrew.marketplace.MarketplaceDTOs.RequirementView> getOpportunities(
      UUID workerId, int page, int size) {
    // Simple matching logic: OPEN requirements matching trade and within radius
    int limit = size > 0 && size <= 100 ? size : 20;
    int offset = page >= 0 ? page * limit : 0;

    String query =
        """
            WITH w AS (
                SELECT user_id, primary_trade_id, availability_status
                FROM worker_profiles
                WHERE user_id = ?
            )
            SELECT r.id, r.title, r.description, c.name as trade, r.worker_count, r.starts_at, r.ends_at, r.city, r.district, r.state_code, r.status, r.created_at,
                   (SELECT string_agg(ts.name, ',') FROM requirement_skills rs JOIN trade_skills ts ON rs.skill_id = ts.id WHERE rs.requirement_id = r.id) as skills
            FROM labour_requirements r
            JOIN labour_categories c ON r.category_id = c.id
            CROSS JOIN w
            JOIN users u ON u.id=w.user_id
            JOIN worker_profiles wp ON wp.user_id=w.user_id
            WHERE r.status = 'OPEN'
              AND r.category_id = w.primary_trade_id
              AND %s
              AND %s
              AND %s
              AND w.availability_status = 'AVAILABLE'
            ORDER BY r.created_at DESC LIMIT ? OFFSET ?
        """
            .formatted(
                ServiceCoverage.geographic(
                    "w.user_id", "r.site_location", "r.location_state_id", "r.location_city_id"),
                ServiceCoverage.profile("wp", "u"),
                ServiceCoverage.freeSchedule("w.user_id", "r.starts_at", "r.ends_at"));

    var items =
        sql.query(
            query,
            (rs, n) -> {
              String skillsStr = rs.getString("skills");
              return new in.nammacrew.marketplace.MarketplaceDTOs.RequirementView(
                  rs.getObject("id", UUID.class),
                  rs.getString("title"),
                  rs.getString("description"),
                  rs.getString("trade"),
                  skillsStr != null && !skillsStr.isBlank()
                      ? java.util.Arrays.asList(skillsStr.split(","))
                      : java.util.List.of(),
                  rs.getInt("worker_count"),
                  rs.getTimestamp("starts_at").toInstant(),
                  rs.getTimestamp("ends_at").toInstant(),
                  rs.getString("city"),
                  rs.getString("district"),
                  rs.getString("state_code"),
                  rs.getString("status"),
                  rs.getTimestamp("created_at").toInstant());
            },
            workerId,
            limit,
            offset);

    // Count could be done similarly, but for simplicity skipping exact count
    return new Paginated<>(items, items.size(), page, limit);
  }
}
