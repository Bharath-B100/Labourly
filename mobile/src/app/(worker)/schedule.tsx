import { GlassBackdrop } from '../../components/theme';
import { Action } from '../../components/ui';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getMyQuotes, withdrawQuote, QuoteView } from '../../api/quotations';
import { NotificationBell } from '../../components/NotificationBell';

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#202326',
  ACCEPTED: '#202326',
  REJECTED: '#202326',
  WITHDRAWN: '#202326',
};

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed',
  PER_DAY: '/day',
  PER_WORKER_PER_DAY: '/worker/day',
};

function QuoteCard({
  quote,
  onWithdraw,
}: {
  quote: QuoteView;
  onWithdraw: (id: string) => void;
}) {
  const color = STATUS_COLOR[quote.status] ?? '#202326';
  const starts = new Date(quote.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="bg-surface rounded-2xl border border-outline p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-1">
        <Text
          className="text-ink font-semibold text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {quote.requirementTitle}
        </Text>
        <View
          style={{ backgroundColor: color + '20', borderColor: color }}
          className="px-2.5 py-0.5 rounded-full border"
        >
          <Text style={{ color }} className="text-xs font-bold">
            Quote: {quote.status}
          </Text>
        </View>
      </View>

      <Text className="text-muted text-xs mb-3">
        Submitted {new Date(quote.createdAt).toLocaleDateString('en-IN')}
      </Text>

      <View className="flex-row gap-4 mb-2">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={14} color="#202326" />
          <Text className="text-accent font-semibold text-sm ml-1">
            ₹{Number(quote.amount).toLocaleString('en-IN')}
            {PRICING_LABEL[quote.pricingBasis]}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#202326" />
          <Text className="text-muted text-sm ml-1">
            {starts} · {quote.durationDays}d
          </Text>
        </View>
      </View>

      {quote.status === 'SUBMITTED' && (
        <Action
          label="Withdraw Quote"
          variant="danger"
          onPress={() => onWithdraw(quote.id)}
        />
      )}

      {quote.status === 'ACCEPTED' && (
        <View className="mt-2 bg-surface p-3 rounded-xl border border-outline">
          <Text className="text-ink font-semibold text-sm">
            {quote.bookingStatus === 'CANCELLED'
              ? 'Booking cancelled'
              : quote.bookingStatus === 'CONFIRMED'
                ? 'Booking confirmed — check My Bookings'
                : quote.bookingStatus === 'IN_PROGRESS'
                  ? 'Booking in progress'
                  : quote.bookingStatus === 'COMPLETED'
                    ? 'Booking completed'
                    : 'Quotation accepted — booking status unavailable'}
          </Text>
          <Text className="text-muted text-sm">
            Booking status: {quote.bookingStatus ?? 'Unavailable'}
          </Text>
          {quote.bookingStatus === 'CANCELLED' && (
            <Text className="text-muted text-sm">
              The quotation remains accepted in your history. This booking is no
              longer active.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function MyQuotesScreen() {
  const [quotes, setQuotes] = useState<QuoteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');
      setQuotes(await getMyQuotes());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, []),
  );

  const handleWithdraw = (quoteId: string) => {
    Alert.alert('Withdraw Quote', 'Remove this quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await withdrawQuote(quoteId);
            fetchQuotes();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to withdraw');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#202326' }}>
            My Quotes
          </Text>
          <Text style={{ fontSize: 13, color: '#202326', marginTop: 2 }}>
            Quotes you&apos;ve submitted to customers
          </Text>
        </View>
        <NotificationBell />
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-ink text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetchQuotes} />
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#202326" />
        ) : quotes.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Ionicons name="send-outline" size={40} color="#202326" />
            <Text className="text-ink text-lg font-semibold mt-3 mb-1">
              No quotes yet
            </Text>
            <Text className="text-muted text-center text-sm">
              Browse opportunities and submit quotes to get hired.
            </Text>
          </View>
        ) : (
          quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} onWithdraw={handleWithdraw} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
