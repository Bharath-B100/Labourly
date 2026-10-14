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
import { LoginTransition } from '../components/LoginTransition';
import { Action, EmptyState, Loading, Screen } from '../components/ui';

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

  const { session, loadSession, isLoading, error, logout } = useSession();
  const transition = useLoginTransition();
  useEffect(() => observeNotificationAccount(client), [client]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Screen>
          <Loading />
        </Screen>
      </SafeAreaProvider>
    );
  }
  if (error)
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
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
            variant="secondary"
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
      <StatusBar style="dark" />
      <QueryClientProvider client={client}>
        <DraftNavigationGuard.Provider value={draftGuard}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#F7F9F5' },
              headerTintColor: '#145C58',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#F7F9F5' },
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
