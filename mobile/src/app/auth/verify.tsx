import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Action, Screen } from '../../components/ui';
import { publicJson } from '../../api/client';
import { credentialsSchema } from '../../auth/credentials';
import { normalizePhone, validateOtp } from '../../auth/validation';
import { useSession } from '../../auth/session';
export default function VerifyScreen() {
  const { phone = '' } = useLocalSearchParams<{ phone?: string }>();
  const [code, setCode] = useState('');
  const router = useRouter();
  const verify = useMutation({
    mutationFn: async () => {
      const tokens = credentialsSchema.parse(
        await publicJson('/api/v1/auth/otp/verify', {
          phone: normalizePhone(phone),
          code: validateOtp(code),
        }),
      );
      await useSession.getState().signIn(tokens);
    },
    onSuccess: () => router.replace('/'),
  });
  const resend = useMutation({
    mutationFn: () =>
      publicJson('/api/v1/auth/otp/request', { phone: normalizePhone(phone) }),
  });
  return (
    <Screen>
      <View className="gap-6">
        <Text accessibilityRole="header" className="text-3xl font-bold">
          Verify your phone
        </Text>
        <Text>Enter the six-digit code sent to {phone}.</Text>
        <TextInput
          accessibilityLabel="Verification code"
          placeholder="Six-digit code"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          editable={!verify.isPending}
          className="rounded-xl border border-slate-300 bg-white p-4 text-lg"
        />
        {verify.isError && (
          <Text accessibilityRole="alert">{verify.error.message}</Text>
        )}
        <Action
          label={verify.isPending ? 'Verifying…' : 'Verify and continue'}
          disabled={verify.isPending}
          onPress={() => verify.mutate()}
        />
        <Action
          label="Resend code"
          disabled={resend.isPending}
          onPress={() => resend.mutate()}
        />
        {resend.isSuccess && <Text>New code sent.</Text>}
        {resend.isError && (
          <Text accessibilityRole="alert">{resend.error.message}</Text>
        )}
      </View>
    </Screen>
  );
}
