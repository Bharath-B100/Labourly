import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlySavedWorkersScreen } from '../components/LabourlySavedWorkersScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlySavedWorkersScreen', () => {
  test('renders 4 saved workers and handles interactions', async () => {
    const handleBack = jest.fn();
    const handleSelectWorker = jest.fn();
    const handleToggleSave = jest.fn();

    await render(
      <LabourlySavedWorkersScreen
        onBack={handleBack}
        onSelectWorker={handleSelectWorker}
        onToggleSave={handleToggleSave}
      />,
    );

    expect(screen.getByText('Saved Workers')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Verify Worker 1: Ramesh Kumar
    expect(screen.getByText('Ramesh Kumar')).toBeTruthy();
    expect(screen.getByText('Mason')).toBeTruthy();
    expect(screen.getByText('4.8')).toBeTruthy();
    expect(screen.getByText(/₹ 600/)).toBeTruthy();

    // Verify Worker 2: Suresh Naik
    expect(screen.getByText('Suresh Naik')).toBeTruthy();
    expect(screen.getByText('Carpenter')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText(/₹ 550/)).toBeTruthy();

    // Verify Worker 3: Imran Khan
    expect(screen.getByText('Imran Khan')).toBeTruthy();
    expect(screen.getByText('Electrician')).toBeTruthy();
    expect(screen.getByText('4.7')).toBeTruthy();
    expect(screen.getByText(/₹ 650/)).toBeTruthy();

    // Verify Worker 4: Vijay Patil
    expect(screen.getByText('Vijay Patil')).toBeTruthy();
    expect(screen.getByText('Painter')).toBeTruthy();
    expect(screen.getByText('4.6')).toBeTruthy();
    expect(screen.getByText(/₹ 500/)).toBeTruthy();
    expect(screen.getByText('Pune, Maharashtra')).toBeTruthy();

    // Select a worker card
    await fireEvent.press(
      screen.getByRole('button', { name: 'Worker Ramesh Kumar, Mason' }),
    );
    expect(handleSelectWorker).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ramesh Kumar', trade: 'Mason' }),
    );

    // Toggle heart for Ramesh Kumar
    await fireEvent.press(
      screen.getByRole('button', { name: 'Heart for Ramesh Kumar' }),
    );
    expect(handleToggleSave).toHaveBeenCalledWith('worker-1', false);
  });
});
