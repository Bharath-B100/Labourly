import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  useWindowDimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LoginTransitionProps {
  onComplete: () => void;
  isReadyToSettle: boolean;
  statusText?: string;
}

export function LoginTransition({
  onComplete,
  isReadyToSettle,
}: LoginTransitionProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Center of screen
  const cx = width / 2;
  const cy = height / 2;

  // Target coordinates for settled brand logo in header:
  // In Dashboard (customer): ScrollView padding (16) + PageHeading inset (8) = 24
  // PageHeading paddingTop: 16
  // Logo size: 38x38 -> center is (24 + 19, insets.top + 16 + 19)
  const targetX = 24 + 19;
  const targetY = insets.top + 16 + 19;

  const deltaX = targetX - cx;
  const deltaY = targetY - cy;

  // Animated values
  const [enterOpacity] = useState(() => new Animated.Value(0));
  const [enterScale] = useState(() => new Animated.Value(0.7));
  const [spinValue] = useState(() => new Animated.Value(0));
  const [pulseScale] = useState(() => new Animated.Value(1));

  // Flight values (from center to top-left)
  const [flightProgress] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  const [hasStartedFlight, setHasStartedFlight] = useState(false);
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const flight = useRef<Animated.CompositeAnimation | null>(null);
  const started = useRef(false);
  const mounted = useRef(true);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    mounted.current = true;
    started.current = false;
    // 1. Enter into center
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(enterScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Rolling spin while in center
    spinLoop.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.current.start();

    // 3. Gentle breathing pulse
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 0.95,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current.start();

    return () => {
      mounted.current = false;
      spinLoop.current?.stop();
      pulseLoop.current?.stop();
      flight.current?.stop();
      overlayOpacity.stopAnimation();
      enterOpacity.stopAnimation();
      enterScale.stopAnimation();
    };
  }, [enterOpacity, enterScale, spinValue, pulseScale, overlayOpacity]);

  useEffect(() => {
    if (isReadyToSettle && !started.current) {
      started.current = true;
      spinLoop.current?.stop();
      pulseLoop.current?.stop();
      // Continue from the actual native rotation instead of snapping to zero.
      spinValue.stopAnimation((rotation) => {
        if (!mounted.current) return;
        setHasStartedFlight(true);
        flight.current = Animated.parallel([
          Animated.timing(spinValue, {
            toValue: Math.ceil(rotation) + 1,
            duration: 850,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flightProgress, {
            toValue: 1,
            duration: 850,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
          }),
        ]);
        flight.current.start(({ finished }) => {
          if (!finished || !mounted.current) return;
          // Hold settled position briefly, then cross-fade out overlay to reveal identical dashboard header
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(({ finished: faded }) => {
            if (faded && mounted.current) complete.current();
          });
        });
      });
    }
  }, [
    isReadyToSettle,
    spinValue,
    pulseScale,
    flightProgress,
    overlayOpacity,
  ]);

  // Center rotation
  const centerRotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Translation
  const translateX = flightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, deltaX],
  });

  const translateY = flightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, deltaY],
  });

  // Scale: 96px down to 38px (scale = 38 / 96 = 0.3958)
  const flightScale = flightProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 38 / 96],
  });

  return (
    <Animated.View
      style={[styles.fullscreen, { opacity: overlayOpacity }]}
      pointerEvents="auto"
      accessibilityViewIsModal
    >
      <View pointerEvents="none" style={styles.loadingBackground}>
        <View
          style={[styles.backgroundHalo, { left: cx - 180, top: cy - 180 }]}
        />
        <View style={[styles.innerHalo, { left: cx - 118, top: cy - 118 }]} />
      </View>

      {/* Floating Animated Helmet */}
      <View
        pointerEvents="none"
        style={[
          styles.helmetAnchor,
          {
            left: cx - 48,
            top: cy - 48,
          },
        ]}
      >
        <Animated.View
          style={{
            ...styles.logoCube,
            width: 96,
            height: 96,
            opacity: enterOpacity,
            transform: [
              { translateX },
              { translateY },
              { scale: enterScale },
              { scale: pulseScale },
              { scale: flightScale },
              { rotate: centerRotate },
            ],
          }}
        >
          <Animated.Image
            source={require('../../assets/logo.png')}
            style={styles.helmetImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loadingBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E6EFEC',
    overflow: 'hidden',
  },
  backgroundHalo: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#EDF4F0',
    borderWidth: 1,
    borderColor: '#D7E6DF',
  },
  innerHalo: {
    position: 'absolute',
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: '#F5F8F4',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  logoCube: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#214E44',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    boxShadow:
      '0 10px 18px rgba(33,78,68,0.18), inset 0 -5px 0 #E3EAE6, inset 0 2px 0 #FFFFFF',
  },
  helmetAnchor: {
    position: 'absolute',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helmetImage: {
    width: 76,
    height: 76,
  },
});
