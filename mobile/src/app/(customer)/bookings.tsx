import {
  GlassBackdrop,
  PageHeading,
  GlassCard,
  glassSurface,
  palette,
} from '../../components/theme';
import { Action } from '../../components/ui';
import { useState } from 'react';
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
  FIXED_TOTAL: 'Fixed total',
  PER_DAY: '/day',
  PER_WORKER_PER_DAY: '/worker/day',
};

function BookingCard({ booking }: { booking: BookingView }) {
  const router = useRouter();
  const date = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  const color = STATUS_COLOR[booking.status] ?? palette.teal;
  return (
    <GlassCard style={{ marginBottom: 18, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={[
            glassSurface,
            {
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#FFCC25',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Ionicons name="briefcase-outline" size={29} color={palette.teal} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>
            {booking.requirementTitle}
          </Text>
          <Text
            style={{
              alignSelf: 'flex-start',
              backgroundColor: color + '18',
              color,
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 16,
              fontSize: 12,
            }}
          >
            {booking.status}
          </Text>
        </View>
      </View>
      <View
        style={[
          glassSurface,
          {
            borderRadius: 20,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'none',
          },
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{ color: palette.teal, fontWeight: '700', fontSize: 18 }}
          >
            {booking.workerName?.charAt(0)}
          </Text>
        </View>
        <Text
          style={{
            flex: 1,
            color: palette.teal,
            fontWeight: '600',
            fontSize: 15,
          }}
        >
          {booking.workerName}
        </Text>
        <View
          style={{
            flex: 1,
            borderLeftWidth: 1,
            borderColor: '#E5E7EB',
            paddingLeft: 10,
            gap: 5,
          }}
        >
          <Ionicons name="calendar-outline" size={21} color={palette.teal} />
          <Text style={{ fontSize: 12, color: palette.teal }}>
            {date(booking.startsAt)} – {date(booking.endsAt)}
          </Text>
        </View>
      </View>
      <View
        style={[
          glassSurface,
          { padding: 12, borderRadius: 20, boxShadow: 'none', gap: 5 },
        ]}
      >
        <Text style={{ fontSize: 12, color: palette.teal }}>Quoted amount</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Text
            style={{ fontSize: 26, fontWeight: '700', color: palette.teal }}
          >
            ₹{Number(booking.amount).toLocaleString('en-IN')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: palette.teal,
              borderLeftWidth: 1,
              borderColor: '#E5E7EB',
              paddingLeft: 18,
            }}
          >
            {PRICING_LABEL[booking.pricingBasis] ?? booking.pricingBasis}
          </Text>
        </View>
      </View>
      <Action
        label="View booking"
        variant="secondary"
        onPress={() => router.push(`/(customer)/booking/${booking.id}`)}
      />
    </GlassCard>
  );
}

export default function BookingsScreen() {
  const {
    data,
    loading,
    error,
    refresh: loadData,
  } = useFocusedResource(getMyBookings);
  const bookings = data || [];
  const [statusTab, setStatusTab] = useState('Active');
  const visibleBookings = bookings.filter((booking) =>
    statusTab === 'Cancelled'
      ? booking.status === 'CANCELLED'
      : statusTab === 'Completed'
        ? booking.status === 'COMPLETED'
        : !['CANCELLED', 'COMPLETED'].includes(booking.status),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <PageHeading
        title="My projects"
        subtitle="Bookings, schedules and your crew"
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        {['Active', 'Completed', 'Cancelled'].map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: statusTab === tab }}
            onPress={() => setStatusTab(tab)}
            style={{
              paddingHorizontal: 16,
              minHeight: 48,
              justifyContent: 'center',
              borderRadius: 24,
              backgroundColor:
                statusTab === tab ? palette.yellow : palette.grey,
            }}
          >
            <Text style={{ color: palette.ink, fontWeight: '600' }}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        {!loading && !error && bookings.length > 0 && (
          <Text style={{ fontSize: 14, color: palette.teal, marginBottom: 16 }}>
            {bookings.length} bookings
          </Text>
        )}
        <Action
          label="Refresh bookings"
          variant="secondary"
          loading={loading}
          onPress={() => void loadData()}
        />
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-ink text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={loadData} />
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
        ) : visibleBookings.length === 0 ? (
          <Text style={{ color: palette.ink }}>
            No {statusTab.toLowerCase()} projects.
          </Text>
        ) : (
          visibleBookings.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
