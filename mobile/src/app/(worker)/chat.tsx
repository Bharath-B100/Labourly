import { useRouter, useLocalSearchParams } from 'expo-router';
import { LabourlyLiveChat } from '../../components/LabourlyLiveChat';
export default function WorkerChat() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  return (
    <LabourlyLiveChat
      initialBookingId={bookingId}
      onGoToJobs={() => router.push('/(worker)/bookings')}
      onGoToWorkers={() => router.push('/(worker)/opportunities')}
    />
  );
}
