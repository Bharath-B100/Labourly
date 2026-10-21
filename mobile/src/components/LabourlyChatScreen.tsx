import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'worker';
  text?: string;
  time: string;
  type?: 'text' | 'location_card';
  locationData?: {
    location: string;
    workers: string;
    duration: string;
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'user',
    text: 'Hi! I need 3 masons for a residential project starting next week.',
    time: '10:20 AM',
    type: 'text',
  },
  {
    id: '2',
    sender: 'worker',
    text: 'Sure sir, I am available. Can you share the location and duration?',
    time: '10:22 AM',
    type: 'text',
  },
  {
    id: '3',
    sender: 'user',
    time: '10:24 AM',
    type: 'location_card',
    locationData: {
      location: 'Bengaluru, Karnataka',
      workers: '3 workers',
      duration: '2 weeks',
    },
  },
  {
    id: '4',
    sender: 'worker',
    text: 'Looks good. I can start from next Monday.',
    time: '10:25 AM',
    type: 'text',
  },
];

const QUICK_REPLIES = ['Are you available?', 'What is your rate?'];

export interface LabourlyChatScreenProps {
  workerName?: string;
  initialMessages?: ChatMessage[];
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onAttachment?: () => void;
  onSend?: (message: string) => void;
  onGoToJobs?: () => void;
  isUnavailable?: boolean;
}

