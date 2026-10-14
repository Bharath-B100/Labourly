import { citiesForState } from '../location/indiaCities';
import { currentSearchLocation } from '../location/currentSearchLocation';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DiscoverScreen from '../app/(customer)/discover';
import { getTrades, searchWorkers } from '../api/marketplace';
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../location/currentSearchLocation', () => ({
  currentSearchLocation: jest.fn(),
}));
jest.mock('../api/marketplace', () => ({
  getTrades: jest.fn(),
  searchWorkers: jest.fn(),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(currentSearchLocation)
    .mockResolvedValue({ latitude: 19.076, longitude: 72.8777 });
  jest.mocked(getTrades).mockResolvedValue([]);
  jest
    .mocked(searchWorkers)
    .mockResolvedValue({ items: [], total: 0, page: 0, size: 20 });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await cleanup();
  client.clear();
});
async function show() {
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await screen.findByText('No workers found');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose a city instead' }),
  );
}
async function chooseState(name: string) {
  await fireEvent.press(
    screen.getByRole('button', { name: /State \/ Union territory:/ }),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Search state / union territory'),
    name,
  );
  await fireEvent.press(screen.getByRole('radio', { name }));
}
async function chooseCity(name: string) {
  await fireEvent.press(screen.getByRole('button', { name: /City:/ }));
  await fireEvent.changeText(screen.getByLabelText('Search city'), name);
  await fireEvent.press(screen.getByRole('radio', { name }));
}
test('city selection filters by state and only searches after Search Workers', async () => {
  await show();
  expect(
    screen.getByRole('button', { name: 'City: Choose a state first' }),
  ).toBeDisabled();
  await chooseState('Karnataka');
  await chooseCity('Bengaluru');
  expect(searchWorkers).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Latitude')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Search Workers' }));
  const city = citiesForState('19').find((c) => c.name === 'Bengaluru')!;
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ lat: city.latitude, lng: city.longitude }),
    ),
  );
});
test('changing state clears the previous city and prevents stale-coordinate search', async () => {
  await show();
  await chooseState('Karnataka');
  await chooseCity('Bengaluru');
  await chooseState('Maharashtra');
  await fireEvent.press(screen.getByRole('button', { name: 'Search Workers' }));
  expect(
    screen.getByText(
      'Choose a city or use your current location before searching.',
    ),
  ).toBeTruthy();
  expect(searchWorkers).toHaveBeenCalledTimes(1);
  await fireEvent.press(
    screen.getByRole('button', { name: 'City: Choose a city' }),
  );
  await fireEvent.changeText(screen.getByLabelText('Search city'), 'Bengaluru');
  expect(screen.getByText('No options found.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search city'), 'Mumbai');
  await fireEvent.press(screen.getByRole('radio', { name: 'Mumbai' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Search Workers' }));
  const city = citiesForState('16').find((c) => c.name === 'Mumbai')!;
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ lat: city.latitude, lng: city.longitude }),
    ),
  );
});

test('autofills actual phone coordinates before requesting nearby workers', async () => {
  await show();
  expect(currentSearchLocation).toHaveBeenCalledTimes(1);
  expect(searchWorkers).toHaveBeenCalledWith(
    expect.objectContaining({ lat: 19.076, lng: 72.8777 }),
  );
  expect(screen.getByText('Current phone location')).toBeTruthy();
});
test('denied location never searches a default city and allows city selection', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockRejectedValue(new Error('Location permission was denied.'));
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await screen.findByText('Location permission was denied.');
  expect(searchWorkers).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose a city instead' }),
  );
  await chooseState('Karnataka');
  await chooseCity('Bengaluru');
  await fireEvent.press(screen.getByRole('button', { name: 'Search Workers' }));
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 12.97194, lng: 77.59369 }),
    ),
  );
});
test('retry uses a recovered phone location after a location error', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockRejectedValueOnce(new Error('Location unavailable'))
    .mockResolvedValue({ latitude: 13, longitude: 80 });
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await screen.findByText('Location unavailable');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Use my current location' }),
  );
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 13, lng: 80 }),
    ),
  );
  expect(screen.queryByText('Location unavailable')).toBeNull();
});

test('GPS search discloses limited coverage and offers city fallback', async () => {
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(
      screen.getByText(
        'GPS matches distance-based service areas only. Choose a city to include state, district and nationwide coverage.',
      ),
    ).toBeTruthy(),
  );
  expect(
    screen.getByRole('button', { name: 'Choose a city instead' }),
  ).toBeTruthy();
});
