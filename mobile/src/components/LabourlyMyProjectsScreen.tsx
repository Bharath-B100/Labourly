import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export type ProjectFilterTab = 'active' | 'completed' | 'cancelled';
export type BottomNavTab = 'home' | 'workers' | 'jobs' | 'chat' | 'profile';

export interface ProjectItem {
  id: string;
  title: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed' | 'Cancelled';
  tradeAndWorkers: string;
  dateRange: string;
  avatarEmojis: string[];
  currentWorkers: number;
  totalWorkers: number;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    title: 'Residential Building',
    status: 'Ongoing',
    tradeAndWorkers: 'Masons • 3 Workers',
    dateRange: '12 Apr - 26 Apr, 2025',
    avatarEmojis: ['👷🏾', '👷🏽', '👷🏻'],
    currentWorkers: 3,
    totalWorkers: 3,
  },
  {
    id: 'proj-2',
    title: 'Office Renovation',
    status: 'Upcoming',
    tradeAndWorkers: 'Carpenters • 2 Workers',
    dateRange: '1 May - 30 May, 2025',
    avatarEmojis: ['👷🏾', '👷🏼'],
    currentWorkers: 0,
    totalWorkers: 2,
  },
  {
    id: 'proj-3',
    title: 'Villa Construction',
    status: 'Ongoing',
    tradeAndWorkers: 'Helpers • 4 Workers',
    dateRange: '10 Apr - 10 May, 2025',
    avatarEmojis: ['👷🏼', '👷🏽', '👷🏾'],
    currentWorkers: 4,
    totalWorkers: 4,
  },
];

const FILTER_TABS: { key: ProjectFilterTab; label: string }[] = [
  { key: 'active', label: 'Active (3)' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const NAV_TABS: { key: BottomNavTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'workers', label: 'Workers', icon: '👥' },
  { key: 'jobs', label: 'Jobs', icon: '💼' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

export interface LabourlyMyProjectsScreenProps {
  projects?: ProjectItem[];
  initialTab?: ProjectFilterTab;
  initialNav?: BottomNavTab;
  onTabChange?: (tab: ProjectFilterTab) => void;
  onNavChange?: (nav: BottomNavTab) => void;
  onProjectPress?: (project: ProjectItem) => void;
}

export function LabourlyMyProjectsScreen({
  projects = DEFAULT_PROJECTS,
  initialTab = 'active',
  initialNav = 'jobs',
  onTabChange,
  onNavChange,
  onProjectPress,
}: LabourlyMyProjectsScreenProps) {
  const [activeTab, setActiveTab] = useState<ProjectFilterTab>(initialTab);
  const [activeNav, setActiveNav] = useState<BottomNavTab>(initialNav);

  const handleTabPress = (tab: ProjectFilterTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleNavPress = (nav: BottomNavTab) => {
    setActiveNav(nav);
    onNavChange?.(nav);
  };

  const displayedProjects =
    activeTab === 'active'
      ? projects.filter(
          (p) => p.status === 'Ongoing' || p.status === 'Upcoming',
        )
      : activeTab === 'completed'
        ? projects.filter((p) => p.status === 'Completed')
        : projects.filter((p) => p.status === 'Cancelled');

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Header & Filter Tabs */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>My Projects</Text>
        <View style={styles.filterTabsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filter: ${tab.label}`}
                style={({ pressed }) => [
                  styles.filterPill,
                  isActive
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Projects Feed */}
      <ScrollView
        style={styles.projectsList}
        contentContainerStyle={styles.projectsListContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏗️</Text>
            <Text style={styles.emptyTitle}>No Projects Found</Text>
            <Text style={styles.emptySubtitle}>
              There are no {activeTab} projects to show at this moment.
            </Text>
          </View>
        ) : (
          displayedProjects.map((project) => {
            const isOngoing = project.status === 'Ongoing';
            const progressRatio =
              project.totalWorkers > 0
                ? project.currentWorkers / project.totalWorkers
                : 0;

            return (
              <Pressable
                key={project.id}
                onPress={() => onProjectPress?.(project)}
                accessibilityRole="button"
                accessibilityLabel={`${project.title}, ${project.status}`}
                style={({ pressed }) => [
                  styles.projectCard,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Top Row: Title + Status Badge */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isOngoing
                        ? styles.statusBadgeOngoing
                        : styles.statusBadgeUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isOngoing
                          ? styles.statusBadgeTextOngoing
                          : styles.statusBadgeTextUpcoming,
                      ]}
                    >
                      {project.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle */}
                <Text style={styles.projectSubtitle}>
                  {project.tradeAndWorkers}
                </Text>

                {/* Date Row */}
                <View style={styles.dateRow}>
                  <Text style={styles.calendarIcon}>📅</Text>
                  <Text style={styles.dateText}>{project.dateRange}</Text>
                </View>

                {/* Bottom Row: Avatar Stack + Progress Bar */}
                <View style={styles.cardBottomRow}>
                  {/* Overlapping Avatars */}
                  <View style={styles.avatarStack}>
                    {project.avatarEmojis.map((emoji, index) => (
                      <View
                        key={index}
                        style={[
                          styles.avatarItem,
                          {
                            zIndex: index + 1,
                            marginLeft: index === 0 ? 0 : -8,
                          },
                        ]}
                      >
                        <Text style={styles.avatarEmoji}>{emoji}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Progress Section */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.round(progressRatio * 100)}%`,
                            backgroundColor:
                              progressRatio > 0 ? palette.yellow : palette.grey,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressLabel}>
                      {project.currentWorkers}/{project.totalWorkers} workers
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Bottom 5-Tab Navigation Bar */}
      <View style={styles.bottomNavBar}>
        {NAV_TABS.map((tab) => {
          const isActive = activeNav === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handleNavPress(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Navigation tab: ${tab.label}`}
              style={({ pressed }) => [
                styles.navTabItem,
                pressed && styles.btnPressed,
              ]}
            >
              {isActive ? (
                <View style={styles.activePillHighlight}>
                  <Text style={styles.navTabIconActive}>{tab.icon}</Text>
                </View>
              ) : (
                <Text style={styles.navTabIcon}>{tab.icon}</Text>
              )}
              <Text
                style={[
                  styles.navTabLabel,
                  isActive && styles.navTabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.grey,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 14,
    backgroundColor: palette.grey,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.ink,
    letterSpacing: -0.5,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillInactive: {
    backgroundColor: palette.white,
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: palette.ink,
  },
  filterPillTextActive: {
    fontWeight: '800',
    color: palette.ink,
  },
  projectsList: {
    flex: 1,
    backgroundColor: palette.grey,
  },
  projectsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  projectCard: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOngoing: {
    backgroundColor: palette.yellow,
  },
  statusBadgeUpcoming: {
    backgroundColor: palette.grey,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextOngoing: {
    color: palette.ink,
  },
  statusBadgeTextUpcoming: {
    color: palette.ink,
  },
  projectSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    color: palette.ink,
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  progressSection: {
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
    maxWidth: 160,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.grey,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: palette.ink,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 72,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  navTabItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  activePillHighlight: {
    backgroundColor: palette.yellow,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
  },
  navTabIcon: {
    fontSize: 20,
  },
  navTabIconActive: {
    fontSize: 20,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.ink,
  },
  navTabLabelActive: {
    fontWeight: '800',
    color: palette.ink,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
