import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SupportQueue } from './SupportQueue';
const original = globalThis.fetch;
beforeEach(() => {
  sessionStorage.setItem('labourly_admin_token', 'fictional-token');
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  globalThis.fetch = original;
});
test('unauthorized queue shows error and retry without private records', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
  render(<SupportQueue />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'authorized administrator',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh requests' }));
  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
});
test('deletion can be reviewed but never marked erased', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: 'request-a',
        kind: 'ACCOUNT_DELETION',
        status: 'OPEN',
        details: 'Fictional request',
        resolution: null,
        createdAt: '',
      },
    ],
  });
  render(<SupportQueue />);
  expect(await screen.findByText('Fictional request')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Resolve support request' }),
  ).toBeNull();
  fireEvent.change(screen.getByLabelText('Response for request-a'), {
    target: { value: 'Reviewing request' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save review' }));
  await waitFor(() =>
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/admin/support/requests/request-a',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'IN_REVIEW',
          note: 'Reviewing request',
        }),
      }),
    ),
  );
});
test('empty queue is truthful', async () => {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => [] });
  render(<SupportQueue />);
  expect(await screen.findByText('No open requests.')).toBeInTheDocument();
});
