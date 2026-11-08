import * as Linking from 'expo-linking';
import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyMyProfileScreen } from '../components/LabourlyMyProfileScreen';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

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
    expect(screen.getByText('Your account')).toBeTruthy();
    expect(screen.getByText('Customer')).toBeTruthy();

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

test('profile never fabricates identity verification or support success', async () => {
  await render(
    <LabourlyMyProfileScreen
      user={{ fullName: 'Fictional Customer', isPhoneVerified: false }}
    />,
  );
  expect(screen.queryByText(/Phone verified/)).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'KYC Verification' }),
  );
  expect(
    screen.getByText(/Identity verification is not available yet/),
  ).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Help & Support' }));
  expect(screen.getByText(/No support request has been sent/)).toBeTruthy();
  expect(
    screen.queryByText(/created successfully|approved|Amit Sharma/),
  ).toBeNull();
});

test('customer and worker profile actions remain connected to their handlers', async () => {
  const action = jest.fn();
  await render(<LabourlyMyProfileScreen onRowPress={action} />);
  for (const [name, key] of [
    ['My bookings', 'bookings'],
    ['My jobs and quotations', 'requirements'],
    ['Saved Workers', 'saved-workers'],
    ['Notifications', 'notifications'],
  ]) {
    await fireEvent.press(screen.getByRole('button', { name }));
    expect(action).toHaveBeenLastCalledWith(key);
  }
  expect(screen.queryByRole('button', { name: /Switch to/ })).toBeNull();
});

test('support uses the owner-provided email without inventing a helpline or sending automatically', async () => {
  jest.mocked(Linking.openURL).mockResolvedValueOnce(true);
  await render(<LabourlyMyProfileScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Help & Support' }));
  expect(
    screen.queryByText(/1800-200|24\/7 Helpline|support@nammacrew/),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Email Labourly support' }),
  );
  expect(Linking.openURL).toHaveBeenCalledWith(
    'mailto:labourly.work@gmail.com?subject=Labourly%20support',
  );
  expect(await screen.findByText(/Your email app was opened/)).toBeTruthy();
});

test('support retains a readable email when no email app can open', async () => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error('No handler'));
  await render(<LabourlyMyProfileScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Help & Support' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Email Labourly support' }),
  );
  expect(await screen.findByText(/Could not open an email app/)).toBeTruthy();
  expect(screen.getByText('labourly.work@gmail.com')).toBeTruthy();
});

test('profile does not invent verification, escrow or background delivery', async () => {
  await render(<LabourlyMyProfileScreen />);
  expect(screen.queryByText(/Phone verified/)).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Terms & Conditions' }),
  );
  expect(
    screen.queryByText(/All jobs completed under verified milestones/),
  ).toBeNull();
  expect(
    screen.getByText(/does not currently provide wallet payments or escrow/),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Notifications' }));
  expect(
    screen.getByText(
      /Background alerts and notification preferences are not available yet/,
    ),
  ).toBeTruthy();
  expect(screen.queryByText(/Live progress tracking, milestones/)).toBeNull();
});
