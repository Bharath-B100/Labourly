import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrades, postRequirement, Trade } from '../../api/marketplace';
import { useRouter } from 'expo-router';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tradeId: z.string().min(1, 'Please select a trade'),
  skillIds: z.array(z.string()).min(1, 'Please select at least one skill'),
  workerCount: z.number().min(1, 'Must need at least 1 worker'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  stateCode: z.string().min(2, 'State Code is required (e.g. KA)'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  startsInDays: z.number().min(0, 'Start day must be valid'),
});

export default function PostRequirementScreen() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('Urgent Carpenter for Furniture Repair');
  const [description, setDescription] = useState(
    'Need a carpenter for furniture repair work.',
  );
  const [tradeId, setTradeId] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [workerCount, setWorkerCount] = useState('1');
  const [city, setCity] = useState('Bengaluru');
  const [district, setDistrict] = useState('Bengaluru');
  const [stateCode, setStateCode] = useState('KA');
  const [startsInDays, setStartsInDays] = useState('1'); // Tomorrow
  const [durationDays, setDurationDays] = useState('2');

  // Hardcoded for Phase 3 fixture matching
  const [lat] = useState('12.9716');
  const [lng] = useState('77.5946');

  useEffect(() => {
    getTrades().then(setTrades).catch(console.error);
  }, []);

  const selectedTrade = trades.find((t) => t.id === tradeId);

  const toggleSkill = (id: string) => {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    try {
      const parsedStartsIn = parseInt(startsInDays) || 0;
      const parsedDuration = parseInt(durationDays) || 1;

      const data = {
        title,
        description,
        tradeId,
        skillIds,
        workerCount: parseInt(workerCount) || 0,
        city,
        district,
        stateCode,
        durationDays: parsedDuration,
        startsInDays: parsedStartsIn,
      };

      formSchema.parse(data);

      setLoading(true);
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + parsedStartsIn);
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + parsedDuration);

      const payload = {
        title,
        description,
        tradeId,
        skillIds,
        workerCount: data.workerCount,
        city,
        district,
        stateCode,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      };

      await postRequirement(payload);
      Alert.alert('Success', 'Requirement posted successfully', [
        { text: 'OK', onPress: () => router.push('/requirements') },
      ]);
    } catch (e: any) {
      if (e && e.name === 'ZodError') {
        Alert.alert(
          'Validation Error',
          e.errors?.[0]?.message || 'Invalid input',
        );
      } else {
        Alert.alert('Error', e.message || 'Failed to post requirement');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">
          Post Requirement
        </Text>
      </View>
      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="font-semibold text-slate-700 mb-1">Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Need 2 Carpenters for woodwork"
          className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4"
        />

        <Text className="font-semibold text-slate-700 mb-2">
          Trade required
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {trades.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                setTradeId(t.id);
                setSkillIds([]);
              }}
              className={`px-4 py-2 rounded-full border ${tradeId === t.id ? 'bg-teal-800 border-teal-800' : 'bg-white border-slate-300'}`}
            >
              <Text
                className={`${tradeId === t.id ? 'text-white' : 'text-slate-700'}`}
              >
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedTrade &&
          selectedTrade.skills &&
          selectedTrade.skills.length > 0 && (
            <View className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Text className="font-semibold text-slate-700 mb-2">
                Required Skills
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedTrade.skills.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => toggleSkill(s.id)}
                    className={`px-3 py-1.5 rounded-full border ${skillIds.includes(s.id) ? 'bg-teal-700 border-teal-700' : 'bg-white border-slate-300'}`}
                  >
                    <Text
                      className={`text-sm ${skillIds.includes(s.id) ? 'text-white' : 'text-slate-600'}`}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">
              Start in (days)
            </Text>
            <TextInput
              value={startsInDays}
              onChangeText={setStartsInDays}
              keyboardType="number-pad"
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
            <Text className="text-xs text-slate-500 mt-1">
              0 = today, 1 = tomorrow
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">
              Duration (days)
            </Text>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
          </View>
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">
              Workers Needed
            </Text>
            <TextInput
              value={workerCount}
              onChangeText={setWorkerCount}
              keyboardType="number-pad"
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">
              State Code
            </Text>
            <TextInput
              value={stateCode}
              onChangeText={setStateCode}
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
          </View>
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-700 mb-1">District</Text>
            <TextInput
              value={district}
              onChangeText={setDistrict}
              className="border border-slate-300 rounded-lg p-3 bg-slate-50"
            />
          </View>
        </View>

        <Text className="font-semibold text-slate-700 mb-1">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the job in detail"
          multiline
          numberOfLines={3}
          className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-6"
          style={{ textAlignVertical: 'top' }}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-xl items-center justify-center ${loading ? 'bg-teal-600' : 'bg-teal-800'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Post Requirement
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
