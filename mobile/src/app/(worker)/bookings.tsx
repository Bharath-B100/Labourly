import { GlassBackdrop } from '../../components/theme';
import { Action } from '../../components/ui';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { getMyBookings, BookingView } from '../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#315CAB',
  IN_PROGRESS: '#6C40A8',
  COMPLETED: '#16734A',
  CANCELLED: '#B42340',
};

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed',
  PER_DAY: '/day',
  PER_WORKER_PER_DAY: '/worker/day',
};

function BookingCard({ booking }: { booking: BookingView }) {
  const color = STATUS_COLOR[booking.status] ?? '#466E68';
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
    <View className="bg-surface rounded-2xl border border-outline p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-ink font-semibold text-base flex-1 mr-2"
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
        <Ionicons name="person-outline" size={14} color="#466E68" />
        <Text className="text-muted text-sm ml-1">{booking.workerName}</Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={14} color="#466E68" />
        <Text className="text-muted text-sm ml-1">
          {starts} – {ends}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="cash-outline" size={14} color="#145C58" />
        <Text className="text-accent font-semibold text-sm ml-1">
          ₹{Number(booking.amount).toLocaleString('en-IN')}
          <Text className="font-normal text-muted">{pricing}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline shadow-sm z-10">
        <Text className="text-xl font-bold text-ink">My Bookings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-700 text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetch} />
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#145C58" />
        ) : bookings.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Ionicons name="briefcase-outline" size={40} color="#466E68" />
            <Text className="text-ink text-lg font-semibold mt-3 mb-1">
              No bookings yet
            </Text>
            <Text className="text-muted text-center text-sm">
              Accepted quotations will appear here as confirmed bookings.
            </Text>
          </View>
        ) : (
          bookings.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => router.push(`/(worker)/booking/${b.id}`)}
            >
              <BookingCard booking={b} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
