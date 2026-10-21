import '../../global.css';
import { StatusBar } from 'expo-status-bar';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import {
  DraftNavigationGuard,
  type DraftExitGuard,
} from '../navigation/DraftNavigationGuard';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hasRole, useSession } from '../auth/session';
import { useLoginTransition } from '../auth/loginTransition';
import { observeNotificationAccount } from '../notifications/session';
import { observeQueryAccount } from '../auth/queryIsolation';
import { LoginTransition } from '../components/LoginTransition';
import { Action, EmptyState, Screen } from '../components/ui';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
  const draftGuard: DraftExitGuard = useRef(null);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );

  const { session, loadSession, isLoading, error } = useSession();
  const transition = useLoginTransition();
  useEffect(() => observeNotificationAccount(client), [client]);
  useEffect(() => observeQueryAccount(client), [client]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const completed =
    !isLoading && !error && session?.onboardingState === 'COMPLETED';

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <QueryClientProvider client={client}>
        <DraftNavigationGuard.Provider value={draftGuard}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#202326',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
            UNSTABLE_router={(original) => ({
              getStateForAction(state, action, options) {
                const next = original.getStateForAction(state, action, options);
                if (
                  next &&
                  next.routes[next.index ?? 0]?.key !==
                    state.routes[state.index ?? 0]?.key &&
                  draftGuard.current?.(action)
                )
                  return state;
                return next;
              },
            })}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Protected guard={!session || !completed}>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!!completed}>
              <Stack.Screen
                name="edit-profile"
                options={{ title: 'Edit profile' }}
              />
              <Stack.Screen
                name="profile"
                options={{ title: 'Edit profile' }}
              />
              <Stack.Screen
                name="notifications"
                options={{ headerShown: false }}
              />
            </Stack.Protected>
            <Stack.Protected
              guard={!!completed && hasRole(session, 'CUSTOMER')}
            >
              <Stack.Screen
                name="(customer)"
                options={{ headerShown: false }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!!completed && hasRole(session, 'WORKER')}>
              <Stack.Screen name="(worker)" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        </DraftNavigationGuard.Provider>
      </QueryClientProvider>
      {transition.isActive && (
        <LoginTransition
          isReadyToSettle={transition.isReadyToSettle}
          onComplete={transition.finishTransition}
        />
      )}
    </SafeAreaProvider>
  );
}
