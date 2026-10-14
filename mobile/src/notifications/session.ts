import type { QueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/session';
import { credentialEpoch } from '../auth/credentials';

export async function forNotificationAccount<T>(
  userId: string,
  action: () => Promise<T>,
): Promise<T> {
  const epoch = credentialEpoch();
  const check = () => {
    if (
      useSession.getState().session?.userId !== userId ||
      credentialEpoch() !== epoch
    )
      throw new Error('Account changed. Open notifications again.');
  };
  check();
  const result = await action();
  check();
  return result;
}

export function observeNotificationAccount(client: QueryClient) {
  return useSession.subscribe((state, previous) => {
    if (state.session?.userId === previous.session?.userId) return;
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0].startsWith('notifications-'),
    };
    void client.cancelQueries(filters);
    client.removeQueries(filters);
  });
}
