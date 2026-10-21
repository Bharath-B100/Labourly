import { useRef } from 'react';
import { credentialEpoch } from '../auth/credentials';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action } from './ui';

export function SaveWorkerButton({ workerId }: { workerId: string }) {
  const session = useSession((state) => state.session);
  const cache = useQueryClient();
  const pending = useRef(false);
  const key = ['saved-worker', session?.userId, workerId];
  const allowed = session?.roles.includes('CUSTOMER');
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      apiJson<{ saved: boolean }>(`/api/v1/saved-workers/${workerId}`),
    enabled: !!allowed,
  });
  const mutation = useMutation({
    scope: { id: `saved-worker:${session?.userId}:${workerId}` },
    mutationFn: async ({
      saved,
      epoch,
      userId,
      targetId,
    }: {
      saved: boolean;
      epoch: number;
      userId: string;
      targetId: string;
    }) => {
      if (
        credentialEpoch() !== epoch ||
        useSession.getState().session?.userId !== userId
      )
        throw new Error('Account changed');
      await cache.cancelQueries({
        queryKey: ['saved-worker', userId, targetId],
      });
      if (
        credentialEpoch() !== epoch ||
        useSession.getState().session?.userId !== userId
      )
        throw new Error('Account changed');
      return apiJson<{ saved: boolean }>(`/api/v1/saved-workers/${targetId}`, {
        method: saved ? 'DELETE' : 'PUT',
      });
    },
    onSuccess: (result, { epoch, userId, targetId }) => {
      if (
        credentialEpoch() !== epoch ||
        useSession.getState().session?.userId !== userId
      )
        return;
      cache.setQueryData(['saved-worker', userId, targetId], result);
      void cache.invalidateQueries({
        queryKey: ['saved-workers', userId],
      });
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  if (!allowed) return null;
  return (
    <View style={{ gap: 8 }}>
      <Action
        label={
          query.isError
            ? 'Retry saved status'
            : query.data?.saved
              ? 'Remove from saved workers'
              : 'Save worker'
        }
        variant="secondary"
        loading={query.isPending || mutation.isPending}
        onPress={() => {
          if (query.isError) {
            void query.refetch();
            return;
          }
          if (pending.current || query.isPending || mutation.isPending) return;
          pending.current = true;
          mutation.mutate({
            saved: query.data?.saved ?? false,
            epoch: credentialEpoch(),
            userId: session!.userId,
            targetId: workerId,
          });
        }}
      />
      {mutation.isError && (
        <Text accessibilityRole="alert">
          Could not update saved workers. Please try again.
        </Text>
      )}
    </View>
  );
}
