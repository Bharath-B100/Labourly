import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

interface LabourlyOnboardingScreenProps {
  onNext?: () => void;
  activeSlide?: number; // 0-indexed, default 0
  totalSlides?: number; // default 3
}

export function LabourlyOnboardingScreen({
  onNext,
  activeSlide = 0,
  totalSlides = 3,
}: LabourlyOnboardingScreenProps) {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Top Third: Typography */}
        <View style={styles.headerContainer}>
          <Text accessibilityRole="header" style={styles.headline}>
            Reliable Labour{'\n'}for Every Project
          </Text>
          <Text style={styles.subtitle}>
            Find skilled, verified labourers{'\n'}in your city. Hire in minutes.
          </Text>
        </View>

        {/* Central Hero Illustration: Circular Construction Badge */}
        <View style={styles.heroWrapper}>
          <View style={styles.badgeCircle}>
            <Image
              source={require('../../assets/labourly/onboarding-screen-mockup.jpg')}
              resizeMode="cover"
              style={styles.heroImage}
              accessible
              accessibilityLabel="Friendly Indian construction worker in safety yellow vest and hard hat with construction cranes in background"
            />
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {/* Pagination Dots (Bottom-Left) */}
          <View
            style={styles.paginationContainer}
            accessibilityLabel={`Slide ${activeSlide + 1} of ${totalSlides}`}
          >
            {Array.from({ length: totalSlides }).map((_, index) => {
              const isActive = index === activeSlide;
              return (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    isActive ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              );
            })}
          </View>

          {/* Floating Action Button (Bottom-Right) */}
          <Pressable
            onPress={onNext}
            style={({ pressed }) => [
              styles.fabButton,
              pressed && styles.fabPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to next slide"
          >
            <Text style={styles.fabArrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  container: {
    flex: 1,
    backgroundColor: palette.white,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerContainer: {
    alignItems: 'center',
    textAlign: 'center',
    paddingTop: 12,
  },
  headline: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '800',
    color: palette.ink, // #202326
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    color: palette.ink, // #202326
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: -0.2,
    opacity: 0.9,
  },
  heroWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  badgeCircle: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: palette.grey, // #E5E7EB
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: palette.ink, // #202326
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: palette.yellow, // #FFCC25
  },
  dotInactive: {
    backgroundColor: palette.grey, // #E5E7EB
  },
  fabButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: palette.yellow, // #FFCC25
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  fabArrow: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.ink, // #202326
    lineHeight: 28,
  },
});
