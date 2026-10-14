import { GlassBackdrop } from '../../../components/theme';
import { Action } from '../../../components/ui';
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
import {
  submitQuote,
  getMyQuotes,
  withdrawQuote,
  editQuote,
} from '../../../api/quotations';

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
    let mounted = true;
    const fetchData = async () => {
      try {
        if (mounted) setLoading(true);
        const [req, myQuotes] = await Promise.all([
          apiJson<RequirementView>(`/api/v1/requirements/${id}`),
          getMyQuotes(),
        ]);
        if (mounted) setRequirement(req);
        const existing = myQuotes.find((q) => q.requirementId === id);
        if (existing) {
          if (mounted) {
            setMyQuoteId(existing.status === 'WITHDRAWN' ? null : existing.id);
            setMyQuoteStatus(existing.status);
            setAmount(String(existing.amount));
            setPricing(existing.pricingBasis as PricingBasis);
            setDurationDays(String(existing.durationDays));
            setNote(existing.workerNote ?? '');
          }
        } else {
          // Pre-fill start date from requirement
          if (req.startsAt && mounted) {
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
        if (mounted) setError(e.message || 'Failed to load details');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async () => {
    const amt = Number(amount);
    const days = Number(durationDays);
    if (
      !/^\d+(\.\d{1,2})?$/.test(amount.trim()) ||
      !Number.isFinite(amt) ||
      amt <= 0 ||
      amt > 9999999999.99
    ) {
      Alert.alert('Validation', 'Enter a valid amount');
      return;
    }
    if (
      !/^\d+$/.test(durationDays.trim()) ||
      !Number.isInteger(days) ||
      days <= 0 ||
      days > 3650
    ) {
      Alert.alert('Validation', 'Enter a valid duration in days');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        amount: amt,
        pricingBasis: pricing,
        startsAt: requirement?.startsAt ?? new Date().toISOString(),
        durationDays: days,
        workerNote: note.trim() || undefined,
      };

      if (myQuoteId) {
        await editQuote(myQuoteId, payload);
      } else {
        await submitQuote(id, payload);
      }
      setSubmitting(false);
      if (myQuoteId) {
        Alert.alert(
          '✅ Quote Updated',
          'Your quote has been updated successfully.',
        );
      } else {
        Alert.alert(
          '✅ Quote Sent',
          'Your quote has been submitted successfully.',
        );
      }
      router.back();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e.message ?? 'Failed to submit quote');
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
          setSubmitting(true);
          try {
            await withdrawQuote(myQuoteId);
            setSubmitting(false);
            setMyQuoteId(null);
            setMyQuoteStatus(null);
            Alert.alert('Withdrawn', 'Your quote has been withdrawn.');
            router.back();
          } catch (e: any) {
            setSubmitting(false);
            Alert.alert('Error', e.message ?? 'Failed to withdraw');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator size="large" color="#145C58" />
      </SafeAreaView>
    );
  }

  if (error || !requirement) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center p-6">
        <Text className="text-red-700 text-center">{error || 'Not found'}</Text>
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
    myQuoteStatus &&
    myQuoteStatus !== 'SUBMITTED' &&
    myQuoteStatus !== 'WITHDRAWN';

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline shadow-sm z-10">
        <Text className="text-xl font-bold text-ink">Job Details</Text>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        {/* Requirement card */}
        <View className="bg-surface rounded-2xl border border-outline p-4 mb-4 shadow-sm">
          <Text className="text-ink font-bold text-lg mb-1">
            {requirement.title}
          </Text>
          <Text className="text-accent text-sm font-medium mb-3">
            {requirement.trade}
          </Text>
          <Text className="text-muted mb-4">{requirement.description}</Text>

          <View className="flex-row flex-wrap gap-x-4 gap-y-1">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#466E68" />
              <Text className="text-muted text-sm ml-1">
                {requirement.city}, {requirement.district}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#466E68" />
              <Text className="text-muted text-sm ml-1">
                {requirement.workerCount} workers
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#466E68" />
              <Text className="text-muted text-sm ml-1">
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
                ? 'bg-green-400/10 border-green-400/30'
                : myQuoteStatus === 'REJECTED'
                  ? 'bg-red-400/10 border-red-400/30'
                  : 'bg-tinted border-outline'
            }`}
          >
            <Text
              className={`font-semibold text-center ${
                myQuoteStatus === 'ACCEPTED'
                  ? 'text-green-700'
                  : myQuoteStatus === 'REJECTED'
                    ? 'text-red-700'
                    : 'text-accent'
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
          <View className="bg-surface rounded-2xl border border-outline p-4 shadow-sm">
            <Text className="text-ink font-bold text-base mb-4">
              {myQuoteId ? 'Your Quote' : 'Submit Your Quote'}
            </Text>

            {/* Amount */}
            <Text className="text-ink font-semibold mb-1">Amount (₹) *</Text>
            <TextInput
              placeholderTextColor="#466E68"
              testID="amount-input"
              accessibilityLabel="Quote amount in rupees"
              className="border border-outline rounded-xl px-3 py-2.5 text-ink mb-4"
              placeholder="e.g. 2500"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => {
                setAmount(t);
              }}
            />

            {/* Pricing basis */}
            <Text className="text-ink font-semibold mb-2">Pricing Basis *</Text>
            <View className="flex-row gap-2 mb-4">
              {PRICING_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{
                    checked: pricing === opt.value,
                    disabled: submitting,
                  }}
                  disabled={submitting}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    justifyContent: 'center',
                    opacity: pressed ? 0.75 : 1,
                  })}
                  onPress={() => setPricing(opt.value)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    pricing === opt.value
                      ? 'bg-tinted border-outline'
                      : 'bg-surface border-outline'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      pricing === opt.value ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Duration */}
            <Text className="text-ink font-semibold mb-1">
              Duration (days) *
            </Text>
            <TextInput
              placeholderTextColor="#466E68"
              className="border border-outline rounded-xl px-3 py-2.5 text-ink mb-4"
              accessibilityLabel="Duration in days"
              placeholder="e.g. 5"
              keyboardType="numeric"
              value={durationDays}
              onChangeText={setDurationDays}
            />

            {/* Note */}
            <Text className="text-ink font-semibold mb-1">
              Note to customer (optional)
            </Text>
            <TextInput
              placeholderTextColor="#466E68"
              className="border border-outline rounded-xl px-3 py-2.5 text-ink mb-5 h-20"
              accessibilityLabel="Note to customer"
              placeholder="Any relevant experience, equipment, or clarifications..."
              multiline
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />

            {/* Action buttons */}
            {!myQuoteId ? (
              <Action
                label="Send Quote"
                loading={submitting}
                onPress={handleSubmit}
              />
            ) : (
              <View className="gap-3">
                <Action
                  label="Update Quote"
                  loading={submitting}
                  onPress={handleSubmit}
                />
                <Action
                  label="Withdraw"
                  variant="danger"
                  disabled={submitting}
                  onPress={handleWithdraw}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
