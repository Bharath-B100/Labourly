import { View, Text, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { updateWorkerAvailability } from '../../api/marketplace';

export default function WorkerProfileScreen() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleAvailability = async (value: boolean) => {
    try {
      setLoading(true);
      const newStatus = value ? 'AVAILABLE' : 'UNAVAILABLE';
      await updateWorkerAvailability(newStatus);
      setIsAvailable(value);
      Alert.alert('Success', `You are now ${newStatus}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update availability');
      setIsAvailable(!value); // revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-slate-900 mb-6">
          Worker Profile
        </Text>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Availability Status
            </Text>
            <Text className="text-slate-500">
              {isAvailable
                ? 'You are visible to customers'
                : 'You are hidden from searches'}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#115e59" />
          ) : (
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#cbd5e1', true: '#115e59' }}
              thumbColor={'#ffffff'}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
