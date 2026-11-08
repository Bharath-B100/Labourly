import { citiesForState } from '../location/indiaCities';
import { currentSearchLocation } from '../location/currentSearchLocation';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DiscoverScreen from '../app/(customer)/discover';
import { getTrades, searchWorkers } from '../api/marketplace';
jest.mock('../components/SaveWorkerButton', () => ({
  SaveWorkerButton: () => null,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../location/currentSearchLocation', () => ({
  currentSearchLocation: jest.fn(),
}));
jest.mock('../api/marketplace', () => ({
  getTrades: jest.fn(),
  searchWorkers: jest.fn(),
}));
let mockSearchParams: {
  tradeId?: string;
  cityId?: string;
  stateCode?: string;
} = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => mockSearchParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = {};
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
test('Home trade selection filters real location search using a catalogue identifier', async () => {
  mockSearchParams = { tradeId: 'carpenter-id' };
  jest
    .mocked(getTrades)
    .mockResolvedValue([
      { id: 'carpenter-id', code: 'CARPENTER', name: 'Carpenter', skills: [] },
    ]);
  await show();
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tradeId: 'carpenter-id',
        lat: 19.076,
        lng: 72.8777,
      }),
    ),
  );
});
test('unknown trade route parameter never reaches the worker search API', async () => {
  mockSearchParams = { tradeId: 'invalid-reference' };
  await show();
  expect(searchWorkers).toHaveBeenLastCalledWith(
    expect.objectContaining({ tradeId: undefined }),
  );
});
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

test('availability chips apply the server filter and All workers clears it', async () => {
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(searchWorkers).toHaveBeenCalled());
  await fireEvent.press(screen.getByRole('button', { name: 'Available' }));
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ availability: 'AVAILABLE' }),
    ),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'All workers' }));
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ availability: 'ALL' }),
    ),
  );
});

test('manual city selection interrupts pending GPS and ignores its late result', async () => {
  let resolve!: (value: { latitude: number; longitude: number }) => void;
  jest.mocked(currentSearchLocation).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(currentSearchLocation).toHaveBeenCalled());
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose a city instead' }),
  );
  await chooseState('Karnataka');
  await chooseCity('Bengaluru');
  await fireEvent.press(screen.getByRole('button', { name: 'Search Workers' }));
  await waitFor(() => expect(searchWorkers).toHaveBeenCalled());
  await act(async () => {
    resolve({ latitude: 19, longitude: 72 });
  });
  expect(searchWorkers).toHaveBeenLastCalledWith(
    expect.objectContaining({ lat: 12.97194, lng: 77.59369 }),
  );
  expect(searchWorkers).toHaveBeenCalledTimes(1);
});

test('workers pagination reaches later results and availability restarts at page zero', async () => {
  const worker = {
    id: 'fictional-worker',
    name: 'Test worker',
    workerType: 'INDIVIDUAL',
    trade: 'Carpenter',
    skills: [],
    experienceYears: 2,
    availability: 'AVAILABLE',
    city: 'Test city',
    district: 'Test district',
    state: 'Test state',
    verificationStatus: 'UNVERIFIED',
  };
  jest.mocked(searchWorkers).mockImplementation(async (params) => ({
    items: [{ ...worker, id: `worker-${params.page ?? 0}` }],
    total: 21,
    size: 20,
    page: params.page ?? 0,
  }));
  await render(
    <QueryClientProvider client={client}>
      <DiscoverScreen />
    </QueryClientProvider>,
  );
  await screen.findByRole('button', { name: 'Next workers' });
  await fireEvent.press(screen.getByRole('button', { name: 'Next workers' }));
  await screen.findByRole('button', { name: 'Previous workers' });
  expect(searchWorkers).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 }),
  );
  expect(screen.queryByRole('button', { name: 'Next workers' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Available' }));
  await waitFor(() =>
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, availability: 'AVAILABLE' }),
    ),
  );
});

