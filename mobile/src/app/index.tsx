import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../api/client';
import { Action, EmptyState, Loading, Screen } from '../components/ui';

export default function Welcome() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    enabled: false,
  });
  return (
    <Screen>
      <View className="gap-3">
        <Text className="text-sm font-bold uppercase tracking-widest text-teal-800">
          Built for the people who build
        </Text>
        <Text
          accessibilityRole="header"
          className="text-4xl font-bold text-slate-950"
        >
          Your next project.{'\n'}The right crew.
        </Text>
        <Text className="text-lg leading-7 text-slate-600">
          A construction workforce marketplace for India.
        </Text>
      </View>
      <EmptyState
        title="Foundation in progress"
        description="Customer and worker spaces are prepared. Secure sign-in, worker discovery and booking are not implemented yet."
      />
      <EmptyState
        title="For customers & workers"
        description="Find skilled people for your site, or find your next opportunity. Access will follow your verified account roles."
      />
      <Action
        label="Check backend connection"
        onPress={() => {
          void health.refetch();
        }}
      />
      {health.isFetching ? <Loading /> : null}
      {health.isError ? (
        <Text accessibilityRole="alert">
          Unable to reach the backend. Check the API URL and local server.
        </Text>
      ) : null}
      {health.isSuccess ? (
        <Text accessibilityLiveRegion="polite">
          Backend status: {health.data.status}
        </Text>
      ) : null}
      <Text className="text-sm text-slate-500">
        NammaCrew is a provisional name. Phase 1 development build.
      </Text>
    </Screen>
  );
}
