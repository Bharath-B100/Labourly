import React, { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LabourlySavedWorkersScreen,
  type SavedWorker,
} from '../../components/LabourlySavedWorkersScreen';
import { getSavedWorkerIds, getWorkerDetails } from '../../api/marketplace';
import { apiJson } from '../../api/client';
import { useSession } from '../../auth/session';
import { credentialEpoch } from '../../auth/credentials';

export default function SavedWorkers() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const cache = useQueryClient();
  const isCustomer = session?.roles.includes('CUSTOMER');
  const mutatingRef = useRef(false);

  // Fetch saved worker IDs and resolve accessible profiles
  const {
    data: workers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SavedWorker[]>({
    queryKey: ['saved-workers-list', session?.userId],
    enabled: !!session?.userId && !!isCustomer,
    queryFn: async () => {
      const ids = await getSavedWorkerIds(0);
      if (!ids || ids.length === 0) return [];

      // Resolve profiles with hidden-worker privacy preservation
      const results = await Promise.allSettled(
        ids.map((id) => getWorkerDetails(id)),
      );

      const items: SavedWorker[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          const w = res.value;
          const locParts = [w.city, w.district, w.state]
            .map((s) => (s ? String(s).trim() : ''))
            .filter(
              (s) =>
                s.length > 0 &&
                s.toLowerCase() !== 'null' &&
                s.toLowerCase() !== 'undefined',
            );
          const uniqueLoc = locParts
            .filter((item, idx) => locParts.indexOf(item) === idx)
            .join(', ');

          items.push({
            id: w.id,
            name: w.name,
            trade: w.trade,
            rating: null, // do not fabricate
            dailyRate: null, // do not fabricate, truthfully "Price by quotation"
            location: uniqueLoc || 'Location on quotation',
            experienceYears: w.experienceYears,
            profilePhotoUrl: w.profilePhotoUrl,
            isSaved: true,
          });
        }
      }
      return items;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      workerId,
      save,
      userId,
      epoch,
    }: {
      workerId: string;
      save: boolean;
      userId: string;
      epoch: number;
    }) => {
      if (
        credentialEpoch() !== epoch ||
        useSession.getState().session?.userId !== userId
      ) {
        throw new Error('Account changed');
      }
      return apiJson<{ saved: boolean }>(`/api/v1/saved-workers/${workerId}`, {
        method: save ? 'PUT' : 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      if (useSession.getState().session?.userId !== variables.userId) return;
      void cache.invalidateQueries({
        queryKey: ['saved-workers-list', variables.userId],
      });
      void cache.invalidateQueries({
        queryKey: ['saved-worker', variables.userId, variables.workerId],
      });
    },
    onSettled: () => {
      mutatingRef.current = false;
    },
  });

  const handleToggleSave = (workerId: string, isSaved: boolean) => {
    if (mutatingRef.current || !session?.userId) return;
    mutatingRef.current = true;
    toggleMutation.mutate({
      workerId,
      save: isSaved,
      userId: session.userId,
      epoch: credentialEpoch(),
    });
  };

  return (
    <LabourlySavedWorkersScreen
      workers={workers ?? []}
      loading={isLoading}
      error={
        isError ? (error?.message ?? 'Could not load saved workers') : null
      }
      onRefresh={() => void refetch()}
      onBack={() => router.back()}
      onSelectWorker={(worker) => {
        router.push(`/worker/${worker.id}` as never);
      }}
      onToggleSave={handleToggleSave}
      onExploreWorkers={() => {
        router.push('/(customer)/discover');
      }}
    />
  );
}
