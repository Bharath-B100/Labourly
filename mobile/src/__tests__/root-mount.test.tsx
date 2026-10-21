import { act, render, screen } from '@testing-library/react-native';
import RootLayout from '../app/_layout';
import { useSession } from '../auth/session';
const mockMount = jest.fn();
const mockUnmount = jest.fn();
jest.mock('../../global.css', () => ({}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = ({ children }: any) => {
    React.useEffect(() => {
      mockMount();
      return () => mockUnmount();
    }, []);
    return <View testID="root-navigator">{children}</View>;
  };
  Stack.Screen = function Screen() {
    return null;
  };
  Stack.Protected = function Protected({ guard, children }: any) {
    return guard ? children : null;
  };
  return { Stack };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
}));
jest.mock('../components/LoginTransition', () => ({
  LoginTransition: () => null,
}));
jest.mock('../components/ui', () => ({
  Action: () => null,
  EmptyState: () => null,
  Screen: () => null,
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

test('root navigator remains mounted through restoration, failure, role change and logout', async () => {
  useSession.setState({
    session: null,
    isLoading: true,
    error: null,
    loadSession: jest.fn(async () => {}),
  });
  await render(<RootLayout />);
  expect(screen.getByTestId('root-navigator')).toBeTruthy();
  for (const state of [
    { isLoading: false, error: 'Offline' },
    { isLoading: true, error: null },
    {
      isLoading: false,
      session: {
        userId: 'fictional',
        phone: '+919000000001',
        fullName: 'Fictional',
        roles: ['CUSTOMER' as const],
        onboardingState: 'COMPLETED' as const,
        onboardingStep: null,
      },
    },
    { session: null, isLoading: false, error: null },
  ]) {
    await act(async () => useSession.setState(state));
    expect(screen.getByTestId('root-navigator')).toBeTruthy();
  }
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(mockUnmount).not.toHaveBeenCalled();
});
