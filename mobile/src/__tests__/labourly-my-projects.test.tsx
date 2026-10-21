import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyMyProjectsScreen } from '../components/LabourlyMyProjectsScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyMyProjectsScreen', () => {
  test('renders My Projects screen with 3 cards, filter tabs, and 5-tab bottom navigation', async () => {
    const handleTabChange = jest.fn();
    const handleNavChange = jest.fn();
    const handleProjectPress = jest.fn();

    await render(
      <LabourlyMyProjectsScreen
        onTabChange={handleTabChange}
        onNavChange={handleNavChange}
        onProjectPress={handleProjectPress}
      />,
    );

    // Verify title and filter pills
    expect(screen.getByText('My Projects')).toBeTruthy();
    expect(screen.getByText('Active (3)')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Cancelled')).toBeTruthy();

    // Verify Project 1: Residential Building
    expect(screen.getByText('Residential Building')).toBeTruthy();
    expect(screen.getByText('Masons • 3 Workers')).toBeTruthy();
    expect(screen.getByText('12 Apr - 26 Apr, 2025')).toBeTruthy();
    expect(screen.getByText('3/3 workers')).toBeTruthy();

    // Verify Project 2: Office Renovation
    expect(screen.getByText('Office Renovation')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText('Carpenters • 2 Workers')).toBeTruthy();
    expect(screen.getByText('1 May - 30 May, 2025')).toBeTruthy();
    expect(screen.getByText('0/2 workers')).toBeTruthy();

    // Verify Project 3: Villa Construction
    expect(screen.getByText('Villa Construction')).toBeTruthy();
    expect(screen.getByText('Helpers • 4 Workers')).toBeTruthy();
    expect(screen.getByText('10 Apr - 10 May, 2025')).toBeTruthy();
    expect(screen.getByText('4/4 workers')).toBeTruthy();

    // Press a card to trigger callback
    await fireEvent.press(
      screen.getByRole('button', { name: 'Residential Building, Ongoing' }),
    );
    expect(handleProjectPress).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Residential Building',
        status: 'Ongoing',
      }),
    );

    // Change filter tab to Completed
    await fireEvent.press(
      screen.getByRole('button', { name: 'Filter: Completed' }),
    );
    expect(handleTabChange).toHaveBeenCalledWith('completed');
    expect(screen.getByText('No Projects Found')).toBeTruthy();

    // Verify 5-tab bottom navigation
    expect(
      screen.getByRole('button', { name: 'Navigation tab: Home' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Navigation tab: Workers' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Navigation tab: Jobs' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Navigation tab: Chat' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Navigation tab: Profile' }),
    ).toBeTruthy();

    // Click Home nav tab
    await fireEvent.press(
      screen.getByRole('button', { name: 'Navigation tab: Home' }),
    );
    expect(handleNavChange).toHaveBeenCalledWith('home');
  });
});
