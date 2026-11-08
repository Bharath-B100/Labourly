import { Stack } from 'expo-router';
import { useSession } from '../../auth/session';
export default function AuthLayout() {
  const session = useSession((state) => state.session);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="phone-login" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected
        guard={!!session && session.onboardingState !== 'COMPLETED'}
      >
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
