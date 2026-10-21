import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';
import {
  DASHBOARD_BANNER,
  getDefaultWorkerAvatar,
} from '../assets/defaultAvatars';

export interface TradeCategory {
  id: string;
  name: string;
  avatarEmoji: string;
}

const DEFAULT_CATEGORIES: TradeCategory[] = [
  { id: 'mason', name: 'Mason', avatarEmoji: '🧱' },
  { id: 'carpenter', name: 'Carpenter', avatarEmoji: '🪚' },
  { id: 'plumber', name: 'Plumber', avatarEmoji: '🔧' },
  { id: 'electrician', name: 'Electrician', avatarEmoji: '⚡' },
  { id: 'painter', name: 'Painter', avatarEmoji: '🖌️' },
  { id: 'welder', name: 'Welder', avatarEmoji: '🔥' },
  { id: 'helper', name: 'Helper', avatarEmoji: '📦' },
];

export type DashboardTab = 'home' | 'workers' | 'jobs' | 'chat' | 'profile';

interface LabourlyHomeDashboardScreenProps {
  location?: string;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onCategorySelect?: (categoryId: string) => void;
  onSearch?: (query: string) => void;
  onFilterPress?: () => void;
  onBannerPress?: () => void;
  onTabSelect?: (tab: DashboardTab) => void;
  activeTab?: DashboardTab;
}

