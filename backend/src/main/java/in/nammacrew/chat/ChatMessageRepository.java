package in.nammacrew.chat;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
  List<ChatMessage> findByThreadIdOrderBySentAtAsc(UUID threadId);

  long countByThreadIdAndSenderIdNotAndReadAtIsNull(UUID threadId, UUID senderId);
}
