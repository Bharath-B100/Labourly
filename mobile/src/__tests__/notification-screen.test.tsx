import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationsScreen from '../app/notifications';
import { NotificationBell } from '../components/NotificationBell';
import { useSession, type Session } from '../auth/session';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '../api/notifications';
import { apiJson } from '../api/client';
import { getMyQuotes } from '../api/quotations';
import { notificationRoute } from '../notifications/navigation';
import {
  forNotificationAccount,
  observeNotificationAccount,
} from '../notifications/session';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../api/client', () => ({ apiJson: jest.fn() }));
jest.mock('../api/quotations', () => ({ getMyQuotes: jest.fn() }));
jest.mock('../api/notifications', () => ({
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));
const id = '11111111-1111-4111-8111-111111111111';
const session: Session = {
  userId: 'a',
  phone: '',
  fullName: 'Test',
  roles: ['WORKER'],
  onboardingState: 'COMPLETED',
  onboardingStep: null,
};
const item: NotificationItem = {
  id: 'note',
  userId: 'a',
  title: 'Test notification',
  message: 'Private A message',
  type: 'QUOTE_ACCEPTED',
  referenceId: id,
  readAt: null,
  createdAt: new Date().toISOString(),
};
let client: QueryClient;
let unsubscribe: () => void;
beforeEach(() => {
  jest.clearAllMocks();
  useSession.setState({ session, isLoading: false, error: null });
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  unsubscribe = observeNotificationAccount(client);
  jest
    .mocked(getNotifications)
    .mockResolvedValue({ items: [item], unreadCount: 1 });
  jest.mocked(getUnreadCount).mockResolvedValue(1);
  jest.mocked(markNotificationAsRead).mockResolvedValue();
  jest.mocked(markAllNotificationsAsRead).mockResolvedValue();
  jest.mocked(apiJson).mockResolvedValue({ status: 'OPEN' });
  jest.mocked(getMyQuotes).mockResolvedValue([{ requirementId: id }] as never);
});
afterEach(async () => {
  unsubscribe();
  await cleanup();
  client.clear();
});
const mount = () =>
  render(
    <QueryClientProvider client={client}>
      <NotificationBell />
      <NotificationsScreen />
    </QueryClientProvider>,
  );

test.each([
  ['QUOTE_RECEIVED', 'CUSTOMER', `/(customer)/requirement/${id}`],
  ['QUOTE_ACCEPTED', 'WORKER', `/(worker)/booking/${id}`],
  ['QUOTE_REJECTED', 'WORKER', '/(worker)/schedule'],
  ['WORK_AVAILABLE', 'WORKER', `/(worker)/opportunity/${id}`],
  ['BOOKING_CANCELLED', 'CUSTOMER', `/(customer)/booking/${id}`],
  ['BOOKING_CANCELLED', 'WORKER', `/(worker)/booking/${id}`],
  ['BOOKING_CONFIRMED', 'CUSTOMER', `/(customer)/booking/${id}`],
])('tap %s for %s opens authorized destination', async (type, role, route) => {
  useSession.setState({
    session: { ...session, roles: [role] as Session['roles'] },
  });
  jest
    .mocked(getNotifications)
    .mockResolvedValue({ items: [{ ...item, type }], unreadCount: 1 });
  await mount();
  await fireEvent.press(
    await screen.findByRole('button', { name: item.title }),
  );
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(route));
  expect(markNotificationAsRead).toHaveBeenCalledWith('note');
});

