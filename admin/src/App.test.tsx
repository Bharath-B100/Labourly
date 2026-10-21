import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import App from './App';
import * as api from './api';
vi.mock('./api', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchHealth: vi.fn(),
  fetchWorkers: vi.fn(),
  fetchOpportunities: vi.fn(),
  fetchTrades: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getToken).mockReturnValue(null);
  vi.mocked(api.fetchHealth).mockResolvedValue({ status: 'UP' });
  vi.mocked(api.fetchWorkers).mockResolvedValue({
    items: [],
    total: 0,
    page: 0,
    size: 20,
  });
  vi.mocked(api.fetchOpportunities).mockResolvedValue({
    items: [],
    total: 0,
    page: 0,
    size: 20,
  });
  vi.mocked(api.fetchTrades).mockResolvedValue([]);
});
afterEach(cleanup);
test('signed-out users see login without private data requests', async () => {
  render(<App />);
  expect(await screen.findByText('Sign in with phone')).toBeInTheDocument();
  expect(api.fetchWorkers).not.toHaveBeenCalled();
  expect(api.fetchOpportunities).not.toHaveBeenCalled();
  expect(screen.queryByText('Live Dashboard')).toBeNull();
});
test('signed-in navigation opens current destinations and logout clears the token', async () => {
  vi.mocked(api.getToken).mockReturnValue('fictional-test-token');
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'Live Dashboard' }),
  ).toBeInTheDocument();
  for (const [button, heading] of [
    ['Workers', 'Workers'],
    ['Jobs', 'Job Requirements'],
    ['Trades', 'Trades Catalogue'],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(button) }));
    expect(
      await screen.findByRole('heading', { name: heading }),
    ).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button', { name: /Sign out/ }));
  expect(api.setToken).toHaveBeenCalledWith(null);
  expect(await screen.findByText('Sign in with phone')).toBeInTheDocument();
  expect(screen.queryByText('Trades Catalogue')).toBeNull();
});
