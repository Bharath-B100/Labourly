import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { requestOtp, verifyOtp } from './api';

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

test('successful OTP request accepts the backend empty 204 response', async () => {
  const json = vi.fn().mockRejectedValue(new SyntaxError('Empty response'));
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 204, json }),
  );
  await expect(requestOtp('+910000000000')).resolves.toBeUndefined();
  expect(json).not.toHaveBeenCalled();
});

test('verification still reads the returned tokens', async () => {
  const tokens = {
    accessToken: 'fictional-access',
    refreshToken: 'fictional-refresh',
  };
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => tokens }),
  );
  await expect(verifyOtp('+910000000000', '000000')).resolves.toEqual(tokens);
});

test('rejected OTP request remains an error', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    }),
  );
  await expect(requestOtp('+910000000000')).rejects.toThrow('429');
});
