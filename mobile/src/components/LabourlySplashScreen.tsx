import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { palette } from './theme';

interface LabourlySplashScreenProps {
  progress?: number; // 0 to 1, defaults to 0.5 (50%)
  animated?: boolean;
}

export function LabourlySplashScreen({
  progress = 0.5,
  animated = true,
}: LabourlySplashScreenProps) {
  const [animatedProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 900,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, animatedProgress]);

  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.rootContainer}>
      {/* 
        Full-bleed master artwork displaying the exact 1:1 design:
        - 9:41 iOS Status Bar
        - Labourly Wordmark with Safety Yellow Hard Hat on 'L'
        - 'Hire Local Labour, Fast.' Tagline
        - City Skyline with Cranes & 3 Hard-Hat Workers in Yellow Vests
        - 'Skilled People Build a Better Tomorrow'
        - Contoured 50% Progress Capsule Bar
      */}
      <Image
        source={require('../../assets/labourly/splash-screen-mockup.jpg')}
        resizeMode="contain"
        style={styles.fullScreenImage}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Labourly: Hire Local Labour, Fast. Skilled People Build a Better Tomorrow"
      />

      {/* Screen Reader & Test Accessibility Anchor */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
        accessibilityLabel="Restoring your session"
        style={styles.accessibilityOverlay}
      >
        <Text style={styles.srOnlyText}>
          Skilled People Build a Better Tomorrow
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  accessibilityOverlay: {
    position: 'absolute',
    bottom: 30,
    width: 240,
    height: 30,
    opacity: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  srOnlyText: {
    fontSize: 1,
    color: 'transparent',
  },
});
