import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Welcome from '../app/index';
import { hasRole } from '../auth/session';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
test('initializes with truthful unfinished features', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });
  try {
    await render(
      <QueryClientProvider client={client}>
        <Welcome />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Foundation in progress')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Check backend connection' }),
    ).toBeTruthy();
  } finally {
    client.clear();
  }
});

test('handles backend network failure', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  try {
    await render(
      <QueryClientProvider client={client}>
        <Welcome />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Foundation in progress')).toBeTruthy();
    await fireEvent.press(screen.getByText('Check backend connection'));
    expect(await screen.findByText(/Unable to reach/)).toBeTruthy();
  } finally {
    global.fetch = originalFetch;
    client.clear();
  }
});
test('fails closed for unauthenticated and wrong-role sessions', () => {
  expect(hasRole(null, 'WORKER')).toBe(false);
  expect(hasRole({ userId: 'synthetic', roles: ['CUSTOMER'] }, 'WORKER')).toBe(
    false,
  );
  expect(hasRole({ userId: 'synthetic', roles: ['WORKER'] }, 'WORKER')).toBe(
    true,
  );
});
