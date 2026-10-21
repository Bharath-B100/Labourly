import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { hasRole, useSession, type Role } from '../auth/session';
import { Action, Screen } from './ui';
import { GlassCard, palette } from './theme';

export function ProfileSettings({ role }: { role: 'CUSTOMER' | 'WORKER' }) {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const other: Role = role === 'CUSTOMER' ? 'WORKER' : 'CUSTOMER';
  const row = (
    label: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    onPress: () => void,
    detail?: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: 16,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderColor: palette.grey,
      }}
    >
      <Ionicons name={icon} size={22} color={palette.ink} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.ink, fontSize: 16 }}>{label}</Text>
        {detail && (
          <Text style={{ color: palette.ink, fontSize: 12, marginTop: 4 }}>
            {detail}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.ink} />
    </Pressable>
  );
  return (
    <Screen branded={false}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 28, fontWeight: '700', color: palette.ink }}
      >
        My profile
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.yellow,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: '700', color: palette.ink }}>
            {session?.fullName?.charAt(0) || 'L'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>
            {session?.fullName || 'Your account'}
          </Text>
          <Text style={{ color: palette.ink }}>
            {role === 'CUSTOMER' ? 'Customer' : 'Worker'}
          </Text>
          <Text style={{ color: palette.ink }}>
            Phone verified · {session?.phone}
          </Text>
        </View>
      </View>
      <GlassCard style={{ paddingVertical: 0 }}>
        {role === 'CUSTOMER' &&
          row('Saved workers', 'heart-outline', () =>
            router.push('/(customer)/saved-workers'),
          )}
        {row('Edit profile', 'create-outline', () =>
          router.push({ pathname: '/edit-profile', params: { role } }),
        )}
        {role === 'WORKER' &&
          row(
            'Service areas and availability',
            'location-outline',
            () => router.push({ pathname: '/edit-profile', params: { role } }),
            'Manage your existing worker profile',
          )}
        {role === 'CUSTOMER' &&
          row('Wallet & payments', 'wallet-outline', () =>
            router.push('/(customer)/wallet'),
          )}
        {row('Notifications', 'notifications-outline', () =>
          router.push('/notifications'),
        )}
        {row('My bookings', 'briefcase-outline', () =>
          router.push(
            role === 'CUSTOMER' ? '/(customer)/bookings' : '/(worker)/bookings',
          ),
        )}
        {hasRole(session, other) &&
          row(
            `Switch to ${other === 'CUSTOMER' ? 'customer' : 'worker'}`,
            'swap-horizontal-outline',
            () => {
              // Switch only to an already-authorized role; never assign roles here.
              cache.clear();
              router.replace(
                other === 'CUSTOMER'
                  ? '/(customer)/home'
                  : '/(worker)/opportunities',
              );
            },
          )}
        {row('Verification information', 'shield-checkmark-outline', () =>
          setNotice(
            'Phone verification confirms access to your number. Identity/KYC verification is not established by this development application.',
          ),
        )}
        {row('About Labourly', 'information-circle-outline', () =>
          setNotice(
            'Labourly connects customers and workers through requirements, quotations and bookings. Messaging, payments and reviews are not available in this version.',
          ),
        )}
      </GlassCard>
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: palette.ink, fontSize: 15, lineHeight: 22 }}
        >
          {notice}
        </Text>
      )}
      <Text style={{ fontSize: 13, color: palette.ink }}>
        Language: English. Regional language settings and published
        support/legal resources are planned before public launch.
      </Text>
      <Action
        label="Sign out"
        variant="secondary"
        loading={busy}
        onPress={() => {
          setBusy(true);
          void useSession
            .getState()
            .logout()
            .catch(() =>
              useSession.setState({
                error:
                  'Signed out on this device. Server revocation could not be confirmed.',
              }),
            )
            .finally(() => {
              cache.clear();
              router.replace('/');
              setBusy(false);
            });
        }}
      />
    </Screen>
  );
}
