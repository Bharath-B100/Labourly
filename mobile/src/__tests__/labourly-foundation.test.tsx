import {
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { currentSearchLocation } from '../location/currentSearchLocation';
import { IntroCarousel } from '../components/IntroCarousel';
import { CustomerCategories } from '../onboarding/CustomerCategories';
import { ProfileSettings } from '../components/ProfileSettings';
import WorkerDetails from '../app/(customer)/worker/[id]';
import { LabourlyChatScreen } from '../components/LabourlyChatScreen';
import CustomerHome from '../app/(customer)/home';
import { useSession, type Session } from '../auth/session';
import { observeQueryAccount } from '../auth/queryIsolation';
import { getWorkerDetails, getTrades } from '../api/marketplace';
import { apiJson } from '../api/client';

jest.mock('../location/currentSearchLocation', () => ({
  currentSearchLocation: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('../components/SaveWorkerButton', () => ({
  SaveWorkerButton: () => null,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ id: 'fictional-worker' }),
}));
jest.mock('../api/client', () => ({
  apiJson: jest.fn(),
  publicJson: jest.fn(),
}));
jest.mock('../api/marketplace', () => ({
  getWorkerDetails: jest.fn(),
  getTrades: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
const customer: Session = {
  userId: 'fictional-customer',
  phone: '+919000000001',
  fullName: 'Fictional Customer',
  roles: ['CUSTOMER'],
  onboardingState: 'COMPLETED',
  onboardingStep: null,
};
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useSession.setState({ session: customer, isLoading: false, error: null });
});
afterEach(async () => {
  await cleanup();
  client.clear();
});
const mount = (element: React.ReactNode) =>
  render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);

test('intro can go back or skip without mutating saved onboarding', async () => {
  const next = jest.fn();
  await render(<IntroCarousel onContinue={next} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText('Your project.\nYour requirements.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Previous' }));
  expect(screen.getByText('Reliable people.\nStronger projects.')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Sign in or skip introduction' }),
  );
  expect(next).toHaveBeenCalledTimes(1);
  expect(apiJson).not.toHaveBeenCalled();
  expect(useSession.getState().session).toEqual(customer);
});

test('Engineer selects the existing category without granting a role', async () => {
  const change = jest.fn();
  await render(
    <CustomerCategories
      value="SITE_ENGINEER"
      options={[
        { code: 'CONTRACTOR', name: 'Contractor' },
        { code: 'SITE_ENGINEER', name: 'Site Engineer' },
        { code: 'ARCHITECT', name: 'Architect' },
        { code: 'OTHER', name: 'Other' },
      ]}
      onChange={change}
    />,
  );
  expect(
    screen.getByRole('radio', { name: 'Engineer' }).props.accessibilityState
      .checked,
  ).toBe(true);
  await fireEvent.press(screen.getByRole('radio', { name: 'Architect' }));
  expect(change).toHaveBeenCalledWith('ARCHITECT');
  await fireEvent.press(screen.getByRole('radio', { name: 'Engineer' }));
  expect(change).toHaveBeenLastCalledWith('SITE_ENGINEER');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Customer type: Site Engineer' }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Other' }));
  expect(change).toHaveBeenLastCalledWith('OTHER');
  expect(apiJson).not.toHaveBeenCalled();
  expect(useSession.getState().session?.roles).toEqual(['CUSTOMER']);
});

test('single-role profile does not offer an unauthorized worker switch', async () => {
  await mount(<ProfileSettings role="CUSTOMER" />);
  expect(screen.queryByRole('button', { name: 'Switch to worker' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit profile' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/edit-profile',
    params: { role: 'CUSTOMER' },
  });
  await fireEvent.press(screen.getByRole('button', { name: 'My bookings' }));
  expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings');
});

test('dual-role switch clears cached data and navigates without assigning roles', async () => {
  useSession.setState({
    session: { ...customer, roles: ['CUSTOMER', 'WORKER'] },
  });
  client.setQueryData(['private-list'], { owner: 'customer' });
  await mount(<ProfileSettings role="CUSTOMER" />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Switch to worker' }),
  );
  expect(mockReplace).toHaveBeenCalledWith('/(worker)/opportunities');
  expect(client.getQueryData(['private-list'])).toBeUndefined();
  expect(apiJson).not.toHaveBeenCalled();
});

test('worker profile retains service coverage and booking entry points', async () => {
  useSession.setState({ session: { ...customer, roles: ['WORKER'] } });
  await mount(<ProfileSettings role="WORKER" />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Service areas and availability' }),
  );
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/edit-profile',
    params: { role: 'WORKER' },
  });
  await fireEvent.press(screen.getByRole('button', { name: 'My bookings' }));
  expect(mockPush).toHaveBeenCalledWith('/(worker)/bookings');
});

test('logout still calls the session lifecycle and clears private cache', async () => {
  const original = useSession.getState().logout;
  const logout = jest.fn().mockResolvedValue(undefined);
  useSession.setState({ logout });
  try {
    client.setQueryData(['private-list'], ['private']);
    await mount(<ProfileSettings role="CUSTOMER" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(['private-list'])).toBeUndefined();
  } finally {
    useSession.setState({ logout: original });
  }
});

test('account observer removes all private cache on identity change, not profile refresh', () => {
  const stop = observeQueryAccount(client);
  try {
    client.setQueryData(['discovery'], ['private']);
    useSession.setState({
      session: { ...customer, fullName: 'Updated Fictional Customer' },
    });
    expect(client.getQueryData(['discovery'])).toEqual(['private']);
    useSession.setState({
      session: { ...customer, userId: 'different-fictional-account' },
    });
    expect(client.getQueryData(['discovery'])).toBeUndefined();
    client.setQueryData(['bookings'], ['private']);
    useSession.setState({ session: null });
    expect(client.getQueryData(['bookings'])).toBeUndefined();
  } finally {
    stop();
  }
});

