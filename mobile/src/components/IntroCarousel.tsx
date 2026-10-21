import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Action, Screen } from './ui';
import { palette, LabourlyMark } from './theme';

const slides = [
  {
    title: 'Reliable people.\nStronger projects.',
    copy: 'Find skilled workers for your next project, or find work that fits your trade.',
    caption: 'LOCAL SKILLS. SHARED AMBITION.',
  },
  {
    title: 'Your project.\nYour requirements.',
    copy: 'Choose a location and schedule. Compare real quotations from eligible workers before you hire.',
    caption: 'A CLEAR PATH FROM JOB TO CREW',
  },
  {
    title: 'Build your\nnext opportunity.',
    copy: 'Work independently or as a team. Set your service areas and manage quotations and bookings in one place.',
    caption: 'FOR CUSTOMERS AND WORKERS',
  },
];

/**
 * Enhanced IntroCarousel with authentic Labourly UI:
 * Uses the 4-color palette (#FFCC25, #202326, #FFFFFF, #E5E7EB),
 * the approved brand logo, and the hero illustration while preserving
 * navigation flow and test contracts.
 */
export function IntroCarousel({ onContinue }: { onContinue: () => void }) {
  const [page, setPage] = useState(0);
  const slide = slides[page] ?? slides[0]!;

  return (
    <Screen>
      {/* Slide Headlines */}
      <View style={styles.typographyContainer} accessibilityLiveRegion="polite">
        <Text accessibilityRole="header" style={styles.titleText}>
          {slide.title}
        </Text>
        <Text style={styles.copyText}>{slide.copy}</Text>
      </View>

      {/* Central Hero Card: Clean Artwork with Hard Hat Mark */}
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.heroCard}
      >
        <View style={styles.imageClipper}>
          <Image
            source={require('../../assets/labourly/onboarding-screen-mockup.jpg')}
            resizeMode="cover"
            style={styles.heroImage}
          />
        </View>
        <View style={styles.markBadge}>
          <LabourlyMark size={46} />
        </View>
      </View>

      {/* Caption Tag */}
      <Text style={styles.captionText}>{slide.caption}</Text>

      {/* Pagination Indicator */}
      <View
        style={styles.paginationRow}
        accessibilityLabel={`Introduction ${page + 1} of ${slides.length}`}
      >
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              page === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Navigation Actions */}
      <Action
        label={page === slides.length - 1 ? 'Get started' : 'Continue'}
        withArrow
        onPress={() =>
          page === slides.length - 1 ? onContinue() : setPage(page + 1)
        }
      />

      {page > 0 && (
        <Action
          label="Previous"
          variant="quiet"
          onPress={() => setPage(page - 1)}
        />
      )}

      <Action
        label="Sign in or skip introduction"
        variant="quiet"
        onPress={onContinue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  typographyContainer: {
    gap: 12,
    paddingTop: 4,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  copyText: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.ink,
    opacity: 0.8,
  },
  heroCard: {
    height: 220,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: palette.ink,
    marginVertical: 4,
  },
  imageClipper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '125%',
    height: 310,
    transform: [{ translateY: -40 }],
  },
  markBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1.5,
    borderColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  captionText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dot: {
    height: 6,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: palette.yellow,
  },
  dotInactive: {
    width: 8,
    backgroundColor: palette.grey,
  },
});
