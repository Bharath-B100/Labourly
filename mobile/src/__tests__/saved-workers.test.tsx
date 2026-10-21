import {
  render,
  act,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SaveWorkerButton } from '../components/SaveWorkerButton';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
jest.mock('../api/client', () => ({ apiJson: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(apiJson).mockReset();
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  useSession.setState({
    session: {
      userId: 'fictional-customer',
      phone: '+919000000001',
      fullName: 'Fictional Customer',
      roles: ['CUSTOMER'],
      onboardingState: 'COMPLETED',
      onboardingStep: null,
    },
  });
});
afterEach(async () => {
  await cleanup();
  client.clear();
});
const show = () =>
  render(
    <QueryClientProvider client={client}>
      <SaveWorkerButton workerId="fictional-worker" />
    </QueryClientProvider>,
  );
test('save and remove reflect successful API state without reserving or hiring', async () => {
  jest
    .mocked(apiJson)
    .mockResolvedValueOnce({ saved: false })
    .mockResolvedValueOnce({ saved: true })
    .mockResolvedValueOnce({ saved: false });
  await show();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save worker' }),
    ).not.toBeDisabled(),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save worker' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Remove from saved workers' }),
  );
  await screen.findByRole('button', { name: 'Save worker' });
  expect(apiJson).toHaveBeenNthCalledWith(
    2,
    '/api/v1/saved-workers/fictional-worker',
    { method: 'PUT' },
  );
  expect(apiJson).toHaveBeenNthCalledWith(
    3,
    '/api/v1/saved-workers/fictional-worker',
    { method: 'DELETE' },
  );
});
test('failed saving retains unsaved state and permits retry', async () => {
  jest
    .mocked(apiJson)
    .mockResolvedValueOnce({ saved: false })
    .mockRejectedValueOnce(new Error('Offline'));
  await show();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save worker' }),
    ).not.toBeDisabled(),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save worker' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Remove from saved workers' }),
  ).toBeNull();
});
test('worker-only account cannot fetch customer saved state', async () => {
  useSession.setState({
    session: { ...useSession.getState().session!, roles: ['WORKER'] },
  });
  await show();
  expect(apiJson).not.toHaveBeenCalled();
});

test('pending taps do not duplicate requests and failed removal retains saved state for retry', async () => {
  let reject!: (error: Error) => void;
  jest
    .mocked(apiJson)
    .mockResolvedValueOnce({ saved: true })
    .mockImplementationOnce(
      () =>
        new Promise((_, r) => {
          reject = r;
        }),
    )
    .mockResolvedValueOnce({ saved: false });
  await show();
  const remove = await screen.findByRole('button', {
    name: 'Remove from saved workers',
  });
  await fireEvent.press(remove);
  await fireEvent.press(remove);
  expect(apiJson).toHaveBeenCalledTimes(2);
  await act(async () => reject(new Error('Offline')));
  await screen.findByRole('alert');
  expect(
    screen.getByRole('button', { name: 'Remove from saved workers' }),
  ).not.toBeDisabled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove from saved workers' }),
  );
  await screen.findByRole('button', { name: 'Save worker' });
  expect(apiJson).toHaveBeenCalledTimes(3);
});

test('late mutation response cannot populate either account cache after switching customers', async () => {
  let resolve!: (value: { saved: boolean }) => void;
  jest
    .mocked(apiJson)
    .mockResolvedValueOnce({ saved: false })
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    )
    .mockResolvedValue({ saved: false });
  await show();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save worker' }),
    ).not.toBeDisabled(),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save worker' }));
  await act(async () => {
    useSession.setState({
      session: { ...useSession.getState().session!, userId: 'other-customer' },
    });
    client.clear();
  });
  await act(async () => resolve({ saved: true }));
  expect(
    client.getQueryData([
      'saved-worker',
      'fictional-customer',
      'fictional-worker',
    ]),
  ).toBeUndefined();
  expect(
    client.getQueryData(['saved-worker', 'other-customer', 'fictional-worker']),
  ).not.toEqual({ saved: true });
});

test('save remove save follows server acknowledgement without optimistic transitions', async () => {
  jest
    .mocked(apiJson)
    .mockResolvedValueOnce({ saved: false })
    .mockResolvedValueOnce({ saved: true })
    .mockResolvedValueOnce({ saved: false })
    .mockResolvedValueOnce({ saved: true });
  await show();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save worker' }),
    ).not.toBeDisabled(),
  );
  for (const name of [
    'Save worker',
    'Remove from saved workers',
    'Save worker',
  ]) {
    const button = await screen.findByRole('button', { name });
    await waitFor(() => expect(button).not.toBeDisabled());
    await fireEvent.press(button);
  }
  await screen.findByRole('button', { name: 'Remove from saved workers' });
  expect(
    jest
      .mocked(apiJson)
      .mock.calls.slice(1)
      .map((call) => call[1]?.method),
  ).toEqual(['PUT', 'DELETE', 'PUT']);
});