test('worker details use real data and quotation CTA, never fabricated price or KYC', async () => {
  jest.mocked(getWorkerDetails).mockResolvedValue({
    id: 'fictional-worker',
    name: 'Example Worker',
    trade: 'Carpenter',
    skills: ['Furniture'],
    workerType: 'INDIVIDUAL',
    experienceYears: 3,
    availability: 'AVAILABLE',
    city: 'Example City',
    district: 'Example District',
    state: 'Example State',
    verificationStatus: 'APPROVED',
  });
  await mount(<WorkerDetails />);
  await waitFor(() => expect(screen.getByText('Example Worker')).toBeTruthy());
  expect(screen.getByText('Rates agreed by quotation')).toBeTruthy();
  expect(screen.queryByText('4.9')).toBeNull();
  expect(screen.queryByText('✓ Verified')).toBeNull();
  expect(screen.queryByRole('button', { name: /₹500/ })).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Post a requirement' }),
  );
  expect(mockPush).toHaveBeenCalledWith('/(customer)/post');
  expect(apiJson).not.toHaveBeenCalled();
});

test('standalone unavailable message retains a working marketplace route', async () => {
  await render(
    <LabourlyChatScreen
      onGoToJobs={() => mockPush('/(customer)/requirements')}
    />,
  );
  expect(screen.getByText('Messaging is not available yet')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Go to my jobs' }));
  expect(mockPush).toHaveBeenCalledWith('/(customer)/requirements');
});

test('Home displays server trades and opens their worker search without fabricating catalogue data', async () => {
  jest
    .mocked(getTrades)
    .mockResolvedValue([
      { id: 'server-trade', code: 'MASON', name: 'Mason', skills: [] },
    ]);
  await mount(<CustomerHome />);
  const tile = await screen.findByRole('button', {
    name: 'Find Mason workers',
  });
  expect(screen.queryByText('Plumber')).toBeNull();
  await fireEvent.press(tile);
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(customer)/discover',
    params: { tradeId: 'server-trade' },
  });
});

test('Home catalogue failure provides a working retry', async () => {
  jest
    .mocked(getTrades)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce([]);
  await mount(<CustomerHome />);
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Retry trades' }),
  );
  expect(await screen.findByText('No trades are available yet.')).toBeTruthy();
});

test('Home search filters the server catalogue and clear restores all trades', async () => {
  jest.mocked(getTrades).mockResolvedValue([
    { id: 'mason', code: 'MASON', name: 'Mason', skills: [] },
    { id: 'carpenter', code: 'CARPENTER', name: 'Carpenter', skills: [] },
  ]);
  await mount(<CustomerHome />);
  await screen.findByRole('button', { name: 'Find Carpenter workers' });
  await fireEvent.changeText(screen.getByLabelText('Search trades'), 'carp');
  expect(
    screen.queryByRole('button', { name: 'Find Mason workers' }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Find Carpenter workers' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(customer)/discover',
    params: { tradeId: 'carpenter' },
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(
    screen.getByRole('button', { name: 'Find Mason workers' }),
  ).toBeTruthy();
});

test('Home location selection is passed with the trade to discovery', async () => {
  jest
    .mocked(getTrades)
    .mockResolvedValue([
      { id: 'carpenter', code: 'CARPENTER', name: 'Carpenter', skills: [] },
    ]);
  await mount(<CustomerHome />);
  await screen.findByRole('button', { name: 'Find Carpenter workers' });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose work location' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: /State \/ Union territory:/ }),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Search state / union territory'),
    'Karnataka',
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Karnataka' }));
  await fireEvent.press(screen.getByRole('button', { name: /City:/ }));
  await fireEvent.changeText(screen.getByLabelText('Search city'), 'Bengaluru');
  await fireEvent.press(screen.getByRole('radio', { name: 'Bengaluru' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Find Carpenter workers' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(customer)/discover',
    params: { tradeId: 'carpenter', stateCode: '19', cityId: '1277333' },
  });
});

test('a delayed automatic GPS response cannot override a manually chosen city', async () => {
  let finish!: (point: { latitude: number; longitude: number }) => void;
  jest.mocked(currentSearchLocation).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  jest
    .mocked(getTrades)
    .mockResolvedValue([
      { id: 'carpenter', code: 'CARPENTER', name: 'Carpenter', skills: [] },
    ]);
  await mount(<CustomerHome />);
  await screen.findByRole('button', { name: 'Find Carpenter workers' });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose work location' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Search in Bengaluru' }),
  );
  finish({ latitude: 11, longitude: 78 });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Find Carpenter workers' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(customer)/discover',
    params: { tradeId: 'carpenter', stateCode: '19', cityId: '1277333' },
  });
});

test('manual hub selection replaces existing GPS coordinates in trade navigation', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockResolvedValueOnce({ latitude: 11, longitude: 78 });
  jest
    .mocked(getTrades)
    .mockResolvedValue([
      { id: 'plumber', code: 'PLUMBER', name: 'Plumber', skills: [] },
    ]);
  await mount(<CustomerHome />);
  await screen.findByText('Current phone location');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose work location' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Search in Bengaluru' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Find Plumber workers' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(customer)/discover',
    params: { tradeId: 'plumber', stateCode: '19', cityId: '1277333' },
  });
});
