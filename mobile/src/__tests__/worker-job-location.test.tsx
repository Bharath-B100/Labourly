import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react-native';
import Jobs from '../app/(worker)/opportunities';
import { getOpportunities } from '../api/marketplace';
import { currentSearchLocation } from '../location/currentSearchLocation';
jest.mock('../api/marketplace', () => ({ getOpportunities: jest.fn() }));
jest.mock('../location/currentSearchLocation', () => ({
  currentSearchLocation: jest.fn(),
}));
jest.mock('../auth/session', () => ({
  useSession: (selector: any) =>
    selector({ session: { userId: 'worker-test' } }),
}));
jest.mock('../components/theme', () => ({ GlassBackdrop: () => null }));
jest.mock('../components/NotificationBell', () => ({
  NotificationBell: () => null,
}));
jest.mock('../components/RequirementCard', () => ({
  RequirementCard: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (fn: any) => jest.requireActual('react').useEffect(fn, [fn]),
}));
jest.mock('../components/ui', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    Action: ({ label, onPress, disabled }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          void onPress();
        }}
        disabled={disabled}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
    Select: ({ label, options, onChange, disabled }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => onChange(options[0].value)}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});
beforeEach(() => {
  jest.clearAllMocks();
  (getOpportunities as jest.Mock).mockResolvedValue({ items: [], total: 0 });
});
afterEach(async () => {
  await cleanup();
});
test('initial search truthfully uses saved coverage, not live GPS', async () => {
  await render(<Jobs />);
  await waitFor(() =>
    expect(getOpportunities).toHaveBeenCalledWith(0, 20, undefined),
  );
  expect(screen.getByText('All your saved service areas')).toBeTruthy();
  expect(currentSearchLocation).not.toHaveBeenCalled();
});
test('current location filters backend and resetting restores coverage', async () => {
  (currentSearchLocation as jest.Mock).mockResolvedValue({
    latitude: 12,
    longitude: 77,
  });
  await render(<Jobs />);
  await fireEvent.press(screen.getByText('Change location'));
  await fireEvent.press(screen.getByText('Use my current location'));
  await waitFor(() =>
    expect(getOpportunities).toHaveBeenLastCalledWith(
      0,
      20,
      expect.objectContaining({ lat: 12, lng: 77, radiusKm: 30 }),
    ),
  );
  expect(screen.getByText(/Phone location \(12.000, 77.000\)/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Change location'));
  await fireEvent.press(screen.getByText('Use all my service areas'));
  await waitFor(() =>
    expect(getOpportunities).toHaveBeenLastCalledWith(0, 20, undefined),
  );
});
test('GPS failure retains current search and offers manual selection', async () => {
  (currentSearchLocation as jest.Mock).mockRejectedValue(
    new Error('Permission denied'),
  );
  await render(<Jobs />);
  await fireEvent.press(screen.getByText('Change location'));
  await fireEvent.press(screen.getByText('Use my current location'));
  await waitFor(() =>
    expect(screen.getByText('Permission denied')).toBeTruthy(),
  );
  expect(screen.getByText('All your saved service areas')).toBeTruthy();
  expect(screen.getByText('Search selected city')).toBeTruthy();
  expect(getOpportunities).toHaveBeenCalledTimes(1);
});

test('manual city selection sends catalogue coordinates and ignores late GPS', async () => {
  let finishGps!: (point: { latitude: number; longitude: number }) => void;
  (currentSearchLocation as jest.Mock).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishGps = resolve;
      }),
  );
  await render(<Jobs />);
  await fireEvent.press(screen.getByText('Change location'));
  await fireEvent.press(screen.getByText('Use my current location'));
  await fireEvent.press(screen.getByRole('button', { name: 'State' }));
  await fireEvent.press(screen.getByRole('button', { name: 'City' }));
  await fireEvent.press(screen.getByText('Search selected city'));
  const { indiaStates, citiesForState } = jest.requireActual(
    '../location/indiaCities',
  );
  const city = citiesForState(indiaStates[0].code)[0];
  await waitFor(() =>
    expect(getOpportunities).toHaveBeenLastCalledWith(
      0,
      20,
      expect.objectContaining({
        lat: city.latitude,
        lng: city.longitude,
        radiusKm: 30,
      }),
    ),
  );
  await act(async () => finishGps({ latitude: 0, longitude: 0 }));
  expect(
    screen.getByText(new RegExp(city.name + ', .*city centre')),
  ).toBeTruthy();
  expect(getOpportunities).toHaveBeenCalledTimes(2);
});

test('network failure offers retry using the same search', async () => {
  (getOpportunities as jest.Mock).mockRejectedValueOnce(
    new Error('Network unavailable'),
  );
  await render(<Jobs />);
  await waitFor(() =>
    expect(screen.getByText('Network unavailable')).toBeTruthy(),
  );
  await fireEvent.press(screen.getByText('Retry'));
  await waitFor(() => expect(screen.getByText('No jobs found')).toBeTruthy());
  expect(getOpportunities).toHaveBeenLastCalledWith(0, 20, undefined);
});
