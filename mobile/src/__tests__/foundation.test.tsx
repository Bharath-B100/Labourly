import { fireEvent, render, screen } from '@testing-library/react-native';
import Welcome from '../app/index';
import { hasRole, homeRoute, useSession, type Session } from '../auth/session';
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Redirect: () => null,
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
const base: Session = {
  userId: 'synthetic',
  phone: '+919000000001',
  fullName: 'Test',
  roles: [],
  onboardingState: 'NOT_STARTED',
  onboardingStep: null,
};
beforeEach(() => {
  useSession.setState({ session: null, isLoading: false, error: null });
  mockPush.mockClear();
});
test('intro completes before opening OTP login', async () => {
  await render(<Welcome />);
  expect(screen.getByText('Reliable people.\nStronger projects.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
  expect(mockPush).toHaveBeenCalledWith('/auth/login');
});
test('role guards fail closed', () => {
  expect(hasRole(null, 'WORKER')).toBe(false);
  expect(hasRole({ ...base, roles: ['CUSTOMER'] }, 'WORKER')).toBe(false);
  expect(hasRole({ ...base, roles: ['WORKER'] }, 'WORKER')).toBe(true);
});
test('routes new and partial accounts to onboarding; completed accounts to correct home', () => {
  expect(homeRoute(null)).toBe('/');
  expect(homeRoute(base)).toBe('/auth/onboarding');
  expect(
    homeRoute({
      ...base,
      roles: ['WORKER'],
      onboardingState: 'IN_PROGRESS',
      onboardingStep: '2',
    }),
  ).toBe('/auth/onboarding');
  expect(
    homeRoute({ ...base, roles: ['CUSTOMER'], onboardingState: 'COMPLETED' }),
  ).toBe('/(customer)/home');
  expect(
    homeRoute({ ...base, roles: ['WORKER'], onboardingState: 'COMPLETED' }),
  ).toBe('/(worker)/opportunities');
});
