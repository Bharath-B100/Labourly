import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export interface SavedWorker {
  id: string;
  name: string;
  trade: string;
  rating?: number | null;
  dailyRate?: number | string | null;
  location: string;
  experienceYears?: number;
  avatarEmoji?: string;
  profilePhotoUrl?: string;
  isSaved: boolean;
}

const DEFAULT_SAVED_WORKERS: SavedWorker[] = [
  {
    id: 'worker-1',
    name: 'Ramesh Kumar',
    trade: 'Mason',
    rating: 4.8,
    dailyRate: 600,
    location: 'Bengaluru, Karnataka',
    avatarEmoji: '👷🏾‍♂️',
    isSaved: true,
  },
  {
    id: 'worker-2',
    name: 'Suresh Naik',
    trade: 'Carpenter',
    rating: 4.5,
    dailyRate: 550,
    location: 'Bengaluru, Karnataka',
    avatarEmoji: '👷🏽‍♂️',
    isSaved: true,
  },
  {
    id: 'worker-3',
    name: 'Imran Khan',
    trade: 'Electrician',
    rating: 4.7,
    dailyRate: 650,
    location: 'Bengaluru, Karnataka',
    avatarEmoji: '👷🏾‍♂️',
    isSaved: true,
  },
  {
    id: 'worker-4',
    name: 'Vijay Patil',
    trade: 'Painter',
    rating: 4.6,
    dailyRate: 500,
    location: 'Pune, Maharashtra',
    avatarEmoji: '👷🏼‍♂️',
    isSaved: true,
  },
];

