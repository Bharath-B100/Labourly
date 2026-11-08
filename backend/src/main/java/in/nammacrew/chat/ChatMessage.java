package in.nammacrew.chat;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "thread_id", nullable = false)
  private UUID threadId;

  @Column(name = "sender_id", nullable = false)
  private UUID senderId;

  @Column(name = "body", nullable = false)
  private String body;

  @Column(name = "client_message_id", length = 80)
  private String clientMessageId;

  public void setClientMessageId(String value) {
    clientMessageId = value;
  }

  @Column(name = "sent_at", nullable = false, updatable = false)
  private Instant sentAt = Instant.now();

  @Column(name = "read_at")
  private Instant readAt;

  public UUID getId() {
    return id;
  }

  public UUID getThreadId() {
    return threadId;
  }

  public UUID getSenderId() {
    return senderId;
  }

  public String getBody() {
    return body;
  }

  public Instant getSentAt() {
    return sentAt;
  }

  public Instant getReadAt() {
    return readAt;
  }

  public void setThreadId(UUID threadId) {
    this.threadId = threadId;
  }

  public void setSenderId(UUID senderId) {
    this.senderId = senderId;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public void setReadAt(Instant readAt) {
    this.readAt = readAt;
  }
}
