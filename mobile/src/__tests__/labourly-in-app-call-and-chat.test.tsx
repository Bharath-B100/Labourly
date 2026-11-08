import { Alert } from 'react-native';
import { useSession } from '../auth/session';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabourlyLiveChat } from '../components/LabourlyLiveChat';
import * as chatApi from '../api/chat';
import * as quotationsApi from '../api/quotations';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

const clients: QueryClient[] = [];
afterEach(async () => {
  await cleanup();
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});

const mockThreadDetail: chatApi.ChatThreadDetail = {
  threadId: 'th-123',
  bookingId: 'bk-456',
  requirementTitle: 'Bathroom Plumbing & Pipe Replacement',
  otherUserName: 'Shankar & Co. Plumbing Team',
  myRole: 'CUSTOMER',
  workerType: 'TEAM',
  teamName: 'Shankar & Co. Plumbing Team',
  teamSize: 4,
  tradeName: 'Plumbing',
  messages: [
    {
      id: 'msg-1',
      senderId: 'worker-uuid',
      senderName: 'Shankar & Co. Plumbing Team',
      body: 'Hello! We have reviewed your bathroom plumbing requirement.',
      sentAt: new Date().toISOString(),
      readByMe: true,
    },
    {
      id: 'msg-2',
      senderId: 'worker-uuid',
      senderName: 'Shankar & Co. Plumbing Team',
      body: '📞 Voice call ended · 1m 45s',
      sentAt: new Date().toISOString(),
      readByMe: true,
    },
  ],
};

async function renderWithClient(ui: React.ReactElement) {
  useSession.setState({
    session: {
      userId: 'customer-test',
      phone: '+919000000001',
      roles: ['CUSTOMER'],
      fullName: 'Fictional Customer',
      onboardingState: 'COMPLETED',
      onboardingStep: null,
    },
    isLoading: false,
  });
  jest.spyOn(chatApi, 'getChatThreads').mockResolvedValue([]);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  clients.push(queryClient);
  return await render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('Labourly In-App Call & Team Chat (Zero Number Sharing)', () => {
  test('renders contact header with Voice Call, Video Call, and Zero Number banner', async () => {
    jest
      .spyOn(chatApi, 'openChatForBooking')
      .mockResolvedValue(mockThreadDetail);
    jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(mockThreadDetail);
    jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);

    await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Voice Call')).toBeTruthy();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText('Shankar & Co. Plumbing Team').length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Zero-Number Sharing Banner
    expect(
      screen.getByText('Booking text chat · Voice and video unavailable'),
    ).toBeTruthy();

    // In-app Calling Buttons
    expect(screen.getByLabelText('Voice Call')).toBeTruthy();
    expect(screen.getByLabelText('Video Call')).toBeTruthy();
    expect(screen.getByLabelText('View Team & Project Details')).toBeTruthy();

    // Call log card in chat feed
    expect(screen.getByText('📞 Voice call ended · 1m 45s')).toBeTruthy();
    expect(screen.getByText('Call back')).toBeTruthy();
  });

  test.each(['Voice Call', 'Video Call'])(
    '%s is truthful and sends no fabricated call message',
    async (label) => {
      jest
        .spyOn(chatApi, 'openChatForBooking')
        .mockResolvedValue(mockThreadDetail);
      jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(mockThreadDetail);
      jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);
      const send = jest.spyOn(chatApi, 'sendChatMessage');
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);
      await waitFor(() => expect(screen.getByLabelText(label)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(label));
      expect(alert).toHaveBeenCalledWith(
        'Calling is not available yet',
        expect.stringContaining('not connected'),
      );
      expect(screen.queryByLabelText('End Call')).toBeNull();
      expect(screen.queryByText('In-App Video Stream')).toBeNull();
      expect(send).not.toHaveBeenCalled();
    },
  );

  test('tapping Project & Team details displays saved team size and explains missing roster', async () => {
    jest
      .spyOn(chatApi, 'openChatForBooking')
      .mockResolvedValue(mockThreadDetail);
    jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(mockThreadDetail);
    jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);

    await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);

    await waitFor(() => {
      expect(screen.getByLabelText('View Team & Project Details')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('View Team & Project Details'));

    // Modal details
    await waitFor(() => {
      expect(screen.getByText('Team & Work Info')).toBeTruthy();
    });
    expect(screen.getByText('TEAM SIZE (4 Workers)')).toBeTruthy();
    expect(
      screen.getByText(
        'Individual team member details have not been provided.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Zero-Number Sharing Security')).toBeTruthy();

    // Close details
    fireEvent.press(screen.getByRole('button', { name: 'Close Details' }));
  });
});

