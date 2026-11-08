import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatSafetyControls } from '../components/ChatSafetyControls';
import { useSession } from '../auth/session';
import { apiJson } from '../api/client';
jest.mock('../api/client', () => ({
  apiJson: jest.fn(),
  publicJson: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../components/ui', () => {
  const { Text, TextInput, Pressable } = jest.requireActual('react-native');
  return {
    Input: ({ label, ...p }: any) => (
      <TextInput accessibilityLabel={label} {...p} />
    ),
    Action: ({ label, onPress, disabled }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});
const clients: QueryClient[] = [];
beforeEach(() => {
  jest.clearAllMocks();
  useSession.setState({
    session: {
      userId: 'test-a',
      phone: '',
      fullName: 'Test',
      roles: ['CUSTOMER'],
      onboardingState: 'COMPLETED',
      onboardingStep: null,
    },
  });
  jest
    .mocked(apiJson)
    .mockResolvedValue({ blockedByMe: false, messagingBlocked: false });
});
afterEach(async () => {
  await cleanup();
  clients.splice(0).forEach((c) => c.clear());
});
async function mount() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  await render(
    <QueryClientProvider client={client}>
      <ChatSafetyControls threadId="thread-a" />
    </QueryClientProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Conversation safety' }),
  );
  await waitFor(() =>
    expect(screen.queryByText('Loading safety settings…')).toBeNull(),
  );
}
test('blocking calls real API and does not cancel a booking', async () => {
  await mount();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Block this conversation' }),
  );
  await waitFor(() =>
    expect(screen.getByText('Conversation preference saved.')).toBeTruthy(),
  );
  expect(apiJson).toHaveBeenCalledWith('/api/v1/chat/threads/thread-a/block', {
    method: 'PUT',
    body: JSON.stringify({ blocked: true }),
  });
  expect(
    jest
      .mocked(apiJson)
      .mock.calls.every((c) => !String(c[0]).includes('/cancel')),
  ).toBe(true);
});
test('report failure preserves reason and retry succeeds', async () => {
  await mount();
  jest.mocked(apiJson).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.changeText(
    screen.getByLabelText('Report reason'),
    'Fictional harassment report',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Send report to support' }),
  );
  await waitFor(() =>
    expect(screen.getByText(/Could not confirm the action/)).toBeTruthy(),
  );
  expect(screen.getByLabelText('Report reason').props.value).toBe(
    'Fictional harassment report',
  );
  jest
    .mocked(apiJson)
    .mockResolvedValue({ blockedByMe: false, messagingBlocked: false });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Send report to support' }),
  );
  await waitFor(() =>
    expect(screen.getByText(/Report received by support/)).toBeTruthy(),
  );
});
test('existing block exposes only own unblock action', async () => {
  jest
    .mocked(apiJson)
    .mockResolvedValue({ blockedByMe: true, messagingBlocked: true });
  await mount();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Unblock this conversation' }),
  );
  expect(apiJson).toHaveBeenCalledWith('/api/v1/chat/threads/thread-a/block', {
    method: 'PUT',
    body: JSON.stringify({ blocked: false }),
  });
});
