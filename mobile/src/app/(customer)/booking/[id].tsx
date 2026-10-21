import { GlassBackdrop } from '../../../components/theme';
import { Action } from '../../../components/ui';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  getBookingDetails,
  cancelBooking,
  BookingView,
} from '../../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FFCC25',
  CONFIRMED: '#202326',
  IN_PROGRESS: '#202326',
  COMPLETED: '#202326',
  CANCELLED: '#202326',
};

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed total',
  PER_DAY: 'Per day',
  PER_WORKER_PER_DAY: 'Per worker/day',
};

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchDetails = useCallback(
    async (mounted: { current: boolean }) => {
      try {
        if (mounted.current) {
          setLoading(true);
          setError('');
        }
        const data = await getBookingDetails(id);
        if (mounted.current) setBooking(data);
      } catch (e: any) {
        if (mounted.current)
          setError(e.message ?? 'Failed to load booking details');
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      const mounted = { current: true };
      fetchDetails(mounted);
      return () => {
        mounted.current = false;
      };
    }, [fetchDetails]),
  );

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation');
      return;
    }
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelBooking(id, cancelReason);
              Alert.alert('Cancelled', 'Booking has been cancelled.');
              fetchDetails({ current: true });
              setShowCancel(false);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !booking) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator size="large" color="#202326" />
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center p-6">
        <Text className="text-ink text-center">{error || 'Not found'}</Text>
      </SafeAreaView>
    );
  }

  const color = STATUS_COLOR[booking.status] ?? '#202326';
  const starts = new Date(booking.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const ends = new Date(booking.endsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline shadow-sm z-10 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-ink">Booking Details</Text>
        <View
          style={{ backgroundColor: color + '22', borderColor: color }}
          className="px-2.5 py-1 rounded-full border"
        >
          <Text style={{ color }} className="text-xs font-bold">
            {booking.status}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="bg-surface rounded-2xl border border-outline p-4 mb-4 shadow-sm">
          <Text className="text-muted text-xs font-semibold mb-1">
            REQUIREMENT
          </Text>
          <Text className="text-ink font-bold text-lg mb-4">
            {booking.requirementTitle}
          </Text>

          <Text className="text-muted text-xs font-semibold mb-1">WORKER</Text>
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-circle-outline" size={24} color="#202326" />
            <Text className="text-ink font-semibold text-base ml-2">
              {booking.workerName}
            </Text>
          </View>

          <Text className="text-muted text-xs font-semibold mb-1">TERMS</Text>
          <View className="bg-tinted rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="cash-outline" size={24} color="#202326" />
            <View className="ml-3">
              <Text className="text-accent font-bold text-xl">
                ₹{Number(booking.amount).toLocaleString('en-IN')}
              </Text>
              <Text className="text-accent text-sm">
                {PRICING_LABEL[booking.pricingBasis] ?? booking.pricingBasis}
              </Text>
            </View>
          </View>

          <Text className="text-muted text-xs font-semibold mb-1">
            SCHEDULE
          </Text>
          <View className="bg-surface rounded-xl p-3 border border-outline flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#202326" />
            <View className="ml-3">
              <Text className="text-ink font-semibold">
                {starts} – {ends}
              </Text>
            </View>
          </View>
        </View>

        {booking.status === 'CANCELLED' && (
          <View className="bg-surface rounded-2xl border border-outline/30 p-4 mb-4 gap-2">
            <Text className="text-ink font-bold text-lg">
              Booking cancelled
            </Text>
            <Text className="font-semibold text-ink">Cancellation reason</Text>
            <Text className="text-ink">
              {booking.cancelReason ||
                'Reason unavailable for this older cancellation.'}
            </Text>
            <Text className="text-ink">
              Cancelled by:{' '}
              {booking.cancelledByRole === 'CUSTOMER'
                ? 'Customer'
                : booking.cancelledByRole === 'WORKER'
                  ? 'Worker'
                  : 'Unavailable'}
              {booking.cancelledByName ? ` (${booking.cancelledByName})` : ''}
            </Text>
            <Text className="text-ink">
              Cancelled at:{' '}
              {booking.cancelledAt
                ? new Date(booking.cancelledAt).toLocaleString('en-IN')
                : 'Unavailable'}
            </Text>
          </View>
        )}

        {booking.status === 'CONFIRMED' && !showCancel && (
          <Action
            label="Cancel Booking"
            variant="danger"
            onPress={() => setShowCancel(true)}
          />
        )}

        {showCancel && (
          <View className="bg-surface rounded-2xl border border-outline/30 p-4 mb-6 shadow-sm">
            <Text className="text-ink font-bold text-base mb-2">
              Cancel Booking
            </Text>
            <Text className="text-muted text-sm mb-3">
              Please provide a reason for cancelling. This will be recorded and
              the booking will be terminated.
            </Text>
            <TextInput
              placeholderTextColor="#202326"
              className="border border-outline rounded-xl px-3 py-2.5 text-ink mb-4 h-20"
              accessibilityLabel="Reason for cancellation"
              placeholder="Reason for cancellation..."
              multiline
              value={cancelReason}
              onChangeText={(t) => {
                setCancelReason(t);
              }}
              textAlignVertical="top"
            />
            <View className="gap-3">
              <Action
                label="Confirm Cancel"
                variant="danger"
                loading={cancelling}
                onPress={handleCancel}
              />
              <Action
                label="Back"
                variant="secondary"
                disabled={cancelling}
                onPress={() => setShowCancel(false)}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
