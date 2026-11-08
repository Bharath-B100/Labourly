import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import WorkerChat from '../app/(worker)/chat';
import CustomerChat from '../app/(customer)/chat';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ bookingId: 'isolated-booking' }),
}));
jest.mock('../components/LabourlyLiveChat', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    LabourlyLiveChat: ({
      initialBookingId,
      onGoToJobs,
      onGoToWorkers,
    }: any) => (
      <>
        <Text>{initialBookingId}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jobs"
          onPress={onGoToJobs}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Opportunities"
          onPress={onGoToWorkers}
        />
      </>
    ),
  };
});
afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});
test('worker chat preserves booking reference and routes only to worker destinations', async () => {
  await render(<WorkerChat />);
  expect(screen.getByText('isolated-booking')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Jobs' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(worker)/bookings');
  await fireEvent.press(screen.getByRole('button', { name: 'Opportunities' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(worker)/opportunities');
});

test('customer chat always renders the live route with the booking reference', async () => {
  await render(<CustomerChat />);
  expect(screen.getByText('isolated-booking')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Jobs' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(customer)/requirements');
  await fireEvent.press(screen.getByRole('button', { name: 'Opportunities' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(customer)/discover');
});
