import { Alert, Image, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getWorkerDetails } from '../../../api/marketplace';
import { getMyBookings } from '../../../api/quotations';
import { useSession } from '../../../auth/session';
import { Action, EmptyState, Loading, Screen } from '../../../components/ui';
import { GlassCard, palette } from '../../../components/theme';
import { SaveWorkerButton } from '../../../components/SaveWorkerButton';
import { getDefaultWorkerAvatar } from '../../../assets/defaultAvatars';

export default function WorkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useSession((state) => state.session?.userId);
  const router = useRouter();

  const query = useQuery({
    queryKey: ['worker-profile', userId, id],
    queryFn: () => getWorkerDetails(id),
    enabled: !!id && !!userId,
  });

  if (!id)
    return (
      <Screen>
        <EmptyState
          title="Worker unavailable"
          description="This worker link is incomplete. Return to Workers and choose a profile."
        />
      </Screen>
    );

  if (query.isPending)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  if (query.isError)
    return (
      <Screen>
        <EmptyState
          title="Unable to load this worker"
          description={query.error.message}
        />
        <Action
          label="Retry"
          onPress={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );

  const worker = query.data;

  const handleMessageOrCall = async () => {
    try {
      const bookings = await getMyBookings();
      const matching = bookings.find(
        (b) => b.workerId === id && b.status !== 'CANCELLED',
      );
      if (matching) {
        router.push({
          pathname: '/(customer)/chat',
          params: { bookingId: matching.id },
        });
        return;
      }
    } catch {
      // handled
    }

    Alert.alert(
      'Booking chat',
      `Text messaging with ${worker.name} is available after a quotation is accepted. Voice and video calls are not available yet.\n\nPost your requirement to receive a tailored quotation!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post Requirement',
          onPress: () => router.push('/(customer)/post'),
        },
        {
          text: 'Open Chat',
          onPress: () => router.push('/(customer)/chat'),
        },
      ],
    );
  };

  return (
    <Screen branded={false}>
      <Image
        accessibilityLabel={`${worker.name} profile photo`}
        source={
          worker.profilePhotoUrl
            ? { uri: worker.profilePhotoUrl }
            : getDefaultWorkerAvatar(worker.trade)
        }
        resizeMode="cover"
        style={{
          width: '100%',
          height: 280,
          borderRadius: 16,
          backgroundColor: palette.grey,
        }}
      />
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={{ fontSize: 28, fontWeight: '700', color: palette.ink }}
        >
          {worker.name}
        </Text>
        <Text style={{ fontSize: 16, color: palette.ink }}>
          {worker.trade} · {worker.experienceYears} years of experience
        </Text>
        <Text style={{ color: palette.ink }}>
          {worker.workerType === 'TEAM'
            ? `Team · ${worker.teamSize ?? 'Unspecified'} workers`
            : 'Individual worker'}
        </Text>
      </View>
      <SaveWorkerButton workerId={id} />

      {/* Action: Direct Message & Call */}
      <Action
        label={`💬 Message ${worker.name}`}
        variant="secondary"
        onPress={handleMessageOrCall}
      />

      <GlassCard style={{ gap: 8, backgroundColor: palette.grey }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.ink }}>
          Rates agreed by quotation
        </Text>
        <Text style={{ color: palette.ink, lineHeight: 22 }}>
          Publish your requirement to receive eligible workers’ quotations.
          Accept a quotation to create a booking after schedule checks.
        </Text>
      </GlassCard>
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.ink }}>
          Skills & location
        </Text>
        <Text style={{ color: palette.ink }}>
          {worker.skills.length
            ? worker.skills.join(' · ')
            : 'No skills listed'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {worker.skills.map((skill) => (
            <View
              key={skill}
              style={{
                backgroundColor: palette.grey,
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: palette.ink }}>{skill}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: palette.ink }}>
          {[worker.city, worker.district, worker.state]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>
      <Text style={{ color: palette.ink }}>
        Worker-declared availability:{' '}
        {worker.availability.toLowerCase().replaceAll('_', ' ')}. Availability
        for your dates is checked before booking.
      </Text>
      <Text style={{ color: palette.ink, lineHeight: 22 }}>
        Reviews and identity/KYC verification are not available in this version.
        A development profile approval is not verified identity.
      </Text>
      <Action
        label="Post a requirement"
        onPress={() => router.push('/(customer)/post')}
      />
    </Screen>
  );
}
