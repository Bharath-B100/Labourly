import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action } from './ui';
type State = {
  status: string;
  nextAction: 'START' | 'COMPLETE' | null;
  confirmedByMe: boolean;
  confirmedByOther: boolean;
};
export function BookingLifecycleControls({
  bookingId,
  onChanged,
}: {
  bookingId: string;
  onChanged: () => void;
}) {
  const account = useSession((s) => s.session?.userId);
  if (!account) return null;
  return (
    <Controls
      key={`${account}:${bookingId}`}
      account={account}
      bookingId={bookingId}
      onChanged={onChanged}
    />
  );
}
function Controls({
  account,
  bookingId,
  onChanged,
}: {
  account?: string;
  bookingId: string;
  onChanged: () => void;
}) {
  const cache = useQueryClient();
  const [error, setError] = useState('');
  const pending = useRef(false);
  const key = ['booking-lifecycle', account, bookingId];
  const state = useQuery({
    queryKey: key,
    enabled: !!account,
    queryFn: () => apiJson<State>(`/api/v1/bookings/${bookingId}/lifecycle`),
    refetchInterval: 10000,
  });
  const lastStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = state.data?.status;
    if (!status) return;
    if (lastStatus.current && status !== lastStatus.current) onChanged();
    lastStatus.current = status;
  }, [state.data?.status, onChanged]);
  const confirm = useMutation({
    mutationFn: (action: string) =>
      apiJson<State>(`/api/v1/bookings/${bookingId}/lifecycle`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    onSuccess: async (value) => {
      if (useSession.getState().session?.userId !== account) return;
      cache.setQueryData(key, value);
      onChanged();
      await cache.invalidateQueries({ queryKey: ['my-bookings', account] });
    },
    onError: (e) => {
      if (useSession.getState().session?.userId === account)
        setError(
          `Could not confirm whether your response was recorded. Retry safely. ${e.message}`,
        );
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  return (
    <View
      style={{
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
      }}
    >
      <Text accessibilityRole="header" style={{ fontWeight: '700' }}>
        Work progress
      </Text>
      {state.isLoading && <Text>Loading progress…</Text>}
      {state.isError && (
        <>
          <Text>Could not load work progress.</Text>
          <Action
            label="Retry work progress"
            onPress={() => void state.refetch()}
          />
        </>
      )}
      {state.data && (
        <>
          <Text>Status: {state.data.status.replaceAll('_', ' ')}</Text>
          {state.data.nextAction && (
            <>
              <Text>
                Both customer and worker must confirm{' '}
                {state.data.nextAction === 'START'
                  ? 'that work has started'
                  : 'that work is complete'}
                . Confirm only if you agree. Contact support if there is a
                disagreement.
              </Text>
              <Text>
                {state.data.confirmedByOther
                  ? 'The other participant has confirmed.'
                  : 'Waiting for the other participant’s confirmation.'}
              </Text>
              <Action
                label={
                  state.data.confirmedByMe
                    ? 'Your confirmation is recorded'
                    : state.data.nextAction === 'START'
                      ? 'Confirm work has started'
                      : 'Confirm work is complete'
                }
                disabled={state.data.confirmedByMe || confirm.isPending}
                loading={confirm.isPending}
                onPress={() => {
                  if (pending.current || !state.data?.nextAction) return;
                  pending.current = true;
                  setError('');
                  confirm.mutate(state.data.nextAction);
                }}
              />
            </>
          )}
        </>
      )}
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
    </View>
  );
}
