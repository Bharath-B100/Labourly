import React from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LabourlyMyProfileScreen } from '../../components/LabourlyMyProfileScreen';
import { hasRole, useSession } from '../../auth/session';
import { apiJson } from '../../api/client';
import type { Draft } from '../../onboarding/profile';
import data from '../../location/india-cities.json';

export default function Profile() {
  const router = useRouter();
  const session = useSession((state) => state.session);
  const logout = useSession((state) => state.logout);
  const cache = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['my-customer-profile', session?.userId],
    queryFn: () => apiJson<Draft>('/api/v1/profile/customer'),
    enabled: !!session?.userId,
    staleTime: 60_000,
  });

  const profileData = profileQuery.data?.data;
  const canSwitchToWorker = hasRole(session, 'WORKER');

  const handleFindWorkersInCity = (cityName: string, _state: string) => {
    const matchedCity = data.cities.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase(),
    );
    if (matchedCity) {
      router.push({
        pathname: '/(customer)/discover',
        params: {
          cityId: matchedCity.id,
          stateCode: matchedCity.stateCode,
        },
      });
    } else {
      router.push('/(customer)/discover');
    }
  };

  return (
    <LabourlyMyProfileScreen
      user={{
        fullName: profileData?.fullName || session?.fullName || 'Your account',
        phone: session?.phone || session?.contactPhone,
        role: 'Customer',
        isPhoneVerified: !!session?.phone,
        city: profileData?.city || null,
        district: profileData?.district || null,
        state: profileData?.state || null,
        postalCode: profileData?.postalCode || null,
        customerType: profileData?.customerType || null,
        companyName: profileData?.companyName || null,
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
      onFindWorkersInCity={handleFindWorkersInCity}
      onRowPress={(key) => {
        if (key === 'support') {
          router.push('/support');
          return;
        }
        if (key === 'bookings') {
          router.push('/(customer)/bookings');
        } else if (key === 'chat') {
          router.push('/(customer)/chat');
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
