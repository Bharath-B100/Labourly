import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { RequirementView } from '../api/marketplace';

export function RequirementCard({
  requirement,
}: {
  requirement: RequirementView;
}) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/requirement/${requirement.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusColor = getStatusColor(requirement.status);

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-slate-900 flex-1 mr-2">
          {requirement.title}
        </Text>
        <View className={`px-2 py-1 rounded border ${statusColor}`}>
          <Text className="text-xs font-bold">{requirement.status}</Text>
        </View>
      </View>

      <Text className="text-slate-600 font-medium mb-3">
        {requirement.trade}
      </Text>

      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-slate-600 ml-2">
          Location: {requirement.city}, {requirement.district}
        </Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-slate-600 ml-2">
          {requirement.workerCount} worker
          {requirement.workerCount > 1 ? 's' : ''} needed
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-sm text-slate-600 ml-2">
          Dates: {new Date(requirement.startsAt).toLocaleDateString()} -{' '}
          {new Date(requirement.endsAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}
