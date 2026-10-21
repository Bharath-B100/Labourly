import React from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LabourlyMyProfileScreen } from '../../components/LabourlyMyProfileScreen';
import { hasRole, useSession } from '../../auth/session';

export default function Profile() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const logout = useSession((state) => state.logout);
  const cache = useQueryClient();

  const canSwitchToWorker = hasRole(session, 'WORKER');

  return (
    <LabourlyMyProfileScreen
      user={{
        fullName: session?.fullName || 'Your account',
        phone: session?.phone,
        role: 'Customer',
        isPhoneVerified: !!session?.phone,
      }}
      role="CUSTOMER"
      canSwitchRole={canSwitchToWorker}
      otherRoleLabel="worker"
      onSwitchRole={() => {
        cache.clear();
        router.replace('/(worker)/opportunities');
      }}
      onBack={() => router.back()}
      onEdit={() =>
        router.push({
          pathname: '/edit-profile',
          params: { role: 'CUSTOMER' },
        })
      }
      onLogout={async () => {
        await logout().catch(() => {});
        cache.clear();
        router.replace('/auth/login');
      }}
      onRowPress={(key) => {
        if (key === 'bookings') {
          router.push('/(customer)/bookings');
        } else if (key === 'requirements') {
          router.push('/(customer)/requirements');
        } else if (key === 'saved-workers') {
          router.push('/(customer)/saved-workers');
        } else if (key === 'wallet') {
          router.push('/(customer)/wallet');
        } else if (key === 'notifications') {
          router.push('/notifications');
        }
      }}
    />
  );
}
