package in.nammacrew.dev;

import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

  private final JdbcTemplate sql;

  public DevDataSeeder(JdbcTemplate sql) {
    this.sql = sql;
  }

  @Override
  public void run(String... args) {
    System.out.println("Seeding development data...");

    // Clean up old seeder users
    sql.execute(
        """
      DELETE FROM worker_verifications WHERE worker_id IN (SELECT id FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994'));
      DELETE FROM worker_service_locations WHERE worker_id IN (SELECT id FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994'));
      DELETE FROM worker_profiles WHERE user_id IN (SELECT id FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994'));
      DELETE FROM customer_profiles WHERE user_id IN (SELECT id FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994'));
      DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994'));
      DELETE FROM users WHERE phone IN ('+919999999990', '+919999999991', '+919999999992', '+919999999993', '+919999999994');
    """);

    UUID carpentryId =
        sql.queryForObject("SELECT id FROM labour_categories WHERE code = 'CARPENTER'", UUID.class);
    UUID electricianId =
        sql.queryForObject(
            "SELECT id FROM labour_categories WHERE code = 'ELECTRICIAN'", UUID.class);

    // Customer
    UUID customerId = UUID.randomUUID();
    sql.update(
        "INSERT INTO users (id, phone, status, onboarding_state, display_name) VALUES (?, '+919999999990', 'ACTIVE', 'COMPLETED', 'Test Customer')",
        customerId);
    sql.update("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'CUSTOMER')", customerId);
    sql.update(
        "INSERT INTO customer_profiles (user_id, customer_type) VALUES (?, 'HOMEOWNER')",
        customerId);

    // Worker A: Carpenter, AVAILABLE, inside radius (Bangalore center)
    UUID workerA = UUID.randomUUID();
    sql.update(
        "INSERT INTO users (id, phone, status, onboarding_state, display_name) VALUES (?, '+919999999991', 'ACTIVE', 'COMPLETED', 'Worker A (Carpenter, In)')",
        workerA);
    sql.update("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'WORKER')", workerA);
    sql.update(
        "INSERT INTO worker_profiles (user_id, worker_type, primary_trade_id, availability_status, visibility_enabled) VALUES (?, 'INDIVIDUAL', ?, 'AVAILABLE', true)",
        workerA,
        carpentryId);
    sql.update(
        "INSERT INTO worker_service_locations (worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Bengaluru', 'Bengaluru', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerA);
    sql.update(
        "INSERT INTO worker_verifications (worker_id, status, reviewer_id, reviewed_at, verification_type) VALUES (?, 'APPROVED', ?, now(), 'SYNTHETIC_REVIEW')",
        workerA,
        customerId);

    // Worker B: Electrician, AVAILABLE, inside radius
    UUID workerB = UUID.randomUUID();
    sql.update(
        "INSERT INTO users (id, phone, status, onboarding_state, display_name) VALUES (?, '+919999999992', 'ACTIVE', 'COMPLETED', 'Worker B (Electrician, In)')",
        workerB);
    sql.update("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'WORKER')", workerB);
    sql.update(
        "INSERT INTO worker_profiles (user_id, worker_type, primary_trade_id, availability_status, visibility_enabled) VALUES (?, 'INDIVIDUAL', ?, 'AVAILABLE', true)",
        workerB,
        electricianId);
    sql.update(
        "INSERT INTO worker_service_locations (worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Bengaluru', 'Bengaluru', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerB);
    sql.update(
        "INSERT INTO worker_verifications (worker_id, status, reviewer_id, reviewed_at, verification_type) VALUES (?, 'APPROVED', ?, now(), 'SYNTHETIC_REVIEW')",
        workerB,
        customerId);

    // Worker C: Carpenter, UNAVAILABLE, inside radius
    UUID workerC = UUID.randomUUID();
    sql.update(
        "INSERT INTO users (id, phone, status, onboarding_state, display_name) VALUES (?, '+919999999993', 'ACTIVE', 'COMPLETED', 'Worker C (Carpenter, Unavail)')",
        workerC);
    sql.update("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'WORKER')", workerC);
    sql.update(
        "INSERT INTO worker_profiles (user_id, worker_type, primary_trade_id, availability_status, visibility_enabled) VALUES (?, 'INDIVIDUAL', ?, 'UNAVAILABLE', true)",
        workerC,
        carpentryId);
    sql.update(
        "INSERT INTO worker_service_locations (worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Bengaluru', 'Bengaluru', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 15)",
        workerC);
    sql.update(
        "INSERT INTO worker_verifications (worker_id, status, reviewer_id, reviewed_at, verification_type) VALUES (?, 'APPROVED', ?, now(), 'SYNTHETIC_REVIEW')",
        workerC,
        customerId);

    // Worker D: Carpenter, AVAILABLE, outside radius (Mysore)
    UUID workerD = UUID.randomUUID();
    sql.update(
        "INSERT INTO users (id, phone, status, onboarding_state, display_name) VALUES (?, '+919999999994', 'ACTIVE', 'COMPLETED', 'Worker D (Carpenter, Out)')",
        workerD);
    sql.update("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'WORKER')", workerD);
    sql.update(
        "INSERT INTO worker_profiles (user_id, worker_type, primary_trade_id, availability_status, visibility_enabled) VALUES (?, 'INDIVIDUAL', ?, 'AVAILABLE', true)",
        workerD,
        carpentryId);
    sql.update(
        "INSERT INTO worker_service_locations (worker_id, state_code, district, city, center, radius_km) VALUES (?, 'KA', 'Mysuru', 'Mysuru', ST_SetSRID(ST_MakePoint(76.6394, 12.2958), 4326), 15)",
        workerD);
    sql.update(
        "INSERT INTO worker_verifications (worker_id, status, reviewer_id, reviewed_at, verification_type) VALUES (?, 'APPROVED', ?, now(), 'SYNTHETIC_REVIEW')",
        workerD,
        customerId);

    System.out.println("Development data seeded successfully!");
  }
}
