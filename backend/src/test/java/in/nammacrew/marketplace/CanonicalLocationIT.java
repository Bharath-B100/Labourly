package in.nammacrew.marketplace;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CanonicalLocationIT {
  @Autowired JdbcTemplate sql;
  @org.springframework.boot.test.mock.mockito.MockBean in.nammacrew.auth.OtpProvider otpProvider;

  @Test
  void completeCatalogueRetainsUnresolvedPlacesAndDistinctCodeSystems() {
    assertEquals(36, sql.queryForObject("SELECT count(*) FROM location_states", Integer.class));
    assertEquals(3781, sql.queryForObject("SELECT count(*) FROM location_cities", Integer.class));
    assertEquals(
        27,
        sql.queryForObject(
            "SELECT count(*) FROM location_cities WHERE district_resolution='UNRESOLVED'",
            Integer.class));
    assertEquals(
        29,
        sql.queryForObject(
            "SELECT lgd_code FROM location_states WHERE geonames_key='19'", Integer.class));
    assertEquals(
        "WB",
        sql.queryForObject(
            "SELECT application_code FROM location_states WHERE lgd_code=19", String.class));
    assertEquals(
        0,
        sql.queryForObject(
            "SELECT count(*) FROM location_city_districts cd JOIN location_cities c ON c.id=cd.city_id WHERE c.district_resolution='UNRESOLVED'",
            Integer.class));
  }

  @Test
  void bengaluruAndKrishnagiriHaveIndependentCoordinatesAndDistricts() {
    assertEquals(
        "geonames:1277331",
        sql.queryForObject(
            "SELECT district_id FROM location_city_districts WHERE city_id='1277333'",
            String.class));
    assertEquals(
        "geonames:8223993",
        sql.queryForObject(
            "SELECT district_id FROM location_city_districts WHERE city_id='1265863'",
            String.class));
    assertEquals(
        12.51921,
        sql.queryForObject(
            "SELECT latitude FROM location_cities WHERE id='1265863'", Double.class));
    assertTrue(
        sql.queryForObject(
            "SELECT ST_Distance(ST_SetSRID(ST_MakePoint(a.longitude,a.latitude),4326)::geography,ST_SetSRID(ST_MakePoint(b.longitude,b.latitude),4326)::geography)>80000 FROM location_cities a,location_cities b WHERE a.id='1277333' AND b.id='1265863'",
            Boolean.class));
  }

  @Test
  void cityCanHaveMultipleDistrictsButNeverCrossStateAssignments() {
    sql.update(
        "INSERT INTO location_districts(id,state_id,name,provenance) VALUES ('synthetic','lgd:29','Test district','{}')");
    sql.update("INSERT INTO location_city_districts VALUES ('1277333','synthetic','lgd:29')");
    assertEquals(
        2,
        sql.queryForObject(
            "SELECT count(*) FROM location_city_districts WHERE city_id='1277333'", Integer.class));
    assertThrows(
        org.springframework.dao.DataIntegrityViolationException.class,
        () ->
            sql.update(
                "INSERT INTO location_city_districts VALUES ('1277333','geonames:8223993','lgd:29')"));
  }
}
