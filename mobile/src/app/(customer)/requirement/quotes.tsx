import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  getRequirementQuotes,
  acceptQuote,
  rejectQuote,
  QuoteView,
} from '../../../../api/quotations';

const PRICING_LABEL: Record<string, string> = {
  FIXED_TOTAL: 'Fixed total',
  PER_DAY: 'Per day',
  PER_WORKER_PER_DAY: 'Per worker/day',
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#3b82f6',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  WITHDRAWN: '#6b7280',
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
  const color = STATUS_COLOR[quote.status] ?? '#6b7280';
  const isSubmitted = quote.status === 'SUBMITTED';
  const starts = new Date(quote.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-slate-900 font-semibold text-base">
            {quote.workerName}
          </Text>
          <Text className="text-slate-500 text-xs mt-0.5">
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
      <View className="bg-teal-50 rounded-xl p-3 mb-3 flex-row items-center">
        <Ionicons name="cash-outline" size={20} color="#0d9488" />
        <View className="ml-2">
          <Text className="text-teal-800 font-bold text-lg">
            ₹{Number(quote.amount).toLocaleString('en-IN')}
          </Text>
          <Text className="text-teal-600 text-xs">
            {PRICING_LABEL[quote.pricingBasis] ?? quote.pricingBasis}
          </Text>
        </View>
      </View>

      {/* Schedule */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text className="text-slate-600 text-sm ml-1">From {starts}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text className="text-slate-600 text-sm ml-1">
            {quote.durationDays}d
          </Text>
        </View>
      </View>

      {/* Worker note */}
      {quote.workerNote ? (
        <View className="bg-slate-50 rounded-lg p-2 mb-3 border border-slate-200">
          <Text className="text-slate-500 text-xs font-semibold mb-0.5">
            Worker note
          </Text>
          <Text className="text-slate-700 text-sm">{quote.workerNote}</Text>
        </View>
      ) : null}

      {/* Actions */}
      {isSubmitted && (
        <View className="flex-row gap-3 mt-1">
          <Pressable
            onPress={() => onAccept(quote.id)}
            className="flex-1 bg-teal-700 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-bold">Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => onReject(quote.id)}
            className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-200"
          >
            <Text className="text-red-600 font-bold">Reject</Text>
          </Pressable>
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

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');
      setQuotes(await getRequirementQuotes(id));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchQuotes(); }, [id]));

  const handleAccept = (quoteId: string) => {
    Alert.alert('Accept Quote', 'Hire this worker and create a booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setActing(true);
            await acceptQuote(quoteId);
            Alert.alert('✅ Hired!', 'Booking created. Check My Bookings.');
            fetchQuotes();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to accept quote');
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  const handleReject = (quoteId: string) => {
    Alert.alert('Reject Quote', 'Decline this worker\'s quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActing(true);
            await rejectQuote(quoteId);
            fetchQuotes();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to reject quote');
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-900">Quotes Received</Text>
        <Text className="text-slate-500 text-sm mt-0.5">
          Review and hire from submitted quotes
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetchQuotes}
              className="bg-teal-800 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">Retry</Text>
            </Pressable>
          </View>
        ) : loading || acting ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : quotes.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
            <Text className="text-slate-800 text-lg font-semibold mt-3 mb-1">
              No quotes yet
            </Text>
            <Text className="text-slate-500 text-center text-sm">
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