test.each([null, '../private', 'not-a-uuid'])(
  'invalid reference %s is safe',
  async (referenceId) => {
    await expect(
      notificationRoute({ ...item, referenceId }, session),
    ).rejects.toThrow();
    expect(apiJson).not.toHaveBeenCalled();
  },
);
test('wrong recipient and wrong role cannot resolve private destinations', async () => {
  await expect(
    notificationRoute({ ...item, userId: 'b' }, session),
  ).rejects.toThrow();
  await expect(
    notificationRoute({ ...item, type: 'QUOTE_RECEIVED' }, session),
  ).rejects.toThrow();
});
test('closed work and missing rejected quote have safe fallbacks', async () => {
  jest.mocked(apiJson).mockResolvedValue({ status: 'CLOSED' });
  await expect(
    notificationRoute({ ...item, type: 'WORK_AVAILABLE' }, session),
  ).rejects.toThrow('no longer open');
  jest.mocked(getMyQuotes).mockResolvedValue([]);
  await expect(
    notificationRoute({ ...item, type: 'QUOTE_REJECTED' }, session),
  ).rejects.toThrow('no longer available');
});
test('deleted or unauthorized booking displays safe error without navigating', async () => {
  jest.mocked(apiJson).mockRejectedValue(new Error('404'));
  await mount();
  await fireEvent.press(
    await screen.findByRole('button', { name: item.title }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /could not be opened/,
  );
  expect(mockPush).not.toHaveBeenCalled();
  expect(markNotificationAsRead).not.toHaveBeenCalled();
});
test('network failure is not empty; Retry loads the list', async () => {
  jest.mocked(getNotifications).mockRejectedValueOnce(new Error('offline'));
  await mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load/);
  expect(screen.queryByText('All caught up!')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry notifications' }),
  );
  expect(await screen.findByText('Private A message')).toBeTruthy();
});
test('loading and true empty state are distinct', async () => {
  let finish!: (value: {
    items: NotificationItem[];
    unreadCount: number;
  }) => void;
  jest.mocked(getNotifications).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await mount();
  expect(screen.getByLabelText('Loading notifications')).toBeTruthy();
  finish({ items: [], unreadCount: 0 });
  expect(await screen.findByText('All caught up!')).toBeTruthy();
});
test('read failure stays visible and retry synchronizes badge', async () => {
  jest
    .mocked(markNotificationAsRead)
    .mockRejectedValueOnce(new Error('offline'));
  await mount();
  await fireEvent.press(
    await screen.findByRole('button', { name: item.title }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Could not mark this/,
  );
  expect(mockPush).not.toHaveBeenCalled();
  jest.mocked(getUnreadCount).mockResolvedValue(0);
  jest.mocked(getNotifications).mockResolvedValue({
    items: [{ ...item, readAt: new Date().toISOString() }],
    unreadCount: 0,
  });
  await fireEvent.press(screen.getByRole('button', { name: item.title }));
  await waitFor(() => expect(mockPush).toHaveBeenCalled());
  expect(
    await screen.findByRole('button', { name: 'Notifications, 0 unread' }),
  ).toBeTruthy();
});
test('mark-all failure can retry without pretending success', async () => {
  jest
    .mocked(markAllNotificationsAsRead)
    .mockRejectedValueOnce(new Error('offline'));
  await mount();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Mark all as read' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Could not mark all/,
  );
  jest
    .mocked(getNotifications)
    .mockResolvedValue({ items: [], unreadCount: 0 });
  jest.mocked(getUnreadCount).mockResolvedValue(0);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Mark all as read' }),
  );
  expect(await screen.findByText('All caught up!')).toBeTruthy();
});
test('unread failure reports unavailable instead of zero', async () => {
  jest.mocked(getUnreadCount).mockRejectedValue(new Error('offline'));
  await mount();
  expect(
    await screen.findByRole('button', {
      name: 'Notifications, count unavailable',
    }),
  ).toBeTruthy();
});
test('account change rejects delayed results and removes old notification cache', async () => {
  client.setQueryData(['notifications-list', 'a'], { items: [item] });
  let finish!: (value: string) => void;
  const pending = forNotificationAccount(
    'a',
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const rejected = expect(pending).rejects.toThrow('Account changed');
  await act(async () => {
    useSession.setState({ session: { ...session, userId: 'b' } });
  });
  finish('old private result');
  await rejected;
  expect(client.getQueryData(['notifications-list', 'a'])).toBeUndefined();
});
test('logout hides notifications and clears cached content', async () => {
  await mount();
  await screen.findByText('Private A message');
  await act(async () => {
    useSession.setState({ session: null });
  });
  await waitFor(() =>
    expect(screen.queryByText('Private A message')).toBeNull(),
  );
  expect(client.getQueryData(['notifications-list', 'a'])).toBeUndefined();
});
