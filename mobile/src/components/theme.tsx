import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';
import type { PropsWithChildren } from 'react';
export const palette = {
  yellow: '#FFCC25',
  ink: '#202326',
  white: '#FFFFFF',
  grey: '#E5E7EB',
  // Compatibility aliases keep existing marketplace screens on one palette.
  teal: '#202326',
  muted: '#202326',
  pearl: '#FFFFFF',
  mint: '#E5E7EB',
} as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const typography = {
  title: 28,
  heading: 20,
  body: 16,
  caption: 13,
} as const;
/** Brand artwork approved by the user; original reference retained with assets. */
export function LabourlyMark({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/labourly/hardhat-mark.png')}
      accessible={false}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
export function LabourlyLogo({ width = 200 }: { width?: number }) {
  return (
    <Image
      source={require('../../assets/labourly/wordmark.png')}
      accessibilityLabel="Labourly. Hire Local. Build Better."
      accessible
      resizeMode="contain"
      style={{ width, maxWidth: '100%', aspectRatio: 3 }}
    />
  );
}
// Legacy export names are adapters, not a second visual theme.
export function GlassBackdrop() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.white }]}
    />
  );
}
export const glassSurface = {
  backgroundColor: palette.white,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: palette.grey,
} as const;
export function GlassRim(_props: { radius?: number }) {
  return null;
}
export function GlassCard({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[glassSurface, { padding: 16 }, style]}>
      {children}
    </View>
  );
}
export function Brand({ right }: { right?: React.ReactNode } = {}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexShrink: 1,
        }}
      >
        <LabourlyLogo />
      </View>
      {right}
    </View>
  );
}
export function PageHeading({
  title,
  subtitle,
  inset = 20,
  right,
}: {
  title: string;
  subtitle?: string;
  inset?: number;
  right?: React.ReactNode;
}) {
  return (
    <View
      style={{
        paddingHorizontal: inset,
        paddingTop: 12,
        paddingBottom: 12,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 22,
            flex: 1,
            fontWeight: '700',
            color: palette.ink,
          }}
        >
          {title}
        </Text>
        {right}
      </View>
      {subtitle && (
        <Text style={{ fontSize: 15, lineHeight: 22, color: palette.ink }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
export function GlassTabBackground(_props: { count?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: palette.white,
          borderTopWidth: 1,
          borderColor: palette.grey,
        },
      ]}
    />
  );
}
