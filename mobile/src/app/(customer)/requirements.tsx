import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyRequirements, RequirementView } from '../../api/marketplace';
import { RequirementCard } from '../../components/RequirementCard';
import { useFocusEffect } from 'expo-router';

export default function RequirementsScreen() {
  const [requirements, setRequirements] = useState<RequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white shadow-sm z-10 border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">
          My Requirements
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetchReqs}
              className="bg-teal-800 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : requirements.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <Text className="text-slate-800 text-lg font-semibold mb-2">
              No requirements yet
            </Text>
            <Text className="text-slate-500 text-center">
              Post a requirement to start finding workers for your job.
            </Text>
          </View>
        ) : (
          requirements.map((req) => (
            <RequirementCard key={req.id} requirement={req} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
