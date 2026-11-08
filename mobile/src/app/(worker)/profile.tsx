import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LabourlyMyProfileScreen } from '../../components/LabourlyMyProfileScreen';
import { hasRole, useSession } from '../../auth/session';
import { apiJson } from '../../api/client';
import type { Draft } from '../../onboarding/profile';

export default function WorkerProfile() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const logout = useSession((state) => state.logout);
  const cache = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['my-worker-profile', session?.userId],
    queryFn: () => apiJson<Draft>('/api/v1/profile/worker'),
    enabled: !!session?.userId,
    staleTime: 60_000,
  });

  const profileData = profileQuery.data?.data;
  const canSwitchToCustomer = hasRole(session, 'CUSTOMER');

  return (
    <LabourlyMyProfileScreen
      user={{
        fullName:
          profileData?.fullName || session?.fullName || 'Worker account',
        phone: session?.phone || session?.contactPhone,
        role: 'Worker',
        isPhoneVerified: !!session?.phone,
        city: profileData?.city || null,
        district: profileData?.district || null,
        state: profileData?.state || null,
        postalCode: profileData?.postalCode || null,
        workerType: profileData?.workerType || null,
        experienceYears: profileData?.experienceYears || null,
        availability: profileData?.availability || null,
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
        if (key === 'support') {
          router.push('/support');
          return;
        }
        if (key === 'service-areas') {
          router.push({
            pathname: '/edit-profile',
            params: { role: 'WORKER' },
          });
        } else if (key === 'bookings') {
          router.push('/(worker)/bookings');
        } else if (key === 'chat') {
          router.push('/(worker)/chat');
        } else if (key === 'notifications') {
          router.push('/notifications');
        }
      }}
    />
  );
}
