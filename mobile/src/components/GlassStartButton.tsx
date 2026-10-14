import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGlassMotion } from './glass';

/** Native adaptation of the supplied CSS pill; reflections do not intercept input. */
export function GlassStartButton({
  label = 'Get Started',
  onPress,
  disabled = false,
}: {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const reduced = useGlassMotion();
  const [motion] = useState(() => new Animated.Value(0));
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    const animation = Animated.spring(motion, {
      toValue: disabled || reduced ? 0 : pressed ? -1 : hovered ? 1 : 0,
      speed: 28,
      bounciness: 3,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [disabled, hovered, motion, pressed, reduced]);
  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [
            {
              scale: motion.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0.96, 1, 1],
              }),
            },
            {
              translateY: motion.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 0, -3],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.pill, focused && styles.focused]}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.innerRim} />
          <View style={styles.topReflection} />
          <View style={styles.bottomReflection} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Animated.View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.icon,
            {
              transform: [
                {
                  scale: motion.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.94, 1, 1.1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.chevron} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#145C58',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
  },
  pill: {
    minHeight: 62,
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.98)',
    backgroundColor: 'rgba(255,255,255,0.38)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  focused: { borderColor: '#145C58' },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#104C49',
    flexShrink: 1,
    textAlign: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#145C58',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C58',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chevron: {
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#FFF',
    transform: [{ rotate: '45deg' }],
    marginRight: 5,
  },
  innerRim: {
    position: 'absolute',
    inset: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    borderBottomColor: 'rgba(20,92,88,0.3)',
  },
  topReflection: {
    position: 'absolute',
    top: 2,
    left: '7%',
    right: '7%',
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopWidth: 2,
    borderColor: '#FFF',
  },
  bottomReflection: {
    position: 'absolute',
    bottom: 2,
    left: '12%',
    right: '12%',
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
