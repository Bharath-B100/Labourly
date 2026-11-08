import { useState } from 'react';
import { Text, View } from 'react-native';
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
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: palette.ink,
            fontSize: 30,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          Welcome to Labourly
        </Text>
        <Text style={{ color: palette.ink, textAlign: 'center', fontSize: 16 }}>
          Good people. Great work.
        </Text>
      </View>
      <View
        style={{
          paddingBottom: 12,
          borderBottomWidth: 3,
          borderColor: palette.yellow,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: palette.ink,
            fontSize: 18,
            fontWeight: '700',
          }}
        >
          Sign in / Create account
        </Text>
      </View>
      <Text style={{ color: palette.ink, lineHeight: 22 }}>
        Enter your phone number. We’ll send a six-digit verification code. New
        here? You can create your profile after verification.
      </Text>
      <Input
        label="Phone number"
        placeholder="+91 mobile number"
        hint="Include your country code, for example +91 for India."
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
        editable={!mutation.isPending}
      />
      {mutation.isError && (
        <Text accessibilityRole="alert" style={{ color: palette.ink }}>
          Unable to send code. {mutation.error.message}
        </Text>
      )}
      <Action
        label={mutation.isPending ? 'Sending code…' : 'Send code'}
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
      <GlassCard style={{ gap: 8 }}>
        <Text style={{ color: palette.ink, fontWeight: '700' }}>
          One account, your way of working
        </Text>
        <Text style={{ color: palette.ink, lineHeight: 22 }}>
          Hire for a project or find work as an individual or team. Your saved
          profile will be restored when you sign in.
        </Text>
      </GlassCard>
    </Screen>
  );
}
