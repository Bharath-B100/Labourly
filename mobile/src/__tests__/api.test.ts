import { getHealth } from '../api/client';

const originalFetch = global.fetch;

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn((_url, options) => {
    const signal = options?.signal;
    return new Promise((_resolve, reject) => {
      const abort = () => reject(new Error('aborted'));
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
    });
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

test('ends a stalled health request after ten seconds', async () => {
  const request = expect(getHealth()).rejects.toThrow('aborted');
  await jest.advanceTimersByTimeAsync(10_000);
  await request;
  expect(jest.getTimerCount()).toBe(0);
});

test('preserves caller cancellation before the timeout', async () => {
  const controller = new AbortController();
  const request = expect(getHealth(controller.signal)).rejects.toThrow(
    'aborted',
  );
  controller.abort();
  await request;
  expect(jest.getTimerCount()).toBe(0);
});

test('cleans up the timeout after a successful response', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'UP' }),
  });
  await expect(getHealth()).resolves.toEqual({ status: 'UP' });
  expect(jest.getTimerCount()).toBe(0);
});
