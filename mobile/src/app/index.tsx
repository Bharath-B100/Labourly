import { Redirect, useRouter } from 'expo-router';
import { homeRoute, useSession } from '../auth/session';
import { LaunchScreen } from '../components/LaunchScreen';
import { Action, EmptyState, Screen } from '../components/ui';
import { IntroCarousel } from '../components/IntroCarousel';
export default function Welcome() {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const { isLoading, error, loadSession, logout } = useSession();
  if (isLoading) return <LaunchScreen />;
  if (error)
    return (
      <Screen>
        <EmptyState title="Connection unavailable" description={error} />
        <Action label="Try again" onPress={() => void loadSession()} />
        <Action
          label="Sign out"
          variant="secondary"
          onPress={() =>
            void logout().catch(() =>
              useSession.setState({
                error:
                  'Signed out on this device. Server revocation could not be confirmed.',
              }),
            )
          }
        />
      </Screen>
    );
  const route = homeRoute(session);
  if (route !== '/') return <Redirect href={route} />;
  return <IntroCarousel onContinue={() => router.push('/auth/login')} />;
}
