import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export type DurationOption = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';

export interface RequirementFormState {
  jobTitle: string;
  skill: string;
  location: string;
  startDate: string;
  duration: DurationOption;
  workerCount: number;
  additionalDetails: string;
}

const INITIAL_REQUIREMENT: RequirementFormState = {
  jobTitle: 'Mason for residential construction',
  skill: 'Mason',
  location: 'Bengaluru, Karnataka',
  startDate: '12 Apr 2025',
  duration: 'Daily',
  workerCount: 3,
  additionalDetails: '',
};

const DURATION_OPTIONS: DurationOption[] = [
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
];

export interface LabourlyPostRequirementScreenProps {
  initialState?: Partial<RequirementFormState>;
  onBack?: () => void;
  onSubmit?: (requirement: RequirementFormState) => void;
  onSkillPress?: () => void;
  onLocationPress?: () => void;
  onDatePress?: () => void;
}

export function LabourlyPostRequirementScreen({
  initialState,
  onBack,
  onSubmit,
  onSkillPress,
  onLocationPress,
  onDatePress,
}: LabourlyPostRequirementScreenProps) {
  const [form, setForm] = useState<RequirementFormState>({
    ...INITIAL_REQUIREMENT,
    ...initialState,
  });

  const handleUpdate = <K extends keyof RequirementFormState>(
    field: K,
    value: RequirementFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkerCountChange = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      workerCount: Math.max(1, Math.min(50, prev.workerCount + delta)),
    }));
  };

  const handleSubmit = () => {
    onSubmit?.(form);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Bar */}
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
          <Text style={styles.navTitle}>Post a Requirement</Text>
          <View style={styles.navSpacer} />
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Job Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Job Title</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={form.jobTitle}
                onChangeText={(text) => handleUpdate('jobTitle', text)}
                placeholder="e.g. Mason for residential construction"
                placeholderTextColor="#64748B"
                accessibilityLabel="Job Title"
              />
            </View>
          </View>

          {/* 2. Skill Required Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Skill Required</Text>
            <Pressable
              onPress={onSkillPress}
              accessibilityRole="button"
              accessibilityLabel={`Skill required: ${form.skill}`}
              style={({ pressed }) => [
                styles.inputBox,
                pressed && styles.inputPressed,
              ]}
            >
              <Text style={styles.inputValueText}>{form.skill}</Text>
              <Text style={styles.inputChevron}>›</Text>
            </Pressable>
          </View>

          {/* 3. Location Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Location</Text>
            <Pressable
              onPress={onLocationPress}
              accessibilityRole="button"
              accessibilityLabel={`Location: ${form.location}`}
              style={({ pressed }) => [
                styles.inputBox,
                pressed && styles.inputPressed,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={form.location}
                onChangeText={(text) => handleUpdate('location', text)}
                placeholder="Bengaluru, Karnataka"
                placeholderTextColor="#64748B"
                accessibilityLabel="Location"
              />
              <Text style={styles.inputGlyph}>📍</Text>
            </Pressable>
          </View>

          {/* 4. Start Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <Pressable
              onPress={onDatePress}
              accessibilityRole="button"
              accessibilityLabel={`Start Date: ${form.startDate}`}
              style={({ pressed }) => [
                styles.inputBox,
                pressed && styles.inputPressed,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={form.startDate}
                onChangeText={(text) => handleUpdate('startDate', text)}
                placeholder="12 Apr 2025"
                placeholderTextColor="#64748B"
                accessibilityLabel="Start Date"
              />
              <Text style={styles.inputGlyph}>📅</Text>
            </Pressable>
          </View>

          {/* Duration Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.durationPillsRow}>
              {DURATION_OPTIONS.map((opt) => {
                const isActive = form.duration === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => handleUpdate('duration', opt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Duration option: ${opt}`}
                    style={({ pressed }) => [
                      styles.durationPill,
                      isActive && styles.durationPillActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        isActive && styles.durationPillTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Number of Workers Stepper */}
          <View style={styles.fieldGroup}>
            <View style={styles.stepperRow}>
              <Text style={styles.fieldLabel}>Number of Workers</Text>
              <View style={styles.stepperContainer}>
                <Pressable
                  onPress={() => handleWorkerCountChange(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease number of workers"
                  disabled={form.workerCount <= 1}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    form.workerCount <= 1 && styles.stepperBtnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.stepperBtnText}>–</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{form.workerCount}</Text>
                <Pressable
                  onPress={() => handleWorkerCountChange(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increase number of workers"
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

          {/* Additional Details (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Additional Details (Optional)</Text>
            <View style={styles.textAreaBox}>
              <TextInput
                style={styles.textAreaInput}
                value={form.additionalDetails}
                onChangeText={(text) => handleUpdate('additionalDetails', text)}
                placeholder="Describe your work requirement..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Additional Details"
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Footer CTA */}
        <View style={styles.stickyFooter}>
          <Pressable
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Post Requirement"
            style={({ pressed }) => [
              styles.postBtn,
              pressed && styles.postBtnPressed,
            ]}
          >
            <Text style={styles.postBtnText}>Post Requirement</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: palette.white,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.7)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.1,
  },
  inputBox: {
    backgroundColor: palette.grey,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  inputPressed: {
    opacity: 0.85,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: palette.ink,
    fontWeight: '500',
    paddingVertical: 0,
  },
  inputValueText: {
    fontSize: 14.5,
    color: palette.ink,
    fontWeight: '600',
  },
  inputChevron: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.ink,
    marginLeft: 8,
  },
  inputGlyph: {
    fontSize: 16,
    marginLeft: 8,
  },
  durationPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  durationPill: {
    flex: 1,
    height: 42,
    backgroundColor: palette.grey,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillActive: {
    backgroundColor: palette.yellow,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink,
  },
  durationPillTextActive: {
    fontWeight: '800',
    color: palette.ink,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperContainer: {
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
  stepperValue: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  textAreaBox: {
    backgroundColor: palette.grey,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textAreaInput: {
    height: 80,
    fontSize: 14,
    color: palette.ink,
    fontWeight: '400',
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
  postBtn: {
    height: 52,
    backgroundColor: palette.yellow,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  postBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  postBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
