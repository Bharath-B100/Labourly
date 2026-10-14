package in.nammacrew.marketplace;

import in.nammacrew.marketplace.MarketplaceDTOs.MatchReason;
import in.nammacrew.marketplace.MarketplaceDTOs.MatchedWorker;
import in.nammacrew.marketplace.MarketplaceDTOs.WorkerCard;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MatchingEngine {

  private final JdbcTemplate sql;

  public MatchingEngine(JdbcTemplate sql) {
    this.sql = sql;
  }

  public List<MatchedWorker> findMatches(UUID requirementId, UUID customerId) {
    return findMatches(requirementId, customerId, false);
  }

  public List<MatchedWorker> findOpportunityMatches(UUID requirementId, UUID customerId) {
    return findMatches(requirementId, customerId, true);
  }

  private List<MatchedWorker> findMatches(
      UUID requirementId, UUID customerId, boolean opportunitiesOnly) {
    String query =
        """
            WITH req AS (
                SELECT id, category_id, site_location, starts_at, ends_at, location_state_id, location_city_id
                FROM labour_requirements
                WHERE id = ? AND customer_id = ? AND status IN ('DRAFT','OPEN')
            )
            SELECT w.user_id, u.display_name, w.profile_photo_url, w.worker_type, c.name as trade_name,
                   w.experience_years, w.team_size, w.availability_status,
                   l.district, l.city, l.state_code,
                   (SELECT string_agg(ts.name, ',') FROM worker_subskills ws JOIN trade_skills ts ON ws.skill_id = ts.id WHERE ws.worker_id = w.user_id) as skills,
                   ST_Distance(l.center, req.site_location) / 1000.0 as distance_km,
                   COALESCE((SELECT status FROM worker_verifications wv WHERE wv.worker_id = w.user_id ORDER BY created_at DESC LIMIT 1), 'NOT_VERIFIED') as verification_status
            FROM worker_profiles w
            JOIN users u ON w.user_id = u.id
            JOIN labour_categories c ON w.primary_trade_id = c.id
            LEFT JOIN LATERAL (SELECT * FROM worker_service_locations wl WHERE wl.worker_id=w.user_id ORDER BY wl.id LIMIT 1) l ON true
            CROSS JOIN req
            WHERE w.visibility_enabled = true
              AND u.status = 'ACTIVE'
              AND u.onboarding_state = 'COMPLETED'
              AND w.primary_trade_id = req.category_id
              AND %s
              %s
            ORDER BY (w.availability_status='AVAILABLE') DESC, distance_km ASC NULLS LAST, w.user_id
            LIMIT 50
        """
            .formatted(
                ServiceCoverage.geographic(
                    "w.user_id",
                    "req.site_location",
                    "req.location_state_id",
                    "req.location_city_id"),
                opportunitiesOnly
                    ? " AND w.availability_status='AVAILABLE' AND req.starts_at>now() AND "
                        + ServiceCoverage.freeSchedule("w.user_id", "req.starts_at", "req.ends_at")
                    : "");

    return sql.query(
        query,
        (rs, n) -> {
          String skillsStr = rs.getString("skills");
          List<String> skills =
              skillsStr != null && !skillsStr.isBlank()
                  ? Arrays.asList(skillsStr.split(","))
                  : List.of();

          Integer teamSize = rs.getObject("team_size", Integer.class);
          Double distance = rs.getObject("distance_km", Double.class);

          WorkerCard card =
              new WorkerCard(
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

          List<MatchReason> reasons = new ArrayList<>();
          reasons.add(new MatchReason("TRADE_MATCH", "Matches the exact trade requirement."));
          reasons.add(new MatchReason("COVERAGE_MATCH", "Serves this job location."));
          if (distance != null)
            reasons.add(
                new MatchReason(
                    "LOCATION_MATCH", String.format("Home/base is %.1f km away.", distance)));
          if ("AVAILABLE".equals(card.availability())) {
            reasons.add(new MatchReason("AVAILABILITY_MATCH", "Currently available."));
          }

          int score = 50; // base score for trade match
          if (distance != null && distance < 10) score += 30;
          else if (distance != null && distance < 30) score += 10;
          if ("AVAILABLE".equals(card.availability())) score += 20;

          return new MatchedWorker(card, reasons, score);
        },
        requirementId,
        customerId);
  }
}
