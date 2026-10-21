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

export interface ListedWorker {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  trade: string;
  dailyRate: string;
  availability: string;
  avatarEmoji: string;
}

const DEFAULT_WORKERS: ListedWorker[] = [
  {
    id: 'w1',
    name: 'Ramesh Kumar',
    rating: 4.8,
    reviewCount: 124,
    trade: 'Mason',
    dailyRate: '₹600/day',
    availability: 'Available today',
    avatarEmoji: '👨🏾‍🔧',
  },
  {
    id: 'w2',
    name: 'Shahid Ansari',
    rating: 4.6,
    reviewCount: 98,
    trade: 'Mason',
    dailyRate: '₹550/day',
    availability: 'Available tomorrow',
    avatarEmoji: '🧔🏽‍♂️',
  },
  {
    id: 'w3',
    name: 'Manoj Yadav',
    rating: 4.7,
    reviewCount: 140,
    trade: 'Mason',
    dailyRate: '₹650/day',
    availability: 'Available today',
    avatarEmoji: '👨🏽‍🔧',
  },
  {
    id: 'w4',
    name: 'Suresh Naik',
    rating: 4.5,
    reviewCount: 86,
    trade: 'Mason',
    dailyRate: '₹500/day',
    availability: 'Available today',
    avatarEmoji: '👨🏾‍🌾',
  },
];

const FILTERS = ['All', 'Nearby', 'Verified', 'Top Rated'];

interface LabourlyLabourListingScreenProps {
  title?: string;
  workers?: ListedWorker[];
  onBack?: () => void;
  onSearchPress?: () => void;
  onWorkerPress?: (worker: ListedWorker) => void;
}

export function LabourlyLabourListingScreen({
  title = 'Masons in Bengaluru',
  workers = DEFAULT_WORKERS,
  onBack,
  onSearchPress,
  onWorkerPress,
}: LabourlyLabourListingScreenProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.navChevron}>‹</Text>
          </Pressable>
          <Text style={styles.navTitle}>{title}</Text>
          <Pressable
            onPress={onSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Search workers"
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>
        </View>

        {/* Quick Filter Pills */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filter}`}
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.filterPill,
                    isActive
                      ? styles.filterPillActive
                      : styles.filterPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive
                        ? styles.filterTextActive
                        : styles.filterTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 4 Stacked Worker Cards */}
        <ScrollView
          contentContainerStyle={styles.cardsScroll}
          showsVerticalScrollIndicator={false}
        >
          {workers.map((worker) => {
            const isFavorited = !!favorites[worker.id];
            return (
              <Pressable
                key={worker.id}
                onPress={() => onWorkerPress?.(worker)}
                accessibilityRole="button"
                accessibilityLabel={`${worker.name}, ${worker.trade}. Rating ${worker.rating}. ${worker.dailyRate}. ${worker.availability}`}
                style={({ pressed }) => [
                  styles.workerCard,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Left Square Worker Portrait */}
                <View style={styles.portraitBox}>
                  <Image
                    source={getDefaultWorkerAvatar(worker.trade)}
                    style={styles.portraitImage}
                    resizeMode="cover"
                  />
                  <View style={styles.helmetBadge}>
                    <Text style={styles.helmetIcon}>⛑️</Text>
                  </View>
                </View>

                {/* Worker Details */}
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.ratingText}>{worker.rating}</Text>
                    <Text style={styles.reviewText}>
                      ({worker.reviewCount})
                    </Text>
                  </View>
                  <Text style={styles.tradeLabel}>{worker.trade}</Text>

                  <View style={styles.bottomRow}>
                    <Text style={styles.dailyRate}>{worker.dailyRate}</Text>
                    <View style={styles.availabilityBadge}>
                      <Text style={styles.availabilityText}>
                        {worker.availability}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Top-Right Favorite Heart */}
                <Pressable
                  onPress={() => toggleFavorite(worker.id)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                  }
                  style={styles.heartButton}
                >
                  <Text
                    style={[
                      styles.heartIcon,
                      isFavorited && styles.heartFavorited,
                    ]}
                  >
                    {isFavorited ? '❤️' : '🤍'}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.grey, // #E5E7EB
  },
  container: {
    flex: 1,
    backgroundColor: palette.grey, // #E5E7EB
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navChevron: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.ink, // #202326
    lineHeight: 30,
  },
  navTitle: {
    fontFamily: 'System',
    fontSize: 19,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.3,
  },
  searchIcon: {
    fontSize: 17,
  },
  btnPressed: {
    opacity: 0.7,
  },
  filtersWrapper: {
    paddingBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  filterPillActive: {
    backgroundColor: palette.ink, // #202326
  },
  filterPillInactive: {
    backgroundColor: palette.white, // #FFFFFF
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: palette.yellow, // #FFCC25
  },
  filterTextInactive: {
    color: palette.ink, // #202326
  },
  cardsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  workerCard: {
    backgroundColor: palette.white, // #FFFFFF
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  portraitBox: {
    width: 76,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  helmetBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  helmetIcon: {
    fontSize: 16,
  },
  portraitEmoji: {
    fontSize: 34,
    marginTop: 10,
  },
  workerInfo: {
    flex: 1,
    gap: 2,
  },
  workerName: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    color: palette.yellow, // #FFCC25
    fontSize: 13,
  },
  ratingText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  reviewText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  tradeLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dailyRate: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.3,
  },
  availabilityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: palette.yellow, // #FFCC25
  },
  availabilityText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  heartButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  heartIcon: {
    fontSize: 18,
  },
  heartFavorited: {
    transform: [{ scale: 1.1 }],
  },
});
