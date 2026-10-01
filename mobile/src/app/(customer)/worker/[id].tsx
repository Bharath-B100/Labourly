import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWorkerDetails, WorkerCard } from '../../../api/marketplace';

export default function WorkerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [worker, setWorker] = useState<WorkerCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorker = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await getWorkerDetails(id as string);
      setWorker(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch worker details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorker();
  }, [id, fetchWorker]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#115e59" />
        <Text className="text-slate-500 mt-4">Loading full details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !worker) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">
          {error || 'Worker not found'}
        </Text>
        <Pressable
          onPress={fetchWorker}
          className="bg-teal-800 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Retry</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-teal-800">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-4 border-b border-slate-200 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-teal-800 text-lg">←</Text>
        </Pressable>
        <Text className="text-xl font-bold text-slate-900">Worker Profile</Text>
      </View>
      <ScrollView className="p-4">
        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-full bg-teal-100 items-center justify-center mb-4">
            {worker.profilePhotoUrl ? (
              <Text className="text-3xl font-bold text-teal-800">IMG</Text> // Fallback if no real Image component ready
            ) : (
              <Text className="text-3xl font-bold text-teal-800">
                {worker.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="text-2xl font-bold text-slate-900">
            {worker.name}
          </Text>
          <Text className="text-teal-800 font-semibold mt-1">
            {worker.trade}
          </Text>

          <View className="flex-row items-center mt-2">
            <View
              className={`w-3 h-3 rounded-full mr-2 ${worker.availability === 'AVAILABLE' ? 'bg-green-500' : 'bg-slate-400'}`}
            />
            <Text className="text-slate-600">
              {worker.availability === 'AVAILABLE'
                ? 'Available Now'
                : 'Currently Unavailable'}
            </Text>
          </View>
        </View>

        <View className="bg-slate-50 p-4 rounded-xl mb-4">
          <Text className="text-sm text-slate-500 mb-1">
            Verification Status
          </Text>
          <Text
            className={`font-semibold ${worker.verificationStatus === 'APPROVED' ? 'text-green-600' : 'text-amber-600'}`}
          >
            {worker.verificationStatus === 'APPROVED'
              ? '✓ Verified Professional'
              : 'Pending Verification'}
          </Text>
        </View>

        <View className="bg-slate-50 p-4 rounded-xl mb-4 flex-row justify-between">
          <View>
            <Text className="text-sm text-slate-500 mb-1">Experience</Text>
            <Text className="font-semibold text-slate-900">
              {worker.experienceYears} Years
            </Text>
          </View>
          <View>
            <Text className="text-sm text-slate-500 mb-1">Type</Text>
            <Text className="font-semibold text-slate-900">
              {worker.workerType}
            </Text>
          </View>
          {worker.teamSize && (
            <View>
              <Text className="text-sm text-slate-500 mb-1">Team Size</Text>
              <Text className="font-semibold text-slate-900">
                {worker.teamSize} people
              </Text>
            </View>
          )}
        </View>

        <View className="bg-slate-50 p-4 rounded-xl mb-4">
          <Text className="text-sm text-slate-500 mb-2">Location</Text>
          <Text className="font-semibold text-slate-900">
            {worker.city}, {worker.district}
          </Text>
          <Text className="text-sm text-slate-500 mt-1">{worker.state}</Text>
        </View>

        {worker.skills && worker.skills.length > 0 && (
          <View className="bg-slate-50 p-4 rounded-xl mb-8">
            <Text className="text-sm text-slate-500 mb-3">
              Specialized Skills
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {worker.skills.map((skill, index) => (
                <View
                  key={index}
                  className="bg-teal-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-teal-800 text-sm font-medium">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
