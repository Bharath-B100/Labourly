import { useSession } from '../auth/session';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatThreads,
  getChatThread,
  sendChatMessage,
  openChatForBooking,
} from '../api/chat';
import { getMyBookings } from '../api/quotations';
import { palette, GlassCard, glassSurface } from './theme';
import { Action } from './ui';
import { ChatSafetyControls } from './ChatSafetyControls';

export interface LabourlyLiveChatProps {
  initialBookingId?: string;
  onGoToJobs?: () => void;
  onGoToWorkers?: () => void;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function LabourlyLiveChat(props: LabourlyLiveChatProps) {
  const userId = useSession((state) => state.session?.userId);
  return (
    <AccountChat key={userId || 'signed-out'} {...props} accountId={userId} />
  );
}
function AccountChat({
  initialBookingId,
  accountId,
  onGoToJobs,
  onGoToWorkers,
}: LabourlyLiveChatProps & { accountId?: string }) {
  const [activeTab, setActiveTab] = useState<'messages' | 'assistant'>(
    'messages',
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);

  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const sending = useRef(false);
  const retryMessage = useRef<{
    threadId: string;
    body: string;
    clientMessageId: string;
  } | null>(null);
  const currentThread = useRef(activeThreadId);
  useEffect(() => {
    currentThread.current = activeThreadId;
  }, [activeThreadId]);

  // Assistant State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'This is an automated help guide with preset answers. It cannot check your bookings, contact support, or take actions for you.',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  // Threads list query
  const threadsQuery = useQuery({
    enabled: !!accountId,
    queryKey: ['chat-threads', accountId],
    queryFn: getChatThreads,
    refetchInterval: 6000,
  });

  // Bookings query (fallback to start new chats)
  const bookingsQuery = useQuery({
    enabled: !!accountId,
    queryKey: ['chat-available-bookings', accountId],
    queryFn: getMyBookings,
    staleTime: 30_000,
  });

  // Active thread query
  const threadDetailQuery = useQuery({
    queryKey: ['chat-thread', accountId, activeThreadId],
    queryFn: () => (activeThreadId ? getChatThread(activeThreadId) : null),
    enabled: !!accountId && !!activeThreadId,
    refetchInterval: 3000,
  });

  // Auto-open thread if initialBookingId is provided
  useEffect(() => {
    let cancelled = false;
    if (initialBookingId && accountId) {
      void (async () => {
        try {
          const detail = await openChatForBooking(initialBookingId);
          if (cancelled || useSession.getState().session?.userId !== accountId)
            return;
          setActiveThreadId(detail.threadId);
          setActiveTab('messages');
        } catch {
          if (!cancelled)
            Alert.alert(
              'Unable to open chat',
              'The booking may be unavailable or the connection failed. Return to bookings and try again.',
            );
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [initialBookingId, accountId]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({
      threadId,
      body,
      clientMessageId,
    }: {
      threadId: string;
      body: string;
      clientMessageId: string;
    }) => {
      return sendChatMessage(threadId, body, clientMessageId);
    },
    onSuccess: (_response, variables) => {
      if (useSession.getState().session?.userId !== accountId) return;
      if (retryMessage.current?.clientMessageId === variables.clientMessageId)
        retryMessage.current = null;
      if (currentThread.current === variables.threadId)
        setMessageInput((current) =>
          current.trim() === variables.body ? '' : current,
        );
      void queryClient.invalidateQueries({
        queryKey: ['chat-thread', accountId, variables.threadId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['chat-threads', accountId],
      });
    },
    onError: () => {
      if (useSession.getState().session?.userId === accountId)
        Alert.alert(
          'Message not confirmed',
          'Your text has been kept. Check the conversation before retrying because the message may have reached the server.',
        );
    },
    onSettled: () => {
      sending.current = false;
    },
  });

  const handleSendMessage = () => {
    if (
      !messageInput.trim() ||
      !activeThreadId ||
      sending.current ||
      !threadDetailQuery.data ||
      threadDetailQuery.isError
    )
      return;
    if (messageInput.trim().length > 2000) {
      Alert.alert('Message too long', 'Please use 2000 characters or fewer.');
      return;
    }
    sending.current = true;
    const body = messageInput.trim();
    // Non-secret correlation key, retained on network failure for same-text retry.
    if (
      retryMessage.current?.threadId !== activeThreadId ||
      retryMessage.current.body !== body
    )
      retryMessage.current = {
        threadId: activeThreadId,
        body,
        clientMessageId: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`,
      };
    sendMutation.mutate(retryMessage.current);
  };

  const handleStartBookingChat = async (bookingId: string) => {
    try {
      const detail = await openChatForBooking(bookingId);
      if (useSession.getState().session?.userId !== accountId) return;
      setActiveThreadId(detail.threadId);
      void queryClient.invalidateQueries({
        queryKey: ['chat-threads', accountId],
      });
    } catch {
      Alert.alert(
        'Unable to open chat',
        'Please check your connection and try again.',
      );
    }
  };

  const startCall = (_type: 'voice' | 'video') => {
    Alert.alert(
      'Calling is not available yet',
      'Voice and video calls are not connected. You can send a text message in this booking chat.',
    );
  };

  const handleAssistantSend = useCallback(
    (customPrompt?: string) => {
      const prompt = (customPrompt || assistantInput).trim();
      if (!prompt) return;

      const userMsg: AssistantMessage = {
        id: String(Date.now()),
        sender: 'user',
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setAssistantMessages((prev) => [...prev, userMsg]);
      setAssistantInput('');

      setTimeout(() => {
        const lower = prompt.toLowerCase();
        let replyText = '';
        let action: { label: string; onPress: () => void } | undefined;

        if (
          lower.includes('bengaluru') ||
          lower.includes('coimbatore') ||
          lower.includes('location') ||
          lower.includes('tamil nadu')
        ) {
          replyText =
            'Choose a search location to find workers within their declared service coverage. GPS and city-centre searches do not prove district boundaries or identity verification.';
          action = onGoToWorkers
            ? { label: 'Explore Workers by Location', onPress: onGoToWorkers }
            : undefined;
        } else if (
          lower.includes('call') ||
          lower.includes('phone') ||
          lower.includes('video') ||
          lower.includes('number')
        ) {
          replyText =
            'Voice and video calling are not available yet. Booking participants can use text chat. Phone numbers are not automatically displayed.';
        } else if (
          lower.includes('team') ||
          lower.includes('crew') ||
          lower.includes('workers')
        ) {
          replyText =
            'Chat shows the saved team name and size when provided. Individual team member details are not available; messages are exchanged with the booking account.';
        } else if (
          lower.includes('price') ||
          lower.includes('rate') ||
          lower.includes('cost') ||
          lower.includes('quotation')
        ) {
          replyText =
            'Workers provide transparent quotations. You can request fixed project pricing, per-day rates, or per-worker-per-day rates. Compare quotes freely before accepting!';
          action = onGoToJobs
            ? { label: 'Check My Jobs & Quotes', onPress: onGoToJobs }
            : undefined;
        } else {
          replyText =
            'This help guide has preset answers about locations, quotations and booking chat. It cannot look up live account information or send a support request.';
        }

        const botMsg: AssistantMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          action,
        };

        setAssistantMessages((prev) => [...prev, botMsg]);
      }, 450);
    },
    [assistantInput, onGoToJobs, onGoToWorkers],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Active Thread View (Chatting with a Worker or Team)
  // ─────────────────────────────────────────────────────────────────────────────
  if (activeThreadId) {
    const thread = threadDetailQuery.data;
    const messages = thread?.messages || [];
    const isTeam = thread?.workerType === 'TEAM' || Boolean(thread?.teamName);
    const teamSize = thread?.teamSize;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Thread Header with In-App Calling & Team Info */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            gap: 10,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to messages"
            onPress={() => setActiveThreadId(null)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={palette.ink} />
          </Pressable>

          {/* Avatar */}
          <Pressable
            onPress={() => setShowTeamModal(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: palette.yellow,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: palette.ink,
            }}
          >
            {isTeam ? (
              <Ionicons name="people" size={20} color={palette.ink} />
            ) : (
              <Text
                style={{ fontWeight: '800', color: palette.ink, fontSize: 16 }}
              >
                {thread?.otherUserName?.charAt(0) || 'W'}
              </Text>
            )}
          </Pressable>

          {/* Contact & Team Name */}
          <Pressable
            onPress={() => setShowTeamModal(true)}
            style={{ flex: 1, gap: 1 }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: palette.ink }}
                numberOfLines={1}
              >
                {thread?.otherUserName || 'Project Contact'}
              </Text>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#16A34A',
                }}
              />
            </View>
            <Text
              style={{ fontSize: 11, color: palette.muted }}
              numberOfLines={1}
            >
              {isTeam
                ? `${teamSize ? `Team of ${teamSize}` : 'Team size not provided'} · ${thread?.requirementTitle || 'Job'}`
                : `🛠️ ${thread?.tradeName || 'Worker'} · ${thread?.requirementTitle || 'Job'}`}
            </Text>
          </Pressable>

          {/* Action: Voice Call (Zero Number Sharing) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice Call"
            onPress={() => startCall('voice')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="call" size={19} color="#16A34A" />
          </Pressable>

          {/* Action: Video Call (Instagram-Style Zero Number Sharing) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Video Call"
            onPress={() => startCall('video')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="videocam" size={20} color="#2563EB" />
          </Pressable>

          {/* Action: Project & Team Roster */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View Team & Project Details"
            onPress={() => setShowTeamModal(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={palette.ink}
            />
          </Pressable>
        </View>

        {/* Security & Zero Number Sharing Notice Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 5,
            paddingHorizontal: 12,
            backgroundColor: '#FEF9C3',
            borderBottomWidth: 1,
            borderBottomColor: '#FDE047',
            gap: 6,
          }}
        >
          <Ionicons name="shield-checkmark" size={13} color="#854D0E" />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: '#854D0E',
            }}
          >
            Booking text chat · Voice and video unavailable
          </Text>
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          style={{ flex: 1, backgroundColor: '#F9FAFB' }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {!!thread && <ChatSafetyControls threadId={activeThreadId} />}
          {threadDetailQuery.isPending && (
            <ActivityIndicator
              size="small"
              color={palette.ink}
              style={{ marginTop: 20 }}
            />
          )}

          {threadDetailQuery.isError && (
            <View style={{ gap: 12 }}>
              <Text accessibilityRole="alert">
                Unable to load this conversation. Check your connection and
                booking access.
              </Text>
              <Action
                label="Retry conversation"
                onPress={() => {
                  void threadDetailQuery.refetch();
                }}
              />
            </View>
          )}
          {messages.length === 0 && !!thread && !threadDetailQuery.isError && (
            <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={palette.muted}
              />
              <Text
                style={{ color: palette.ink, fontWeight: '700', fontSize: 16 }}
              >
                Connected with {thread?.otherUserName || 'your worker'}
              </Text>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                Quotation accepted! You can send text messages about this
                booking. Voice and video calling are not available yet.
              </Text>
            </View>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === accountId;
            const isCallRecord =
              msg.body.startsWith('📞') || msg.body.startsWith('📹');

            // Specialized Call Record Card
            if (isCallRecord) {
              const isVideo = msg.body.startsWith('📹');
              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: 'center',
                    marginVertical: 4,
                    width: '88%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: isVideo ? '#EFF6FF' : '#F0FDF4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={isVideo ? 'videocam' : 'call'}
                      size={18}
                      color={isVideo ? '#2563EB' : '#16A34A'}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.ink,
                      }}
                    >
                      {msg.body}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: palette.muted }}>
                      In-app encrypted · Zero number shared
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => startCall(isVideo ? 'video' : 'voice')}
                    style={{
                      backgroundColor: palette.yellow,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: palette.ink,
                      }}
                    >
                      Call back
                    </Text>
                  </Pressable>
                </View>
              );
            }

            // Normal Text Message Bubble
            return (
              <View
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                {!isMe && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: palette.muted,
                      marginBottom: 2,
                      marginLeft: 4,
                    }}
                  >
                    {msg.senderName}
                  </Text>
                )}
                <View
                  style={{
                    backgroundColor: isMe ? palette.ink : palette.white,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: !isMe ? 4 : 18,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{
                      color: isMe ? palette.white : palette.ink,
                      fontSize: 15,
                      lineHeight: 21,
                    }}
                  >
                    {msg.body}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: palette.muted,
                    marginTop: 3,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    marginHorizontal: 4,
                  }}
                >
                  {new Date(msg.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Suggestions Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            maxHeight: 48,
          }}
        >
          {[
            '📍 Work location confirmed',
            '⏰ What time will you arrive?',
            '🛠️ Tools and materials ready',
            'When can you start?',
            'Please confirm the schedule',
          ].map((chip) => (
            <Pressable
              key={chip}
              onPress={() => setMessageInput(chip)}
              style={{
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text
                style={{ fontSize: 12, color: palette.ink, fontWeight: '500' }}
              >
                {chip}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            gap: 10,
          }}
        >
          <TextInput
            accessibilityLabel="Message text"
            maxLength={2000}
            placeholder="Type a message..."
            placeholderTextColor={palette.muted}
            value={messageInput}
            onChangeText={setMessageInput}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 100,
              backgroundColor: '#F3F4F6',
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              color: palette.ink,
            }}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={
              !messageInput.trim() ||
              sendMutation.isPending ||
              !thread ||
              threadDetailQuery.isError
            }
            onPress={handleSendMessage}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: messageInput.trim() ? palette.yellow : '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={palette.ink} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={messageInput.trim() ? palette.ink : palette.muted}
              />
            )}
          </Pressable>
        </View>

        {/* ─────────────────────────────────────────────────────────────────────────────
            OVERLAY: Fullscreen In-App Voice / Video Call (Instagram-Style Zero Number Sharing)
           ───────────────────────────────────────────────────────────────────────────── */}
        {showTeamModal && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 999,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
              },
            ]}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                gap: 16,
                maxHeight: '85%',
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: palette.ink,
                    }}
                  >
                    {isTeam ? 'Team & Work Info' : 'Craftsman Info'}
                  </Text>
                  <Text style={{ fontSize: 13, color: palette.muted }}>
                    {thread?.requirementTitle}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowTeamModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color={palette.ink} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ gap: 14 }}>
                {/* Leader / Primary Contact Card */}
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: palette.muted,
                    }}
                  >
                    PRIMARY CONTACT
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: palette.yellow,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '800',
                          color: palette.ink,
                        }}
                      >
                        {thread?.otherUserName?.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: palette.ink,
                        }}
                      >
                        {thread?.otherUserName}
                      </Text>
                      <Text style={{ fontSize: 13, color: palette.muted }}>
                        {isTeam
                          ? `Lead Contractor · ${thread?.tradeName || 'Specialist'}`
                          : `${thread?.tradeName || 'Craftsman'}`}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#DCFCE7',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: '#16A34A',
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        VERIFIED
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Team Roster (If team) */}
                {isTeam && (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.ink,
                      }}
                    >
                      {teamSize
                        ? `TEAM SIZE (${teamSize} Workers)`
                        : 'Team size not provided'}
                    </Text>
                    <Text style={{ color: palette.ink }}>
                      Individual team member details have not been provided.
                    </Text>
                  </View>
                )}

                {/* Zero Number Privacy Shield */}
                <View
                  style={{
                    backgroundColor: '#FEF9C3',
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#FDE047',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={16}
                      color="#854D0E"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: '#854D0E',
                      }}
                    >
                      Zero-Number Sharing Security
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#854D0E',
                      lineHeight: 18,
                    }}
                  >
                    To protect your privacy and security, personal phone numbers
                    are not automatically displayed. Share sensitive information
                    only when needed. Voice and video calling are not available
                    yet.
                  </Text>
                </View>
              </ScrollView>

              <Action
                label="Close Details"
                variant="secondary"
                onPress={() => setShowTeamModal(false)}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Main Chat Module (Tabs: Messages vs Assistant)
  // ─────────────────────────────────────────────────────────────────────────────
  const threads = threadsQuery.data || [];
  const bookings = bookingsQuery.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ fontSize: 26, fontWeight: '800', color: palette.ink }}
        >
          Chat & Support
        </Text>

        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            padding: 3,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('messages')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 10,
              backgroundColor:
                activeTab === 'messages' ? palette.yellow : 'transparent',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                fontSize: 14,
                color: palette.ink,
              }}
            >
              💬 Work Messages
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('assistant')}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 10,
              backgroundColor:
                activeTab === 'assistant' ? palette.yellow : 'transparent',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                fontSize: 14,
                color: palette.ink,
              }}
            >
              Help guide
            </Text>
          </Pressable>
        </View>
      </View>

      {/* TAB 1: WORK MESSAGES */}
      {activeTab === 'messages' && (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        >
          {threadsQuery.isPending && (
            <ActivityIndicator
              size="large"
              color={palette.ink}
              style={{ marginTop: 24 }}
            />
          )}

          {/* Active Threads List */}
          {threads.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: palette.muted,
                }}
              >
                ACTIVE CONVERSATIONS
              </Text>
              {threads.map((thread) => {
                const isTeam =
                  thread.workerType === 'TEAM' || Boolean(thread.teamName);
                return (
                  <Pressable
                    key={thread.threadId}
                    accessibilityRole="button"
                    accessibilityLabel={`Chat with ${thread.otherUserName}`}
                    onPress={() => setActiveThreadId(thread.threadId)}
                    style={[
                      glassSurface,
                      {
                        padding: 14,
                        borderRadius: 16,
                        backgroundColor: '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: palette.yellow,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isTeam ? (
                        <Ionicons name="people" size={24} color={palette.ink} />
                      ) : (
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: '800',
                            color: palette.ink,
                          }}
                        >
                          {thread.otherUserName.charAt(0)}
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1, gap: 3 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: palette.ink,
                          }}
                        >
                          {thread.otherUserName}
                        </Text>
                        <Text style={{ fontSize: 11, color: palette.muted }}>
                          {new Date(thread.lastMessageAt).toLocaleDateString(
                            [],
                            {
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.yellow,
                          fontWeight: '600',
                        }}
                        numberOfLines={1}
                      >
                        {isTeam ? '👥 ' : '🛠️ '}
                        {thread.requirementTitle}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: palette.muted }}
                        numberOfLines={1}
                      >
                        {thread.lastMessage || 'No messages yet. Tap to start.'}
                      </Text>
                    </View>

                    {thread.unreadCount > 0 && (
                      <View
                        style={{
                          backgroundColor: palette.ink,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: palette.white,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {thread.unreadCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Bookings available to chat */}
          {bookings.length > 0 && (
            <View style={{ gap: 10, marginTop: threads.length > 0 ? 12 : 0 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: palette.muted,
                }}
              >
                START CHAT FOR BOOKED PROJECTS
              </Text>
              {bookings.map((booking) => (
                <GlassCard key={booking.id} style={{ gap: 8, padding: 14 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: palette.ink,
                        flex: 1,
                      }}
                    >
                      {booking.requirementTitle}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#16A34A',
                        fontWeight: '700',
                      }}
                    >
                      {booking.status}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: palette.muted }}>
                    Worker: {booking.workerName} · ₹
                    {Number(booking.amount).toLocaleString('en-IN')}
                  </Text>
                  <Action
                    label={`💬 Chat with ${booking.workerName}`}
                    variant="secondary"
                    onPress={() => handleStartBookingChat(booking.id)}
                  />
                </GlassCard>
              ))}
            </View>
          )}

          {/* Empty State */}
          {threads.length === 0 &&
            bookings.length === 0 &&
            !threadsQuery.isPending && (
              <GlassCard
                style={{
                  gap: 14,
                  alignItems: 'center',
                  padding: 24,
                  marginTop: 12,
                }}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={palette.ink}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: palette.ink,
                    textAlign: 'center',
                  }}
                >
                  No active job conversations yet
                </Text>
                <Text
                  style={{
                    color: palette.muted,
                    textAlign: 'center',
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  Once a quotation is accepted and a project is booked, you can
                  send text messages to your workers or team directly here.
                </Text>
                <View style={{ width: '100%', gap: 12, marginTop: 12 }}>
                  {onGoToWorkers && (
                    <Action
                      label="Find & Book Workers"
                      onPress={onGoToWorkers}
                    />
                  )}
                  {onGoToJobs && (
                    <Action
                      label="View My Jobs & Quotes"
                      variant="secondary"
                      onPress={onGoToJobs}
                    />
                  )}
                </View>
              </GlassCard>
            )}
        </ScrollView>
      )}

      {/* TAB 2: ASSISTANT BOT */}
      {activeTab === 'assistant' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
            style={{ flex: 1, backgroundColor: '#F9FAFB' }}
          >
            {assistantMessages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isMe ? palette.ink : palette.white,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 18,
                      borderBottomRightRadius: isMe ? 4 : 18,
                      borderBottomLeftRadius: !isMe ? 4 : 18,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                      gap: 8,
                    }}
                  >
                    {!isMe && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color={palette.yellow}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: palette.muted,
                          }}
                        >
                          Labourly Assistant
                        </Text>
                      </View>
                    )}
                    <Text
                      style={{
                        color: isMe ? palette.white : palette.ink,
                        fontSize: 14.5,
                        lineHeight: 21,
                      }}
                    >
                      {msg.text}
                    </Text>
                    {msg.action && (
                      <Pressable
                        onPress={msg.action.onPress}
                        style={{
                          backgroundColor: palette.yellow,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          alignSelf: 'flex-start',
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            fontSize: 13,
                            color: palette.ink,
                          }}
                        >
                          {msg.action.label} →
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: palette.muted,
                      marginTop: 3,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      marginHorizontal: 4,
                    }}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick FAQ prompts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
              maxHeight: 48,
            }}
          >
            {[
              '📍 How does location matching work in Bengaluru/Coimbatore?',
              '📞 Can I call workers without sharing my phone number?',
              '👥 How do team bookings work?',
              '💰 How are quotations calculated?',
            ].map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => handleAssistantSend(prompt)}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: palette.ink,
                    fontWeight: '500',
                  }}
                >
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Assistant Input Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              gap: 10,
            }}
          >
            <TextInput
              placeholder="Ask the Labourly Assistant anything..."
              placeholderTextColor={palette.muted}
              value={assistantInput}
              onChangeText={setAssistantInput}
              onSubmitEditing={() => handleAssistantSend()}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 100,
                backgroundColor: '#F3F4F6',
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 15,
                color: palette.ink,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ask assistant"
              disabled={!assistantInput.trim()}
              onPress={() => handleAssistantSend()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: assistantInput.trim()
                  ? palette.yellow
                  : '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="send"
                size={18}
                color={assistantInput.trim() ? palette.ink : palette.muted}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
