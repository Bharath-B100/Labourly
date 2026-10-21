import React from 'react';
import { useRouter } from 'expo-router';
import { LabourlyChatScreen } from '../../components/LabourlyChatScreen';

export default function ChatUnavailable() {
  const router = useRouter();

  return (
    <LabourlyChatScreen
      isUnavailable={true}
      onGoToJobs={() => router.push('/(customer)/requirements')}
    />
  );
}
