import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LabourlyLiveChat } from '../../components/LabourlyLiveChat';

export default function ChatScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  return (
    <LabourlyLiveChat
      initialBookingId={bookingId}
      onGoToJobs={() => router.push('/(customer)/requirements')}
      onGoToWorkers={() => router.push('/(customer)/discover')}
    />
  );
}
