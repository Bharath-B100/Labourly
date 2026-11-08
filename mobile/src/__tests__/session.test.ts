import * as SecureStore from 'expo-secure-store';
import { apiFetch, apiJson } from '../api/client';
import { readCredentials, storeCredentials } from '../auth/credentials';
import { useSession } from '../auth/session';
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
}));
const storage = new Map<string, string>();
const previous = { accessToken: 'old-access', refreshToken: 'old-refresh' };
const next = { accessToken: 'new-access', refreshToken: 'new-refresh' };
const response = (status: number, data: unknown = {}) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
  }) as Response;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function tick() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
const originalFetch = global.fetch;
beforeEach(async () => {
  storage.clear();
  jest.clearAllMocks();
  jest
    .mocked(SecureStore.getItemAsync)
    .mockImplementation(async (key) => storage.get(key) ?? null);
  jest
    .mocked(SecureStore.setItemAsync)
    .mockImplementation(async (key, value) => {
      storage.set(key, value);
    });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key) => {
    storage.delete(key);
  });
  await storeCredentials(previous);
  useSession.setState({ session: null, isLoading: false, error: null });
});
afterEach(() => {
  global.fetch = originalFetch;
});
test('simultaneous 401s share one rotation and all original requests retry once', async () => {
  const rotated = deferred<Response>();
  const fetcher = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) return rotated.promise;
      return response(
        new Headers(options?.headers).get('Authorization') ===
          'Bearer old-access'
          ? 401
          : 200,
      );
    },
  );
  global.fetch = fetcher;
  const requests = [apiFetch('/one'), apiFetch('/two'), apiFetch('/three')];
  await tick();
  expect(
    fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh')),
  ).toHaveLength(1);
  rotated.resolve(response(200, next));
  expect((await Promise.all(requests)).map((r) => r.status)).toEqual([
    200, 200, 200,
  ]);
  expect(fetcher).toHaveBeenCalledTimes(7);
  expect(await readCredentials()).toEqual(next);
  expect(storage.size).toBe(1);
  expect(JSON.parse(storage.get('nammacrew.credentials')!)).toEqual(next);
});
test('delayed old-token 401 reuses completed rotation without rotating again', async () => {
  const late = deferred<Response>();
  let initial = 0;
  const fetcher = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) return response(200, next);
      if (
        new Headers(options?.headers).get('Authorization') ===
        'Bearer old-access'
      ) {
        initial++;
        return initial === 2 ? late.promise : response(401);
      }
      return response(200);
    },
  );
  global.fetch = fetcher;
  const first = apiFetch('/one');
  const second = apiFetch('/two');
  expect((await first).status).toBe(200);
  late.resolve(response(401));
  expect((await second).status).toBe(200);
  expect(
    fetcher.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh')),
  ).toHaveLength(1);
});
test('failed refresh rejects every waiter and clears secure session', async () => {
  const rotated = deferred<Response>();
  global.fetch = jest.fn(async (url) =>
    String(url).endsWith('/auth/refresh') ? rotated.promise : response(401),
  );
  const results = Promise.allSettled([apiFetch('/one'), apiFetch('/two')]);
  await tick();
  rotated.resolve(response(401));
  expect((await results).map((item) => item.status)).toEqual([
    'rejected',
    'rejected',
  ]);
  expect(await readCredentials()).toBeNull();
  expect(useSession.getState().session).toBeNull();
});
test('refresh endpoint cannot recursively refresh and a second 401 ends the retry', async () => {
  const fetcher = jest.fn(async (url) =>
    String(url).endsWith('/auth/refresh') ? response(200, next) : response(401),
  );
  global.fetch = fetcher;
  expect((await apiFetch('/protected')).status).toBe(401);
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(await readCredentials()).toBeNull();
  await storeCredentials(previous);
  fetcher.mockClear();
  fetcher.mockResolvedValue(response(401));
  expect((await apiFetch('/api/v1/auth/refresh')).status).toBe(401);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test('logout during rotation cannot restore credentials', async () => {
  const rotated = deferred<Response>();
  global.fetch = jest.fn(async (url) =>
    String(url).endsWith('/auth/refresh') ? rotated.promise : response(401),
  );
  const result = expect(apiFetch('/protected')).rejects.toThrow();
  await tick();
  await storeCredentials(null);
  rotated.resolve(response(200, next));
  await result;
  expect(await readCredentials()).toBeNull();
});
test('an old request cannot be replayed under a newly signed-in identity', async () => {
  const late = deferred<Response>();
  global.fetch = jest.fn(() => late.promise);
  const result = expect(
    apiFetch('/profile', { method: 'POST', body: '{}' }),
  ).rejects.toThrow('Session changed');
  await tick();
  await storeCredentials(next);
  late.resolve(response(401));
  await result;
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(await readCredentials()).toEqual(next);
});
test('session restoration uses authoritative backend fields and logout revokes server session', async () => {
  global.fetch = jest.fn(async (url) =>
    String(url).endsWith('/logout')
      ? response(204)
      : response(200, {
          id: 'worker-id',
          phone: '+919000000002',
          fullName: 'Worker',
          roles: ['WORKER'],
          onboardingState: 'IN_PROGRESS',
          onboardingStep: '2',
        }),
  );
  await useSession.getState().loadSession();
  expect(useSession.getState().session).toMatchObject({
    userId: 'worker-id',
    roles: ['WORKER'],
    onboardingState: 'IN_PROGRESS',
    onboardingStep: '2',
  });
  await useSession.getState().logout();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/auth/logout'),
    expect.objectContaining({
      body: JSON.stringify({ refreshToken: previous.refreshToken }),
    }),
  );
  expect(await readCredentials()).toBeNull();
  expect(useSession.getState().session).toBeNull();
});
test('offline restoration fails closed while preserving credentials for retry', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  await useSession.getState().loadSession();
  expect(useSession.getState().session).toBeNull();
  expect(useSession.getState().error).toContain('Unable to restore');
  expect(await readCredentials()).toEqual(previous);
});

