import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '../api/notifications';
import { GlassBackdrop, GlassCard, palette } from '../components/theme';
import { useSession, type Session } from '../auth/session';
import { notificationRoute } from '../notifications/navigation';
import { forNotificationAccount } from '../notifications/session';

function formatTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function getIconForType(type: string): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
} {
  switch (type) {
    case 'QUOTE_RECEIVED':
      return {
        name: 'cash-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    case 'QUOTE_ACCEPTED':
      return {
        name: 'checkmark-circle-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    case 'QUOTE_REJECTED':
      return {
        name: 'close-circle-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    case 'BOOKING_CONFIRMED':
      return {
        name: 'calendar-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    case 'BOOKING_CANCELLED':
      return {
        name: 'alert-circle-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    case 'WORK_AVAILABLE':
      return {
        name: 'briefcase-outline',
        color: '#202326',
        bgColor: '#E5E7EB',
      };
    default:
      return {
        name: 'notifications-outline',
        color: '#202326',
        bgColor: '#FFFFFF',
      };
  }
}

export default function NotificationsScreen() {
  const session = useSession((s) => s.session);
  return session ? (
    <AccountNotifications key={session.userId} session={session} />
  ) : null;
}

function AccountNotifications({ session }: { session: Session }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['notifications-list', session?.userId],
    queryFn: () =>
      forNotificationAccount(session.userId, () => getNotifications(50, 0)),
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      forNotificationAccount(session.userId, () => markNotificationAsRead(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications-list', session?.userId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count', session?.userId],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      forNotificationAccount(session.userId, markAllNotificationsAsRead),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications-list', session?.userId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count', session?.userId],
      });
    },
  });

  const openNotification = useMutation({
    mutationFn: async (item: NotificationItem) => {
      const route = await forNotificationAccount(session.userId, () =>
        notificationRoute(item, session),
      );
      if (!item.readAt) await markReadMutation.mutateAsync(item.id);
      if (useSession.getState().session?.userId === session.userId)
        router.push(route as never);
    },
  });
  const actionError = markReadMutation.isError
    ? 'Could not mark this notification as read. Tap it to retry.'
    : markAllMutation.isError
      ? 'Could not mark all notifications as read. Please retry.'
      : openNotification.isError
        ? 'This update could not be opened. It may no longer be accessible. Check your connection and try again.'
        : '';

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GlassBackdrop />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#202326" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            disabled={markAllMutation.isPending}
            onPress={() => {
              markReadMutation.reset();
              openNotification.reset();
              markAllMutation.mutate();
            }}
            style={({ pressed }) => [
              styles.markAllButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {!!actionError && (
        <Text
          accessibilityRole="alert"
          style={{ color: '#202326', padding: 16 }}
        >
          {actionError}
        </Text>
      )}
      {/* List */}
      {isError ? (
        <View style={styles.centerContainer}>
          <Text accessibilityRole="alert">
            Could not load notifications. Check your connection.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry notifications"
            onPress={() => {
              void refetch();
            }}
          >
            <Text style={styles.markAllText}>Retry</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            accessibilityLabel="Loading notifications"
            size="large"
            color="#202326"
          />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="notifications-off-outline"
              size={40}
              color="#202326"
            />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            When workers send quotes, accept work, or new matching jobs appear,
            updates will arrive here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#202326"
            />
          }
          renderItem={({ item, index }) => {
            const isUnread = !item.readAt;
            const iconConfig = getIconForType(item.type);

            const group =
              new Date(item.createdAt).toDateString() ===
              new Date().toDateString()
                ? 'Today'
                : 'Earlier';
            const previousGroup =
              index > 0 &&
              new Date(
                notifications[index - 1]?.createdAt ?? '',
              ).toDateString() === new Date().toDateString()
                ? 'Today'
                : 'Earlier';
            return (
              <View>
                {(index === 0 || group !== previousGroup) && (
                  <Text
                    accessibilityRole="header"
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: palette.ink,
                      marginVertical: 12,
                    }}
                  >
                    {group}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  disabled={
                    openNotification.isPending || markAllMutation.isPending
                  }
                  onPress={() => {
                    markReadMutation.reset();
                    markAllMutation.reset();
                    openNotification.mutate(item);
                  }}
                  style={({ pressed }) => [
                    styles.cardWrapper,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <GlassCard
                    style={{
                      padding: 16,
                      borderWidth: 0,
                      borderColor: isUnread ? '#E5E7EB' : '#FFFFFF',
                      backgroundColor: isUnread ? '#E5E7EB' : '#FFFFFF',
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: iconConfig.bgColor },
                        ]}
                      >
                        <Ionicons
                          name={iconConfig.name}
                          size={20}
                          color={iconConfig.color}
                        />
                      </View>

                      <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isUnread && styles.unreadTitle,
                            ]}
                          >
                            {item.title}
                          </Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.timestamp}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.messageText}>{item.message}</Text>
                  </GlassCard>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 12,
    minHeight: 48,
    minWidth: 48,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#202326',
    fontWeight: '600',
    marginTop: 2,
  },
  markAllButton: {
    paddingVertical: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#202326',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.muted,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#202326',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCC25',
  },
  timestamp: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#202326',
    marginLeft: 48,
  },
});
