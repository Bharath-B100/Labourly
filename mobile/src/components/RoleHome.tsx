import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/session';
import { Action, EmptyState, Screen } from './ui';
export default function RoleHome({ role }: { role: 'Customer' | 'Worker' }) {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const cache = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen>
      <Text accessibilityRole="header" className="text-ink text-3xl font-bold">
        {role} Home
      </Text>
      <Text className="text-ink">Welcome, {session?.fullName}</Text>
      <Text className="text-ink">{session?.phone}</Text>
      <EmptyState
        title="Your profile is ready"
        description="Manage your profile and use the tabs below to explore jobs, quotes and bookings."
      />
      <Action label="Edit profile" onPress={() => router.push('/profile')} />
      <Action
        label="Sign out"
        variant="secondary"
        onPress={() => {
          void useSession
            .getState()
            .logout()
            .then(() => {
              cache.clear();
              router.replace('/');
            })
            .catch(() =>
              setError(
                'Signed out locally. Server revocation could not be confirmed.',
              ),
            );
        }}
      />
      {error && (
        <Text className="text-ink" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </Screen>
  );
}
