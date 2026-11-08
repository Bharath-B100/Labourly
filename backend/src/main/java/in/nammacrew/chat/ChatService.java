package in.nammacrew.chat;

import in.nammacrew.booking.BookingDTOs;
import in.nammacrew.booking.BookingQueryService;
import in.nammacrew.user.UserRepository;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ChatService {

  private final ChatThreadRepository threads;
  private final ChatMessageRepository messages;
  private final BookingQueryService bookingQuery;
  private final UserRepository users;
  private final JdbcTemplate sql;

  public ChatService(
      ChatThreadRepository threads,
      ChatMessageRepository messages,
      BookingQueryService bookingQuery,
      UserRepository users,
      JdbcTemplate sql) {
    this.threads = threads;
    this.messages = messages;
    this.bookingQuery = bookingQuery;
    this.users = users;
    this.sql = sql;
  }

  private record WorkerTeamInfo(
      String workerType, String teamName, Integer teamSize, String tradeName) {}

  private WorkerTeamInfo getWorkerTeamInfo(UUID workerId) {
    try {
      return sql.queryForObject(
          "SELECT wp.worker_type, wp.team_name, wp.team_size, lc.name AS trade_name "
              + "FROM worker_profiles wp "
              + "LEFT JOIN labour_categories lc ON wp.primary_trade_id = lc.id "
              + "WHERE wp.user_id = ?",
          (rs, rowNum) ->
              new WorkerTeamInfo(
                  rs.getString("worker_type"),
                  rs.getString("team_name"),
                  rs.getObject("team_size") != null ? rs.getInt("team_size") : null,
                  rs.getString("trade_name")),
          workerId);
    } catch (Exception e) {
      return new WorkerTeamInfo("INDIVIDUAL", null, null, null);
    }
  }

  /** Get or create a chat thread for a booking */
  public ChatThread getOrCreateThread(UUID bookingId, UUID callerId) {
    // Authorize both first creation and retrieval of an existing thread.
    var booking =
        bookingQuery
            .getBookingForUser(bookingId, callerId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    // Serialize first-open requests across backend instances. The booking exists
    // before the thread, so it is a stable lock target; keep authorization first.
    sql.queryForList("SELECT id FROM bookings WHERE id = ? FOR UPDATE", bookingId);
    return threads
        .findByBookingId(bookingId)
        .orElseGet(
            () -> {
              var thread = new ChatThread();
              thread.setBookingId(bookingId);
              thread.setCustomerId(booking.customerId());
              thread.setWorkerId(booking.workerId());
              return threads.save(thread);
            });
  }

  /** List all threads for the calling user */
  @Transactional(readOnly = true)
  public List<ChatDTOs.ThreadSummary> listThreads(UUID callerId) {
    var userThreads = threads.findAllByParticipant(callerId);
    var result = new ArrayList<ChatDTOs.ThreadSummary>();

    for (var thread : userThreads) {
      boolean iAmCustomer = thread.getCustomerId().equals(callerId);
      UUID otherId = iAmCustomer ? thread.getWorkerId() : thread.getCustomerId();
      var teamInfo = getWorkerTeamInfo(thread.getWorkerId());

      // Instagram-style zero number sharing: NEVER leak phone number!
      String otherName =
          users
              .findById(otherId)
              .map(
                  u ->
                      (u.getDisplayName() != null && !u.getDisplayName().isBlank())
                          ? u.getDisplayName()
                          : (iAmCustomer ? "Assigned Worker" : "Customer"))
              .orElse(iAmCustomer ? "Assigned Worker" : "Customer");

      if (iAmCustomer
          && "TEAM".equalsIgnoreCase(teamInfo.workerType())
          && teamInfo.teamName() != null
          && !teamInfo.teamName().isBlank()) {
        otherName = teamInfo.teamName();
      }

      // Get last message
      var msgs = messages.findByThreadIdOrderBySentAtAsc(thread.getId());
      String lastBody = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getBody();
      Instant lastAt =
          msgs.isEmpty() ? thread.getCreatedAt() : msgs.get(msgs.size() - 1).getSentAt();

      long unread = messages.countByThreadIdAndSenderIdNotAndReadAtIsNull(thread.getId(), callerId);

      // Get requirement title from booking
      String reqTitle =
          bookingQuery
              .getBookingForUser(thread.getBookingId(), callerId)
              .map(BookingDTOs.BookingView::requirementTitle)
              .orElse("Booking");

      result.add(
          new ChatDTOs.ThreadSummary(
              thread.getId(),
              thread.getBookingId(),
              otherName,
              otherId,
              iAmCustomer ? "CUSTOMER" : "WORKER",
              reqTitle,
              lastBody,
              lastAt,
              unread,
              teamInfo.workerType(),
              teamInfo.teamName(),
              teamInfo.teamSize(),
              teamInfo.tradeName()));
    }
    return result;
  }

  /** Get messages in a thread */
  @Transactional
  public ChatDTOs.ThreadDetail getThreadMessages(UUID threadId, UUID callerId) {
    var thread =
        threads
            .findById(threadId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

    // Security: only participants can read
    boolean isParticipant =
        thread.getCustomerId().equals(callerId) || thread.getWorkerId().equals(callerId);
    if (!isParticipant)
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant");

    boolean iAmCustomer = thread.getCustomerId().equals(callerId);
    UUID otherId = iAmCustomer ? thread.getWorkerId() : thread.getCustomerId();
    var teamInfo = getWorkerTeamInfo(thread.getWorkerId());

    // Zero number sharing: strict fallback to role descriptor instead of phone
    String otherName =
        users
            .findById(otherId)
            .map(
                u ->
                    (u.getDisplayName() != null && !u.getDisplayName().isBlank())
                        ? u.getDisplayName()
                        : (iAmCustomer ? "Assigned Worker" : "Customer"))
            .orElse(iAmCustomer ? "Assigned Worker" : "Customer");

    if (iAmCustomer
        && "TEAM".equalsIgnoreCase(teamInfo.workerType())
        && teamInfo.teamName() != null
        && !teamInfo.teamName().isBlank()) {
      otherName = teamInfo.teamName();
    }

    String reqTitle =
        bookingQuery
            .getBookingForUser(thread.getBookingId(), callerId)
            .map(BookingDTOs.BookingView::requirementTitle)
            .orElse("Booking");

    // Mark received messages as read
    var allMessages = messages.findByThreadIdOrderBySentAtAsc(threadId);
    for (var msg : allMessages) {
      if (!msg.getSenderId().equals(callerId) && msg.getReadAt() == null) {
        msg.setReadAt(Instant.now());
        messages.save(msg);
      }
    }

    var userNames = new HashMap<UUID, String>();
    userNames.put(
        callerId,
        users
            .findById(callerId)
            .map(
                u ->
                    (u.getDisplayName() != null && !u.getDisplayName().isBlank())
                        ? u.getDisplayName()
                        : "Me")
            .orElse("Me"));
    userNames.put(otherId, otherName);

    var messageViews =
        allMessages.stream()
            .map(
                m ->
                    new ChatDTOs.MessageView(
                        m.getId(),
                        m.getSenderId(),
                        userNames.getOrDefault(m.getSenderId(), "Labourly User"),
                        m.getBody(),
                        m.getSentAt(),
                        m.getSenderId().equals(callerId) || m.getReadAt() != null))
            .toList();

    return new ChatDTOs.ThreadDetail(
        threadId,
        thread.getBookingId(),
        reqTitle,
        otherName,
        iAmCustomer ? "CUSTOMER" : "WORKER",
        teamInfo.workerType(),
        teamInfo.teamName(),
        teamInfo.teamSize(),
        teamInfo.tradeName(),
        messageViews);
  }

  /** Send a message */
  @Transactional
  public ChatDTOs.MessageView sendMessage(UUID threadId, UUID senderId, String body) {
    return sendMessage(threadId, senderId, body, null);
  }

  @Transactional
  public ChatDTOs.MessageView sendMessage(
      UUID threadId, UUID senderId, String body, String clientMessageId) {
    var thread =
        threads
            .findById(threadId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

    boolean isParticipant =
        thread.getCustomerId().equals(senderId) || thread.getWorkerId().equals(senderId);
    if (!isParticipant)
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant");

    if (body == null || body.isBlank() || body.length() > 2000)
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Message body must be 1–2000 characters");

    if (clientMessageId != null && !clientMessageId.matches("[A-Za-z0-9_-]{16,80}"))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid message retry identifier");
    // Serialize retries and block/send races across backend instances.
    sql.queryForList("SELECT id FROM chat_threads WHERE id=? FOR UPDATE", threadId);
    String senderName =
        users
            .findById(senderId)
            .map(
                u ->
                    (u.getDisplayName() != null && !u.getDisplayName().isBlank())
                        ? u.getDisplayName()
                        : "Me")
            .orElse("Me");

    if (clientMessageId != null) {
      var existing =
          sql.queryForList(
              "SELECT id,body,sent_at FROM chat_messages WHERE thread_id=? AND sender_id=? AND client_message_id=?",
              threadId,
              senderId,
              clientMessageId);
      if (!existing.isEmpty()) {
        var row = existing.getFirst();
        if (!body.trim().equals(row.get("body")))
          throw new ResponseStatusException(
              HttpStatus.CONFLICT, "Retry identifier already belongs to different message content");
        return new ChatDTOs.MessageView(
            (UUID) row.get("id"),
            senderId,
            senderName,
            (String) row.get("body"),
            ((java.sql.Timestamp) row.get("sent_at")).toInstant(),
            true);
      }
    }
    if (Boolean.TRUE.equals(
        sql.queryForObject(
            "SELECT EXISTS(SELECT 1 FROM chat_thread_blocks WHERE thread_id=?)",
            Boolean.class,
            threadId)))
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Messaging is blocked in this conversation. Contact support for booking issues.");

    var msg = new ChatMessage();
    msg.setThreadId(threadId);
    msg.setSenderId(senderId);
    msg.setBody(body.trim());
    msg.setClientMessageId(clientMessageId);
    msg = messages.save(msg);

    return new ChatDTOs.MessageView(
        msg.getId(), senderId, senderName, msg.getBody(), msg.getSentAt(), true);
  }
}
