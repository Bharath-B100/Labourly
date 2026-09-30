import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Action, Screen } from '../../components/ui';
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
      <View className="gap-6">
        <Text accessibilityRole="header" className="text-3xl font-bold">
          Your phone number
        </Text>
        <Text>Sign in or create your NammaCrew account.</Text>
        <TextInput
          accessibilityLabel="Phone number"
          placeholder="+919876543210"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
          editable={!mutation.isPending}
          className="rounded-xl border border-slate-300 bg-white p-4 text-lg"
        />
        {mutation.isError && (
          <Text accessibilityRole="alert">{mutation.error.message}</Text>
        )}
        <Action
          label={mutation.isPending ? 'Sending code…' : 'Send code'}
          disabled={mutation.isPending}
          onPress={() => mutation.mutate()}
        />
      </View>
    </Screen>
  );
}
