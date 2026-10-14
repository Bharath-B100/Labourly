import { GlassBackdrop } from '../../../components/theme';
import { Action } from '../../../components/ui';
import { useEffect, useState, useCallback } from 'react';
import {
  Image,
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
  const [duration, setDuration] = useState('1 Day');

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
      <SafeAreaView className="flex-1 bg-canvas justify-center items-center">
        <ActivityIndicator size="large" color="#145C58" />
        <Text className="text-muted mt-4">Loading full details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !worker) {
    return (
      <SafeAreaView className="flex-1 bg-canvas justify-center items-center p-4">
        <Text className="text-red-700 text-center mb-4">
          {error || 'Worker not found'}
        </Text>
        <Action label="Retry" variant="secondary" onPress={fetchWorker} />
        <Action
          label="Go Back"
          variant="secondary"
          onPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      {/* Top Header */}
      <View className="px-4 pt-4 pb-4 flex-row items-center z-10 absolute top-0 left-0 right-0 mt-8">
        <Action label="←" variant="quiet" onPress={() => router.back()} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Top Profile Image & Basics */}
        <View className="items-center px-4 pt-20 pb-10">
          <View className="w-32 h-32 rounded-full bg-tinted items-center justify-center mb-5 border-4 border-surface shadow-md">
            {worker.profilePhotoUrl ? (
              <Image
                accessibilityLabel={`${worker.name} profile photo`}
                source={{ uri: worker.profilePhotoUrl }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <Text className="text-4xl font-bold text-accent">
                {worker.name.charAt(0).toUpperCase()}
              </Text>
            )}
            <View
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-surface ${worker.availability === 'AVAILABLE' ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </View>

          <Text className="text-3xl font-bold text-ink text-center leading-tight mb-2">
            {worker.name}
          </Text>

          {/* Trust Signals (Rule 12: Next to title) */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Text className="text-amber-500 text-lg mr-1">★</Text>
              <Text className="font-bold text-ink text-base">4.9</Text>
              <Text className="text-muted ml-1 text-base">(120)</Text>
            </View>
            <View className="w-1.5 h-1.5 rounded-full bg-outline" />
            <Text
              className={`font-semibold text-base ${worker.verificationStatus === 'APPROVED' ? 'text-green-700' : 'text-amber-700'}`}
            >
              {worker.verificationStatus === 'APPROVED'
                ? '✓ Verified'
                : 'Pending'}
            </Text>
          </View>

          <Text className="text-lg text-muted mt-3">{worker.trade}</Text>
        </View>

        {/* Scrollable Content Card (Rule 16) */}
        <View className="bg-surface rounded-t-3xl px-6 pt-10 pb-10 flex-1 shadow-sm -mt-6">
          {/* Quick Stats Grid (Rule 11: Soft dividers) */}
          <View className="flex-row justify-between mb-8">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-ink">
                {worker.experienceYears}
              </Text>
              <Text className="text-sm text-muted mt-1">Years Exp</Text>
            </View>
            <View className="w-[1px] bg-outline/40" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-ink capitalize">
                {worker.workerType.toLowerCase()}
              </Text>
              <Text className="text-sm text-muted mt-1">Type</Text>
            </View>
            {worker.teamSize && (
              <>
                <View className="w-[1px] bg-outline/40" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-ink">
                    {worker.teamSize}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Team Size</Text>
                </View>
              </>
            )}
          </View>

          {/* Location */}
          <View className="mb-8">
            <Text className="text-xs font-bold text-ink/60 uppercase tracking-widest mb-3">
              Location
            </Text>
            <Text className="text-lg text-ink font-medium">
              {worker.city}, {worker.district}
            </Text>
            <Text className="text-base text-muted mt-1">{worker.state}</Text>
          </View>

          {/* Skills (Rule 9: Consistent visual logic) */}
          {worker.skills && worker.skills.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-bold text-ink/60 uppercase tracking-widest mb-4">
                Specialized Skills
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {worker.skills.map((skill, index) => (
                  <View
                    key={index}
                    className="bg-tinted/40 border border-tinted/60 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-ink text-sm font-medium">
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Area (Rule 17) */}
      <View className="absolute bottom-0 left-0 right-0 bg-canvas/95 border-t border-outline/30 px-4 pt-4 pb-8 shadow-lg">
        {/* Predefined Options (Rule 18) */}
        <View className="flex-row gap-3 mb-4 justify-between">
          {['1 Day', '1 Week', '1 Month'].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setDuration(opt)}
              className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                duration === opt
                  ? 'bg-tinted/30 border-[#145C58]'
                  : 'bg-surface border-outline/60'
              }`}
            >
              <Text
                className={`font-semibold ${
                  duration === opt ? 'text-[#104C49]' : 'text-muted'
                }`}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Purchase Action (Rule 15: Clear Price) */}
        <Action
          label="Book Worker • ₹500/day"
          variant="primary"
          onPress={() => alert('Booking flow...')}
        />
      </View>
    </SafeAreaView>
  );
}
