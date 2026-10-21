import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Action, Input, Screen } from '../../components/ui';
import { publicJson } from '../../api/client';
import { credentialsSchema } from '../../auth/credentials';
import { normalizePhone, validateOtp } from '../../auth/validation';
import { useSession } from '../../auth/session';
import { useLoginTransition } from '../../auth/loginTransition';

export default function VerifyScreen() {
  const { phone = '' } = useLocalSearchParams<{ phone?: string }>();
  const [code, setCode] = useState('');

  useEffect(() => {
    useLoginTransition.getState().cancelTransition();
    return () => {
      // If unmounting without transitioning, cleanup
    };
  }, []);

  const verify = useMutation({
    mutationFn: async () => {
      try {
        const tokens = credentialsSchema.parse(
          await publicJson('/api/v1/auth/otp/verify', {
            phone: normalizePhone(phone),
            code: validateOtp(code),
          }),
        );

        // Now commit session credentials to mount the dashboard underneath
        await useSession.getState().signIn(tokens);
        useLoginTransition.getState().markReadyToSettle();
      } catch (error) {
        useLoginTransition.getState().cancelTransition();
        throw error;
      }
    },
    onError: () => {
      useLoginTransition.getState().cancelTransition();
    },
  });

  const handleVerify = () => {
    useLoginTransition.getState().startTransition();
    verify.mutate();
  };

  const resend = useMutation({
    mutationFn: () =>
      publicJson('/api/v1/auth/otp/request', { phone: normalizePhone(phone) }),
  });

  return (
    <Screen>
      <View className="gap-6">
        <Text
          accessibilityRole="header"
          className="text-3xl font-bold text-ink"
        >
          Verify your phone
        </Text>
        <Text className="text-muted">
          Enter the six-digit code sent to {phone}.
        </Text>
        <Input
          label="Verification code"
          placeholder="Six-digit code"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          editable={!verify.isPending}
        />
        {verify.isError && (
          <Text accessibilityRole="alert" className="text-ink">
            {verify.error.message}
          </Text>
        )}
        <Action
          label={verify.isPending ? 'Verifying…' : 'Verify and continue'}
          loading={verify.isPending}
          onPress={handleVerify}
        />
        <Action
          label="Resend code"
          variant="secondary"
          loading={resend.isPending}
          onPress={() => resend.mutate()}
        />
        {resend.isSuccess && <Text className="text-ink">New code sent.</Text>}
        {resend.isError && (
          <Text accessibilityRole="alert" className="text-ink">
            {resend.error.message}
          </Text>
        )}
      </View>
    </Screen>
  );
}