export function LabourlyHomeDashboardScreen({
  location = 'Bengaluru, Karnataka',
  onLocationPress,
  onNotificationPress,
  onCategorySelect,
  onSearch,
  onFilterPress,
  onBannerPress,
  onTabSelect,
  activeTab = 'home',
}: LabourlyHomeDashboardScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<DashboardTab>(activeTab);

  const handleTabPress = (tab: DashboardTab) => {
    setCurrentTab(tab);
    onTabSelect?.(tab);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header: Logo + Location + Notification */}
          <View style={styles.headerRow}>
            <View style={styles.brandCol}>
              <View style={styles.logoWrapper}>
                <View style={styles.hardHatBadge}>
                  <Text style={styles.hardHatEmoji}>👷</Text>
                </View>
                <Text style={styles.logoWordmark}>Labourly</Text>
              </View>
              <Pressable
                onPress={onLocationPress}
                accessibilityRole="button"
                accessibilityLabel={`Location: ${location}`}
                style={styles.locationButton}
              >
                <Text style={styles.locationPin}>📍</Text>
                <Text style={styles.locationText}>{location}</Text>
                <Text style={styles.dropdownChevron}>⌄</Text>
              </Pressable>
            </View>

            {/* Notification Bell */}
            <Pressable
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={({ pressed }) => [
                styles.bellButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                onSearch?.(text);
              }}
              placeholder="Search for labour, skills, or jobs..."
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              accessibilityLabel="Search labour, skills, or jobs"
            />
            <Pressable
              onPress={onFilterPress}
              accessibilityRole="button"
              accessibilityLabel="Filter options"
              style={styles.filterButton}
            >
              <Text style={styles.filterIcon}>⚙️</Text>
            </Pressable>
          </View>

          {/* Trade Categories Grid (7 Items) */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionHeading}>Trade Categories</Text>
            <View style={styles.categoryGrid}>
              {DEFAULT_CATEGORIES.map((cat, index) => {
                const isHelper = cat.id === 'helper';
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => onCategorySelect?.(cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cat.name} trade category`}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      isHelper && styles.helperCard,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.avatarCircle}>
                      <Image
                        source={getDefaultWorkerAvatar(cat.name)}
                        style={styles.categoryAvatarImage}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Promo Banner */}
          <Pressable
            onPress={onBannerPress}
            accessibilityRole="button"
            accessibilityLabel="Get skilled labour near you. Verified, reliable, on demand"
            style={({ pressed }) => [
              styles.promoBanner,
              pressed && styles.bannerPressed,
            ]}
          >
            <View style={styles.bannerAvatarWrapper}>
              <Image
                source={DASHBOARD_BANNER}
                style={styles.bannerAvatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerHeadline}>
                Get Skilled Labour{'\n'}Near You
              </Text>
              <Text style={styles.bannerSubtext}>
                Verified • Reliable • On Demand
              </Text>
            </View>
            <View style={styles.bannerArrowBtn}>
              <Text style={styles.bannerArrowText}>→</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* Bottom 5-Tab Navigation Bar */}
        <View style={styles.bottomTabBar}>
          {/* 1. Home (Active) */}
          <Pressable
            onPress={() => handleTabPress('home')}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentTab === 'home' }}
          >
            {currentTab === 'home' && <View style={styles.tabActiveBar} />}
            <Text
              style={[
                styles.tabIcon,
                currentTab === 'home' && styles.tabIconActive,
              ]}
            >
              🏠
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'home' && styles.tabLabelActive,
              ]}
            >
              Home
            </Text>
          </Pressable>

          {/* 2. Workers */}
          <Pressable
            onPress={() => handleTabPress('workers')}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentTab === 'workers' }}
          >
            {currentTab === 'workers' && <View style={styles.tabActiveBar} />}
            <Text
              style={[
                styles.tabIcon,
                currentTab === 'workers' && styles.tabIconActive,
              ]}
            >
              👥
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'workers' && styles.tabLabelActive,
              ]}
            >
              Workers
            </Text>
          </Pressable>

          {/* 3. Jobs */}
          <Pressable
            onPress={() => handleTabPress('jobs')}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentTab === 'jobs' }}
          >
            {currentTab === 'jobs' && <View style={styles.tabActiveBar} />}
            <Text
              style={[
                styles.tabIcon,
                currentTab === 'jobs' && styles.tabIconActive,
              ]}
            >
              💼
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'jobs' && styles.tabLabelActive,
              ]}
            >
              Jobs
            </Text>
          </Pressable>

          {/* 4. Chat */}
          <Pressable
            onPress={() => handleTabPress('chat')}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentTab === 'chat' }}
          >
            {currentTab === 'chat' && <View style={styles.tabActiveBar} />}
            <Text
              style={[
                styles.tabIcon,
                currentTab === 'chat' && styles.tabIconActive,
              ]}
            >
              💬
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'chat' && styles.tabLabelActive,
              ]}
            >
              Chat
            </Text>
          </Pressable>

          {/* 5. Profile */}
          <Pressable
            onPress={() => handleTabPress('profile')}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentTab === 'profile' }}
          >
            {currentTab === 'profile' && <View style={styles.tabActiveBar} />}
            <Text
              style={[
                styles.tabIcon,
                currentTab === 'profile' && styles.tabIconActive,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'profile' && styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  brandCol: {
    gap: 3,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  hardHatBadge: {
    position: 'absolute',
    left: -14,
    top: -8,
    transform: [{ rotate: '-15deg' }],
    zIndex: 2,
  },
  hardHatEmoji: {
    fontSize: 20,
  },
  logoWordmark: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '900',
    color: palette.ink, // #202326
    letterSpacing: -0.8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationPin: {
    fontSize: 12,
  },
  locationText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink, // #202326
  },
  dropdownChevron: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.yellow, // #FFCC25
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: palette.grey, // #E5E7EB
    borderRadius: 9999,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    color: palette.ink, // #202326
    height: '100%',
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 16,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink, // #202326
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30.5%',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: palette.grey, // #E5E7EB
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  helperCard: {
    width: '30.5%',
  },
  cardPressed: {
    borderColor: palette.yellow, // #FFCC25
    transform: [{ scale: 0.98 }],
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.grey, // #E5E7EB
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  categoryAvatarImage: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink, // #202326
    textAlign: 'center',
  },
  promoBanner: {
    backgroundColor: palette.ink, // #202326
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerPressed: {
    opacity: 0.92,
  },
  bannerAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D3136',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  bannerContent: {
    flex: 1,
    gap: 2,
  },
  bannerHeadline: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: palette.white, // #FFFFFF
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  bannerSubtext: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    color: palette.yellow, // #FFCC25
    letterSpacing: 0.2,
  },
  bannerArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.yellow, // #FFCC25
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerArrowText: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.ink, // #202326
    lineHeight: 18,
  },
  bottomTabBar: {
    height: 70,
    backgroundColor: palette.white, // #FFFFFF
    borderTopWidth: 1,
    borderTopColor: palette.grey, // #E5E7EB
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    width: 58,
    position: 'relative',
    paddingTop: 6,
  },
  tabActiveBar: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    backgroundColor: palette.yellow, // #FFCC25
    borderRadius: 2,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: palette.ink, // #202326
    fontWeight: '800',
  },
});