export function LabourlyChatScreen({
  workerName,
  initialMessages,
  onBack,
  onCall,
  onVideoCall,
  onAttachment,
  onSend,
  onGoToJobs,
  isUnavailable = false,
}: LabourlyChatScreenProps) {
  const effectiveWorkerName =
    workerName ?? (isUnavailable ? 'Direct Messages' : 'Ramesh Kumar');
  const effectiveInitialMessages =
    initialMessages ?? (isUnavailable ? [] : INITIAL_MESSAGES);
  const [messages, setMessages] = useState<ChatMessage[]>(
    effectiveInitialMessages,
  );
  const [inputText, setInputText] = useState('');
  const msgCounter = useRef(100);

  const handleSendMessage = (textToSend?: string) => {
    if (isUnavailable) return;
    const content = (textToSend ?? inputText).trim();
    if (!content) return;

    msgCounter.current += 1;
    const newMsg: ChatMessage = {
      id: `msg-${msgCounter.current}`,
      sender: 'user',
      text: content,
      time: 'Just now',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    onSend?.(content);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            {!!onBack && (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.backChevron}>‹</Text>
              </Pressable>
            )}

            {/* Avatar with Hard Hat Badge */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👷🏾‍♂️</Text>
              </View>
            </View>

            {/* Worker Name & Online Status */}
            <View style={styles.workerMeta}>
              <Text style={styles.workerNameText}>{effectiveWorkerName}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.onlineDot,
                    isUnavailable && styles.dotUnavailable,
                  ]}
                />
                <Text style={styles.statusText}>
                  {isUnavailable ? 'Unavailable' : 'Online'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Icons */}
          <View style={styles.headerActions}>
            <Pressable
              onPress={isUnavailable ? undefined : onCall}
              accessibilityRole="button"
              accessibilityLabel={`Call ${effectiveWorkerName}`}
              disabled={isUnavailable}
              style={({ pressed }) => [
                styles.iconBtn,
                isUnavailable && styles.btnDisabledOpacity,
                pressed && !isUnavailable && styles.btnPressed,
              ]}
            >
              <Text style={styles.iconGlyph}>📞</Text>
            </Pressable>
            <Pressable
              onPress={isUnavailable ? undefined : onVideoCall}
              accessibilityRole="button"
              accessibilityLabel={`Video call ${effectiveWorkerName}`}
              disabled={isUnavailable}
              style={({ pressed }) => [
                styles.iconBtn,
                isUnavailable && styles.btnDisabledOpacity,
                pressed && !isUnavailable && styles.btnPressed,
              ]}
            >
              <Text style={styles.iconGlyph}>📹</Text>
            </Pressable>
          </View>
        </View>

        {/* Truthful Unavailable or Preview Banner */}
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerTitle}>
            {isUnavailable
              ? 'Messaging is not available yet'
              : 'Demonstration Preview'}
          </Text>
          <Text style={styles.demoBannerText}>
            {isUnavailable
              ? 'No messages can be sent in this version. You can manage existing quotations and bookings from Jobs.'
              : 'Direct in-app messaging, private voice and video calls are planned for an upcoming release. To coordinate work today, use Quotations and Bookings under Jobs.'}
          </Text>
          {isUnavailable && !!onGoToJobs && (
            <Pressable
              onPress={onGoToJobs}
              accessibilityRole="button"
              accessibilityLabel="Go to my jobs"
              style={({ pressed }) => [
                styles.goToJobsBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.goToJobsBtnText}>Go to my jobs</Text>
            </Pressable>
          )}
        </View>

        {/* Chat Feed (Concrete Grey #E5E7EB Background) */}
        <ScrollView
          style={styles.chatFeed}
          contentContainerStyle={styles.chatFeedContent}
          showsVerticalScrollIndicator={false}
        >
          {isUnavailable && messages.length === 0 ? (
            <View style={styles.emptyNoticeContainer}>
              <View style={styles.emptyNoticeCard}>
                <Text style={styles.emptyNoticeTitle}>
                  Direct Messaging In Development
                </Text>
                <Text style={styles.emptyNoticeBody}>
                  Direct messaging between contractors and workers is planned
                  for an upcoming release. Real-time delivery and push
                  notifications will be supported once the chat backend is
                  ready.
                </Text>
                <Text style={styles.emptyNoticeFooter}>
                  To coordinate work today, use Quotations and Bookings under
                  Jobs.
                </Text>
              </View>
            </View>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (msg.type === 'location_card' && msg.locationData) {
                return (
                  <View key={msg.id} style={[styles.msgRow, styles.msgRowUser]}>
                    <View style={styles.locationCard}>
                      {/* Simulated Map Visual */}
                      <View style={styles.mapVisual}>
                        <View style={styles.mapGridLine1} />
                        <View style={styles.mapGridLine2} />
                        <View style={styles.mapPinContainer}>
                          <View style={styles.mapPin}>
                            <View style={styles.mapPinHole} />
                          </View>
                        </View>
                      </View>
                      <Text style={styles.locationCaption}>
                        {msg.locationData.location} • {msg.locationData.workers}{' '}
                        • {msg.locationData.duration}
                      </Text>
                    </View>
                    <Text style={styles.msgTimeRight}>{msg.time}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    isUser ? styles.msgRowUser : styles.msgRowWorker,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleWorker,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isUser
                          ? styles.bubbleTextUser
                          : styles.bubbleTextWorker,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  <Text
                    style={isUser ? styles.msgTimeRight : styles.msgTimeLeft}
                  >
                    {msg.time}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Footer Area: Quick Replies + Message Bar */}
        <View style={styles.footerContainer}>
          {/* Quick-Reply Chips (hidden in unavailable mode) */}
          {!isUnavailable && (
            <View style={styles.quickRepliesRow}>
              {QUICK_REPLIES.map((reply) => (
                <Pressable
                  key={reply}
                  onPress={() => handleSendMessage(reply)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick reply: ${reply}`}
                  style={({ pressed }) => [
                    styles.quickReplyChip,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <Pressable
              onPress={isUnavailable ? undefined : onAttachment}
              accessibilityRole="button"
              accessibilityLabel="Add attachment"
              disabled={isUnavailable}
              style={({ pressed }) => [
                styles.attachBtn,
                isUnavailable && styles.btnDisabledOpacity,
                pressed && !isUnavailable && styles.btnPressed,
              ]}
            >
              <Text style={styles.attachGlyph}>📎</Text>
            </Pressable>

            <TextInput
              style={[
                styles.textInput,
                isUnavailable && styles.textInputDisabled,
              ]}
              value={isUnavailable ? '' : inputText}
              onChangeText={setInputText}
              placeholder={
                isUnavailable
                  ? 'Messaging is not available yet'
                  : 'Type a message...'
              }
              placeholderTextColor="#64748B"
              accessibilityLabel="Type a message"
              editable={!isUnavailable}
            />

            <Pressable
              onPress={isUnavailable ? undefined : () => handleSendMessage()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={isUnavailable}
              style={({ pressed }) => [
                styles.sendBtn,
                isUnavailable && styles.sendBtnDisabled,
                pressed && !isUnavailable && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.sendBtnText,
                  isUnavailable && styles.sendBtnTextDisabled,
                ]}
              >
                →
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: palette.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.8)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  backChevron: {
    fontSize: 26,
    color: palette.ink,
    fontWeight: '300',
    lineHeight: 28,
  },
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.grey,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  workerMeta: {
    justifyContent: 'center',
  },
  workerNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.yellow,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  iconGlyph: {
    fontSize: 18,
  },
  chatFeed: {
    flex: 1,
    backgroundColor: palette.grey,
  },
  chatFeedContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  msgRow: {
    maxWidth: '82%',
    marginBottom: 4,
  },
  msgRowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgRowWorker: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: palette.ink,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleWorker: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: palette.white,
    fontWeight: '500',
  },
  bubbleTextWorker: {
    color: palette.ink,
    fontWeight: '500',
  },
  msgTimeRight: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    paddingRight: 4,
    textAlign: 'right',
  },
  msgTimeLeft: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    paddingLeft: 4,
    textAlign: 'left',
  },
  locationCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 8,
    width: 250,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mapVisual: {
    width: '100%',
    height: 115,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGridLine1: {
    position: 'absolute',
    top: 40,
    left: -20,
    right: -20,
    height: 8,
    backgroundColor: '#CBD5E1',
    transform: [{ rotate: '-12deg' }],
  },
  mapGridLine2: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 100,
    width: 8,
    backgroundColor: '#CBD5E1',
    transform: [{ rotate: '15deg' }],
  },
  mapPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  mapPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 3,
  },
  mapPinHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.ink,
  },
  locationCaption: {
    marginTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
    fontSize: 13.5,
    fontWeight: '700',
    color: palette.ink,
    lineHeight: 18,
  },
  footerContainer: {
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    gap: 10,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickReplyChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachGlyph: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: palette.grey,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14.5,
    color: palette.ink,
    fontWeight: '500',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
    lineHeight: 20,
  },
  btnPressed: {
    opacity: 0.7,
  },
  demoBanner: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 3,
  },
  demoBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBannerText: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.ink,
    opacity: 0.85,
  },
  dotUnavailable: {
    backgroundColor: '#94A3B8',
  },
  btnDisabledOpacity: {
    opacity: 0.4,
  },
  goToJobsBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: palette.ink,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  goToJobsBtnText: {
    color: palette.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNoticeContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyNoticeCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    width: '100%',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 8,
  },
  emptyNoticeBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  emptyNoticeFooter: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.ink,
    lineHeight: 16,
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnTextDisabled: {
    color: '#94A3B8',
  },
});
