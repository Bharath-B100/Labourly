import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyMyProfileScreen } from '../components/LabourlyMyProfileScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyMyProfileScreen', () => {
  test('renders profile card, settings groups, and handles logout and edit', async () => {
    const handleEdit = jest.fn();
    const handleLogout = jest.fn();
    const handleRowPress = jest.fn();

    await render(
      <LabourlyMyProfileScreen
        onEdit={handleEdit}
        onLogout={handleLogout}
        onRowPress={handleRowPress}
      />,
    );

    // Verify Title & Profile Card
    expect(screen.getByText('My Profile')).toBeTruthy();
    expect(screen.getByText('Amit Sharma')).toBeTruthy();
    expect(screen.getByText('Contractor')).toBeTruthy();

    // Verify Group 1 items
    expect(screen.getByText('KYC Verification')).toBeTruthy();
    expect(screen.getByText('Language')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.getByText('Country')).toBeTruthy();
    expect(screen.getByText('India')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();

    // Verify Group 2 items
    expect(screen.getByText('Help & Support')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Terms & Conditions')).toBeTruthy();

    // Verify Edit trigger
    await fireEvent.press(screen.getByRole('button', { name: 'Edit profile' }));
    expect(handleEdit).toHaveBeenCalledTimes(1);

    // Verify Logout CTA
    await fireEvent.press(screen.getByRole('button', { name: 'Log Out' }));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
