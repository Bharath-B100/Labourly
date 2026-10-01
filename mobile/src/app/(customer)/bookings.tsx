import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getMyBookings, BookingView } from '../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed',
  PER_DAY: '/day',
  PER_WORKER_PER_DAY: '/worker/day',
};

function BookingCard({ booking }: { booking: BookingView }) {
  const color = STATUS_COLOR[booking.status] ?? '#6b7280';
  const starts = new Date(booking.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const ends = new Date(booking.endsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  const pricing = PRICING_LABEL[booking.pricingBasis] ?? '';

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-slate-900 font-semibold text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {booking.requirementTitle}
        </Text>
        <View
          style={{ backgroundColor: color + '22', borderColor: color }}
          className="px-2 py-0.5 rounded-full border"
        >
          <Text style={{ color }} className="text-xs font-bold">
            {booking.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="person-outline" size={14} color="#64748b" />
        <Text className="text-slate-600 text-sm ml-1">{booking.workerName}</Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={14} color="#64748b" />
        <Text className="text-slate-600 text-sm ml-1">
          {starts} – {ends}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="cash-outline" size={14} color="#0d9488" />
        <Text className="text-teal-700 font-semibold text-sm ml-1">
          ₹{Number(booking.amount).toLocaleString('en-IN')}
          <Text className="font-normal text-slate-500">{pricing}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = async () => {
    try {
      setLoading(true);
      setError('');
      setBookings(await getMyBookings());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetch(); }, []));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-900">My Bookings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetch}
              className="bg-teal-800 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">Retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : bookings.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <Ionicons name="briefcase-outline" size={40} color="#94a3b8" />
            <Text className="text-slate-800 text-lg font-semibold mt-3 mb-1">
              No bookings yet
            </Text>
            <Text className="text-slate-500 text-center text-sm">
              Accepted quotations will appear here as confirmed bookings.
            </Text>
          </View>
        ) : (
          bookings.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
