import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './theme';
import { getDefaultUserAvatar } from '../assets/defaultAvatars';

interface SettingsRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  tag?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingsRow({
  iconName,
  label,
  value,
  tag,
  onPress,
  isLast = false,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: '100%' }}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.settingsRow,
            isLast && styles.noBorder,
            pressed && styles.rowPressed,
          ]}
        >
          {/* Left side: Icon + Label */}
          <View style={styles.rowLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={18} color={palette.ink} />
            </View>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>

          {/* Right side: Optional Tag / Value + Chevron */}
          <View style={styles.rowRight}>
            {tag && (
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark" size={12} color={palette.ink} />
                <Text style={styles.verifiedTagText}>{tag}</Text>
              </View>
            )}
            {value && <Text style={styles.rowValue}>{value}</Text>}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={palette.ink}
              style={styles.chevronIcon}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}

export interface ProfileUserData {
  fullName?: string | null;
  phone?: string | null;
  role?: string;
  isPhoneVerified?: boolean;
}

export interface LabourlyMyProfileScreenProps {
  user?: ProfileUserData;
  role?: 'CUSTOMER' | 'WORKER';
  canSwitchRole?: boolean;
  otherRoleLabel?: string;
  onSwitchRole?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
  onLogout?: () => void;
  onRowPress?: (key: string) => void;
}

