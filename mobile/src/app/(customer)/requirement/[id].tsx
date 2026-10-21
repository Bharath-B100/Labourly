import { GlassBackdrop } from '../../../components/theme';
import { Action } from '../../../components/ui';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getRequirement,
  getRequirementMatches,
  updateRequirementStatus,
  MatchedWorker,
  RequirementView,
} from '../../../api/marketplace';
import { WorkerCard } from '../../../components/WorkerCard';

export default function RequirementDetailsScreen() {
  const { id, refresh } = useLocalSearchParams();
  const router = useRouter();
  const [requirement, setRequirement] = useState<RequirementView | null>(null);
  const [matches, setMatches] = useState<MatchedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [reqData, matchesData] = await Promise.all([
        getRequirement(id as string),
        getRequirementMatches(id as string),
      ]);
      setRequirement(reqData);
      setMatches(matchesData);
    } catch (e: any) {
      setError(e.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getRequirement(id as string),
      getRequirementMatches(id as string),
    ])
      .then(([req, workers]) => {
        if (mounted) {
          setError('');
          setRequirement(req);
          setMatches(workers);
        }
      })
      .catch((e: Error) => {
        if (mounted) setError(e.message || 'Failed to load details');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, refresh]);

  const handlePublish = async () => {
    Alert.alert(
      'Publish Requirement',
      'Are you sure you want to publish this requirement? It will be visible to matching workers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            try {
              setPublishing(true);
              await updateRequirementStatus(id as string, 'OPEN');
              Alert.alert('Success', 'Requirement published successfully');
              await fetchDetails();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.message || 'Failed to publish requirement',
              );
            } finally {
              setPublishing(false);
            }
          },
        },
      ],
    );
  };

  const handleClose = async () => {
    try {
      await updateRequirementStatus(id as string, 'CLOSED');
      Alert.alert('Success', 'Requirement closed');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to close requirement');
    }
  };

  const handleCancel = async () => {
    try {
      await updateRequirementStatus(id as string, 'CANCELLED');
      Alert.alert('Success', 'Requirement cancelled');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to cancel requirement');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface shadow-sm z-10 border-b border-outline flex-row justify-between items-center">
        <Text className="text-xl font-bold text-ink">Requirement Details</Text>
        {requirement && (
          <View className="bg-surface px-2 py-1 rounded">
            <Text className="text-xs font-bold text-muted">
              {requirement.status}
            </Text>
          </View>
        )}
      </View>
      <ScrollView className="flex-1 p-4">
        {error ? (
          <Text className="text-ink">{error}</Text>
        ) : loading ? (
          <ActivityIndicator size="large" color="#202326" />
        ) : (
          <>
            <View className="bg-surface p-4 rounded-2xl shadow-sm border border-outline mb-6">
              <Text className="text-lg font-bold text-ink mb-4">
                Manage Requirement
              </Text>

              <View className="gap-4">
                {requirement?.status === 'DRAFT' && (
                  <Action
                    label="Edit Draft"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/post',
                        params: { editId: id as string },
                      })
                    }
                  />
                )}
                {requirement?.status === 'DRAFT' && (
                  <Action
                    label="Publish Requirement"
                    variant="primary"
                    withArrow={false}
                    onPress={handlePublish}
                    loading={publishing}
                  />
                )}

                {(requirement?.status === 'DRAFT' ||
                  requirement?.status === 'OPEN') && (
                  <View className="flex-row gap-4">
                    {requirement?.status === 'OPEN' && (
                      <View className="flex-1">
                        <Action
                          label="Close Job"
                          variant="secondary"
                          withArrow={false}
                          onPress={handleClose}
                        />
                      </View>
                    )}
                    <View className="flex-1">
                      <Action
                        label="Cancel Job"
                        variant="danger"
                        onPress={handleCancel}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            <Text className="text-lg font-bold text-ink mb-4">
              Suitable Workers ({matches.length})
            </Text>

            {matches.length === 0 ? (
              <View className="items-center py-6 bg-surface rounded-xl border border-outline">
                <Text className="text-muted">
                  No suitable workers found yet.
                </Text>
                <Text className="text-muted text-sm mt-2 text-center px-4">
                  We could not find any workers matching your exact criteria at
                  this moment.
                </Text>
              </View>
            ) : (
              matches.map((match, i) => (
                <View key={match.worker.id} className="mb-4">
                  <WorkerCard worker={match.worker} />
                  <View className="bg-tinted p-3 rounded-b-xl border border-t-0 border-outline -mt-6 pt-8 z-[-1]">
                    <Text className="text-accent font-semibold mb-1">
                      Match Reasons:
                    </Text>
                    {match.reasons.map((r, idx) => (
                      <Text key={idx} className="text-accent text-sm">
                        • {r.explanation}
                      </Text>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
