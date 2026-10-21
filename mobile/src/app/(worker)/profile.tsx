import React from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LabourlyMyProfileScreen } from '../../components/LabourlyMyProfileScreen';
import { hasRole, useSession } from '../../auth/session';

export default function WorkerProfile() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const logout = useSession((state) => state.logout);
  const cache = useQueryClient();

  const canSwitchToCustomer = hasRole(session, 'CUSTOMER');

  return (
    <LabourlyMyProfileScreen
      user={{
        fullName: session?.fullName || 'Worker account',
        phone: session?.phone,
        role: 'Worker',
        isPhoneVerified: !!session?.phone,
      }}
      role="WORKER"
      canSwitchRole={canSwitchToCustomer}
      otherRoleLabel="customer"
      onSwitchRole={() => {
        cache.clear();
        router.replace('/(customer)/home');
      }}
      onBack={() => router.back()}
      onEdit={() =>
        router.push({
          pathname: '/edit-profile',
          params: { role: 'WORKER' },
        })
      }
      onLogout={async () => {
        await logout().catch(() => {});
        cache.clear();
        router.replace('/auth/login');
      }}
      onRowPress={(key) => {
        if (key === 'service-areas') {
          router.push({
            pathname: '/edit-profile',
            params: { role: 'WORKER' },
          });
        } else if (key === 'bookings') {
          router.push('/(worker)/bookings');
        } else if (key === 'notifications') {
          router.push('/notifications');
        }
      }}
    />
  );
}
