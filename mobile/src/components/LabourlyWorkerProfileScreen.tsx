import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';
import { getDefaultWorkerAvatar } from '../assets/defaultAvatars';

export interface WorkerProfileData {
  profilePhotoUrl?: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  trade: string;
  experience: string;
  dailyRate: string;
  hourlyRate: string;
  skills: { id: string; name: string; emoji: string }[];
  availability: string;
  languages: string[];
  featuredReview: {
    author: string;
    rating: number;
    comment: string;
  };
}

const DEFAULT_PROFILE: WorkerProfileData = {
  name: 'Ramesh Kumar',
  verified: true,
  rating: 4.8,
  reviewCount: 120,
  trade: 'Mason',
  experience: '8 years experience',
  dailyRate: '₹ 600 / day',
  hourlyRate: '₹ 80 / hour',
  skills: [
    { id: '1', name: 'Masonry', emoji: '🧱' },
    { id: '2', name: 'Brick work', emoji: '🏗️' },
    { id: '3', name: 'Plaster', emoji: '📋' },
    { id: '4', name: 'Tile work', emoji: '🔲' },
  ],
  availability: 'Available today',
  languages: ['Hindi', 'English', 'Kannada'],
  featuredReview: {
    author: 'Amit Sharma',
    rating: 4.8,
    comment: 'Very skilled and professional. Completed work on time.',
  },
};

interface LabourlyWorkerProfileScreenProps {
  data?: WorkerProfileData;
  onBack?: () => void;
  onFavorite?: (favorited: boolean) => void;
  onMenu?: () => void;
  onCall?: () => void;
  onHireNow?: () => void;
  onSeeAllReviews?: () => void;
}

export function LabourlyWorkerProfileScreen({
  data = DEFAULT_PROFILE,
  onBack,
  onFavorite,
  onMenu,
  onCall,
  onHireNow,
  onSeeAllReviews,
}: LabourlyWorkerProfileScreenProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteToggle = () => {
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    onFavorite?.(nextState);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Photo Banner with Overlaid Floating Buttons */}
          <View style={styles.bannerContainer}>
            <Image
              source={
                data.profilePhotoUrl
                  ? { uri: data.profilePhotoUrl }
                  : getDefaultWorkerAvatar(data.trade)
              }
              resizeMode="cover"
              style={styles.bannerImage}
              accessible
              accessibilityLabel={`${data.name} photo`}
            />

            {/* Overlaid Floating Header Buttons */}
            <View style={styles.floatingHeaderRow}>
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.circleBtn}
              >
                <Text style={styles.circleBtnChevron}>‹</Text>
              </Pressable>

              <View style={styles.rightButtonsRow}>
                <Pressable
                  onPress={handleFavoriteToggle}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                  }
                  style={styles.circleBtn}
                >
                  <Text style={styles.circleBtnIcon}>
                    {isFavorited ? '❤️' : '🤍'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onMenu}
                  accessibilityRole="button"
                  accessibilityLabel="More options"
                  style={styles.circleBtn}
                >
                  <Text style={styles.circleBtnIcon}>⋯</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Profile Identity Details */}
          <View style={styles.detailsBody}>
            {/* Name + Verified Badge */}
            <View style={styles.identityRow}>
              <View style={styles.nameBadgeGroup}>
                <Text style={styles.nameText}>{data.name}</Text>
                {data.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.ratingText}>
                  {data.rating} ({data.reviewCount} reviews)
                </Text>
              </View>

              <Text style={styles.tradeExperienceText}>
                {data.trade} • {data.experience}
              </Text>
            </View>

            {/* Pricing Card */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingText}>
                {data.dailyRate} ({data.hourlyRate})
              </Text>
            </View>

            {/* 4 Square Skills Tiles */}
            <View style={styles.skillsSection}>
              <View style={styles.skillsGrid}>
                {data.skills.map((skill) => (
                  <View key={skill.id} style={styles.skillTile}>
                    <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                    <Text style={styles.skillName}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Availability Row */}
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>Availability</Text>
              <View style={styles.pillsContainer}>
                <View style={styles.availabilityPill}>
                  <Text style={styles.availabilityText}>
                    {data.availability}
                  </Text>
                </View>
              </View>
            </View>

            {/* Languages Row */}
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>Languages</Text>
              <View style={styles.pillsContainer}>
                {data.languages.map((lang) => (
                  <View key={lang} style={styles.languagePill}>
                    <Text style={styles.languageText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Reviews Section */}
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsTitle}>
                  Reviews ({data.reviewCount})
                </Text>
                <Pressable onPress={onSeeAllReviews} accessibilityRole="button">
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
              </View>

              <View style={styles.reviewCard}>
                <View style={styles.reviewerRow}>
                  <Text style={styles.reviewerName}>
                    {data.featuredReview.author}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.reviewerRating}>
                      {data.featuredReview.rating}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>
                  &ldquo;{data.featuredReview.comment}&rdquo;
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={styles.stickyFooter}>
          <Pressable
            onPress={onCall}
            accessibilityRole="button"
            accessibilityLabel="Call worker"
            style={({ pressed }) => [
              styles.callBtn,
              pressed && styles.callBtnPressed,
            ]}
          >
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callBtnText}>Call</Text>
          </Pressable>

          <Pressable
            onPress={onHireNow}
            accessibilityRole="button"
            accessibilityLabel="Hire worker now"
            style={({ pressed }) => [
              styles.hireBtn,
              pressed && styles.hireBtnPressed,
            ]}
          >
            <Text style={styles.hireBtnText}>Hire Now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white, // #FFFFFF
  },
  container: {
    flex: 1,
    backgroundColor: palette.white, // #FFFFFF
  },
  scrollContent: {
    paddingBottom: 90,
  },
  bannerContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: palette.grey,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  floatingHeaderRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  rightButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  circleBtnChevron: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.ink, // #202326
    lineHeight: 28,
  },
  circleBtnIcon: {
    fontSize: 16,
    color: palette.ink, // #202326
  },
  detailsBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  identityRow: {
    gap: 4,
  },
  nameBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: palette.yellow, // #FFCC25
  },
  verifiedText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 14,
    color: palette.yellow, // #FFCC25
  },
  ratingText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  tradeExperienceText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  pricingCard: {
    backgroundColor: palette.grey, // #E5E7EB
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingText: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.3,
  },
  skillsSection: {
    marginTop: 2,
  },
  skillsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  skillTile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: palette.grey, // #E5E7EB
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  },
  skillEmoji: {
    fontSize: 22,
  },
  skillName: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    color: palette.ink, // #202326
    textAlign: 'center',
  },
  metaRow: {
    gap: 8,
  },
  metaTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  availabilityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: palette.yellow, // #FFCC25
  },
  availabilityText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  languagePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: palette.grey, // #E5E7EB
  },
  languageText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  reviewsSection: {
    gap: 10,
    marginTop: 4,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  seeAllText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink, // #202326
    textDecorationLine: 'underline',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: palette.grey, // #E5E7EB
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  reviewerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  reviewerRating: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  reviewComment: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: palette.white, // #FFFFFF
    borderTopWidth: 1,
    borderTopColor: palette.grey, // #E5E7EB
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  callBtn: {
    width: 100,
    height: 52,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: palette.ink, // #202326
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBtnPressed: {
    backgroundColor: '#F3F4F6',
  },
  callIcon: {
    fontSize: 15,
  },
  callBtnText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  hireBtn: {
    flex: 1,
    height: 52,
    borderRadius: 9999,
    backgroundColor: palette.yellow, // #FFCC25
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  hireBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  hireBtnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
});
