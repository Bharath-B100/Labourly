import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlySelectScheduleScreen } from '../components/LabourlySelectScheduleScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlySelectScheduleScreen', () => {
  test('renders April 2025 calendar with date 12 selected, alters duration, and confirms schedule', async () => {
    const handleConfirm = jest.fn();
    const handleBack = jest.fn();

    await render(
      <LabourlySelectScheduleScreen
        onBack={handleBack}
        onConfirm={handleConfirm}
      />,
    );

    // Verify title, header, and month
    expect(screen.getByText('Select Schedule')).toBeTruthy();
    expect(screen.getByText('April 2025')).toBeTruthy();
    expect(screen.getByText('Preferred Time')).toBeTruthy();
    expect(screen.getByText('Full Day (8 hours)')).toBeTruthy();
    expect(screen.getByText('1 week')).toBeTruthy();

    // Verify back navigation
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Switch duration pill to Weekly
    await fireEvent.press(
      screen.getByRole('button', { name: 'Schedule duration: Weekly' }),
    );

    // Change date to 15
    await fireEvent.press(
      screen.getByRole('button', { name: 'Select date 15 April 2025' }),
    );

    // Increment duration weeks
    await fireEvent.press(
      screen.getByRole('button', { name: 'Increase duration weeks' }),
    );
    expect(screen.getByText('2 weeks')).toBeTruthy();

    // Confirm schedule
    await fireEvent.press(
      screen.getByRole('button', { name: 'Confirm Schedule' }),
    );

    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMode: 'Weekly',
        startDate: 15,
        durationWeeks: 2,
        preferredTime: 'Full Day (8 hours)',
      }),
    );
  });
});
