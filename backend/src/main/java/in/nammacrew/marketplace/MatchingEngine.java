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

  public List<MatchedWorker> findMatches(UUID requirementId) {
    String query =
        """
            WITH req AS (
                SELECT id, category_id, site_location, starts_at, ends_at
                FROM labour_requirements
                WHERE id = ?
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
            JOIN worker_service_locations l ON w.user_id = l.worker_id
            CROSS JOIN req
            WHERE w.visibility_enabled = true
              AND u.status = 'ACTIVE'
              AND w.primary_trade_id = req.category_id
              AND ST_DWithin(l.center, req.site_location, COALESCE(l.radius_km, 30) * 1000)
            ORDER BY distance_km ASC
            LIMIT 50
        """;

    return sql.query(
        query,
        (rs, n) -> {
          String skillsStr = rs.getString("skills");
          List<String> skills =
              skillsStr != null && !skillsStr.isBlank()
                  ? Arrays.asList(skillsStr.split(","))
                  : List.of();

          Integer teamSize = rs.getObject("team_size", Integer.class);
          Double distance = rs.getDouble("distance_km");

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
          reasons.add(
              new MatchReason("LOCATION_MATCH", String.format("Located %.1f km away.", distance)));
          if ("AVAILABLE".equals(card.availability())) {
            reasons.add(new MatchReason("AVAILABILITY_MATCH", "Currently available."));
          }

          int score = 50; // base score for trade match
          if (distance < 10) score += 30;
          else if (distance < 30) score += 10;
          if ("AVAILABLE".equals(card.availability())) score += 20;

          return new MatchedWorker(card, reasons, score);
        },
        requirementId);
  }
}