test.each([429, 503])(
  'temporary refresh HTTP %s preserves credentials for retry',
  async (status) => {
    global.fetch = jest.fn(async (url) =>
      response(String(url).endsWith('/auth/refresh') ? status : 401),
    );
    await expect(apiFetch('/protected')).rejects.toThrow();
    expect(await readCredentials()).toEqual(previous);
  },
);

test('offline refresh preserves credentials and a later retry can restore the session', async () => {
  global.fetch = jest.fn(async (url) => {
    if (String(url).endsWith('/auth/refresh')) throw new Error('offline');
    return response(401);
  });
  await expect(apiFetch('/protected')).rejects.toThrow('offline');
  expect(await readCredentials()).toEqual(previous);
  global.fetch = jest.fn(async (url, options) =>
    String(url).endsWith('/auth/refresh')
      ? response(200, next)
      : response(
          new Headers(options?.headers).get('Authorization') ===
            'Bearer new-access'
            ? 200
            : 401,
        ),
  );
  expect((await apiFetch('/protected')).status).toBe(200);
  expect(await readCredentials()).toEqual(next);
});

test('a delayed successful response is rejected after an account change', async () => {
  const late = deferred<Response>();
  global.fetch = jest.fn(() => late.promise);
  const result = expect(apiFetch('/private-profile')).rejects.toThrow(
    'Session changed',
  );
  await tick();
  await storeCredentials(next);
  late.resolve(response(200, { privateData: 'previous account' }));
  await result;
  expect(await readCredentials()).toEqual(next);
});

test('a delayed retried response is rejected after logout', async () => {
  const late = deferred<Response>();
  global.fetch = jest.fn(async (url, options) => {
    if (String(url).endsWith('/auth/refresh')) return response(200, next);
    return new Headers(options?.headers).get('Authorization') ===
      'Bearer old-access'
      ? response(401)
      : late.promise;
  });
  const result = expect(apiFetch('/private-profile')).rejects.toThrow(
    'Session changed',
  );
  await tick();
  await storeCredentials(null);
  late.resolve(response(200));
  await result;
});

test('logout clears local credentials before remote completion and cannot erase a new login', async () => {
  const remote = deferred<Response>();
  global.fetch = jest.fn(() => remote.promise);
  const logout = useSession.getState().logout();
  await tick();
  expect(await readCredentials()).toBeNull();
  await storeCredentials(next);
  remote.resolve(response(204));
  await logout;
  expect(await readCredentials()).toEqual(next);
});

test('failed remote logout still clears local credentials and reports revocation failure', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(useSession.getState().logout()).rejects.toThrow('offline');
  expect(await readCredentials()).toBeNull();
  expect(useSession.getState().session).toBeNull();
});

test('restoration with an expired refresh token ends signed out without retry loop', async () => {
  global.fetch = jest.fn(async () => response(401));
  await useSession.getState().loadSession();
  expect(await readCredentials()).toBeNull();
  expect(useSession.getState()).toMatchObject({
    session: null,
    isLoading: false,
    error: null,
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('absent credentials restore signed out without an identity request', async () => {
  await storeCredentials(null);
  global.fetch = jest.fn();
  await useSession.getState().loadSession();
  expect(useSession.getState()).toMatchObject({
    session: null,
    isLoading: false,
    error: null,
  });
  expect(global.fetch).not.toHaveBeenCalled();
});

test('forbidden resource does not rotate or destroy an otherwise valid session', async () => {
  global.fetch = jest.fn(async () => response(403));
  expect((await apiFetch('/forbidden')).status).toBe(403);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(await readCredentials()).toEqual(previous);
});

test('a response body finishing after account change cannot return private JSON', async () => {
  const body = deferred<unknown>();
  global.fetch = jest.fn(async () => ({
    ...response(200),
    json: () => body.promise,
  }));
  const result = expect(apiJson('/private-profile')).rejects.toThrow(
    'Session changed',
  );
  await tick();
  await storeCredentials(next);
  body.resolve({ privateData: 'previous account' });
  await result;
});

test('Google account without an authentication phone restores normally', async () => {
  await storeCredentials(previous);
  global.fetch = jest.fn().mockResolvedValue(
    response(200, {
      id: 'google-user',
      phone: null,
      contactPhone: null,
      fullName: 'Fictional Google User',
      roles: [],
      onboardingState: 'NOT_STARTED',
      onboardingStep: null,
    }),
  );
  await useSession.getState().loadSession();
  expect(useSession.getState().session?.userId).toBe('google-user');
  expect(useSession.getState().session?.phone).toBe('');
  expect(useSession.getState().error).toBeNull();
});