export interface LabourlySavedWorkersScreenProps {
  workers?: SavedWorker[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onBack?: () => void;
  onSelectWorker?: (worker: SavedWorker) => void;
  onToggleSave?: (workerId: string, isSaved: boolean) => void;
  onExploreWorkers?: () => void;
}

export function LabourlySavedWorkersScreen({
  workers: incomingWorkers,
  loading = false,
  error = null,
  onRefresh,
  onBack,
  onSelectWorker,
  onToggleSave,
  onExploreWorkers,
}: LabourlySavedWorkersScreenProps) {
  const [internalWorkers, setInternalWorkers] = useState<SavedWorker[]>(
    incomingWorkers ?? DEFAULT_SAVED_WORKERS,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayedWorkers =
    incomingWorkers !== undefined ? incomingWorkers : internalWorkers;

  const handleToggleHeart = (worker: SavedWorker) => {
    const nextState = !worker.isSaved;
    if (onToggleSave) {
      onToggleSave(worker.id, nextState);
    } else {
      setInternalWorkers((prev) =>
        prev.map((w) =>
          w.id === worker.id ? { ...w, isSaved: nextState } : w,
        ),
      );
    }
    setToastMessage(
      nextState
        ? `${worker.name} saved to favorites`
        : `${worker.name} removed from saved`,
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Real Top Header Bar (No fake status bar) */}
      <View style={styles.headerBar}>
        <View style={styles.navBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressedState,
            ]}
          >
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Saved Workers</Text>
        </View>
      </View>

      {/* Toast feedback */}
      {!!toastMessage && (
        <View style={styles.toastContainer} accessibilityLiveRegion="polite">
          <Text style={styles.toastCheck}>✓</Text>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.ink} />
          <Text style={styles.loadingText}>Loading saved workers…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.warningGlyph}>⚠</Text>
          <Text style={styles.errorTitle}>Could not load saved workers</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel="Retry"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          )}
        </View>
      ) : displayedWorkers.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyHeartGlyph}>♡</Text>
          </View>
          <Text style={styles.emptyTitle}>No saved workers yet</Text>
          <Text style={styles.emptySubtitle}>
            When you find workers you like while exploring, tap the heart or
            save button to keep them handy here.
          </Text>
          {onExploreWorkers && (
            <Pressable
              onPress={onExploreWorkers}
              accessibilityRole="button"
              accessibilityLabel="Explore workers"
              style={styles.exploreButton}
            >
              <Text style={styles.exploreButtonText}>Explore Workers</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayedWorkers.map((worker) => (
            <View key={worker.id} style={styles.cardContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Worker ${worker.name}, ${worker.trade}`}
                onPress={() => onSelectWorker?.(worker)}
                style={styles.cardPressable}
              >
                {/* Left Portrait Avatar */}
                <View style={styles.avatarContainer}>
                  <Image
                    source={
                      worker.profilePhotoUrl
                        ? { uri: worker.profilePhotoUrl }
                        : getDefaultWorkerAvatar(worker.trade)
                    }
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <View style={styles.hardHatBadge}>
                    <Text style={styles.hardHatGlyph}>👷</Text>
                  </View>
                </View>

                {/* Center Content */}
                <View style={styles.cardBody}>
                  {/* Row 1: Name + Rating / Verified */}
                  <View style={styles.nameRow}>
                    <Text style={styles.workerName} numberOfLines={1}>
                      {worker.name}
                    </Text>
                    {worker.rating ? (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.starGlyph}>★</Text>
                        <Text style={styles.ratingText}>
                          {worker.rating.toFixed(1)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.verifiedMiniBadge}>
                        <Text style={styles.verifiedMiniText}>✓ Verified</Text>
                      </View>
                    )}
                  </View>

                  {/* Row 2: Trade & Experience */}
                  <View style={styles.tradeRow}>
                    <View style={styles.tradeBadge}>
                      <Text style={styles.tradeBadgeText}>{worker.trade}</Text>
                    </View>
                    {worker.experienceYears !== undefined && (
                      <Text style={styles.experienceText}>
                        {worker.experienceYears} yrs exp
                      </Text>
                    )}
                  </View>

                  {/* Row 3: Daily Rate or Price by Quotation */}
                  <Text style={styles.dailyRate}>
                    {worker.dailyRate !== null && worker.dailyRate !== undefined
                      ? typeof worker.dailyRate === 'number'
                        ? `₹ ${worker.dailyRate} / day`
                        : worker.dailyRate
                      : 'Price by quotation'}
                  </Text>

                  {/* Row 4: Location */}
                  <View style={styles.locationRow}>
                    <Text style={styles.locationPin}>📍</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {worker.location}
                    </Text>
                  </View>
                </View>

                {/* Top-Right Heart Toggle */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Heart for ${worker.name}`}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleHeart(worker);
                  }}
                  style={styles.heartButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text
                    style={[
                      styles.heartGlyph,
                      {
                        color: worker.isSaved ? palette.yellow : palette.ink,
                      },
                    ]}
                  >
                    {worker.isSaved ? '♥' : '♡'}
                  </Text>
                </Pressable>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.grey,
  },
  headerBar: {
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.grey,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 30,
    color: palette.ink,
    fontWeight: '300',
  },
  pressedState: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  toastCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  cardContainer: {
    backgroundColor: palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressable: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    position: 'relative',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: palette.yellow,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.yellow,
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
  },
  hardHatBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hardHatGlyph: {
    fontSize: 10,
  },
  cardBody: {
    flex: 1,
    gap: 4,
    paddingRight: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starGlyph: {
    fontSize: 13,
    color: palette.yellow,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink,
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.grey,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedMiniText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: palette.ink,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tradeBadge: {
    backgroundColor: palette.grey,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.ink,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
  },
  dailyRate: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationPin: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 12,
    color: palette.muted,
    flex: 1,
  },
  heartButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartGlyph: {
    fontSize: 22,
    lineHeight: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyHeartGlyph: {
    fontSize: 32,
    color: palette.ink,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    textAlign: 'center',
  },
  exploreButton: {
    marginTop: 8,
    backgroundColor: palette.yellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink,
  },
  warningGlyph: {
    fontSize: 36,
    color: palette.ink,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink,
  },
  errorSubtitle: {
    fontSize: 13,
    color: palette.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.ink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink,
  },
});
