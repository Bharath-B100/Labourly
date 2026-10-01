import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOpportunities, RequirementView } from '../../api/marketplace';
import { RequirementCard } from '../../components/RequirementCard';
import { useFocusEffect, useRouter } from 'expo-router';

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
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white shadow-sm z-10 border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">
          Nearby Opportunities
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetchOpps}
              className="bg-teal-800 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : opportunities.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <Text className="text-slate-800 text-lg font-semibold mb-2">
              No jobs found
            </Text>
            <Text className="text-slate-500 text-center">
              There are no open requirements matching your trade in your service
              area.
            </Text>
          </View>
        ) : (
          opportunities.map((opp) => (
            <View key={opp.id}>
              <Pressable onPress={() => router.push(`/opportunity/${opp.id}`)}>
                <View pointerEvents="none">
                  <RequirementCard requirement={opp} />
                </View>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
