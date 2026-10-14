import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';
import type { PropsWithChildren } from 'react';

export const palette = {
  yellow: '#F7C948',
  teal: '#145C58',
  ink: '#104C49',
  muted: '#466E68',
  pearl: '#F7F9F5',
  mint: '#DCEEE7',
};

/** Static colour field avoids expensive live blur on scrolling Android screens. */
export function GlassBackdrop() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Image
        source={require('../../assets/glass-background.png')}
        resizeMode="stretch"
        accessible={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

export const glassSurface = {
  backgroundColor: 'rgba(255,255,255,0.20)',
  borderRadius: 28,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.96)',
  shadowColor: '#145C58',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  boxShadow:
    '0 8px 16px rgba(20,92,88,0.12), inset 2px 3px 2px rgba(255,255,255,0.95), inset -2px -3px 2px rgba(255,255,255,0.75), inset 5px 5px 7px rgba(170,224,208,0.28)',
} as const;

export function GlassRim({ radius = 28 }: { radius?: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: radius, overflow: 'hidden' },
      ]}
    >
      <Image
        source={require('../../assets/glass-sheen.png')}
        style={{ width: '100%', height: '100%', opacity: 0.65 }}
        resizeMode="stretch"
        accessible={false}
      />
      <View
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: radius - 3,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.70)',
          borderLeftWidth: 3,
          borderBottomColor: 'rgba(255,255,255,0.95)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          inset: 7,
          borderRadius: radius - 7,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
        }}
      />
    </View>
  );
}

export function GlassCard({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[glassSurface, { padding: 20 }, style]}>
      <GlassRim />
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
        marginBottom: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E3EAE6',
          }}
        >
          <Image
            accessible={false}
            source={require('../../assets/logo.png')}
            style={{ width: 30, height: 30, resizeMode: 'contain' }}
          />
        </View>
        <Text
          style={{
            color: palette.teal,
            fontSize: 21,
            fontWeight: '800',
            letterSpacing: -0.6,
          }}
        >
          NammaCrew
        </Text>
      </View>
      {right}
    </View>
  );
}

export function PageHeading({
  title,
  subtitle,
  inset = 28,
  right,
}: {
  title: string;
  subtitle?: string;
  inset?: number;
  right?: React.ReactNode;
}) {
  return (
    <View
      style={{ paddingHorizontal: inset, paddingTop: 16, paddingBottom: 12 }}
    >
      <Brand right={right} />
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 34,
          fontWeight: '800',
          letterSpacing: -0.9,
          color: palette.ink,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: palette.muted,
            marginTop: 5,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/** Five adjoining lenses; navigator retains tab events, guards and accessibility. */
export function GlassTabBackground({ count = 5 }: { count?: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        { flexDirection: 'row', alignItems: 'stretch' },
      ]}
    >
      <Image
        accessible={false}
        source={
          count === 4
            ? require('../../assets/glass-nav-4.png')
            : require('../../assets/glass-nav-5.png')
        }
        resizeMode="stretch"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