test.each(['empty', 'error'])(
  'can return from a later %s worker page',
  async (outcome) => {
    const worker = {
      id: 'test-worker',
      name: 'Test worker',
      workerType: 'INDIVIDUAL',
      trade: 'Carpenter',
      skills: [],
      experienceYears: 1,
      availability: 'AVAILABLE',
      city: 'Test city',
      district: 'Test district',
      state: 'Test state',
      verificationStatus: 'UNVERIFIED',
    };
    jest.mocked(searchWorkers).mockImplementation(async (params) => {
      if (params.page === 1 && outcome === 'error')
        throw new Error('Connection interrupted');
      return {
        items: params.page === 1 ? [] : [worker],
        total: params.page === 1 ? 20 : 21,
        size: 20,
        page: params.page ?? 0,
      };
    });
    await render(
      <QueryClientProvider client={client}>
        <DiscoverScreen />
      </QueryClientProvider>,
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Next workers' }),
    );
    await screen.findByText(
      outcome === 'empty' ? 'No workers found' : 'Unable to load workers',
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Previous workers' }),
    );
    await screen.findByRole('button', { name: 'Next workers' });
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0 }),
    );
  },
);

test('Home canonical city reaches search without being overwritten by GPS', async () => {
  const city = citiesForState('33').find((c) => c.name === 'Krishnagiri');
  const selected =
    city || citiesForState('19').find((c) => c.name === 'Bengaluru')!;
  mockSearchParams = { cityId: selected.id, stateCode: selected.stateCode };
  await show();
  expect(currentSearchLocation).not.toHaveBeenCalled();
  expect(searchWorkers).toHaveBeenLastCalledWith(
    expect.objectContaining({
      cityId: selected.id,
      lat: selected.latitude,
      lng: selected.longitude,
    }),
  );
});

test('GPS outside India is never silently replaced with Bengaluru', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockResolvedValue({ latitude: 37.42, longitude: -122.08 });
  await show();
  expect(searchWorkers).toHaveBeenLastCalledWith(
    expect.objectContaining({ lat: 37.42, lng: -122.08, cityId: undefined }),
  );
});

test.each(['Carpenter', 'Electrician', 'Plumber'])(
  '%s opens a real trade-filtered list including unavailable workers',
  async (name) => {
    mockSearchParams = { tradeId: 'selected-trade' };
    jest
      .mocked(getTrades)
      .mockResolvedValue([
        { id: 'selected-trade', code: name.toUpperCase(), name, skills: [] },
      ]);
    jest.mocked(searchWorkers).mockResolvedValue({
      items: [
        {
          id: 'fictional-worker',
          name: 'Fictional Worker',
          trade: name,
          workerType: 'INDIVIDUAL',
          skills: [],
          experienceYears: 5,
          availability: 'UNAVAILABLE',
          district: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          verificationStatus: 'NOT_VERIFIED',
        },
      ],
      total: 1,
      page: 0,
      size: 20,
    });
    await render(
      <QueryClientProvider client={client}>
        <DiscoverScreen />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Currently unavailable')).toBeTruthy();
    expect(screen.getByText('Next available date not provided')).toBeTruthy();
    expect(screen.queryByText('4.8')).toBeNull();
    expect(screen.queryByText('Available tomorrow')).toBeNull();
    expect(searchWorkers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tradeId: 'selected-trade',
        availability: 'ALL',
      }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Filter Nearby' }),
    );
    await waitFor(() =>
      expect(searchWorkers).toHaveBeenLastCalledWith(
        expect.objectContaining({ nearby: true, radiusKm: 15 }),
      ),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Available' }));
    await waitFor(() =>
      expect(searchWorkers).toHaveBeenLastCalledWith(
        expect.objectContaining({ availability: 'AVAILABLE' }),
      ),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Filter Top Rated' }),
    );
    expect(screen.getByText('Ratings are not available yet')).toBeTruthy();
    expect(screen.queryByText('Fictional Worker')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Filter Verified' }),
    );
    expect(
      screen.getByText('Identity verification is not available yet'),
    ).toBeTruthy();
  },
);
