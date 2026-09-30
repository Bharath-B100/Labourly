package in.nammacrew.user;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role {
  @Id private String code;

  protected Role() {}

  public Role(String code) {
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
