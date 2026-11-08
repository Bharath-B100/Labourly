import { apiFetch } from './client';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'QUOTE_RECEIVED'
    | 'QUOTE_ACCEPTED'
    | 'QUOTE_REJECTED'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_UPDATED'
    | 'WORK_AVAILABLE'
    | string;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function getNotifications(
  limit = 30,
  offset = 0,
): Promise<NotificationListResponse> {
  const res = await apiFetch(
    `/api/v1/notifications?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) {
    throw new Error('Failed to load notifications');
  }
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch('/api/v1/notifications/unread-count');
  if (!res.ok) {
    throw new Error('Could not load unread count');
  }
  const data: UnreadCountResponse = await res.json();
  return data.unreadCount ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/notifications/${id}/read`, {
    method: 'POST',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await apiFetch('/api/v1/notifications/read-all', {
    method: 'POST',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to mark all as read');
  }
}
