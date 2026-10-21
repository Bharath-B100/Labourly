import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyPostRequirementScreen } from '../components/LabourlyPostRequirementScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyPostRequirementScreen', () => {
  test('renders form with default fields and allows stepper increment/decrement', async () => {
    const handleSubmit = jest.fn();
    const handleBack = jest.fn();

    await render(
      <LabourlyPostRequirementScreen
        onBack={handleBack}
        onSubmit={handleSubmit}
      />,
    );

    // Verify header and fields exist
    expect(screen.getByText('Post a Requirement')).toBeTruthy();
    expect(screen.getByText('Job Title')).toBeTruthy();
    expect(screen.getByText('Skill Required')).toBeTruthy();
    expect(screen.getByText('Mason')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('Number of Workers')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();

    // Verify back button calls onBack
    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Stepper + increment
    await fireEvent.press(
      screen.getByRole('button', { name: 'Increase number of workers' }),
    );
    expect(screen.getByText('4')).toBeTruthy();

    // Change duration to Weekly
    await fireEvent.press(
      screen.getByRole('button', { name: 'Duration option: Weekly' }),
    );

    // Submit form
    await fireEvent.press(
      screen.getByRole('button', { name: 'Post Requirement' }),
    );
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Mason for residential construction',
        skill: 'Mason',
        duration: 'Weekly',
        workerCount: 4,
      }),
    );
  });
});
