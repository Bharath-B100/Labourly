import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export interface NotificationItem {
  id: string;
  section: 'today' | 'earlier';
  title: string;
  time: string;
  unread: boolean;
  badgeType:
    | 'avatar'
    | 'yellow_checkmark'
    | 'yellow_hardhat'
    | 'grey_briefcase'
    | 'grey_verified';
  avatarEmoji?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  // Today unread
  {
    id: 'notif-1',
    section: 'today',
    title: 'Ramesh Kumar accepted your booking request',
    time: '2 min ago',
    unread: true,
    badgeType: 'avatar',
    avatarEmoji: '👷🏾‍♂️',
  },
  {
    id: 'notif-2',
    section: 'today',
    title: 'Your payment of ₹1,800 was successful',
    time: '10 min ago',
    unread: true,
    badgeType: 'yellow_checkmark',
  },
  {
    id: 'notif-3',
    section: 'today',
    title: 'New workers available in Bengaluru for Mason',
    time: '1 hour ago',
    unread: true,
    badgeType: 'yellow_hardhat',
  },
  // Earlier read
  {
    id: 'notif-4',
    section: 'earlier',
    title: 'Shahid Ansari sent you a message',
    time: '5 Apr, 10:30 AM',
    unread: false,
    badgeType: 'avatar',
    avatarEmoji: '👷🏽‍♂️',
  },
  {
    id: 'notif-5',
    section: 'earlier',
    title: "Your project 'Office Renovation' starts tomorrow",
    time: '4 Apr, 6:00 PM',
    unread: false,
    badgeType: 'grey_briefcase',
  },
  {
    id: 'notif-6',
    section: 'earlier',
    title: 'New verified labourers near you',
    time: '3 Apr, 11:20 AM',
    unread: false,
    badgeType: 'grey_verified',
  },
];

export interface LabourlyNotificationsScreenProps {
  notifications?: NotificationItem[];
  onBack?: () => void;
  onNotificationPress?: (item: NotificationItem) => void;
}

export function LabourlyNotificationsScreen({
  notifications = DEFAULT_NOTIFICATIONS,
  onBack,
  onNotificationPress,
}: LabourlyNotificationsScreenProps) {
  const [items, setItems] = useState<NotificationItem[]>(notifications);

  const handlePress = (item: NotificationItem) => {
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
    onNotificationPress?.(item);
  };

  const todayItems = items.filter((n) => n.section === 'today');
  const earlierItems = items.filter((n) => n.section === 'earlier');

  const renderBadge = (item: NotificationItem) => {
    switch (item.badgeType) {
      case 'avatar':
        return (
          <View style={[styles.badgeBase, styles.badgeAvatar]}>
            <Text style={styles.badgeEmoji}>{item.avatarEmoji || '👷'}</Text>
          </View>
        );
      case 'yellow_checkmark':
        return (
          <View style={[styles.badgeBase, styles.badgeYellow]}>
            <Text style={styles.badgeGlyph}>✓</Text>
          </View>
        );
      case 'yellow_hardhat':
        return (
          <View style={[styles.badgeBase, styles.badgeYellow]}>
            <Text style={styles.badgeGlyph}>🪖</Text>
          </View>
        );
      case 'grey_briefcase':
        return (
          <View style={[styles.badgeBase, styles.badgeGrey]}>
            <Text style={styles.badgeGlyph}>💼</Text>
          </View>
        );
      case 'grey_verified':
        return (
          <View style={[styles.badgeBase, styles.badgeGrey]}>
            <Text style={styles.badgeGlyph}>🛡️</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Navigation Header */}
      <View style={styles.navBar}>
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
        <Text style={styles.navTitle}>Notifications</Text>
        <View style={styles.navSpacer} />
      </View>

      {/* Notifications Feed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Section */}
        {todayItems.length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.todayCardList}>
              {todayItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handlePress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.time}`}
                  style={({ pressed }) => [
                    styles.unreadCard,
                    !item.unread && styles.readCardBackground,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    {renderBadge(item)}
                    <View style={styles.itemTextContainer}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                  </View>
                  {item.unread && <View style={styles.unreadDot} />}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Earlier Section */}
        {earlierItems.length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Earlier</Text>
            <View style={styles.earlierRowList}>
              {earlierItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handlePress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.time}`}
                  style={({ pressed }) => [
                    styles.readRow,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    {renderBadge(item)}
                    <View style={styles.itemTextContainer}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.7)',
    backgroundColor: palette.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  backChevron: {
    fontSize: 28,
    color: palette.ink,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
  },
  navSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  sectionGroup: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
    paddingHorizontal: 2,
  },
  todayCardList: {
    gap: 10,
  },
  unreadCard: {
    backgroundColor: palette.grey,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readCardBackground: {
    backgroundColor: '#F8FAFC',
  },
  earlierRowList: {
    backgroundColor: palette.white,
  },
  readRow: {
    backgroundColor: palette.white,
    paddingVertical: 13,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.7)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeAvatar: {
    backgroundColor: '#CBD5E1',
  },
  badgeYellow: {
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeGrey: {
    backgroundColor: palette.grey,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeGlyph: {
    fontSize: 18,
    color: palette.ink,
    fontWeight: '800',
  },
  itemTextContainer: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: palette.ink,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.yellow,
    flexShrink: 0,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
