import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notifications';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});

test('getNotifications returns items and unread count', async () => {
  jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      items: [
        {
          id: 'note-1',
          userId: 'user-1',
          title: 'New Quote',
          message: 'Worker Ramesh sent a quote',
          type: 'QUOTE_RECEIVED',
          referenceId: 'req-1',
          readAt: null,
          createdAt: '2026-10-13T10:00:00Z',
        },
      ],
      unreadCount: 1,
    }),
  } as Response);

  const res = await getNotifications();
  expect(res.items).toHaveLength(1);
  expect(res.items[0]?.title).toBe('New Quote');
  expect(res.unreadCount).toBe(1);
});

test('getUnreadCount returns integer count', async () => {
  jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ unreadCount: 3 }),
  } as Response);

  const count = await getUnreadCount();
  expect(count).toBe(3);
});

test('markNotificationAsRead and markAllNotificationsAsRead handle 204 response', async () => {
  jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 204,
  } as Response);

  await expect(markNotificationAsRead('note-1')).resolves.toBeUndefined();
  await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
});
