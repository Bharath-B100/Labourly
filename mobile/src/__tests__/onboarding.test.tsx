import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from '../app/auth/login';
import VerifyScreen from '../app/auth/verify';
import ProfileEditor from '../onboarding/ProfileEditor';
import { apiJson, publicJson } from '../api/client';
import { useSession, type Session } from '../auth/session';
import { normalizePhone, validateOtp } from '../auth/validation';
import {
  emptyProfile,
  validateStep,
  type Catalogue,
  type Draft,
} from '../onboarding/profile';
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLoad = jest.fn();
const mockSignIn = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ phone: '+919100000001' }),
}));
jest.mock('../api/client', () => ({
  apiJson: jest.fn(),
  publicJson: jest.fn(),
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
const user: Session = {
  userId: 'test-id',
  phone: '+919100000001',
  fullName: null,
  roles: [],
  onboardingState: 'NOT_STARTED',
  onboardingStep: null,
};
const catalogue: Catalogue = {
  customerTypes: [
    { code: 'HOMEOWNER', name: 'Homeowner' },
    { code: 'OTHER', name: 'Other' },
  ],
  trades: [
    {
      id: 'trade',
      code: 'CARPENTER',
      name: 'Carpenter',
      skills: [{ id: 'skill', name: 'Furniture' }],
    },
  ],
};
let draft: Draft;
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  mockLoad.mockResolvedValue(undefined);
  mockSignIn.mockResolvedValue(undefined);
  useSession.setState({
    session: user,
    isLoading: false,
    error: null,
    loadSession: mockLoad,
    signIn: mockSignIn,
  });
  draft = { role: null, state: 'NOT_STARTED', step: 0, data: {} };
  jest.mocked(apiJson).mockImplementation(async (path, options) => {
    if (path.endsWith('/catalogue')) return catalogue;
    if (options?.method === 'PUT')
      return { ...draft, ...JSON.parse(String(options.body)) };
    if (options?.method === 'POST') return {};
    return draft;
  });
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
});
afterEach(async () => {
  await cleanup();
  client.clear();
});
async function show(element: React.ReactElement) {
  await render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}
async function fill(label: string, value: string) {
  await fireEvent.changeText(screen.getByLabelText(label), value);
}
async function press(label: string) {
  await fireEvent.press(screen.getByRole('button', { name: label }));
}

test('phone and OTP validation reject invalid input', () => {
  expect(normalizePhone('98765 43210')).toBe('+919876543210');
  expect(() => normalizePhone('123')).toThrow();
  expect(validateOtp('012345')).toBe('012345');
  for (const code of ['12345', '1234567', 'abcdef'])
    expect(() => validateOtp(code)).toThrow();
});
test('login validates phone and requests the correct OTP endpoint', async () => {
  await show(<LoginScreen />);
  await fill('Phone number', '123');
  await press('Send code');
  await screen.findByText(/Enter a valid phone/);
  expect(publicJson).not.toHaveBeenCalled();
  jest.mocked(publicJson).mockResolvedValue(undefined);
  await fill('Phone number', '+919100000001');
  await press('Send code');
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/auth/verify',
      params: { phone: '+919100000001' },
    }),
  );
  expect(publicJson).toHaveBeenCalledWith('/api/v1/auth/otp/request', {
    phone: '+919100000001',
  });
});
test('incorrect OTP stays on verification and displays the server failure', async () => {
  jest
    .mocked(publicJson)
    .mockRejectedValue(new Error('Code is invalid, expired or already used.'));
  await show(<VerifyScreen />);
  await fill('Verification code', '000000');
  await press('Verify and continue');
  await waitFor(() =>
    expect(
      screen.getByText('Code is invalid, expired or already used.'),
    ).toBeTruthy(),
  );
  expect(mockSignIn).not.toHaveBeenCalled();
});
test('successful OTP stores credentials through the session service', async () => {
  const tokens = { accessToken: 'access', refreshToken: 'refresh' };
  jest.mocked(publicJson).mockResolvedValue(tokens);
  await show(<VerifyScreen />);
  await fill('Verification code', '123456');
  await press('Verify and continue');
  await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith(tokens));
  expect(publicJson).toHaveBeenCalledWith('/api/v1/auth/otp/verify', {
    phone: '+919100000001',
    code: '123456',
  });
});
test('role selection persists on server before reloading identity', async () => {
  await show(<ProfileEditor />);
  await screen.findByText('What brings you here?');
  await press('I am a worker');
  await waitFor(() =>
    expect(apiJson).toHaveBeenCalledWith(
      '/api/v1/users/me/roles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ role: 'WORKER' }),
      }),
    ),
  );
  expect(mockLoad).toHaveBeenCalled();
});
test('customer onboarding requires name and location, reviews and completes', async () => {
  draft = { role: 'CUSTOMER', state: 'IN_PROGRESS', step: 0, data: {} };
  await show(<ProfileEditor />);
  await screen.findByText('Your details');
  await press('Save and continue');
  await waitFor(() =>
    expect(screen.getByText(/Enter your full name/)).toBeTruthy(),
  );
  await fill('Full name', 'Test Customer');
  await fireEvent.press(screen.getByRole('radio', { name: 'Other' }));
  await press('Save and continue');
  await screen.findByText('Your location');
  await fill('State code (for example KA)', 'KA');
  await fill('District', 'Bengaluru Urban');
  await fill('City', 'Bengaluru');
  await fill('Postal code', '560001');
  await press('Save and continue');
  await screen.findByText('Review your profile');
  expect(screen.getByText('Test Customer')).toBeTruthy();
  await press('Complete profile');
  await waitFor(() =>
    expect(apiJson).toHaveBeenCalledWith('/api/v1/onboarding/complete', {
      method: 'POST',
    }),
  );
});
test('worker resumes the server draft step and completes trade, skills and availability', async () => {
  draft = {
    role: 'WORKER',
    state: 'IN_PROGRESS',
    step: 1,
    data: { fullName: 'Test Worker', workerType: 'INDIVIDUAL' },
  };
  await show(<ProfileEditor />);
  await screen.findByText('Your trade and skills');
  await fireEvent.press(screen.getByRole('radio', { name: 'Carpenter' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Furniture' }));
  await fill('Years of experience', '5');
  await press('Save and continue');
  await screen.findByText('Location and availability');
  await fill('State code (for example KA)', 'KA');
  await fill('District', 'Bengaluru Urban');
  await fill('City', 'Bengaluru');
  await fill('Postal code', '560001');
  await fireEvent.press(screen.getByRole('radio', { name: 'Available' }));
  await press('Save and continue');
  await screen.findByText('Review your profile');
  expect(screen.getByText('Test Worker')).toBeTruthy();
  await press('Complete profile');
  await waitFor(() =>
    expect(apiJson).toHaveBeenCalledWith('/api/v1/onboarding/complete', {
      method: 'POST',
    }),
  );
});
test('reopening onboarding replaces cached progress with the authoritative server draft', async () => {
  client.setQueryData(['onboarding', user.userId, false], {
    draft: { role: 'WORKER', state: 'IN_PROGRESS', step: 0, data: {} },
    catalogue,
  });
  draft = {
    role: 'WORKER',
    state: 'IN_PROGRESS',
    step: 1,
    data: { fullName: 'Saved Worker', workerType: 'INDIVIDUAL' },
  };
  await show(<ProfileEditor />);
  await screen.findByText('Your trade and skills');
  expect(screen.queryByText('Your details')).toBeNull();
  expect(apiJson).toHaveBeenCalledWith('/api/v1/onboarding');
});
test('worker team fields and review prerequisites are validated', () => {
  expect(
    validateStep(
      { ...emptyProfile, fullName: 'Worker', workerType: 'TEAM' },
      'WORKER',
      1,
    ),
  ).toContain('team');
  expect(
    validateStep(
      { ...emptyProfile, fullName: 'Worker', workerType: 'INDIVIDUAL' },
      'WORKER',
      2,
    ),
  ).toContain('trade');
});