export function LabourlyMyProfileScreen({
  user,
  role = 'CUSTOMER',
  canSwitchRole = false,
  otherRoleLabel = 'worker',
  onSwitchRole,
  onBack,
  onEdit,
  onLogout,
  onRowPress,
}: LabourlyMyProfileScreenProps) {
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const displayName = user?.fullName || 'Amit Sharma';
  const displayRole =
    user?.role || (role === 'WORKER' ? 'Worker' : 'Contractor');
  const displayPhone = user?.phone;
  const isVerified =
    user?.isPhoneVerified !== undefined ? user.isPhoneVerified : true;

  const handleRowClick = (key: string, defaultNotice?: string) => {
    if (defaultNotice) {
      setActiveNotice((prev) =>
        prev === defaultNotice ? null : defaultNotice,
      );
    }
    onRowPress?.(key);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header: Bold left title 'My Profile' and right edit icon */}
      <View style={styles.navBar}>
        <Text style={styles.titleText}>My Profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={onEdit}
        >
          {({ pressed }) => (
            <View style={[styles.editButton, pressed && styles.buttonPressed]}>
              <Ionicons name="create-outline" size={20} color={palette.ink} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile Card (#FFFFFF) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Image
                source={getDefaultUserAvatar(role)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="shield-checkmark" size={12} color={palette.ink} />
            </View>
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileRole}>
              {displayRole}
              {displayPhone ? ` · ${displayPhone}` : ''}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={palette.ink}
                />
                <Text style={styles.badgeText}>
                  {isVerified
                    ? user?.phone
                      ? 'Phone Verified'
                      : 'Verified'
                    : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Group 1: Operations */}
        <View style={styles.settingsGroup}>
          {role === 'CUSTOMER' ? (
            <>
              <SettingsRow
                iconName="briefcase-outline"
                label="My Bookings"
                onPress={() => handleRowClick('bookings')}
              />
              <SettingsRow
                iconName="list-outline"
                label="My Requirements"
                onPress={() => handleRowClick('requirements')}
              />
              <SettingsRow
                iconName="heart-outline"
                label="Saved Workers"
                onPress={() => handleRowClick('saved-workers')}
              />
              <SettingsRow
                iconName="wallet-outline"
                label="Wallet & Payments"
                value="Unavailable"
                onPress={() => handleRowClick('wallet')}
              />
              <SettingsRow
                iconName="notifications-outline"
                label="Notifications"
                isLast
                onPress={() => handleRowClick('notifications')}
              />
            </>
          ) : (
            <>
              <SettingsRow
                iconName="location-outline"
                label="Service Areas & Availability"
                onPress={() => handleRowClick('service-areas')}
              />
              <SettingsRow
                iconName="briefcase-outline"
                label="My Bookings"
                onPress={() => handleRowClick('bookings')}
              />
              <SettingsRow
                iconName="notifications-outline"
                label="Notifications"
                isLast
                onPress={() => handleRowClick('notifications')}
              />
            </>
          )}
        </View>

        {/* Group 2: Account, Verification & Settings */}
        <View style={styles.settingsGroup}>
          {canSwitchRole && (
            <SettingsRow
              iconName="swap-horizontal-outline"
              label={`Switch to ${otherRoleLabel}`}
              onPress={onSwitchRole}
            />
          )}
          <SettingsRow
            iconName="shield-checkmark-outline"
            label="KYC Verification"
            value="Phone only"
            onPress={() =>
              handleRowClick(
                'kyc',
                'Phone verification confirms access to your registered mobile number. Official government KYC / identity verification is not established in this development version.',
              )
            }
          />
          <SettingsRow
            iconName="globe-outline"
            label="Language"
            value="English"
            onPress={() =>
              handleRowClick(
                'language',
                'Language: English. Regional language settings are planned for a future update.',
              )
            }
          />
          <SettingsRow
            iconName="location-outline"
            label="Country"
            value="India"
            onPress={() =>
              handleRowClick(
                'country',
                'Labourly currently serves registered locations across India.',
              )
            }
          />
          <SettingsRow
            iconName="headset-outline"
            label="Help & Support"
            onPress={() =>
              handleRowClick(
                'support',
                'Customer support channels and dispute resolution are in development and will open before public release. Contact your site supervisor for on-site assistance.',
              )
            }
          />
          <SettingsRow
            iconName="lock-closed-outline"
            label="Privacy Policy"
            onPress={() =>
              handleRowClick(
                'privacy',
                'Standard Labourly data privacy applies. Your phone number is only shared upon confirmed booking.',
              )
            }
          />
          <SettingsRow
            iconName="document-text-outline"
            label="Terms & Conditions"
            isLast
            onPress={() =>
              handleRowClick(
                'terms',
                'Labourly terms and conditions govern all quotations, hiring schedules, and bookings.',
              )
            }
          />
        </View>

        {/* Informational Notice Banner if row pressed */}
        {!!activeNotice && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <Ionicons
                name="information-circle"
                size={18}
                color={palette.ink}
              />
              <Text style={styles.noticeText}>{activeNotice}</Text>
            </View>
            <Pressable
              onPress={() => setActiveNotice(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notice"
              style={styles.noticeDismiss}
            >
              <Text style={styles.noticeDismissText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Footer CTA: Full-width #FFFFFF 'Log Out' button bordered in #202326 */}
        <View style={styles.footerContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log Out"
            onPress={onLogout}
            style={{ width: '100%' }}
          >
            {({ pressed }) => (
              <View
                style={[styles.logoutButton, pressed && styles.buttonPressed]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={palette.ink}
                />
                <Text style={styles.logoutText}>Log Out</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.grey,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: palette.grey,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.4,
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: 'rgba(32, 35, 38, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    borderWidth: 2.5,
    borderColor: palette.ink,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.yellow,
    borderWidth: 2,
    borderColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
  },
  profileRole: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink,
    opacity: 0.65,
  },
  badgeRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.yellow,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.ink,
  },
  settingsGroup: {
    backgroundColor: palette.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.grey,
    width: '100%',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    letterSpacing: -0.1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.yellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: palette.ink,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
    opacity: 0.6,
  },
  chevronIcon: {
    opacity: 0.4,
  },
  noticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    gap: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: palette.ink,
  },
  noticeDismiss: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noticeDismissText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    marginTop: 8,
    marginBottom: 40,
    width: '100%',
  },
  logoutButton: {
    width: '100%',
    height: 52,
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
});
