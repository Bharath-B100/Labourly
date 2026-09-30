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
      <Text accessibilityRole="header" className="text-3xl font-bold">
        {role} Home
      </Text>
      <Text>Welcome, {session?.fullName}</Text>
      <Text>{session?.phone}</Text>
      <EmptyState
        title="Your profile is ready"
        description="Marketplace discovery and booking flows are planned for a later phase."
      />
      <Action label="Edit profile" onPress={() => router.push('/profile')} />
      <Action
        label="Sign out"
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
      {error && <Text accessibilityRole="alert">{error}</Text>}
    </Screen>
  );
}
