import { requireOptionalNativeModule } from 'expo';
import { publicJson } from '../api/client';
import { googleCredentials, clearGoogleSession } from '../auth/google';
jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
jest.mock('../api/client', () => ({ publicJson: jest.fn() }));
jest.mock('expo-secure-store', () => ({}));
const native = { signIn: jest.fn(), clearSession: jest.fn() };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(requireOptionalNativeModule).mockReturnValue(native);
  jest.mocked(publicJson).mockResolvedValueOnce({
    challenge: 'signed-challenge',
    nonce: 'a'.repeat(64),
  });
});
test('passes server nonce to Google and exchanges token through existing backend', async () => {
  native.signIn.mockResolvedValue({
    cancelled: false,
    idToken: 'google-token',
  });
  jest
    .mocked(publicJson)
    .mockResolvedValueOnce({ accessToken: 'access', refreshToken: 'refresh' });
  expect(await googleCredentials()).toEqual({
    accessToken: 'access',
    refreshToken: 'refresh',
  });
  expect(native.signIn).toHaveBeenCalledWith(
    expect.stringMatching(/apps.googleusercontent.com$/),
    'a'.repeat(64),
  );
  expect(publicJson).toHaveBeenNthCalledWith(
    1,
    '/api/v1/auth/google/challenge',
    {},
    90_000,
  );
  expect(publicJson).toHaveBeenLastCalledWith(
    '/api/v1/auth/google',
    {
      challenge: 'signed-challenge',
      idToken: 'google-token',
    },
    90_000,
  );
});
test('cancellation never exchanges a token', async () => {
  native.signIn.mockResolvedValue({ cancelled: true });
  expect(await googleCredentials()).toBeNull();
  expect(publicJson).toHaveBeenCalledTimes(1);
});
test('missing native module fails before network access', async () => {
  jest.mocked(requireOptionalNativeModule).mockReturnValue(null);
  await expect(googleCredentials()).rejects.toThrow('updated Android');
  expect(publicJson).not.toHaveBeenCalled();
});
test('missing token fails closed', async () => {
  native.signIn.mockResolvedValue({ cancelled: false });
  await expect(googleCredentials()).rejects.toThrow('did not return');
  expect(publicJson).toHaveBeenCalledTimes(1);
});
test('backend rejection is visible and permits a fresh retry', async () => {
  native.signIn.mockResolvedValue({ cancelled: false, idToken: 'token' });
  jest.mocked(publicJson).mockRejectedValueOnce(new Error('expired challenge'));
  await expect(googleCredentials()).rejects.toThrow('expired challenge');
  jest
    .mocked(publicJson)
    .mockResolvedValueOnce({ challenge: 'new', nonce: 'b'.repeat(64) })
    .mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });
  await expect(googleCredentials()).resolves.toEqual({
    accessToken: 'a',
    refreshToken: 'r',
  });
});
test('concurrent login is rejected until first chooser settles', async () => {
  let finish!: (value: { cancelled: boolean }) => void;
  native.signIn.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = googleCredentials();
  await Promise.resolve();
  await expect(googleCredentials()).rejects.toThrow('already in progress');
  finish({ cancelled: true });
  await first;
});
test('provider session cleanup delegates to native module', async () => {
  await clearGoogleSession();
  expect(native.clearSession).toHaveBeenCalledTimes(1);
});
