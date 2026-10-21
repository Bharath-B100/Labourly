import { GlassBackdrop, PageHeading, GlassCard } from '../../components/theme';
import { Action } from '../../components/ui';
import { NotificationBell } from '../../components/NotificationBell';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyRequirements, RequirementView } from '../../api/marketplace';
import { RequirementCard } from '../../components/RequirementCard';
import { useFocusEffect, useRouter } from 'expo-router';

export default function RequirementsScreen() {
  const [requirements, setRequirements] = useState<RequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchReqs = async () => {
    try {
      setLoading(true);
      setError('');
      const page = await getMyRequirements();
      setRequirements(page.items);
    } catch (e: any) {
      setError(e.message || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReqs();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <PageHeading
        title="My jobs"
        subtitle="Your posted requirements, in one place."
        right={<NotificationBell />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <View style={{ gap: 12, marginBottom: 20 }}>
          <Action
            label="Post a requirement"
            onPress={() => router.push('/(customer)/post')}
          />
          <Action
            label="My bookings"
            variant="secondary"
            onPress={() => router.push('/(customer)/bookings')}
          />
        </View>
        {!loading && !error && requirements.length > 0 && (
          <Text style={{ fontSize: 14, color: '#202326', marginBottom: 16 }}>
            {requirements.length} requirements
          </Text>
        )}
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-ink text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetchReqs} />
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#202326" />
        ) : requirements.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Text className="text-ink text-lg font-semibold mb-2">
              No requirements yet
            </Text>
            <Text className="text-muted text-center">
              Post a requirement to start finding workers for your job.
            </Text>
          </View>
        ) : (
          requirements.map((req) => (
            <GlassCard key={req.id} style={{ marginBottom: 20, padding: 20 }}>
              <RequirementCard requirement={req} embedded />
              {req.status === 'OPEN' && (
                <Action
                  label="View Quotes"
                  variant="primary"
                  onPress={() =>
                    router.push(`/requirement/quotes?id=${req.id}` as any)
                  }
                />
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
