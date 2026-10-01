package in.nammacrew.marketplace;

import in.nammacrew.marketplace.MarketplaceDTOs.RequirementForm;
import in.nammacrew.marketplace.MarketplaceDTOs.RequirementView;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequirementService {

  private final JdbcTemplate sql;

  public RequirementService(JdbcTemplate sql) {
    this.sql = sql;
  }

  @Transactional
  public UUID postRequirement(UUID customerId, RequirementForm form) {
    UUID reqId = UUID.randomUUID();

    sql.update(
        """
            INSERT INTO labour_requirements(id, customer_id, category_id, title, description, worker_count, starts_at, ends_at, city, district, state_code, site_location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326))
            """,
        reqId,
        customerId,
        form.tradeId(),
        form.title(),
        form.description(),
        form.workerCount(),
        java.sql.Timestamp.from(form.startsAt()),
        java.sql.Timestamp.from(form.endsAt()),
        form.city(),
        form.district(),
        form.stateCode(),
        form.lng(),
        form.lat());

    if (form.skillIds() != null) {
      for (UUID skillId : form.skillIds()) {
        sql.update(
            "INSERT INTO requirement_skills(requirement_id, skill_id, trade_id) VALUES (?, ?, ?)",
            reqId,
            skillId,
            form.tradeId());
      }
    }

    return reqId;
  }

  @Transactional(readOnly = true)
  public MarketplaceDTOs.Paginated<RequirementView> getMyRequirements(
      UUID customerId, int page, int size) {
    int limit = size > 0 && size <= 100 ? size : 20;
    int offset = page >= 0 ? page * limit : 0;

    int total =
        sql.queryForObject(
            "SELECT count(id) FROM labour_requirements WHERE customer_id = ?",
            Integer.class,
            customerId);

    String query =
        """
            SELECT r.id, r.title, r.description, c.name as trade, r.worker_count, r.starts_at, r.ends_at, r.city, r.district, r.state_code, r.status, r.created_at,
                   (SELECT string_agg(ts.name, ',') FROM requirement_skills rs JOIN trade_skills ts ON rs.skill_id = ts.id WHERE rs.requirement_id = r.id) as skills
            FROM labour_requirements r
            JOIN labour_categories c ON r.category_id = c.id
            WHERE r.customer_id = ?
            ORDER BY r.created_at DESC LIMIT ? OFFSET ?
            """;

    var items =
        sql.query(
            query,
            (rs, n) -> {
              String skillsStr = rs.getString("skills");
              return new RequirementView(
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
            customerId,
            limit,
            offset);

    return new MarketplaceDTOs.Paginated<>(items, total, page, limit);
  }

  @Transactional
  public void updateStatus(UUID requirementId, UUID customerId, String status) {
    int rows =
        sql.update(
            "UPDATE labour_requirements SET status = ?, updated_at = now() WHERE id = ? AND customer_id = ?",
            status,
            requirementId,
            customerId);
    if (rows == 0) {
      throw new IllegalArgumentException("Requirement not found or access denied");
    }
  }

  @Transactional(readOnly = true)
  public RequirementView getRequirementById(UUID requirementId) {
    String query =
        """
            SELECT r.id, r.title, r.description, c.name as trade, r.worker_count, r.starts_at, r.ends_at, r.city, r.district, r.state_code, r.status, r.created_at,
                   (SELECT string_agg(ts.name, ',') FROM requirement_skills rs JOIN trade_skills ts ON rs.skill_id = ts.id WHERE rs.requirement_id = r.id) as skills
            FROM labour_requirements r
            JOIN labour_categories c ON r.category_id = c.id
            WHERE r.id = ?
            """;

    return sql.queryForObject(
        query,
        (rs, n) -> {
          String skillsStr = rs.getString("skills");
          return new RequirementView(
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
        requirementId);
  }
}
