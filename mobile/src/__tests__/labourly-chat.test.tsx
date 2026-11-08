import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyChatScreen } from '../components/LabourlyChatScreen';
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
afterEach(async () => {
  await cleanup();
});
test('messaging has no fabricated thread, presence, calls or send action', async () => {
  const jobs = jest.fn();
  await render(<LabourlyChatScreen onGoToJobs={jobs} />);
  expect(screen.getByText('Messaging is not available yet')).toBeTruthy();
  expect(screen.queryByText('Online')).toBeNull();
  expect(screen.queryByText('Ramesh Kumar')).toBeNull();
  expect(screen.queryByLabelText('Type a message')).toBeNull();
  expect(
    screen.queryByRole('button', { name: /Call|Send message|Quick reply/ }),
  ).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Go to my jobs' }));
  expect(jobs).toHaveBeenCalledTimes(1);
});
