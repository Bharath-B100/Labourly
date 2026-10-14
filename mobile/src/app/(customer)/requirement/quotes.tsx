import { GlassBackdrop } from '../../../components/theme';
import { Action } from '../../../components/ui';
import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  getRequirementQuotes,
  acceptQuote,
  rejectQuote,
  QuoteView,
} from '../../../api/quotations';

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed total',
  PER_DAY: 'Per day',
  PER_WORKER_PER_DAY: 'Per worker/day',
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#315CAB',
  ACCEPTED: '#16734A',
  REJECTED: '#B42340',
  WITHDRAWN: '#466E68',
};

function QuoteCard({
  quote,
  onAccept,
  onReject,
}: {
  quote: QuoteView;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const color = STATUS_COLOR[quote.status] ?? '#466E68';
  const isSubmitted = quote.status === 'SUBMITTED';
  const starts = new Date(quote.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="bg-surface rounded-2xl border border-outline p-4 mb-3 shadow-sm">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-ink font-semibold text-base">
            {quote.workerName}
          </Text>
          <Text className="text-muted text-xs mt-0.5">
            Submitted {new Date(quote.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>
        <View
          style={{ backgroundColor: color + '20', borderColor: color }}
          className="px-2.5 py-0.5 rounded-full border"
        >
          <Text style={{ color }} className="text-xs font-bold">
            {quote.status}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View className="bg-tinted rounded-xl p-3 mb-3 flex-row items-center">
        <Ionicons name="cash-outline" size={20} color="#145C58" />
        <View className="ml-2">
          <Text className="text-accent font-bold text-lg">
            ₹{Number(quote.amount).toLocaleString('en-IN')}
          </Text>
          <Text className="text-accent text-xs">
            {PRICING_LABEL[quote.pricingBasis] ?? quote.pricingBasis}
          </Text>
        </View>
      </View>

      {/* Schedule */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#466E68" />
          <Text className="text-muted text-sm ml-1">From {starts}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#466E68" />
          <Text className="text-muted text-sm ml-1">{quote.durationDays}d</Text>
        </View>
      </View>

      {/* Worker note */}
      {quote.workerNote ? (
        <View className="bg-surface rounded-lg p-2 mb-3 border border-outline">
          <Text className="text-muted text-xs font-semibold mb-0.5">
            Worker note
          </Text>
          <Text className="text-ink text-sm">{quote.workerNote}</Text>
        </View>
      ) : null}

      {/* Actions */}
      {isSubmitted && (
        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Action
              label="Accept"
              variant="primary"
              onPress={() => onAccept(quote.id)}
            />
          </View>
          <View className="flex-1">
            <Action
              label="Reject"
              variant="danger"
              onPress={() => onReject(quote.id)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export default function RequirementQuotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quotes, setQuotes] = useState<QuoteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const mutationPending = useRef(false);

  const fetchQuotes = useCallback(
    async (mounted: { current: boolean }) => {
      try {
        if (mounted.current) {
          setLoading(true);
          setError('');
        }
        const data = await getRequirementQuotes(id);
        if (mounted.current) setQuotes(data);
      } catch (e: any) {
        if (mounted.current) setError(e.message ?? 'Failed to load quotes');
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      const mounted = { current: true };
      fetchQuotes(mounted);
      return () => {
        mounted.current = false;
      };
    }, [fetchQuotes]),
  );

  const handleAccept = (quoteId: string) => {
    Alert.alert('Accept Quote', 'Hire this worker and create a booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          if (mutationPending.current) return;
          mutationPending.current = true;
          try {
            setActing(true);
            await acceptQuote(quoteId);
            Alert.alert('✅ Hired!', 'Booking created. Check My Bookings.');
            await fetchQuotes({ current: true });
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to accept quote');
          } finally {
            mutationPending.current = false;
            setActing(false);
          }
        },
      },
    ]);
  };

  const handleReject = (quoteId: string) => {
    Alert.alert('Reject Quote', "Decline this worker's quote?", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          if (mutationPending.current) return;
          mutationPending.current = true;
          try {
            setActing(true);
            await rejectQuote(quoteId);
            await fetchQuotes({ current: true });
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to reject quote');
          } finally {
            mutationPending.current = false;
            setActing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline shadow-sm z-10">
        <Text className="text-xl font-bold text-ink">Quotes Received</Text>
        <Text className="text-muted text-sm mt-0.5">
          Review and hire from submitted quotes
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-700 text-center mb-4">{error}</Text>
            <Action
              label="Retry"
              variant="secondary"
              onPress={() => {
                void fetchQuotes({ current: true });
              }}
            />
          </View>
        ) : loading || acting ? (
          <ActivityIndicator className="mt-8" size="large" color="#145C58" />
        ) : quotes.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Ionicons name="document-text-outline" size={40} color="#466E68" />
            <Text className="text-ink text-lg font-semibold mt-3 mb-1">
              No quotes yet
            </Text>
            <Text className="text-muted text-center text-sm">
              Workers will submit quotes for your requirement here.
            </Text>
          </View>
        ) : (
          quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
