package in.nammacrew.marketplace;

import in.nammacrew.auth.AuthFailure;
import in.nammacrew.marketplace.MarketplaceDTOs.RequirementForm;
import in.nammacrew.marketplace.MarketplaceDTOs.RequirementView;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequirementService {

  private final JdbcTemplate sql;
  private final in.nammacrew.notification.NotificationService notifications;

  public RequirementService(
      JdbcTemplate sql, in.nammacrew.notification.NotificationService notifications) {
    this.sql = sql;
    this.notifications = notifications;
  }

  @Transactional
  public UUID postRequirement(UUID customerId, RequirementForm form) {
    return saveRequirement(customerId, form, null, null, null);
  }

  private UUID saveRequirement(
      UUID customerId,
      RequirementForm form,
      UUID existing,
      Long expectedVersion,
      java.math.BigDecimal budget) {
    validateForm(form, budget);
    if (form == null
        || form.lat() == null
        || form.lng() == null
        || !Double.isFinite(form.lat())
        || !Double.isFinite(form.lng())
        || Math.abs(form.lat()) > 90
        || Math.abs(form.lng()) > 180) throw new AuthFailure(400, "Provide valid job coordinates.");
    String city;
    String district = null;
    String state;
    if ("CITY_CENTRE".equals(form.locationSource())) {
      var places =
          sql.queryForList(
              "SELECT c.*,s.application_code FROM location_cities c JOIN location_states s ON s.id=c.state_id WHERE c.id=? AND c.state_id=?",
              form.locationCityId(),
              form.locationStateId());
      if (places.isEmpty()) throw new AuthFailure(400, "Choose a valid canonical state and city.");
      var place = places.get(0);
      if (Math.abs(((Number) place.get("latitude")).doubleValue() - form.lat()) > 0.000001
          || Math.abs(((Number) place.get("longitude")).doubleValue() - form.lng()) > 0.000001)
        throw new AuthFailure(400, "City-centre coordinates do not match the selected city.");
      city = (String) place.get("name");
      state = (String) place.get("application_code");
      var districts =
          sql.queryForList(
              "SELECT d.name FROM location_city_districts cd JOIN location_districts d ON d.id=cd.district_id WHERE cd.city_id=?",
              String.class,
              form.locationCityId());
      if ("SOURCE_VERIFIED".equals(place.get("district_resolution")) && districts.size() == 1)
        district = districts.get(0);
    } else if ("GPS".equals(form.locationSource())
        && form.locationStateId() == null
        && form.locationCityId() == null) {
      city = "GPS job location";
      state =
          "IN"; // Administrative labels are deliberately not asserted for an unverified GPS point.
    } else
      throw new AuthFailure(400, "Confirm a catalogue city or GPS job location before posting.");
    UUID reqId = existing == null ? UUID.randomUUID() : existing;
    if (existing != null) {
      var rows =
          sql.queryForList(
              "SELECT status,edit_version FROM labour_requirements WHERE id=? AND customer_id=? FOR UPDATE",
              existing,
              customerId);
      if (rows.isEmpty()) throw new AuthFailure(404, "Draft not found.");
      if (!"DRAFT".equals(rows.get(0).get("status")))
        throw new AuthFailure(409, "Only drafts can be edited.");
      if (expectedVersion == null
          || expectedVersion.longValue() != ((Number) rows.get(0).get("edit_version")).longValue())
        throw new AuthFailure(409, "This draft changed. Reload before saving.");
      sql.update(
          "UPDATE labour_requirements SET title=?,description=?,category_id=?,worker_count=?,starts_at=?,ends_at=?,city=?,district=?,state_code=?,site_location=ST_SetSRID(ST_MakePoint(?,?),4326),location_source=?,location_state_id=?,location_city_id=?,budget=?,edit_version=edit_version+1,updated_at=now() WHERE id=?",
          form.title(),
          form.description(),
          form.tradeId(),
          form.workerCount(),
          java.sql.Timestamp.from(form.startsAt()),
          java.sql.Timestamp.from(form.endsAt()),
          city,
          district,
          state,
          form.lng(),
          form.lat(),
          form.locationSource(),
          form.locationStateId(),
          form.locationCityId(),
          budget,
          existing);
      sql.update("DELETE FROM requirement_skills WHERE requirement_id=?", existing);
    } else {

      sql.update(
          """
            INSERT INTO labour_requirements(id, customer_id, category_id, title, description, worker_count, starts_at, ends_at, city, district, state_code, site_location,location_source,location_state_id,location_city_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326),?,?,?)
            """,
          reqId,
          customerId,
          form.tradeId(),
          form.title(),
          form.description(),
          form.workerCount(),
          java.sql.Timestamp.from(form.startsAt()),
          java.sql.Timestamp.from(form.endsAt()),
          city,
          district,
          state,
          form.lng(),
          form.lat(),
          form.locationSource(),
          form.locationStateId(),
          form.locationCityId());
    }
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

  public record DraftEdit(
      RequirementForm form, Long expectedVersion, java.math.BigDecimal budget) {}

  @Transactional
  public UUID editDraft(UUID customer, UUID id, DraftEdit edit) {
    if (edit == null) throw new AuthFailure(400, "Draft content required.");
    return saveRequirement(customer, edit.form(), id, edit.expectedVersion(), edit.budget());
  }

  @Transactional(readOnly = true)
  public java.util.Map<String, Object> getDraft(UUID customer, UUID id) {
    var rows =
        sql.queryForList(
            "SELECT r.*, ST_Y(site_location::geometry) lat,ST_X(site_location::geometry) lng FROM labour_requirements r WHERE id=? AND customer_id=?",
            id,
            customer);
    if (rows.isEmpty()) throw new AuthFailure(404, "Draft not found.");
    var r = rows.get(0);
    if (!"DRAFT".equals(r.get("status"))) throw new AuthFailure(409, "Only drafts can be edited.");
    r.remove("site_location");
    r.put(
        "skill_ids",
        sql.queryForList(
            "SELECT skill_id FROM requirement_skills WHERE requirement_id=?", UUID.class, id));
    return r;
  }

  private void validateForm(RequirementForm f, java.math.BigDecimal budget) {
    if (f == null
        || f.title() == null
        || f.title().trim().length() < 5
        || f.title().length() > 120
        || f.description() == null
        || f.description().trim().length() < 5
        || f.description().length() > 2000
        || f.workerCount() < 1
        || f.workerCount() > 10000
        || f.startsAt() == null
        || f.endsAt() == null
        || !f.startsAt().isAfter(java.time.Instant.now())
        || !f.endsAt().isAfter(f.startsAt())
        || java.time.Duration.between(f.startsAt(), f.endsAt()).toDays() > 3650)
      throw new AuthFailure(
          400, "Provide a title, description, worker count and valid future schedule.");
    if (budget != null
        && (budget.signum() <= 0
            || budget.scale() > 2
            || budget.compareTo(new java.math.BigDecimal("9999999999.99")) > 0))
      throw new AuthFailure(
          400, "Budget must be a positive INR amount with at most two decimal places.");
    if (!Boolean.TRUE.equals(
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM labour_categories WHERE id=? AND active)",
            Boolean.class,
            f.tradeId()))) throw new AuthFailure(400, "Choose an active trade.");
    if (f.skillIds() != null)
      for (UUID skill : f.skillIds())
        if (!Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM trade_skills WHERE id=? AND trade_id=?)",
                Boolean.class,
                skill,
                f.tradeId())))
          throw new AuthFailure(400, "Skill does not belong to the selected trade.");
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
    java.util.List<String> states =
        sql.query(
            "SELECT status FROM labour_requirements WHERE id = ? AND customer_id = ? FOR UPDATE",
            (rs, n) -> rs.getString(1),
            requirementId,
            customerId);
    if (states.isEmpty()) {
      throw new IllegalArgumentException("Requirement not found or access denied");
    }
    String current = states.get(0);

    boolean valid = false;
    if ("DRAFT".equals(current) && ("OPEN".equals(status) || "CANCELLED".equals(status))) {
      valid = true;
    } else if ("OPEN".equals(current) && ("CLOSED".equals(status) || "CANCELLED".equals(status))) {
      valid = true;
    }

    if (!valid) {
      throw new AuthFailure(409, "Invalid state transition from " + current + " to " + status);
    }

    sql.update(
        "UPDATE labour_requirements SET status = ?, updated_at = now() WHERE id = ?",
        status,
        requirementId);

    if ("OPEN".equals(status)) {
      try {
        var info =
            sql.queryForMap(
                "SELECT r.title, r.city, c.name as trade FROM labour_requirements r JOIN labour_categories c ON r.category_id=c.id WHERE r.id=?",
                requirementId);
        notifications.notifyMatchingWorkers(
            requirementId,
            customerId,
            (String) info.get("title"),
            (String) info.get("trade"),
            (String) info.get("city"));
      } catch (Exception ignored) {
      }
    }
  }

  @Transactional(readOnly = true)
  public RequirementView getRequirementById(UUID requirementId, UUID callerId, boolean isCustomer) {
    String accessCheck =
        isCustomer
            ? " AND r.customer_id = ?"
            : " AND (r.status = 'OPEN' OR EXISTS (SELECT 1 FROM quotations q WHERE q.requirement_id = r.id AND q.worker_id = ?))";

    String query =
        """
            SELECT r.id, r.title, r.description, c.name as trade, r.worker_count, r.starts_at, r.ends_at, r.city, r.district, r.state_code, r.status, r.created_at,
                   (SELECT string_agg(ts.name, ',') FROM requirement_skills rs JOIN trade_skills ts ON rs.skill_id = ts.id WHERE rs.requirement_id = r.id) as skills
            FROM labour_requirements r
            JOIN labour_categories c ON r.category_id = c.id
            WHERE r.id = ?
            """
            + accessCheck;

    try {
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
          requirementId,
          callerId);
    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
      throw new AuthFailure(404, "Requirement not found or access denied.");
    }
  }
}
