import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingLifecycleControls } from '../components/BookingLifecycleControls';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
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
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    Action: ({ label, onPress, disabled, loading }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});
const clients: QueryClient[] = [];
const initial = {
  status: 'CONFIRMED',
  nextAction: 'START',
  confirmedByMe: false,
  confirmedByOther: false,
};
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
  jest.mocked(apiJson).mockResolvedValue(initial);
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
      <BookingLifecycleControls bookingId="booking-a" onChanged={jest.fn()} />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.queryByText('Loading progress…')).toBeNull(),
  );
}
test('first confirmation waits for other participant', async () => {
  await mount();
  jest.mocked(apiJson).mockResolvedValue({ ...initial, confirmedByMe: true });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm work has started' }),
  );
  await waitFor(() =>
    expect(screen.getByText('Your confirmation is recorded')).toBeTruthy(),
  );
  expect(screen.getByText('Status: CONFIRMED')).toBeTruthy();
  expect(apiJson).toHaveBeenCalledWith('/api/v1/bookings/booking-a/lifecycle', {
    method: 'POST',
    body: JSON.stringify({ action: 'START' }),
  });
});
test('failed confirmation permits retry without pretending status changed', async () => {
  await mount();
  jest.mocked(apiJson).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm work has started' }),
  );
  await waitFor(() =>
    expect(screen.getByText(/Could not confirm whether/)).toBeTruthy(),
  );
  expect(screen.getByText('Status: CONFIRMED')).toBeTruthy();
  jest.mocked(apiJson).mockResolvedValue({
    ...initial,
    status: 'IN_PROGRESS',
    nextAction: 'COMPLETE',
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm work has started' }),
  );
  await waitFor(() =>
    expect(screen.getByText('Status: IN PROGRESS')).toBeTruthy(),
  );
});
test('completed booking has no further confirmation action', async () => {
  jest.mocked(apiJson).mockResolvedValue({
    status: 'COMPLETED',
    nextAction: null,
    confirmedByMe: false,
    confirmedByOther: false,
  });
  await mount();
  expect(screen.getByText('Status: COMPLETED')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Confirm work/ })).toBeNull();
});