test('failed sends keep the draft and explain an uncertain network outcome', async () => {
  jest.spyOn(chatApi, 'openChatForBooking').mockResolvedValue(mockThreadDetail);
  jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(mockThreadDetail);
  jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);
  const send = jest
    .spyOn(chatApi, 'sendChatMessage')
    .mockRejectedValue(new Error('offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);
  await screen.findByText(
    'Hello! We have reviewed your bathroom plumbing requirement.',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Message text'),
    'Please confirm arrival',
  );
  await fireEvent.press(screen.getByLabelText('Send message'));
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      'Message not confirmed',
      expect.stringContaining('text has been kept'),
    ),
  );
  expect(screen.getByLabelText('Message text').props.value).toBe(
    'Please confirm arrival',
  );
  expect(send).toHaveBeenCalledTimes(1);
  const firstKey = send.mock.calls[0]?.[2];
  expect(firstKey).toMatch(/^[A-Za-z0-9_-]{16,80}$/);
  await fireEvent.press(screen.getByLabelText('Send message'));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(send.mock.calls[1]?.[2]).toBe(firstKey);
});

test('failed conversation loading never claims a successful connection and can retry', async () => {
  jest.spyOn(chatApi, 'openChatForBooking').mockResolvedValue(mockThreadDetail);
  const get = jest
    .spyOn(chatApi, 'getChatThread')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(mockThreadDetail);
  jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);
  await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);
  await screen.findByText(
    'Unable to load this conversation. Check your connection and booking access.',
  );
  expect(screen.queryByText(/Connected with/)).toBeNull();
  await fireEvent.press(screen.getByText('Retry conversation'));
  await screen.findByText(
    'Hello! We have reviewed your bathroom plumbing requirement.',
  );
  expect(get).toHaveBeenCalledTimes(2);
});

test('missing team size is not replaced by a fictional four-person team', async () => {
  const detail = { ...mockThreadDetail, teamSize: undefined };
  jest.spyOn(chatApi, 'openChatForBooking').mockResolvedValue(detail);
  jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(detail);
  jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);
  await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);
  await screen.findByText(
    'Hello! We have reviewed your bathroom plumbing requirement.',
  );
  expect(screen.queryByText(/Team of 4/)).toBeNull();
  expect(screen.getByText(/Team size not provided/)).toBeTruthy();
});

test('pending sends reject repeated taps and preserve newly edited text', async () => {
  jest.spyOn(chatApi, 'openChatForBooking').mockResolvedValue(mockThreadDetail);
  jest.spyOn(chatApi, 'getChatThread').mockResolvedValue(mockThreadDetail);
  jest.spyOn(quotationsApi, 'getMyBookings').mockResolvedValue([]);
  let resolveSend!: (value: chatApi.ChatMessageView) => void;
  const send = jest.spyOn(chatApi, 'sendChatMessage').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
  );
  await renderWithClient(<LabourlyLiveChat initialBookingId="bk-456" />);
  await screen.findByText(
    'Hello! We have reviewed your bathroom plumbing requirement.',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Message text'),
    'First message',
  );
  await fireEvent.press(screen.getByLabelText('Send message'));
  await fireEvent.press(screen.getByLabelText('Send message'));
  expect(send).toHaveBeenCalledTimes(1);
  await fireEvent.changeText(
    screen.getByLabelText('Message text'),
    'Next message draft',
  );
  resolveSend({ ...mockThreadDetail.messages[0]!, body: 'First message' });
  await waitFor(() =>
    expect(
      screen.getByLabelText('Send message').props.accessibilityState?.disabled,
    ).not.toBe(true),
  );
  expect(screen.getByLabelText('Message text').props.value).toBe(
    'Next message draft',
  );
});
