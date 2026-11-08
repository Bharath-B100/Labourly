import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSession } from '../auth/session';

/** Refresh visible server data without overlapping requests or retaining another account's response. */
export function useFocusedResource<T>(load: () => Promise<T>) {
  const account = useSession((state) => state.session?.userId);
  const [result, setResult] = useState<{
    account: string | undefined;
    source: typeof load;
    data: T | null;
    error: string;
  }>({ account, source: load, data: null, error: '' });
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      let pending = false;
      let foreground =
        AppState.currentState == null || AppState.currentState === 'active';
      const refresh = async () => {
        if (!alive || pending || !foreground) return;
        pending = true;
        setLoading(true);
        try {
          const data = await load();
          if (alive && useSession.getState().session?.userId === account)
            setResult({ account, source: load, data, error: '' });
        } catch (error) {
          if (alive && useSession.getState().session?.userId === account)
            setResult({
              account,
              source: load,
              data: null,
              error:
                error instanceof Error
                  ? error.message
                  : 'Could not load data. Please retry.',
            });
        } finally {
          pending = false;
          if (alive) setLoading(false);
        }
      };
      refreshRef.current = refresh;
      void refresh();
      const timer = setInterval(() => void refresh(), 15000);
      const listener = AppState.addEventListener('change', (state) => {
        foreground = state === 'active';
        if (foreground) void refresh();
      });
      return () => {
        alive = false;
        clearInterval(timer);
        listener.remove();
      };
    }, [load, account]),
  );
  return {
    data:
      result.account === account && result.source === load ? result.data : null,
    error:
      result.account === account && result.source === load ? result.error : '',
    loading,
    refresh: useCallback(() => refreshRef.current(), []),
  };
}
