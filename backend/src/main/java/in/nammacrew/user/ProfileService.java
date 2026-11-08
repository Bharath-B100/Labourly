package in.nammacrew.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.nammacrew.auth.AuthFailure;
import java.net.URI;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
  private final JdbcTemplate sql;
  private final UserRepository users;
  private final ObjectMapper mapper;
  private static final Set<String> CUSTOMER_TYPES =
      Set.of(
          "HOMEOWNER",
          "ARCHITECT",
          "INTERIOR_DESIGNER",
          "CONTRACTOR",
          "BUILDER",
          "COMPANY",
          "SITE_ENGINEER",
          "PROJECT_MANAGER",
          "OTHER");

  public ProfileService(JdbcTemplate sql, UserRepository users, ObjectMapper mapper) {
    this.sql = sql;
    this.users = users;
    this.mapper = mapper;
  }

  public record Draft(String role, String state, int step, ProfileData data) {}

  public record Skill(UUID id, String name) {}

  public record Trade(UUID id, String code, String name, List<Skill> skills) {}

  public record CustomerType(String code, String name) {}

  public record Catalogue(List<CustomerType> customerTypes, List<Trade> trades) {}

  @Transactional(readOnly = true)
  public UserView me(UUID id) {
    return UserView.from(user(id));
  }

  @Transactional
  public UserView contact(UUID id, String phone) {
    if (phone != null && !phone.matches("\\+[1-9][0-9]{7,14}"))
      throw new AuthFailure(400, "Enter a valid international contact number.");
    lockUser(id);
    var user = user(id);
    user.setContactPhone(phone);
    return UserView.from(user);
  }

  private User user(UUID id) {
    return users.findById(id).orElseThrow(() -> new AuthFailure(401, "Account unavailable."));
  }

  private void lockUser(UUID id) {
    sql.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", id);
  }

  private String role(User user) {
    return user.getRoles().stream()
        .map(Role::getCode)
        .filter(r -> r.equals("CUSTOMER") || r.equals("WORKER"))
        .findFirst()
        .orElse(null);
  }

  private void requireRole(User user, String role) {
    if (user.getRoles().stream().noneMatch(r -> r.getCode().equals(role)))
      throw new AccessDeniedException("Role required");
  }

  @Transactional
  public UserView selectRole(UUID id, String selected) {
    if (!Set.of("CUSTOMER", "WORKER").contains(selected == null ? "" : selected))
      throw new IllegalArgumentException("Invalid role");
    lockUser(id);
    User user = user(id);
    String current = role(user);
    if (current != null && !current.equals(selected))
      throw new AccessDeniedException("Role is already selected");
    if (current == null) {
      user.getRoles().add(new Role(selected));
      user.setOnboardingState("IN_PROGRESS");
      user.setOnboardingStep("0");
      sql.update("INSERT INTO onboarding_drafts(user_id,role) VALUES (?,?)", id, selected);
    }
    return UserView.from(user);
  }

  @Transactional(readOnly = true)
  public Draft draft(UUID id) {
    User user = user(id);
    String role = role(user);
    if (role == null) return new Draft(null, user.getOnboardingState(), 0, empty());
    var rows =
        sql.query(
            "SELECT role,step,data::text FROM onboarding_drafts WHERE user_id=?",
            (rs, n) ->
                new Draft(
                    rs.getString(1),
                    user.getOnboardingState(),
                    rs.getInt(2),
                    decode(rs.getString(3))),
            id);
    if (!rows.isEmpty()) {
      requireRole(user, rows.getFirst().role());
      return rows.getFirst();
    }
    if (user.getRoles().stream()
            .filter(r -> Set.of("CUSTOMER", "WORKER").contains(r.getCode()))
            .count()
        > 1) throw new IllegalArgumentException("Select an explicit profile role");
    return new Draft(role, user.getOnboardingState(), 0, empty());
  }

  /** Completed profiles are read from role-specific records, never the shared onboarding draft. */
  @Transactional(readOnly = true)
  public Draft profile(UUID id, String role) {
    if (!Set.of("CUSTOMER", "WORKER").contains(role))
      throw new IllegalArgumentException("Invalid profile role");
    User user = user(id);
    requireRole(user, role);
    String query =
        role.equals("CUSTOMER")
            ? "SELECT jsonb_build_object('fullName',u.display_name,'customerType',p.customer_type,'companyName',p.company_name,'state',p.location->>'state','district',p.location->>'district','city',p.location->>'city','postalCode',p.location->>'postalCode')::text FROM customer_profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id=?"
            : "SELECT jsonb_build_object('fullName',u.display_name,'workerType',p.worker_type,'profilePhotoUrl',p.profile_photo_url,'tradeId',p.primary_trade_id,'experienceYears',p.experience_years,'availability',p.availability_status,'teamName',p.team_name,'teamSize',p.team_size,'skillIds',(SELECT coalesce(jsonb_agg(skill_id ORDER BY skill_id),'[]'::jsonb) FROM worker_subskills WHERE worker_id=p.user_id),'state',l.state_code,'district',l.district,'city',l.city,'postalCode',l.postal_code)::text FROM worker_profiles p JOIN users u ON u.id=p.user_id LEFT JOIN LATERAL (SELECT * FROM worker_service_locations WHERE worker_id=p.user_id ORDER BY created_at,id LIMIT 1) l ON true WHERE p.user_id=?";
    var rows = sql.query(query, (rs, n) -> decode(rs.getString(1)), id);
    if (rows.isEmpty())
      throw new IllegalArgumentException("Saved profile not available for this role");
    return new Draft(
        role, user.getOnboardingState(), role.equals("CUSTOMER") ? 2 : 3, rows.getFirst());
  }

  @Transactional
  public Draft saveDraft(UUID id, int step, ProfileData data) {
    lockUser(id);
    var old = draft(id);
    if (old.role() == null) throw new IllegalArgumentException("Select a role first");
    int last = old.role().equals("CUSTOMER") ? 2 : 3;
    if (step < 0 || step > last || step > old.step() + 1)
      throw new IllegalArgumentException("Invalid onboarding step");
    validate(data, old.role(), step);
    sql.update(
        "INSERT INTO onboarding_drafts(user_id,role,step,data) VALUES (?,?,?,?::jsonb) ON CONFLICT(user_id) DO UPDATE SET step=excluded.step,data=excluded.data WHERE onboarding_drafts.role=excluded.role",
        id,
        old.role(),
        step,
        encode(data));
    var user = user(id);
    user.setOnboardingStep(Integer.toString(step));
    if (!"COMPLETED".equals(user.getOnboardingState())) user.setOnboardingState("IN_PROGRESS");
    return new Draft(old.role(), user.getOnboardingState(), step, data);
  }

  @Transactional
  public UserView complete(UUID id) {
    lockUser(id);
    var draft = draft(id);
    if (draft.role() == null || draft.step() != (draft.role().equals("CUSTOMER") ? 2 : 3))
      throw new IllegalArgumentException("Review your complete profile first");
    return persist(id, draft.role(), draft.data());
  }

  @Transactional
  public UserView edit(UUID id, String role, ProfileData data) {
    lockUser(id);
    User user = user(id);
    requireRole(user, role);
    if (!"COMPLETED".equals(user.getOnboardingState()))
      throw new IllegalArgumentException("Complete onboarding first");
    return persist(id, role, data);
  }

  private UserView persist(UUID id, String role, ProfileData data) {
    User user = user(id);
    requireRole(user, role);
    validate(data, role, role.equals("CUSTOMER") ? 2 : 3);
    if (role.equals("CUSTOMER")) {
      var location =
          Map.of(
              "state",
              data.state().trim(),
              "district",
              data.district().trim(),
              "city",
              data.city().trim(),
              "postalCode",
              data.postalCode());
      sql.update(
          "INSERT INTO customer_profiles(user_id,customer_type,company_name,location) VALUES (?,?,?,?::jsonb) ON CONFLICT(user_id) DO UPDATE SET customer_type=excluded.customer_type,company_name=excluded.company_name,location=excluded.location",
          id,
          data.customerType(),
          blankToNull(data.companyName()),
          encode(location));
    } else {
      boolean team = "TEAM".equals(data.workerType());
      sql.update(
          "INSERT INTO worker_profiles(user_id,worker_type,experience_years,profile_photo_url,primary_trade_id,availability_status,team_name,team_size) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET worker_type=excluded.worker_type,experience_years=excluded.experience_years,profile_photo_url=excluded.profile_photo_url,primary_trade_id=excluded.primary_trade_id,availability_status=excluded.availability_status,team_name=excluded.team_name,team_size=excluded.team_size",
          id,
          data.workerType(),
          data.experienceYears(),
          blankToNull(data.profilePhotoUrl()),
          data.tradeId(),
          data.availability(),
          team ? data.teamName().trim() : null,
          team ? data.teamSize() : null);
      sql.update("DELETE FROM worker_subskills WHERE worker_id=?", id);
      sql.update("DELETE FROM worker_skills WHERE worker_id=?", id);
      sql.update(
          "INSERT INTO worker_skills(worker_id,category_id) VALUES (?,?)", id, data.tradeId());
      for (UUID skill : new HashSet<>(data.skillIds()))
        sql.update(
            "INSERT INTO worker_subskills(worker_id,skill_id,trade_id) VALUES (?,?,?)",
            id,
            skill,
            data.tradeId());
      sql.update("DELETE FROM worker_service_locations WHERE worker_id=?", id);
      var cityMatch =
          sql.queryForList(
              "SELECT id, latitude, longitude, state_id FROM location_cities WHERE lower(trim(name))=lower(trim(?)) LIMIT 1",
              data.city().trim());
      if (!cityMatch.isEmpty()) {
        double lat = ((Number) cityMatch.get(0).get("latitude")).doubleValue();
        double lng = ((Number) cityMatch.get(0).get("longitude")).doubleValue();
        sql.update(
            "INSERT INTO worker_service_locations(worker_id,state_code,district,city,postal_code,center,radius_km) VALUES (?,?,?,?,?,ST_SetSRID(ST_MakePoint(?,?),4326)::geography,30.0)",
            id,
            data.state().trim(),
            data.district().trim(),
            data.city().trim(),
            data.postalCode(),
            lng,
            lat);
      } else {
        sql.update(
            "INSERT INTO worker_service_locations(worker_id,state_code,district,city,postal_code) VALUES (?,?,?,?,?)",
            id,
            data.state().trim(),
            data.district().trim(),
            data.city().trim(),
            data.postalCode());
      }
    }
    user.setDisplayName(data.fullName().trim());
    user.setStatus("ACTIVE");
    user.setOnboardingState("COMPLETED");
    user.setOnboardingStep(null);
    sql.update(
        "INSERT INTO onboarding_drafts(user_id,role,step,data) VALUES (?,?,?,?::jsonb) ON CONFLICT(user_id) DO UPDATE SET step=excluded.step,data=excluded.data WHERE onboarding_drafts.role=excluded.role",
        id,
        role,
        role.equals("CUSTOMER") ? 2 : 3,
        encode(data));
    return UserView.from(user);
  }

  private void validate(ProfileData d, String role, int step) {
    if (d == null) throw new IllegalArgumentException("Profile required");
    length(d.fullName(), 120);
    length(d.companyName(), 180);
    length(d.profilePhotoUrl(), 2048);
    length(d.teamName(), 120);
    length(d.state(), 8);
    length(d.district(), 100);
    length(d.city(), 100);
    if (step >= 1) {
      required(d.fullName(), 120);
      if (role.equals("CUSTOMER")) {
        if (!CUSTOMER_TYPES.contains(d.customerType() == null ? "" : d.customerType()))
          throw new IllegalArgumentException("Choose a customer type");
      } else {
        if (!Set.of("INDIVIDUAL", "TEAM").contains(d.workerType() == null ? "" : d.workerType()))
          throw new IllegalArgumentException("Choose worker type");
        if ("TEAM".equals(d.workerType())) {
          required(d.teamName(), 120);
          if (d.teamSize() == null || d.teamSize() < 2 || d.teamSize() > 1000)
            throw new IllegalArgumentException("Invalid team size");
        }
        if (blankToNull(d.profilePhotoUrl()) != null) {
          URI photo = URI.create(d.profilePhotoUrl());
          if (!"https".equals(photo.getScheme())
              || photo.getHost() == null
              || photo.getUserInfo() != null)
            throw new IllegalArgumentException("Photo must be an HTTPS URL");
        }
      }
    }
    if (role.equals("WORKER") && step >= 2) {
      if (d.tradeId() == null
          || d.experienceYears() == null
          || d.experienceYears() < 0
          || d.experienceYears() > 80)
        throw new IllegalArgumentException("Trade and experience required");
      if (!Boolean.TRUE.equals(
          sql.queryForObject(
              "SELECT EXISTS(SELECT 1 FROM labour_categories WHERE id=? AND active)",
              Boolean.class,
              d.tradeId()))) throw new IllegalArgumentException("Unknown trade");
      if (d.skillIds() == null
          || d.skillIds().isEmpty()
          || d.skillIds().size() > 30
          || new HashSet<>(d.skillIds()).size() != d.skillIds().size())
        throw new IllegalArgumentException("Select skills");
      for (UUID skill : d.skillIds())
        if (!Boolean.TRUE.equals(
            sql.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM trade_skills WHERE id=? AND trade_id=? AND active)",
                Boolean.class,
                skill,
                d.tradeId()))) throw new IllegalArgumentException("Skill does not belong to trade");
    }
    if (step >= (role.equals("CUSTOMER") ? 2 : 3)) {
      required(d.state(), 8);
      required(d.district(), 100);
      required(d.city(), 100);
      if (d.postalCode() == null || !d.postalCode().matches("[1-9][0-9]{5}"))
        throw new IllegalArgumentException("Enter a valid postal code");
      if (role.equals("WORKER")
          && !Set.of("AVAILABLE", "BUSY", "UNAVAILABLE")
              .contains(d.availability() == null ? "" : d.availability()))
        throw new IllegalArgumentException("Choose availability");
    }
  }

  @Transactional(readOnly = true)
  public Catalogue catalogue() {
    var types =
        List.of(
            new CustomerType("HOMEOWNER", "Homeowner"),
            new CustomerType("ARCHITECT", "Architect"),
            new CustomerType("INTERIOR_DESIGNER", "Interior Designer"),
            new CustomerType("CONTRACTOR", "Contractor"),
            new CustomerType("BUILDER", "Builder"),
            new CustomerType("COMPANY", "Construction Company"),
            new CustomerType("SITE_ENGINEER", "Site Engineer"),
            new CustomerType("PROJECT_MANAGER", "Project Manager"),
            new CustomerType("OTHER", "Other"));
    var trades =
        sql.query(
            "SELECT id,code,name FROM labour_categories WHERE active ORDER BY name",
            (rs, n) -> {
              UUID id = rs.getObject(1, UUID.class);
              var skills =
                  sql.query(
                      "SELECT id,name FROM trade_skills WHERE trade_id=? AND active ORDER BY name",
                      (s, i) -> new Skill(s.getObject(1, UUID.class), s.getString(2)),
                      id);
              return new Trade(id, rs.getString(2), rs.getString(3), skills);
            });
    return new Catalogue(types, trades);
  }

  private void required(String value, int max) {
    if (value == null || value.isBlank() || value.length() > max)
      throw new IllegalArgumentException("Required profile field missing or too long");
  }

  private void length(String value, int max) {
    if (value != null && value.length() > max)
      throw new IllegalArgumentException("Profile field too long");
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String encode(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid profile", e);
    }
  }

  private ProfileData decode(String json) {
    try {
      return mapper.readValue(json, ProfileData.class);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Invalid stored profile", e);
    }
  }

  private ProfileData empty() {
    return decode("{}");
  }
}
