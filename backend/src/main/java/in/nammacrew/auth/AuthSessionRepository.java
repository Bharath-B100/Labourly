package in.nammacrew.auth;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from AuthSession s where s.id = :id")
  Optional<AuthSession> lockById(UUID id);
}
