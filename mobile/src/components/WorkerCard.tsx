import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { WorkerCard as WorkerCardType } from '../api/marketplace';

export function WorkerCard({ worker }: { worker: WorkerCardType }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/worker/${worker.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-row gap-4 mb-4"
    >
      <View className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
        {worker.profilePhotoUrl ? (
          <Image
            source={{ uri: worker.profilePhotoUrl }}
            className="w-full h-full"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-teal-100">
            <Text className="text-teal-800 text-lg font-bold">
              {worker.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="text-lg font-bold text-slate-900">
            {worker.name}
          </Text>
          <View
            className={`px-2 py-1 rounded-full ${worker.verificationStatus === 'APPROVED' ? 'bg-green-100' : 'bg-slate-100'}`}
          >
            <Text
              className={`text-xs font-medium ${worker.verificationStatus === 'APPROVED' ? 'text-green-700' : 'text-slate-600'}`}
            >
              {worker.verificationStatus === 'APPROVED'
                ? 'VERIFIED'
                : worker.verificationStatus}
            </Text>
          </View>
        </View>
        <Text className="text-slate-600 mt-1">
          {worker.trade} • {worker.experienceYears}y exp
        </Text>
        <Text className="text-slate-500 mt-1 text-sm">
          {worker.city}, {worker.state}
        </Text>
        <View className="flex-row gap-2 mt-2">
          {worker.availability === 'AVAILABLE' && (
            <View className="bg-teal-50 px-2 py-1 rounded border border-teal-200">
              <Text className="text-teal-700 text-xs font-medium">
                Available Now
              </Text>
            </View>
          )}
          {worker.workerType === 'TEAM' && (
            <View className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
              <Text className="text-blue-700 text-xs font-medium">
                Team: {worker.teamSize}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
