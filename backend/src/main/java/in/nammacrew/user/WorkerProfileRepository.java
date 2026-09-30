package in.nammacrew.user;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, UUID> {}
