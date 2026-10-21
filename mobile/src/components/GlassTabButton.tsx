import type { ComponentProps } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlatformPressable } from 'expo-router/react-navigation';

export function TabIcon({
  name,
  color,
  focused,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color: ComponentProps<typeof Ionicons>['color'];
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 38,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? '#FFCC25' : '#FFFFFF',
      }}
    >
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}
/** Forward all navigation events, including tabPress and the draft exit guard. */
export function GlassTabButton({
  style,
  ...props
}: ComponentProps<typeof PlatformPressable>) {
  const selected =
    props.accessibilityState?.selected ?? props['aria-selected'] ?? false;
  return (
    <PlatformPressable
      {...props}
      style={[
        style,
        {
          minHeight: 48,
          borderTopWidth: 3,
          borderTopColor: selected ? '#FFCC25' : '#FFFFFF',
        },
      ]}
    />
  );
}

/** Short visual labels at large text sizes; the tab retains its full accessibility label. */
export function CustomerTabLabel({ label }: { label: string }) {
  const { fontScale } = useWindowDimensions();
  const compact: Record<string, string> = {
    Home: 'Hub',
    Workers: 'Crew',
    Profile: 'You',
  };
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '600',
        color: '#202326',
        textAlign: 'center',
      }}
    >
      {fontScale >= 1.5 ? (compact[label] ?? label) : label}
    </Text>
  );
}
