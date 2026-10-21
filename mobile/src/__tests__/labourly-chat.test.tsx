import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react-native';
import { LabourlyChatScreen } from '../components/LabourlyChatScreen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(async () => {
  await cleanup();
});

describe('LabourlyChatScreen', () => {
  test('renders chat messages, location card, quick reply chips, and sends new message', async () => {
    const handleSend = jest.fn();
    const handleBack = jest.fn();
    const handleCall = jest.fn();

    await render(
      <LabourlyChatScreen
        onBack={handleBack}
        onCall={handleCall}
        onSend={handleSend}
      />,
    );

    // Verify header and worker info
    expect(screen.getByText('Ramesh Kumar')).toBeTruthy();
    expect(screen.getByText('Online')).toBeTruthy();

    // Verify call and back interactions
    await fireEvent.press(
      screen.getByRole('button', { name: 'Call Ramesh Kumar' }),
    );
    expect(handleCall).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Verify initial chat thread
    expect(
      screen.getByText(
        'Hi! I need 3 masons for a residential project starting next week.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Sure sir, I am available. Can you share the location and duration?',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText('Bengaluru, Karnataka • 3 workers • 2 weeks'),
    ).toBeTruthy();
    expect(
      screen.getByText('Looks good. I can start from next Monday.'),
    ).toBeTruthy();

    // Verify quick-reply buttons
    expect(
      screen.getByRole('button', { name: 'Quick reply: Are you available?' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Quick reply: What is your rate?' }),
    ).toBeTruthy();

    // Click quick reply to trigger send
    await fireEvent.press(
      screen.getByRole('button', { name: 'Quick reply: What is your rate?' }),
    );
    expect(handleSend).toHaveBeenCalledWith('What is your rate?');

    // Type a custom message and send
    const input = screen.getByLabelText('Type a message');
    await fireEvent.changeText(input, 'See you on Monday!');
    await fireEvent.press(screen.getByRole('button', { name: 'Send message' }));
    expect(handleSend).toHaveBeenCalledWith('See you on Monday!');
    expect(screen.getByText('See you on Monday!')).toBeTruthy();
  });
});
