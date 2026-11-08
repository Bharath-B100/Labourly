import { AppState, Alert } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react-native';
import BookingsScreen from '../app/(customer)/bookings';
import BookingDetailsScreen from '../app/(customer)/booking/[id]';
import {
  getMyBookings,
  getBookingDetails,
  cancelBooking,
} from '../api/quotations';

jest.mock('expo-router', () => {
  return {
    useLocalSearchParams: () => ({ id: 'booking-1' }),
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (cb: any) => {
      const React = jest.requireActual<typeof import('react')>('react');
      React.useEffect(() => {
        const cleanup = cb();
        return () => {
          if (typeof cleanup === 'function') cleanup();
        };
      }, [cb]);
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../api/quotations', () => ({
  getMyBookings: jest.fn(),
  getBookingDetails: jest.fn(),
  cancelBooking: jest.fn(),
}));

const mockAlert = jest.spyOn(Alert, 'alert');
afterEach(async () => {
  await cleanup();
});

describe('Bookings List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockImplementation(() => {});
  });

  test('renders empty bookings state', async () => {
    (getMyBookings as jest.Mock).mockResolvedValue([]);
    await render(<BookingsScreen />);
    await waitFor(() =>
      expect(screen.getByText('No bookings yet')).toBeTruthy(),
    );
  });

  test('renders booking cards', async () => {
    (getMyBookings as jest.Mock).mockResolvedValue([
      {
        id: 'booking-1',
        requirementTitle: 'Fixing doors',
        workerName: 'Worker A',
        status: 'CONFIRMED',
        amount: 1500,
        pricingBasis: 'PER_DAY',
        startsAt: '2023-11-01T10:00:00Z',
        endsAt: '2023-11-03T10:00:00Z',
      },
    ]);

    await render(<BookingsScreen />);
    await waitFor(() => expect(screen.getByText('Fixing doors')).toBeTruthy());
    expect(screen.getByText('Worker A')).toBeTruthy();
  });
});

describe('Booking Details & Cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockImplementation(() => {});
  });

  test('renders details and shows cancellation UI', async () => {
    (getBookingDetails as jest.Mock).mockResolvedValue({
      id: 'booking-1',
      requirementTitle: 'Fixing doors',
      workerName: 'Worker A',
      status: 'CONFIRMED',
      amount: 1500,
      pricingBasis: 'PER_DAY',
      startsAt: '2023-11-01T10:00:00Z',
      endsAt: '2023-11-03T10:00:00Z',
    });

    await render(<BookingDetailsScreen />);
    await waitFor(() =>
      expect(screen.getByText('Booking Details')).toBeTruthy(),
    );
    expect(screen.getByText('Worker A')).toBeTruthy();

    await fireEvent.press(screen.getByText('Cancel Booking'));
    expect(screen.getByText('Confirm Cancel')).toBeTruthy();
  });

  test('validates cancellation reason and submits', async () => {
    (getBookingDetails as jest.Mock).mockResolvedValue({
      id: 'booking-1',
      requirementTitle: 'Fixing doors',
      workerName: 'Worker A',
      status: 'CONFIRMED',
      amount: 1500,
      pricingBasis: 'PER_DAY',
      startsAt: '2023-11-01T10:00:00Z',
      endsAt: '2023-11-03T10:00:00Z',
    });

    await render(<BookingDetailsScreen />);
    await waitFor(() =>
      expect(screen.getByText('Cancel Booking')).toBeTruthy(),
    );

    await fireEvent.press(screen.getByText('Cancel Booking'));

    // empty reason validation
    await fireEvent.press(screen.getByText('Confirm Cancel'));
    expect(mockAlert).toHaveBeenCalledWith(
      'Required',
      'Please provide a reason for cancellation',
    );
    mockAlert.mockClear();

    // fill reason
    await fireEvent(
      screen.getByPlaceholderText('Reason for cancellation...'),
      'onChangeText',
      'Plans changed',
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue('Plans changed')).toBeTruthy(),
    );

    mockAlert.mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    (cancelBooking as jest.Mock).mockResolvedValue({});

    await fireEvent.press(screen.getByText('Confirm Cancel'));

    await waitFor(() =>
      expect(cancelBooking).toHaveBeenCalledWith('booking-1', 'Plans changed'),
    );
  });
});

const originalAppState = AppState.currentState;
beforeAll(() => {
  AppState.currentState = 'active';
});
afterAll(() => {
  AppState.currentState = originalAppState;
});
