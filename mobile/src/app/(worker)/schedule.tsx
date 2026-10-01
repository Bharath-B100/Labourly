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
import { useFocusEffect } from 'expo-router';
import { getMyQuotes, withdrawQuote, QuoteView } from '../../api/quotations';

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#3b82f6',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  WITHDRAWN: '#6b7280',
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
  const color = STATUS_COLOR[quote.status] ?? '#6b7280';
  const starts = new Date(quote.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-1">
        <Text
          className="text-slate-900 font-semibold text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {quote.requirementTitle}
        </Text>
        <View
          style={{ backgroundColor: color + '20', borderColor: color }}
          className="px-2.5 py-0.5 rounded-full border"
        >
          <Text style={{ color }} className="text-xs font-bold">
            {quote.status}
          </Text>
        </View>
      </View>

      <Text className="text-slate-500 text-xs mb-3">
        Submitted {new Date(quote.createdAt).toLocaleDateString('en-IN')}
      </Text>

      <View className="flex-row gap-4 mb-2">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={14} color="#0d9488" />
          <Text className="text-teal-700 font-semibold text-sm ml-1">
            ₹{Number(quote.amount).toLocaleString('en-IN')}
            {PRICING_LABEL[quote.pricingBasis]}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text className="text-slate-600 text-sm ml-1">
            {starts} · {quote.durationDays}d
          </Text>
        </View>
      </View>

      {quote.status === 'SUBMITTED' && (
        <Pressable
          onPress={() => onWithdraw(quote.id)}
          className="mt-2 bg-red-50 py-2 rounded-xl items-center border border-red-200"
        >
          <Text className="text-red-600 font-semibold text-sm">
            Withdraw Quote
          </Text>
        </Pressable>
      )}

      {quote.status === 'ACCEPTED' && (
        <View className="mt-2 bg-green-50 py-2 rounded-xl items-center border border-green-200">
          <Text className="text-green-700 font-semibold text-sm">
            ✅ Hired — check Schedule
          </Text>
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

  useFocusEffect(useCallback(() => { fetchQuotes(); }, []));

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
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-900">My Quotes</Text>
        <Text className="text-slate-500 text-sm mt-0.5">
          Quotes you've submitted to customers
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
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#115e59" />
        ) : quotes.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-white rounded-xl border border-slate-200">
            <Ionicons name="send-outline" size={40} color="#94a3b8" />
            <Text className="text-slate-800 text-lg font-semibold mt-3 mb-1">
              No quotes yet
            </Text>
            <Text className="text-slate-500 text-center text-sm">
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
