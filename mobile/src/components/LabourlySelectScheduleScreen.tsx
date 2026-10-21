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

export type SchedulePill = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';

export interface ScheduleState {
  durationMode: SchedulePill;
  selectedMonth: string;
  startDate: number;
  rangeEnd: number;
  preferredTime: string;
  durationWeeks: number;
}

const INITIAL_SCHEDULE: ScheduleState = {
  durationMode: 'Daily',
  selectedMonth: 'April 2025',
  startDate: 12,
  rangeEnd: 18,
  preferredTime: 'Full Day (8 hours)',
  durationWeeks: 1,
};

const PILL_OPTIONS: SchedulePill[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// April 2025 begins on Tuesday (index 2), has 30 days
const APRIL_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export interface LabourlySelectScheduleScreenProps {
  initialState?: Partial<ScheduleState>;
  onBack?: () => void;
  onConfirm?: (schedule: ScheduleState) => void;
  onTimePress?: () => void;
}

export function LabourlySelectScheduleScreen({
  initialState,
  onBack,
  onConfirm,
  onTimePress,
}: LabourlySelectScheduleScreenProps) {
  const [schedule, setSchedule] = useState<ScheduleState>({
    ...INITIAL_SCHEDULE,
    ...initialState,
  });

  const handlePillSelect = (mode: SchedulePill) => {
    setSchedule((prev) => ({ ...prev, durationMode: mode }));
  };

  const handleDatePick = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      startDate: day,
      rangeEnd: Math.min(30, day + prev.durationWeeks * 6),
    }));
  };

  const handleDurationDelta = (delta: number) => {
    setSchedule((prev) => {
      const nextWeeks = Math.max(1, Math.min(12, prev.durationWeeks + delta));
      return {
        ...prev,
        durationWeeks: nextWeeks,
        rangeEnd: Math.min(30, prev.startDate + nextWeeks * 6),
      };
    });
  };

  const handleConfirm = () => {
    onConfirm?.(schedule);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Navigation Header */}
      <View style={styles.navBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Select Schedule</Text>
        <View style={styles.navSpacer} />
      </View>

      {/* Duration Pills Row */}
      <View style={styles.pillsRow}>
        {PILL_OPTIONS.map((pill) => {
          const isActive = schedule.durationMode === pill;
          return (
            <Pressable
              key={pill}
              onPress={() => handlePillSelect(pill)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Schedule duration: ${pill}`}
              style={({ pressed }) => [
                styles.pillBtn,
                isActive && styles.pillBtnActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[styles.pillText, isActive && styles.pillTextActive]}
              >
                {pill}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Content Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={({ pressed }) => [
                styles.calNavBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.calNavText}>‹</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{schedule.selectedMonth}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={({ pressed }) => [
                styles.calNavBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.calNavText}>›</Text>
            </Pressable>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Grid of Days (April 2025 starts on Tuesday, offset by 2 empty cells) */}
          <View style={styles.daysGrid}>
            {/* 2 Leading empty spaces for Sun and Mon */}
            <View style={styles.emptyDayCell} />
            <View style={styles.emptyDayCell} />

            {APRIL_DAYS.map((day) => {
              const isStart = day === schedule.startDate;
              const isInRange =
                day > schedule.startDate && day <= schedule.rangeEnd;
              const isEnd = day === schedule.rangeEnd;

              return (
                <Pressable
                  key={day}
                  onPress={() => handleDatePick(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select date ${day} April 2025`}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isInRange && styles.dayCellInRange,
                    isEnd && styles.dayCellRangeEnd,
                    isStart && styles.dayCellStart,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isInRange && styles.dayTextInRange,
                      isStart && styles.dayTextStart,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Preferred Time Dropdown */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preferred Time</Text>
          <Pressable
            onPress={onTimePress}
            accessibilityRole="button"
            accessibilityLabel={`Preferred Time: ${schedule.preferredTime}`}
            style={({ pressed }) => [
              styles.dropdownBox,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.dropdownValueText}>
              {schedule.preferredTime}
            </Text>
            <Text style={styles.dropdownChevron}>›</Text>
          </Pressable>
        </View>

        {/* Duration Stepper */}
        <View style={styles.fieldGroup}>
          <View style={styles.stepperRow}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.stepperWidget}>
              <Pressable
                onPress={() => handleDurationDelta(-1)}
                accessibilityRole="button"
                accessibilityLabel="Decrease duration weeks"
                disabled={schedule.durationWeeks <= 1}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  schedule.durationWeeks <= 1 && styles.stepperBtnDisabled,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.stepperBtnText}>–</Text>
              </Pressable>
              <Text style={styles.stepperValueText}>
                {schedule.durationWeeks}{' '}
                {schedule.durationWeeks === 1 ? 'week' : 'weeks'}
              </Text>
              <Pressable
                onPress={() => handleDurationDelta(1)}
                accessibilityRole="button"
                accessibilityLabel="Increase duration weeks"
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action CTA */}
      <View style={styles.stickyFooter}>
        <Pressable
          onPress={handleConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirm Schedule"
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.confirmBtnPressed,
          ]}
        >
          <Text style={styles.confirmBtnText}>Confirm Schedule</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: palette.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  backChevron: {
    fontSize: 28,
    fontWeight: '300',
    color: palette.ink,
    lineHeight: 30,
    marginTop: -2,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
  },
  navSpacer: {
    width: 36,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  pillBtn: {
    flex: 1,
    height: 40,
    backgroundColor: palette.grey,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActive: {
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink,
  },
  pillTextActive: {
    fontWeight: '800',
    color: palette.ink,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 18,
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.grey,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  calNavText: {
    fontSize: 24,
    color: palette.ink,
    lineHeight: 26,
    fontWeight: '300',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellStart: {
    backgroundColor: palette.yellow,
    borderRadius: 10,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  dayCellInRange: {
    backgroundColor: palette.grey,
    borderRadius: 0,
  },
  dayCellRangeEnd: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  dayTextStart: {
    fontWeight: '800',
    color: palette.ink,
  },
  dayTextInRange: {
    color: palette.ink,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink,
  },
  dropdownBox: {
    height: 52,
    backgroundColor: palette.grey,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
  },
  dropdownChevron: {
    fontSize: 22,
    color: palette.ink,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.grey,
    borderRadius: 14,
    padding: 4,
    gap: 12,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    lineHeight: 20,
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink,
    minWidth: 60,
    textAlign: 'center',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: palette.ink,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.yellow,
    letterSpacing: -0.2,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
