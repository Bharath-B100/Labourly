import { Text } from 'react-native';
import { Action, Screen } from './ui';
import { GlassCard, palette } from './theme';
export interface LabourlyWalletScreenProps {
  onBack: () => void;
}
export function LabourlyWalletScreen({ onBack }: LabourlyWalletScreenProps) {
  return (
    <Screen branded={false}>
      <Text
        accessibilityRole="header"
        style={{ color: palette.ink, fontSize: 28, fontWeight: '800' }}
      >
        Wallet & Payments
      </Text>
      <GlassCard style={{ gap: 16 }}>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '700' }}>
          Wallet and payments are not available yet
        </Text>
        <Text style={{ color: palette.ink, fontSize: 16 }}>
          You can manage quotations and bookings in Labourly. This app does not
          collect, hold or transfer money. No wallet balance or payment history
          is available.
        </Text>
      </GlassCard>
      <Action label="Go back" variant="secondary" onPress={onBack} />
    </Screen>
  );
}
