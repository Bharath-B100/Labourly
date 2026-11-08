import { Ionicons } from '@expo/vector-icons';
import { palette } from './theme';
import { useRef } from 'react';
import { credentialEpoch } from '../auth/credentials';
import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action } from './ui';

export function SaveWorkerButton({
  workerId,
  compact = false,
}: {
  workerId: string;
  compact?: boolean;
}) {
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
  const label = query.isError
    ? 'Retry saved status'
    : query.data?.saved
      ? 'Remove from saved workers'
      : 'Save worker';
  const loading = query.isPending || mutation.isPending;
  const onPress = () => {
    if (query.isError) {
      void query.refetch();
      return;
    }
    if (pending.current || loading) return;
    pending.current = true;
    mutation.mutate({
      saved: query.data?.saved ?? false,
      epoch: credentialEpoch(),
      userId: session!.userId,
      targetId: workerId,
    });
  };
  return (
    <View style={{ gap: 8, flexShrink: 1 }}>
      {compact ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={onPress}
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={palette.ink} />
          ) : (
            <Ionicons
              name={
                query.isError
                  ? 'refresh'
                  : query.data?.saved
                    ? 'heart'
                    : 'heart-outline'
              }
              size={24}
              color={query.data?.saved ? palette.yellow : palette.ink}
            />
          )}
        </Pressable>
      ) : (
        <Action
          label={label}
          variant="secondary"
          loading={loading}
          onPress={onPress}
        />
      )}
      {mutation.isError && (
        <Text accessibilityRole="alert">
          Could not update saved workers. Please try again.
        </Text>
      )}
    </View>
  );
}
