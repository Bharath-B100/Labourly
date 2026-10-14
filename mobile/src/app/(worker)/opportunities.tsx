import { GlassBackdrop } from '../../components/theme';
import { Action } from '../../components/ui';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOpportunities, RequirementView } from '../../api/marketplace';
import { RequirementCard } from '../../components/RequirementCard';
import { useFocusEffect, useRouter } from 'expo-router';

import { NotificationBell } from '../../components/NotificationBell';

export default function OpportunitiesScreen() {
  const [opportunities, setOpportunities] = useState<RequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchOpps = async () => {
    try {
      setLoading(true);
      setError('');
      const page = await getOpportunities();
      setOpportunities(page.items);
    } catch (e: any) {
      setError(e.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOpps();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(20, 92, 88, 0.1)',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#104C49' }}>
          Nearby Opportunities
        </Text>
        <NotificationBell />
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-700 text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetchOpps} />
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#145C58" />
        ) : opportunities.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Text className="text-ink text-lg font-semibold mb-2">
              No jobs found
            </Text>
            <Text className="text-muted text-center">
              There are no open requirements matching your trade in your service
              area.
            </Text>
          </View>
        ) : (
          opportunities.map((opp) => (
            <RequirementCard
              key={opp.id}
              requirement={opp}
              onPress={() => router.push(`/(worker)/opportunity/${opp.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
