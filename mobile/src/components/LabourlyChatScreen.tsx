import { Text } from 'react-native';
import { Action, Screen } from './ui';
import { GlassCard, palette } from './theme';
export function LabourlyChatScreen({ onGoToJobs }: { onGoToJobs: () => void }) {
  return (
    <Screen branded={false}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 28, fontWeight: '800', color: palette.ink }}
      >
        Messages
      </Text>
      <GlassCard style={{ gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: palette.ink }}>
          Messaging is not available yet
        </Text>
        <Text style={{ color: palette.ink }}>
          Text messaging and private voice/video calls are not connected in this
          version. Manage your project through requirements, quotations and
          bookings.
        </Text>
      </GlassCard>
      <Action label="Go to my jobs" onPress={onGoToJobs} />
    </Screen>
  );
}
