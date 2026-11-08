import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SupportRequests from '../app/support';
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
  const { Text, TextInput, Pressable, View } =
    jest.requireActual('react-native');
  return {
    Screen: View,
    Input: ({ label, ...props }: any) => (
      <TextInput accessibilityLabel={label} {...props} />
    ),
    Action: ({ label, onPress, disabled, loading }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || loading}
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
      userId: 'synthetic-a',
      phone: '',
      fullName: 'Test',
      roles: ['CUSTOMER'],
      onboardingState: 'COMPLETED',
      onboardingStep: null,
    },
  });
  jest.mocked(apiJson).mockResolvedValue([]);
});
afterEach(async () => {
  await cleanup();
  clients.splice(0).forEach((client) => client.clear());
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
      <SupportRequests />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.queryByText('Loading requests…')).toBeNull(),
  );
}
test('empty list and deletion require explicit confirmation', async () => {
  await mount();
  expect(screen.getByText('No requests yet.')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Request account deletion' }),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Request details'),
    'Please delete my data',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit request' }));
  expect(apiJson).toHaveBeenCalledTimes(1);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm I want to request deletion' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit request' }));
  await waitFor(() =>
    expect(screen.getByText(/Deletion request received/)).toBeTruthy(),
  );
  expect(apiJson).toHaveBeenCalledWith('/api/v1/support/requests', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'ACCOUNT_DELETION',
      details: 'Please delete my data',
    }),
  });
});
test('failed submission preserves details and supports retry', async () => {
  await mount();
  jest.mocked(apiJson).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.changeText(
    screen.getByLabelText('Request details'),
    'Booking help',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit request' }));
  await waitFor(() =>
    expect(screen.getByText(/Could not confirm submission/)).toBeTruthy(),
  );
  expect(screen.getByLabelText('Request details').props.value).toBe(
    'Booking help',
  );
  jest.mocked(apiJson).mockResolvedValue([]);
  await fireEvent.press(screen.getByRole('button', { name: 'Submit request' }));
  await waitFor(() =>
    expect(screen.getByText(/Support request received/)).toBeTruthy(),
  );
});
test('list failure exposes working retry', async () => {
  jest.mocked(apiJson).mockRejectedValueOnce(new Error('offline'));
  await mount();
  expect(screen.getByText('Could not load requests.')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry loading requests' }),
  );
  await waitFor(() =>
    expect(screen.getByText('No requests yet.')).toBeTruthy(),
  );
});
test('logged out screen never requests private data', async () => {
  useSession.setState({ session: null });
  await mount();
  expect(apiJson).not.toHaveBeenCalled();
  expect(screen.getByText('Sign in to manage your requests.')).toBeTruthy();
});
