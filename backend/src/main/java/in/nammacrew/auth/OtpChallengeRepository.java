package in.nammacrew.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
  Optional<OtpChallenge> findFirstByPhoneOrderByCreatedAtDesc(String phone);
}
