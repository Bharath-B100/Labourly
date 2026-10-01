import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getRequirementMatches,
  updateRequirementStatus,
  MatchedWorker,
} from '../../../api/marketplace';
import { WorkerCard } from '../../../components/WorkerCard';

export default function RequirementDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getRequirementMatches(id as string);
        setMatches(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [id]);

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
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white shadow-sm z-10 border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">
          Requirement Details
        </Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <Text className="text-lg font-bold text-slate-900 mb-2">
            Manage Requirement
          </Text>
          <View className="flex-row gap-4 mt-2">
            <Pressable
              onPress={handleClose}
              className="flex-1 bg-slate-800 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold">Close Job</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              className="flex-1 bg-red-100 py-3 rounded-lg items-center border border-red-200"
            >
              <Text className="text-red-700 font-bold">Cancel Job</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-lg font-bold text-slate-900 mb-4">
          Suitable Workers ({matches.length})
        </Text>

        {error ? (
          <Text className="text-red-500">{error}</Text>
        ) : loading ? (
          <ActivityIndicator size="large" color="#115e59" />
        ) : matches.length === 0 ? (
          <View className="items-center py-6 bg-white rounded-xl border border-slate-200">
            <Text className="text-slate-600">
              No suitable workers found yet.
            </Text>
            <Text className="text-slate-500 text-sm mt-2 text-center px-4">
              We could not find any workers matching your exact criteria at this
              moment.
            </Text>
          </View>
        ) : (
          matches.map((match, i) => (
            <View key={match.worker.id} className="mb-4">
              <WorkerCard worker={match.worker} />
              <View className="bg-teal-50 p-3 rounded-b-xl border border-t-0 border-teal-100 -mt-6 pt-8 z-[-1]">
                <Text className="text-teal-800 font-semibold mb-1">
                  Match Reasons:
                </Text>
                {match.reasons.map((r, idx) => (
                  <Text key={idx} className="text-teal-700 text-sm">
                    • {r.explanation}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
