import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { LabourlyWalletScreen } from '../components/LabourlyWalletScreen';
import WalletScreen from '../app/(customer)/wallet';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function expectUnavailableWallet() {
  expect(
    screen.getByText('Wallet and payments are not available yet'),
  ).toBeTruthy();
  expect(
    screen.queryByText(
      /₹|12,450|14,450|Available Balance|Recent Transactions|Payment to|Apr 2025/,
    ),
  ).toBeNull();
  for (const name of [
    'Add Money',
    'Send',
    'Request',
    'Transactions',
    'Invoice',
    'See all transactions',
  ]) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
  expect(screen.getAllByRole('button')).toHaveLength(1);
}

test('wallet component exposes only an honest unavailable state and back navigation', async () => {
  const back = jest.fn();
  await render(<LabourlyWalletScreen onBack={back} />);
  expectUnavailableWallet();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(back).toHaveBeenCalledTimes(1);
  expectUnavailableWallet();
});

test('direct wallet route cannot expose demo financial data or mutation actions', async () => {
  await render(<WalletScreen />);
  expectUnavailableWallet();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});
