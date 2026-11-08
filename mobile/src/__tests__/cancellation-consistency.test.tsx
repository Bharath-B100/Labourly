import { AppState } from 'react-native';
import {
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react-native';
import MyQuotes from '../app/(worker)/schedule';
import CustomerDetails from '../app/(customer)/booking/[id]';
import WorkerDetails from '../app/(worker)/booking/[id]';
import { getMyQuotes, getBookingDetails } from '../api/quotations';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'booking' }),
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (cb: any) => jest.requireActual('react').useEffect(cb, [cb]),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../api/quotations', () => ({
  getMyQuotes: jest.fn(),
  getBookingDetails: jest.fn(),
  withdrawQuote: jest.fn(),
  cancelBooking: jest.fn(),
}));
afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});
const quote = {
  id: 'quote',
  requirementId: 'req',
  requirementTitle: 'Cancellation test',
  workerId: 'worker',
  workerName: 'Worker E',
  amount: 1000,
  currency: 'INR',
  pricingBasis: 'FIXED_TOTAL',
  startsAt: '2026-10-22T07:00:00Z',
  durationDays: 1,
  createdAt: '2026-10-08T08:00:00Z',
  status: 'ACCEPTED',
  bookingId: 'booking',
};
test.each(['CONFIRMED', 'CANCELLED', 'COMPLETED', null])(
  'accepted quote distinguishes current booking %s from historical acceptance',
  async (bookingStatus) => {
    jest.mocked(getMyQuotes).mockResolvedValue([{ ...quote, bookingStatus }]);
    await render(<MyQuotes />);
    await waitFor(() =>
      expect(screen.getByText('Quote: ACCEPTED')).toBeTruthy(),
    );
    expect(
      screen.getByText(`Booking status: ${bookingStatus ?? 'Unavailable'}`),
    ).toBeTruthy();
    if (bookingStatus === 'CANCELLED') {
      expect(screen.getByText('Booking cancelled')).toBeTruthy();
      expect(screen.queryByText(/Booking confirmed|Hired/)).toBeNull();
    }
    if (!bookingStatus)
      expect(screen.queryByText(/Booking confirmed|Hired/)).toBeNull();
  },
);
const booking = {
  ...quote,
  id: 'booking',
  status: 'CANCELLED',
  endsAt: '2026-10-23T07:00:00Z',
  cancelReason: 'Plans changed',
  cancelledByName: 'Fictional Test Customer',
  cancelledByRole: 'CUSTOMER' as const,
  cancelledAt: '2026-10-09T12:00:00Z',
};
test.each([CustomerDetails, WorkerDetails])(
  'authorized shared details renders reason, actor and timestamp',
  async (Details) => {
    jest.mocked(getBookingDetails).mockResolvedValue(booking);
    await render(<Details />);
    await waitFor(() => expect(screen.getByText('Plans changed')).toBeTruthy());
    expect(
      screen.getByText('Cancelled by: Customer (Fictional Test Customer)'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        `Cancelled at: ${new Date(booking.cancelledAt).toLocaleString('en-IN')}`,
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Cancel Booking')).toBeNull();
  },
);
test('older cancellation displays unavailable fields without inventing reasons', async () => {
  jest.mocked(getBookingDetails).mockResolvedValue({
    ...booking,
    cancelReason: null,
    cancelledByName: null,
    cancelledByRole: null,
    cancelledAt: null,
  });
  await render(<WorkerDetails />);
  await waitFor(() =>
    expect(
      screen.getByText('Reason unavailable for this older cancellation.'),
    ).toBeTruthy(),
  );
  expect(screen.getByText('Cancelled by: Unavailable')).toBeTruthy();
  expect(screen.getByText('Cancelled at: Unavailable')).toBeTruthy();
});
test('unaffected confirmed booking does not display cancellation information', async () => {
  jest.mocked(getBookingDetails).mockResolvedValue({
    ...booking,
    status: 'CONFIRMED',
    cancelReason: null,
    cancelledByName: null,
    cancelledByRole: null,
    cancelledAt: null,
  });
  await render(<CustomerDetails />);
  await waitFor(() => expect(screen.getByText('Cancel Booking')).toBeTruthy());
  expect(screen.queryByText('Cancellation reason')).toBeNull();
});

const originalAppState = AppState.currentState;
beforeAll(() => {
  AppState.currentState = 'active';
});
afterAll(() => {
  AppState.currentState = originalAppState;
});
