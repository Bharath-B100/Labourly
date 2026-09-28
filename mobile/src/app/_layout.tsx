import '../../global.css';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hasRole, useSession } from '../auth/session';
import { Action, EmptyState, Screen } from '../components/ui';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <Screen>
        <EmptyState
          title="Something went wrong"
          description="Please try opening this screen again."
        />
        <Action label="Try again" onPress={retry} />
      </Screen>
    </SafeAreaProvider>
  );
}
export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );
  const session = useSession((state) => state.session);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'NammaCrew' }} />
          <Stack.Protected guard={hasRole(session, 'CUSTOMER')}>
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={hasRole(session, 'WORKER')}>
            <Stack.Screen name="(worker)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
