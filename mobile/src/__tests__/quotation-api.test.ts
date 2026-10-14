import {
  cancelBooking,
  editQuote,
  rejectQuote,
  withdrawQuote,
  submitQuote,
  acceptQuote,
} from '../api/quotations';
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});
const payload = {
  amount: 1500,
  pricingBasis: 'PER_DAY' as const,
  startsAt: '2031-01-01T00:00:00Z',
  durationDays: 2,
};
test.each([
  ['cancel', () => cancelBooking('booking', 'Changed plans')],
  ['edit', () => editQuote('quote', payload)],
  ['reject', () => rejectQuote('quote')],
  ['withdraw', () => withdrawQuote('quote')],
] as const)(
  '%s propagates server conflicts instead of reporting success',
  async (_name, action) => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Already finalized' }),
    } as Response);
    await expect(action()).rejects.toMatchObject({
      status: 409,
      message: 'Already finalized',
    });
  },
);
test('successful empty mutations accept HTTP 204 and UUID responses remain strings', async () => {
  jest
    .mocked(global.fetch)
    .mockResolvedValue({ ok: true, status: 204 } as Response);
  await expect(
    cancelBooking('booking', 'Changed plans'),
  ).resolves.toBeUndefined();
  jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => 'generated-id',
  } as Response);
  await expect(submitQuote('requirement', payload)).resolves.toBe(
    'generated-id',
  );
  await expect(acceptQuote('quote')).resolves.toBe('generated-id');
});
