import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyNotificationsScreen } from '../components/LabourlyNotificationsScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyNotificationsScreen', () => {
  test('renders Today unread items and Earlier read items, and handles press', async () => {
    const handlePress = jest.fn();
    const handleBack = jest.fn();

    await render(
      <LabourlyNotificationsScreen
        onBack={handleBack}
        onNotificationPress={handlePress}
      />,
    );

    // Verify Header
    expect(screen.getByText('Notifications')).toBeTruthy();

    // Verify back navigation
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Verify Today subheader and items
    expect(screen.getByText('Today')).toBeTruthy();
    expect(
      screen.getByText('Ramesh Kumar accepted your booking request'),
    ).toBeTruthy();
    expect(screen.getByText('2 min ago')).toBeTruthy();

    expect(
      screen.getByText('Your payment of ₹1,800 was successful'),
    ).toBeTruthy();
    expect(screen.getByText('10 min ago')).toBeTruthy();

    expect(
      screen.getByText('New workers available in Bengaluru for Mason'),
    ).toBeTruthy();
    expect(screen.getByText('1 hour ago')).toBeTruthy();

    // Verify Earlier subheader and items
    expect(screen.getByText('Earlier')).toBeTruthy();
    expect(screen.getByText('Shahid Ansari sent you a message')).toBeTruthy();
    expect(screen.getByText('5 Apr, 10:30 AM')).toBeTruthy();

    expect(
      screen.getByText("Your project 'Office Renovation' starts tomorrow"),
    ).toBeTruthy();
    expect(screen.getByText('4 Apr, 6:00 PM')).toBeTruthy();

    expect(screen.getByText('New verified labourers near you')).toBeTruthy();
    expect(screen.getByText('3 Apr, 11:20 AM')).toBeTruthy();

    // Click an unread item
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Ramesh Kumar accepted your booking request, 2 min ago',
      }),
    );
    expect(handlePress).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ramesh Kumar accepted your booking request',
        section: 'today',
      }),
    );
  });
});
