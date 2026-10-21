import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export interface FilterState {
  location: string;
  skill: string;
  minRate: number;
  maxRate: number;
  availability: 'Any' | 'Today' | 'This Week';
  duration: 'Daily' | 'Hourly' | 'Weekly' | 'Monthly';
  minRating: '4+' | '4.5+' | '4.8+';
  verifiedOnly: boolean;
}

const INITIAL_FILTERS: FilterState = {
  location: 'Bengaluru, Karnataka',
  skill: 'Mason',
  minRate: 300,
  maxRate: 1500,
  availability: 'Any',
  duration: 'Daily',
  minRating: '4+',
  verifiedOnly: true,
};

interface LabourlySmartFiltersScreenProps {
  initialState?: Partial<FilterState>;
  onClose?: () => void;
  onReset?: () => void;
  onApply?: (filters: FilterState) => void;
}

export function LabourlySmartFiltersScreen({
  initialState,
  onClose,
  onReset,
  onApply,
}: LabourlySmartFiltersScreenProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTERS,
    ...initialState,
  });

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    onReset?.();
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.navChevron}>‹</Text>
          </Pressable>
          <Text style={styles.navTitle}>Filters</Text>
          <Pressable
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
            style={({ pressed }) => [
              styles.resetBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {/* Scrollable Filters Body */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dropdown Selectors */}
          <View style={styles.dropdownGroup}>
            {/* Location Dropdown */}
            <Pressable
              accessibilityRole="combobox"
              accessibilityLabel={`Location: ${filters.location}`}
              style={styles.dropdownField}
            >
              <View style={styles.dropdownTexts}>
                <Text style={styles.dropdownLabel}>Location</Text>
                <Text style={styles.dropdownValue}>{filters.location}</Text>
              </View>
              <Text style={styles.dropdownChevron}>⌄</Text>
            </Pressable>

            {/* Skill Dropdown */}
            <Pressable
              accessibilityRole="combobox"
              accessibilityLabel={`Skill: ${filters.skill}`}
              style={styles.dropdownField}
            >
              <View style={styles.dropdownTexts}>
                <Text style={styles.dropdownLabel}>Skill</Text>
                <Text style={styles.dropdownValue}>{filters.skill}</Text>
              </View>
              <Text style={styles.dropdownChevron}>⌄</Text>
            </Pressable>
          </View>

          {/* Rate (per day) Slider */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Rate (per day)</Text>
              <Text style={styles.sliderValueText}>
                ₹{filters.minRate} – ₹{filters.maxRate}
              </Text>
            </View>
            <View style={styles.sliderTrackContainer}>
              <View style={styles.sliderBaseTrack} />
              <View style={styles.sliderActiveFill} />
              <View style={[styles.sliderKnob, { left: '15%' }]} />
              <View style={[styles.sliderKnob, { left: '75%' }]} />
            </View>
          </View>

          {/* Availability Pill Group */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Availability</Text>
            <View style={styles.pillsRow}>
              {(['Any', 'Today', 'This Week'] as const).map((opt) => {
                const isActive = filters.availability === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, availability: opt }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[
                      styles.pill,
                      isActive
                        ? styles.pillCharcoalActive
                        : styles.pillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isActive
                          ? styles.pillTextYellow
                          : styles.pillTextCharcoal,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Duration Pill Group */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.pillsRow}>
              {(['Daily', 'Hourly', 'Weekly', 'Monthly'] as const).map(
                (opt) => {
                  const isActive = filters.duration === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() =>
                        setFilters((prev) => ({ ...prev, duration: opt }))
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      style={[
                        styles.pill,
                        isActive
                          ? styles.pillYellowActive
                          : styles.pillInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          isActive
                            ? styles.pillTextCharcoal
                            : styles.pillTextCharcoal,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>

          {/* Minimum Rating Pill Group */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Minimum Rating</Text>
            <View style={styles.pillsRow}>
              {(['4+', '4.5+', '4.8+'] as const).map((opt) => {
                const isActive = filters.minRating === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, minRating: opt }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[
                      styles.pill,
                      isActive ? styles.pillYellowActive : styles.pillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isActive
                          ? styles.pillTextCharcoal
                          : styles.pillTextCharcoal,
                      ]}
                    >
                      {opt} {opt === '4+' && '★'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Verified Only Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Verified Only</Text>
            <Switch
              value={filters.verifiedOnly}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, verifiedOnly: val }))
              }
              trackColor={{ false: palette.grey, true: palette.yellow }}
              thumbColor={palette.white}
              accessibilityLabel="Filter for verified workers only"
            />
          </View>
        </ScrollView>

        {/* Bottom Full-Width CTA */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={() => onApply?.(filters)}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
            style={({ pressed }) => [
              styles.applyBtn,
              pressed && styles.applyBtnPressed,
            ]}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
  },
  navChevron: {
    fontSize: 30,
    fontWeight: '700',
    color: palette.ink, // #202326
    lineHeight: 32,
  },
  navTitle: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.4,
  },
  resetBtn: {
    padding: 6,
  },
  resetText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink, // #202326
  },
  btnPressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  dropdownGroup: {
    gap: 12,
    marginBottom: 22,
  },
  dropdownField: {
    height: 64,
    backgroundColor: palette.grey, // #E5E7EB
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTexts: {
    gap: 2,
  },
  dropdownLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dropdownValue: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  dropdownChevron: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  sliderValueText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBaseTrack: {
    width: '100%',
    height: 6,
    backgroundColor: palette.grey, // #E5E7EB
    borderRadius: 3,
  },
  sliderActiveFill: {
    position: 'absolute',
    left: '15%',
    width: '60%',
    height: 6,
    backgroundColor: palette.yellow, // #FFCC25
    borderRadius: 3,
  },
  sliderKnob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.ink, // #202326
    top: 1,
    marginLeft: -11,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  pillCharcoalActive: {
    backgroundColor: palette.ink, // #202326
  },
  pillYellowActive: {
    backgroundColor: palette.yellow, // #FFCC25
  },
  pillInactive: {
    backgroundColor: palette.grey, // #E5E7EB
  },
  pillText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextYellow: {
    color: palette.yellow, // #FFCC25
  },
  pillTextCharcoal: {
    color: palette.ink, // #202326
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  toggleLabel: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: palette.white,
  },
  applyBtn: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: palette.ink, // #202326
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  applyBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  applyBtnText: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '800',
    color: palette.yellow, // #FFCC25
    letterSpacing: -0.2,
  },
});
