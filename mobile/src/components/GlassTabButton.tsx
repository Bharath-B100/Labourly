import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useGlassMotion } from './glass';

/** Keep the navigator's link, press, long-press and accessibility semantics. */
export function GlassTabButton({
  children,
  style,
  ...props
}: ComponentProps<typeof PlatformPressable>) {
  const selected =
    props.accessibilityState?.selected ?? props['aria-selected'] ?? false;
  const reduced = useGlassMotion();
  const [scale] = useState(() => new Animated.Value(selected ? 1 : 0.92));
  useEffect(() => {
    if (reduced) {
      scale.setValue(selected ? 1 : 0.92);
      return;
    }
    const animation = Animated.spring(scale, {
      toValue: selected ? 1 : 0.92,
      damping: 16,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, reduced, scale]);
  return (
    <PlatformPressable {...props} style={[style, styles.button]}>
      {selected && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}
        >
          <Image
            accessible={false}
            source={require('../../assets/glass-nav-selected.png')}
            resizeMode="stretch"
            style={styles.material}
          />
        </Animated.View>
      )}
      {children}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  material: { width: '100%', height: '100%' },
});
