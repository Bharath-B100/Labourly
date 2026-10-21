import type { QueryClient } from '@tanstack/react-query';
import { useSession } from './session';

/** Private cached data never survives an account change, including token expiry. */
export function observeQueryAccount(client: QueryClient) {
  return useSession.subscribe((state, previous) => {
    if (state.session?.userId !== previous.session?.userId) client.clear();
  });
}
