import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiJson } from '../../../api/client';

export default function OpportunityDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const req = await apiJson<any>(`/api/v1/requirements/${id}`);
        setRequirement(req);
      } catch (e: any) {
        setError(e.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">
          Opportunity Details
        </Text>
      </View>
      <ScrollView className="p-4">
        {loading ? (
          <ActivityIndicator size="large" color="#115e59" className="mt-8" />
        ) : error ? (
          <Text className="text-red-500 text-center">{error}</Text>
        ) : requirement ? (
          <View>
            <Text className="text-2xl font-bold text-slate-900 mb-2">
              {requirement.title}
            </Text>
            <Text className="text-slate-600 font-medium mb-4">
              {requirement.trade}
            </Text>

            <View className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <Text className="text-slate-800 mb-4">
                {requirement.description}
              </Text>

              <View className="flex-row items-center mb-2">
                <Text className="text-slate-700 ml-2">
                  Location: {requirement.city}, {requirement.district}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Text className="text-slate-700 ml-2">
                  {requirement.workerCount} workers needed
                </Text>
              </View>

              <View className="flex-row items-center">
                <Text className="text-slate-700 ml-2">
                  Dates: {new Date(requirement.startsAt).toLocaleDateString()}{' '}
                  to {new Date(requirement.endsAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* In a real app we might show match reasons here if they were provided in the detailed endpoint */}

            <View className="bg-teal-50 p-4 rounded-xl border border-teal-200 mt-4">
              <Text className="text-teal-800 font-bold text-center">
                Acceptance and Quoting features are coming in Phase 4!
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
