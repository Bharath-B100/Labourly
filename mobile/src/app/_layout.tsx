import '../../global.css';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hasRole, useSession } from '../auth/session';
import { Action, EmptyState, Loading, Screen } from '../components/ui';

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

  const { session, loadSession, isLoading, error, logout } = useSession();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <Screen>
          <Loading />
        </Screen>
      </SafeAreaProvider>
    );
  }
  if (error)
    return (
      <SafeAreaProvider>
        <Screen>
          <EmptyState title="Connection unavailable" description={error} />
          <Action
            label="Try again"
            onPress={() => {
              void loadSession();
            }}
          />
          <Action
            label="Sign out"
            onPress={() => {
              void logout().catch(() =>
                useSession.setState({
                  error:
                    'Signed out on this device. Server revocation could not be confirmed.',
                }),
              );
            }}
          />
        </Screen>
      </SafeAreaProvider>
    );
  const completed = session?.onboardingState === 'COMPLETED';

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'NammaCrew' }} />
          <Stack.Protected guard={!session || !completed}>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!completed}>
            <Stack.Screen name="profile" options={{ title: 'Edit profile' }} />
          </Stack.Protected>
          <Stack.Protected guard={!!completed && hasRole(session, 'CUSTOMER')}>
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!completed && hasRole(session, 'WORKER')}>
            <Stack.Screen name="(worker)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
