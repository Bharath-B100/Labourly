import React, { useContext } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, QueryClientContext } from '@tanstack/react-query';
import { getUnreadCount } from '../api/notifications';
import { useSession } from '../auth/session';
import { forNotificationAccount } from '../notifications/session';

function NotificationBellContent() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const { data: unreadCount = 0, isError } = useQuery({
    queryKey: ['notifications-unread-count', session?.userId],
    queryFn: () => forNotificationAccount(session!.userId, getUnreadCount),
    enabled: !!session,
    retry: false,
    refetchInterval: 15_000,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isError
          ? 'Notifications, count unavailable'
          : `Notifications, ${unreadCount} unread`
      }
      onPress={() => router?.push?.('/notifications')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={24} color="#202326" />
      {!isError && unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function NotificationBell() {
  const session = useSession((state) => state.session);
  const isAuthenticated = !!session && session.onboardingState === 'COMPLETED';

  const client = useContext(QueryClientContext);

  if (!isAuthenticated || !client) return null;

  return <NotificationBellContent />;
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    position: 'relative',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#202326',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
