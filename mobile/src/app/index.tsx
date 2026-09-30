import { Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { homeRoute, useSession } from '../auth/session';
import { Action, EmptyState, Screen } from '../components/ui';
export default function Welcome() {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const route = homeRoute(session);
  if (route !== '/') return <Redirect href={route} />;
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
        <Text className="text-lg text-slate-600">
          A construction workforce marketplace for India.
        </Text>
      </View>
      <EmptyState
        title="Ready to build?"
        description="Set up your customer or worker profile to get started."
      />
      <Action label="Get Started" onPress={() => router.push('/auth/login')} />
      <Text>NammaCrew is a provisional name. Phase 2 development build.</Text>
    </Screen>
  );
}
