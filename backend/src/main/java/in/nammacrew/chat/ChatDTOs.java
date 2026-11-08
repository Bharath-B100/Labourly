package in.nammacrew.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ChatDTOs {

  public record ThreadSummary(
      UUID threadId,
      UUID bookingId,
      String otherUserName,
      UUID otherUserId,
      String role, // "CUSTOMER" or "WORKER" - the caller's role in this thread
      String requirementTitle,
      String lastMessage,
      Instant lastMessageAt,
      long unreadCount,
      String workerType,
      String teamName,
      Integer teamSize,
      String tradeName) {}

  public record MessageView(
      UUID id, UUID senderId, String senderName, String body, Instant sentAt, boolean readByMe) {}

  public record SendMessageRequest(String body, String clientMessageId) {}

  public record ThreadDetail(
      UUID threadId,
      UUID bookingId,
      String requirementTitle,
      String otherUserName,
      String myRole,
      String workerType,
      String teamName,
      Integer teamSize,
      String tradeName,
      List<MessageView> messages) {}
}
