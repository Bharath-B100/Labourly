import { useEffect } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Brand, palette } from './theme';
/** No artificial auth delay; the overlay follows real session readiness. */
export function LoginTransition({
  isReadyToSettle,
  onComplete,
}: {
  isReadyToSettle: boolean;
  onComplete: () => void;
}) {
  useEffect(() => {
    if (isReadyToSettle) onComplete();
  }, [isReadyToSettle, onComplete]);
  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: palette.white,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          gap: 24,
        },
      ]}
    >
      <Brand />
      <ActivityIndicator color={palette.ink} />
      <Text accessibilityLiveRegion="polite" style={{ color: palette.ink }}>
        Restoring your account…
      </Text>
    </View>
  );
}
