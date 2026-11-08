import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Action, Screen } from '../../components/ui';
import { palette } from '../../components/theme';
import { googleCredentials } from '../../auth/google';
import { useSession } from '../../auth/session';

export default function LoginScreen() {
  const router = useRouter();
  const [cancelled, setCancelled] = useState(false);
  const login = useMutation({
    mutationFn: async () => {
      setCancelled(false);
      const tokens = await googleCredentials();
      if (!tokens) {
        setCancelled(true);
        return;
      }
      await useSession.getState().signIn(tokens);
      const state = useSession.getState();
      if (!state.session)
        throw new Error(
          state.error ?? 'Unable to load your profile. Retry your connection.',
        );
    },
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
        <Text style={{ color: palette.ink }}>Good people. Great work.</Text>
      </View>
      <Text>
        Sign in or create your account with Google. Add your contact number when
        setting up your profile.
      </Text>
      <Action
        label={login.isPending ? 'Signing in...' : 'Continue with Google'}
        disabled={login.isPending}
        loading={login.isPending}
        onPress={() => login.mutate()}
      />
      {cancelled && (
        <Text accessibilityRole="alert">
          Sign-in cancelled. You can try again when ready.
        </Text>
      )}
      {login.isError && (
        <Text accessibilityRole="alert">
          Unable to sign in. {login.error.message}
        </Text>
      )}
      <Action
        label="Existing phone account"
        variant="secondary"
        disabled={login.isPending}
        onPress={() => router.push('/auth/phone-login')}
      />
      <Text>
        Already used a phone account? Use that account to keep your existing
        bookings. Google does not automatically merge accounts.
      </Text>
    </Screen>
  );
}
