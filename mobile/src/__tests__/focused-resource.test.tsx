import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useFocusedResource } from '../hooks/useFocusedResource';
import { useSession, type Session } from '../auth/session';
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: any) => jest.requireActual('react').useEffect(cb, [cb]),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
const originalState = AppState.currentState;
const customer: Session = {
  userId: 'isolated-customer',
  phone: '+919000000001',
  fullName: 'Fictional Customer',
  roles: ['CUSTOMER'],
  onboardingState: 'COMPLETED',
  onboardingStep: null,
};
beforeEach(() => {
  jest.useFakeTimers();
  AppState.currentState = 'active';
  useSession.setState({ session: customer });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  AppState.currentState = originalState;
});

test('both active consumers pick up a newly confirmed booking and cancellation on next refresh', async () => {
  let server = [] as { id: string; status: string }[];
  const load = jest.fn(async () => server);
  const a = await renderHook(() => useFocusedResource(load));
  const b = await renderHook(() => useFocusedResource(load));
  await waitFor(() => expect(a.result.current.data).toEqual([]));
  server = [{ id: 'isolated-booking', status: 'CONFIRMED' }];
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(a.result.current.data).toEqual(server);
  expect(b.result.current.data).toEqual(server);
  server = [{ id: 'isolated-booking', status: 'CANCELLED' }];
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(a.result.current.data).toEqual(server);
  expect(b.result.current.data).toEqual(server);
});

test('pending requests do not overlap and responses from a prior account are ignored', async () => {
  let resolveFirst!: (value: string[]) => void;
  const load = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<string[]>((resolve) => {
          resolveFirst = resolve;
        }),
    )
    .mockResolvedValue(['second-account']);
  const hook = await renderHook(() => useFocusedResource<string[]>(load));
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => {
    useSession.setState({ session: { ...customer, userId: 'second' } });
  });
  await waitFor(() =>
    expect(hook.result.current.data).toEqual(['second-account']),
  );
  await act(async () => resolveFirst(['private-first-account']));
  expect(hook.result.current.data).toEqual(['second-account']);
});

test('network failure is visible and manual retry returns current data', async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(['recovered']);
  const hook = await renderHook(() => useFocusedResource(load));
  await waitFor(() => expect(hook.result.current.error).toBe('Offline'));
  await act(async () => {
    await hook.result.current.refresh();
  });
  expect(hook.result.current.error).toBe('');
  expect(hook.result.current.data).toEqual(['recovered']);
});

test('background polling pauses and foreground resumes; unmount removes timers', async () => {
  const load = jest.fn().mockResolvedValue([]);
  const hook = await renderHook(() => useFocusedResource(load));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  const listener = jest
    .mocked(AppState.addEventListener)
    .mock.calls.filter(([type]) => type === 'change')
    .at(-1)![1];
  await act(async () => {
    listener('background');
    jest.advanceTimersByTime(30000);
  });
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => listener('active'));
  expect(load).toHaveBeenCalledTimes(2);
  await hook.unmount();
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(load).toHaveBeenCalledTimes(2);
});

test('changing the booking resource never exposes the previous booking response', async () => {
  let finish!: (value: string) => void;
  const oldLoad = jest.fn().mockResolvedValue('old-booking');
  const nextLoad = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const hook = await renderHook<any, any>(
    ({ load }: any) => useFocusedResource<string>(load),
    { initialProps: { load: oldLoad } },
  );
  await waitFor(() => expect(hook.result.current.data).toBe('old-booking'));
  await hook.rerender({ load: nextLoad });
  expect(hook.result.current.data).toBeNull();
  await act(async () => finish('new-booking'));
  expect(hook.result.current.data).toBe('new-booking');
});
