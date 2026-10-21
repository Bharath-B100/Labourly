import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyWalletScreen } from '../components/LabourlyWalletScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyWalletScreen', () => {
  test('renders balance card, quick action buttons, transaction rows, and handles add money', async () => {
    const handleAddMoney = jest.fn();
    const handleSend = jest.fn();
    const handleTransactionPress = jest.fn();
    const handleBack = jest.fn();

    await render(
      <LabourlyWalletScreen
        onBack={handleBack}
        onAddMoney={handleAddMoney}
        onSend={handleSend}
        onTransactionPress={handleTransactionPress}
      />,
    );

    // Verify header and balance
    expect(screen.getByText('Wallet')).toBeTruthy();
    expect(screen.getByText('Available Balance')).toBeTruthy();
    expect(screen.getByText('₹ 12,450')).toBeTruthy();
    expect(screen.getByText('Add Money +')).toBeTruthy();

    // Verify back navigation
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Click Add Money +
    await fireEvent.press(screen.getByRole('button', { name: 'Add Money' }));
    expect(handleAddMoney).toHaveBeenCalledTimes(1);
    expect(screen.getByText('₹ 14,450')).toBeTruthy();

    // Verify Quick Actions
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Transactions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invoice' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(handleSend).toHaveBeenCalledTimes(1);

    // Verify Transactions
    expect(screen.getByText('Recent Transactions')).toBeTruthy();
    expect(screen.getByText('See all')).toBeTruthy();
    expect(screen.getByText('Payment to Ramesh Kumar')).toBeTruthy();
    expect(screen.getByText('12 Apr 2025')).toBeTruthy();
    expect(screen.getByText('- ₹1,800')).toBeTruthy();

    expect(screen.getByText('Add Money')).toBeTruthy();
    expect(screen.getByText('10 Apr 2025')).toBeTruthy();
    expect(screen.getByText('+ ₹5,000')).toBeTruthy();

    expect(screen.getByText('Payment to Shahid Ansari')).toBeTruthy();
    expect(screen.getByText('5 Apr 2025')).toBeTruthy();
    expect(screen.getByText('- ₹2,200')).toBeTruthy();

    expect(screen.getByText('Refund')).toBeTruthy();
    expect(screen.getByText('2 Apr 2025')).toBeTruthy();
    expect(screen.getByText('+ ₹800')).toBeTruthy();

    // Click a transaction
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Payment to Ramesh Kumar, 12 Apr 2025, - ₹1,800',
      }),
    );
    expect(handleTransactionPress).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Payment to Ramesh Kumar',
        amount: '- ₹1,800',
      }),
    );
  });
});
