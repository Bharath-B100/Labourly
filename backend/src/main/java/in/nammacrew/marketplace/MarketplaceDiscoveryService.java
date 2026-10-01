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
    int limit = size > 0 && size <= 100 ? size : 20;
    int offset = page >= 0 ? page * limit : 0;

    List<Object> args = new java.util.ArrayList<>();
    StringBuilder where =
        new StringBuilder(" WHERE w.visibility_enabled = true AND u.status = 'ACTIVE'");

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

    if (lat != null && lng != null && radiusKm != null && radiusKm > 0) {
      where.append(
          " AND l.center IS NOT NULL AND ST_DWithin(l.center, ST_SetSRID(ST_MakePoint(?, ?), 4326), ? * 1000)");
      args.add(lng);
      args.add(lat);
      args.add(radiusKm);
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
  public WorkerCard getWorkerDetails(UUID workerId) {
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
            """;
    try {
      return sql.queryForObject(query, this::mapWorkerCard, workerId);
    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
      throw new IllegalArgumentException("Worker not found");
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
                SELECT user_id, primary_trade_id
                FROM worker_profiles
                WHERE user_id = ?
            ), wl AS (
                SELECT center, radius_km FROM worker_service_locations WHERE worker_id = ?
            )
            SELECT r.id, r.title, r.description, c.name as trade, r.worker_count, r.starts_at, r.ends_at, r.city, r.district, r.state_code, r.status, r.created_at,
                   (SELECT string_agg(ts.name, ',') FROM requirement_skills rs JOIN trade_skills ts ON rs.skill_id = ts.id WHERE rs.requirement_id = r.id) as skills
            FROM labour_requirements r
            JOIN labour_categories c ON r.category_id = c.id
            CROSS JOIN w
            CROSS JOIN wl
            WHERE r.status = 'OPEN'
              AND r.category_id = w.primary_trade_id
              AND ST_DWithin(wl.center, r.site_location, COALESCE(wl.radius_km, 30) * 1000)
            ORDER BY r.created_at DESC LIMIT ? OFFSET ?
            """;

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
            workerId,
            limit,
            offset);

    // Count could be done similarly, but for simplicity skipping exact count
    return new Paginated<>(items, items.size(), page, limit);
  }
}
