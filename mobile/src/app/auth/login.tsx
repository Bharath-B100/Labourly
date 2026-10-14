import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Action, Input, Screen } from '../../components/ui';
import { GlassCard, palette } from '../../components/theme';
import { publicJson } from '../../api/client';
import { normalizePhone } from '../../auth/validation';
export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const normalized = normalizePhone(phone);
      await publicJson('/api/v1/auth/otp/request', { phone: normalized });
      return normalized;
    },
    onSuccess: (normalized) =>
      router.push({ pathname: '/auth/verify', params: { phone: normalized } }),
  });
  return (
    <Screen>
      <View style={styles.intro}>
        <View style={styles.step}>
          <Text style={styles.stepText}>01</Text>
          <Text style={styles.stepLabel}>LET’S GET YOU STARTED</Text>
        </View>
        <Text accessibilityRole="header" style={styles.heading}>
          Good work.{'\n'}One step closer.
        </Text>
        <Text style={styles.description}>
          Sign in or create your NammaCrew account with your phone number.
        </Text>
      </View>
      <GlassCard style={styles.form}>
        <View style={styles.formHeader}>
          <View style={styles.phoneIcon} accessible={false}>
            <View style={styles.phoneOutline}>
              <View style={styles.phoneDot} />
            </View>
          </View>
          <View style={styles.formHeading}>
            <Text style={styles.formTitle}>Your phone number</Text>
            <Text style={styles.caption}>
              We’ll send you a verification code.
            </Text>
          </View>
        </View>
        <Input
          label="Phone number"
          placeholder="+91 98765 43210"
          hint="Include your country code, for example +91 for India."
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
          editable={!mutation.isPending}
        />
        {mutation.isError && (
          <Text accessibilityRole="alert" className="text-red-700">
            {mutation.error.message}
          </Text>
        )}
        <Action
          label={mutation.isPending ? 'Sending code…' : 'Send code'}
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
        />
        <Text style={styles.helper}>
          Use a number you can access to complete verification.
        </Text>
      </GlassCard>
      <View style={styles.next}>
        <View style={styles.line} />
        <Text style={styles.nextTitle}>WHAT’S NEXT</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.steps}>
        <View style={styles.stepItem}>
          <Text style={styles.smallNumber}>02</Text>
          <Text style={styles.stepCopy}>Verify your number</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.smallNumber}>03</Text>
          <Text style={styles.stepCopy}>Make your profile</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 16, paddingTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepText: {
    color: palette.teal,
    backgroundColor: '#E5EEE5',
    borderRadius: 10,
    padding: 8,
    fontWeight: '800',
    fontSize: 11,
  },
  stepLabel: {
    color: palette.muted,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    flexShrink: 1,
  },
  heading: {
    color: palette.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.3,
  },
  description: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 430,
  },
  form: { gap: 20, padding: 20, backgroundColor: 'rgba(255,255,255,0.6)' },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phoneIcon: {
    width: 44,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#E5EEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneOutline: {
    width: 17,
    height: 27,
    borderWidth: 1.8,
    borderColor: palette.teal,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  phoneDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.teal,
  },
  formHeading: { flex: 1, gap: 4 },
  formTitle: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  caption: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  helper: {
    color: palette.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
  },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(20,92,88,0.14)' },
  nextTitle: {
    color: palette.muted,
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stepItem: { flex: 1, minWidth: 120, gap: 8 },
  smallNumber: { color: palette.teal, fontSize: 12, fontWeight: '800' },
  stepCopy: { color: palette.muted, fontSize: 13 },
});
