import {
  GlassBackdrop,
  PageHeading,
  GlassCard,
  glassSurface,
  palette,
} from '../../components/theme';
import { Action } from '../../components/ui';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMyBookings, BookingView } from '../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#145C58',
  IN_PROGRESS: '#6C40A8',
  COMPLETED: '#16734A',
  CANCELLED: '#B42340',
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
              backgroundColor: 'rgba(247,201,72,0.25)',
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
            backgroundColor: '#DCEEE7',
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
            borderColor: '#B7D9CE',
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
              borderColor: '#B7D9CE',
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
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
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
      let mounted = true;
      const fetchData = async () => {
        try {
          if (mounted) {
            setLoading(true);
            setError('');
          }
          const data = await getMyBookings();
          if (mounted) setBookings(data);
        } catch (e: any) {
          if (mounted) setError(e.message ?? 'Failed to load bookings');
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchData();
      return () => {
        mounted = false;
      };
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <PageHeading title="My bookings" subtitle="Your work, organised." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        {!loading && !error && bookings.length > 0 && (
          <Text style={{ fontSize: 14, color: palette.teal, marginBottom: 16 }}>
            {bookings.length} bookings
          </Text>
        )}
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-700 text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={loadData} />
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
          bookings.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
