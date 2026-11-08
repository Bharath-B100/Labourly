import { GlassBackdrop } from '../../components/theme';
import { Action } from '../../components/ui';
import { useFocusedResource } from '../../hooks/useFocusedResource';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyBookings, BookingView } from '../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FFCC25',
  CONFIRMED: '#202326',
  IN_PROGRESS: '#202326',
  COMPLETED: '#202326',
  CANCELLED: '#202326',
};

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed',
  PER_DAY: '/day',
  PER_WORKER_PER_DAY: '/worker/day',
};

function BookingCard({ booking }: { booking: BookingView }) {
  const color = STATUS_COLOR[booking.status] ?? '#202326';
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
        <Ionicons name="person-outline" size={14} color="#202326" />
        <Text className="text-muted text-sm ml-1">{booking.workerName}</Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={14} color="#202326" />
        <Text className="text-muted text-sm ml-1">
          {starts} – {ends}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="cash-outline" size={14} color="#202326" />
        <Text className="text-accent font-semibold text-sm ml-1">
          ₹{Number(booking.amount).toLocaleString('en-IN')}
          <Text className="font-normal text-muted">{pricing}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const {
    data,
    loading,
    error,
    refresh: fetch,
  } = useFocusedResource(getMyBookings);
  const bookings = data || [];
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline shadow-sm z-10">
        <Text className="text-xl font-bold text-ink">My Bookings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Action
          label="Refresh bookings"
          variant="secondary"
          loading={loading}
          onPress={() => void fetch()}
        />
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-ink text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetch} />
          </View>
        ) : loading && !data ? (
          <ActivityIndicator className="mt-8" size="large" color="#202326" />
        ) : bookings.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Ionicons name="briefcase-outline" size={40} color="#202326" />
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
              accessibilityRole="button"
              accessibilityLabel={`View booking: ${b.requirementTitle}`}
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
