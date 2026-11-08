package in.nammacrew.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {
  Optional<ChatThread> findByBookingId(UUID bookingId);

  @Query(
      "SELECT t FROM ChatThread t WHERE t.customerId = :userId OR t.workerId = :userId ORDER BY t.createdAt DESC")
  List<ChatThread> findAllByParticipant(UUID userId);
}
