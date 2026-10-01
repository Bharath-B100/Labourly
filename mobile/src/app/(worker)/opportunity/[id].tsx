import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../../api/client';
import { RequirementView } from '../../../api/marketplace';
import { submitQuote, getMyQuotes, withdrawQuote } from '../../../api/quotations';

const PRICING_OPTIONS = [
  { value: 'FIXED_TOTAL', label: 'Fixed Total' },
  { value: 'PER_DAY', label: 'Per Day' },
  { value: 'PER_WORKER_PER_DAY', label: 'Per Worker / Day' },
] as const;

type PricingBasis = 'FIXED_TOTAL' | 'PER_DAY' | 'PER_WORKER_PER_DAY';

export default function OpportunityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [requirement, setRequirement] = useState<RequirementView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // existing quote for this requirement (if any)
  const [myQuoteId, setMyQuoteId] = useState<string | null>(null);
  const [myQuoteStatus, setMyQuoteStatus] = useState<string | null>(null);

  // form state
  const [amount, setAmount] = useState('');
  const [pricing, setPricing] = useState<PricingBasis>('PER_DAY');
  const [durationDays, setDurationDays] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [req, myQuotes] = await Promise.all([
          apiJson<RequirementView>(`/api/v1/requirements/${id}`),
          getMyQuotes(),
        ]);
        setRequirement(req);
        const existing = myQuotes.find((q) => q.requirementId === id);
        if (existing) {
          setMyQuoteId(existing.id);
          setMyQuoteStatus(existing.status);
          setAmount(String(existing.amount));
          setPricing(existing.pricingBasis as PricingBasis);
          setDurationDays(String(existing.durationDays));
          setNote(existing.workerNote ?? '');
        } else {
          // Pre-fill start date from requirement
          if (req.startsAt) {
            const days = Math.max(
              1,
              Math.round(
                (new Date(req.endsAt).getTime() -
                  new Date(req.startsAt).getTime()) /
                  86400000,
              ),
            );
            setDurationDays(String(days));
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    const days = parseInt(durationDays, 10);
    if (!amt || amt <= 0) {
      Alert.alert('Validation', 'Enter a valid amount');
      return;
    }
    if (!days || days <= 0) {
      Alert.alert('Validation', 'Enter a valid duration in days');
      return;
    }
    try {
      setSubmitting(true);
      await submitQuote(id, {
        amount: amt,
        pricingBasis: pricing,
        startsAt: requirement?.startsAt ?? new Date().toISOString(),
        durationDays: days,
        workerNote: note.trim() || undefined,
      });
      Alert.alert('✅ Quote Sent', 'Your quote has been submitted successfully.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = () => {
    if (!myQuoteId) return;
    Alert.alert('Withdraw Quote', 'Remove your quote for this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            await withdrawQuote(myQuoteId);
            setMyQuoteId(null);
            setMyQuoteStatus(null);
            Alert.alert('Withdrawn', 'Your quote has been withdrawn.');
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to withdraw');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#115e59" />
      </SafeAreaView>
    );
  }

  if (error || !requirement) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">{error || 'Not found'}</Text>
      </SafeAreaView>
    );
  }

  const starts = new Date(requirement.startsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const ends = new Date(requirement.endsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const alreadyActioned =
    myQuoteStatus && myQuoteStatus !== 'SUBMITTED' && myQuoteStatus !== 'WITHDRAWN';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-900">Job Details</Text>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        {/* Requirement card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
          <Text className="text-slate-900 font-bold text-lg mb-1">
            {requirement.title}
          </Text>
          <Text className="text-teal-700 text-sm font-medium mb-3">
            {requirement.trade}
          </Text>
          <Text className="text-slate-600 mb-4">{requirement.description}</Text>

          <View className="flex-row flex-wrap gap-x-4 gap-y-1">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text className="text-slate-600 text-sm ml-1">
                {requirement.city}, {requirement.district}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#64748b" />
              <Text className="text-slate-600 text-sm ml-1">
                {requirement.workerCount} workers
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text className="text-slate-600 text-sm ml-1">
                {starts} – {ends}
              </Text>
            </View>
          </View>
        </View>

        {/* Quote status banner */}
        {myQuoteStatus && myQuoteStatus !== 'WITHDRAWN' && (
          <View
            className={`rounded-xl p-3 mb-4 border ${
              myQuoteStatus === 'ACCEPTED'
                ? 'bg-green-50 border-green-200'
                : myQuoteStatus === 'REJECTED'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
            }`}
          >
            <Text
              className={`font-semibold text-center ${
                myQuoteStatus === 'ACCEPTED'
                  ? 'text-green-700'
                  : myQuoteStatus === 'REJECTED'
                    ? 'text-red-700'
                    : 'text-blue-700'
              }`}
            >
              {myQuoteStatus === 'ACCEPTED'
                ? '✅ Your quote was accepted! Check My Bookings.'
                : myQuoteStatus === 'REJECTED'
                  ? '❌ Your quote was rejected.'
                  : '⏳ Quote submitted — awaiting customer decision.'}
            </Text>
          </View>
        )}

        {/* Quote form (only if not yet submitted / can resubmit) */}
        {!alreadyActioned && (
          <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <Text className="text-slate-900 font-bold text-base mb-4">
              {myQuoteId ? 'Your Quote' : 'Submit Your Quote'}
            </Text>

            {/* Amount */}
            <Text className="text-slate-700 font-semibold mb-1">
              Amount (₹) *
            </Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 mb-4"
              placeholder="e.g. 2500"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!myQuoteId}
            />

            {/* Pricing basis */}
            <Text className="text-slate-700 font-semibold mb-2">
              Pricing Basis *
            </Text>
            <View className="flex-row gap-2 mb-4">
              {PRICING_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => !myQuoteId && setPricing(opt.value)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    pricing === opt.value
                      ? 'bg-teal-700 border-teal-700'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      pricing === opt.value ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Duration */}
            <Text className="text-slate-700 font-semibold mb-1">
              Duration (days) *
            </Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 mb-4"
              placeholder="e.g. 5"
              keyboardType="numeric"
              value={durationDays}
              onChangeText={setDurationDays}
              editable={!myQuoteId}
            />

            {/* Note */}
            <Text className="text-slate-700 font-semibold mb-1">
              Note to customer (optional)
            </Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 mb-5 h-20"
              placeholder="Any relevant experience, equipment, or clarifications..."
              multiline
              value={note}
              onChangeText={setNote}
              editable={!myQuoteId}
              textAlignVertical="top"
            />

            {/* Action buttons */}
            {!myQuoteId ? (
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-teal-700 py-3.5 rounded-xl items-center"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Send Quote
                  </Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={handleWithdraw}
                disabled={submitting}
                className="bg-red-50 py-3.5 rounded-xl items-center border border-red-200"
              >
                {submitting ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <Text className="text-red-600 font-bold">Withdraw Quote</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
