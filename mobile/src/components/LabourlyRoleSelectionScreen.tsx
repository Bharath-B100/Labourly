import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export type UserRole = 'contractor' | 'engineer' | 'architect';

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  iconSymbol: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'contractor',
    title: 'Contractor',
    subtitle: 'Build with trusted labour',
    iconSymbol: '🏗️',
  },
  {
    id: 'engineer',
    title: 'Engineer',
    subtitle: 'Get skilled support for your projects',
    iconSymbol: '⚙️',
  },
  {
    id: 'architect',
    title: 'Architect',
    subtitle: 'Bring your designs to life with the right team',
    iconSymbol: '📐',
  },
];

interface LabourlyRoleSelectionScreenProps {
  initialRole?: UserRole;
  onContinue?: (selectedRole: UserRole) => void;
}

export function LabourlyRoleSelectionScreen({
  initialRole = 'contractor',
  onContinue,
}: LabourlyRoleSelectionScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Top-Left Header */}
        <View style={styles.headerSection}>
          <Text accessibilityRole="header" style={styles.headline}>
            I am a
          </Text>
          <Text style={styles.subtitle}>
            Choose your role to get a personalized experience.
          </Text>
        </View>

        {/* Middle Role Cards Stack */}
        <View style={styles.cardsStack}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <Pressable
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${role.title}. ${role.subtitle}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.card,
                  isSelected ? styles.cardActive : styles.cardInactive,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Left Icon Container in Concrete Grey (#E5E7EB) */}
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{role.iconSymbol}</Text>
                </View>

                {/* Role Details */}
                <View style={styles.roleDetails}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                </View>

                {/* Radio Button */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected
                      ? styles.radioOuterActive
                      : styles.radioOuterInactive,
                  ]}
                >
                  {isSelected && <View style={styles.radioInnerFilled} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom CTA Continue Button */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={() => onContinue?.(selectedRole)}
            accessibilityRole="button"
            accessibilityLabel="Continue with selected role"
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    paddingTop: 12,
    marginBottom: 24,
  },
  headline: {
    fontFamily: 'System',
    fontSize: 40,
    fontWeight: '900',
    color: palette.ink, // #202326
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink, // #202326
    lineHeight: 22,
    letterSpacing: -0.2,
    opacity: 0.9,
  },
  cardsStack: {
    gap: 16,
    marginBottom: 'auto',
  },
  card: {
    backgroundColor: palette.white, // #FFFFFF
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 3,
    borderColor: palette.yellow, // #FFCC25
  },
  cardInactive: {
    borderWidth: 1.5,
    borderColor: palette.grey, // #E5E7EB
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.grey, // #E5E7EB
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  roleDetails: {
    flex: 1,
    gap: 3,
  },
  roleTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.3,
  },
  roleSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    color: palette.ink, // #202326
    lineHeight: 18,
    opacity: 0.85,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderWidth: 2.5,
    borderColor: palette.yellow, // #FFCC25
    backgroundColor: palette.white,
  },
  radioOuterInactive: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  radioInnerFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.yellow, // #FFCC25
  },
  bottomSection: {
    paddingTop: 20,
    width: '100%',
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: palette.yellow, // #FFCC25
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  continueText: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.2,
  },
});
