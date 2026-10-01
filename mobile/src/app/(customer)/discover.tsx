import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTrades,
  searchWorkers,
  Trade,
  WorkerCard as WorkerCardType,
} from '../../api/marketplace';
import { WorkerCard } from '../../components/WorkerCard';

export default function DiscoverScreen() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [workers, setWorkers] = useState<WorkerCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Test filters
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [radius, setRadius] = useState('15');
  const [availability] = useState('');

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const page = await searchWorkers({
        tradeId: selectedTrade || undefined,
        availability: availability || undefined,
        lat: parseFloat(lat) || undefined,
        lng: parseFloat(lng) || undefined,
        radiusKm: parseFloat(radius) || undefined,
      });
      setWorkers(page.items);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  }, [selectedTrade, availability, lat, lng, radius]);

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .catch(() => setError('Failed to load trades.'));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white shadow-sm z-10 border-b border-slate-200">
        <Text className="text-sm font-semibold text-slate-700 mb-2">Trade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <Pressable
            onPress={() => setSelectedTrade('')}
            className={`mr-2 px-4 py-2 rounded-full border ${selectedTrade === '' ? 'bg-teal-800 border-teal-800' : 'bg-white border-slate-300'}`}
          >
            <Text
              className={`${selectedTrade === '' ? 'text-white' : 'text-slate-700'}`}
            >
              All
            </Text>
          </Pressable>
          {trades.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setSelectedTrade(t.id)}
              className={`mr-2 px-4 py-2 rounded-full border ${selectedTrade === t.id ? 'bg-teal-800 border-teal-800' : 'bg-white border-slate-300'}`}
            >
              <Text
                className={`${selectedTrade === t.id ? 'text-white' : 'text-slate-700'}`}
              >
                {t.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row gap-2 mb-4">
          <View className="flex-1">
            <Text className="text-xs text-slate-500 mb-1">Lat</Text>
            <TextInput
              value={lat}
              onChangeText={setLat}
              className="border border-slate-300 rounded p-2 text-sm bg-slate-50"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-500 mb-1">Lng</Text>
            <TextInput
              value={lng}
              onChangeText={setLng}
              className="border border-slate-300 rounded p-2 text-sm bg-slate-50"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-500 mb-1">Radius (km)</Text>
            <TextInput
              value={radius}
              onChangeText={setRadius}
              className="border border-slate-300 rounded p-2 text-sm bg-slate-50"
            />
          </View>
        </View>

        <Pressable
          onPress={fetchWorkers}
          className="bg-teal-800 py-3 rounded-lg items-center justify-center"
        >
          <Text className="text-white font-bold text-base">Search Workers</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : workers.length === 0 ? (
          <Text className="text-center text-slate-500 mt-8">
            No workers found matching your criteria.
          </Text>
        ) : (
          workers.map((w) => <WorkerCard key={w.id} worker={w} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
