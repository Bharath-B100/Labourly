import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from './ui';

export interface ProfileUserData {
  fullName?: string | null;
  phone?: string | null;
  role?: string;
  isPhoneVerified?: boolean;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postalCode?: string | null;
  customerType?: string | null;
  companyName?: string | null;
  workerType?: string | null;
  tradeName?: string | null;
  experienceYears?: number | null;
  availability?: string | null;
}

export interface LabourlyMyProfileScreenProps {
  user?: ProfileUserData;
  role?: 'CUSTOMER' | 'WORKER';
  canSwitchRole?: boolean;
  otherRoleLabel?: string;
  onSwitchRole?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
  onLogout?: () => void | Promise<void>;
  onRowPress?: (key: string) => void;
  onFindWorkersInCity?: (city: string, state: string) => void;
}

type ModalType =
  | 'KYC'
  | 'LANGUAGE'
  | 'COUNTRY'
  | 'NOTIFICATIONS'
  | 'SUPPORT'
  | 'PRIVACY'
  | 'TERMS'
  | null;

export function LabourlyMyProfileScreen({
  user,
  role = 'CUSTOMER',
  canSwitchRole = false,
  otherRoleLabel = 'worker',
  onSwitchRole,
  onEdit,
  onLogout,
  onRowPress,
  onFindWorkersInCity,
}: LabourlyMyProfileScreenProps) {
  const [supportStatus, setSupportStatus] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const locationString = [user?.city, user?.district, user?.state]
    .filter(Boolean)
    .join(', ');

  const isVerified = user?.isPhoneVerified === true;
  const userInitial = user?.fullName?.trim().charAt(0).toUpperCase() || 'L';

  const handleRowClick = (key: string, defaultAction: () => void) => {
    if (key === 'notifications' && onRowPress) {
      onRowPress('notifications');
      return;
    }
    defaultAction();
  };

  /**
   * Renders a single horizontal row guaranteed not to wrap vertically.
   * Icon on left, Title & optional subtitle in center, optional right value + chevron on right.
   */
  const renderRow = (
    label: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    action: () => void,
    options?: {
      subtitle?: string;
      rightValue?: string;
      rightValueColor?: string;
      isLast?: boolean;
    },
  ) => {
    const isLast = options?.isLast ?? false;
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={action}
        style={({ pressed }) => [
          styles.rowPressable,
          isLast && styles.rowPressableLast,
          pressed && styles.rowPressablePressed,
        ]}
      >
        <View style={styles.rowInnerContainer}>
          {/* Left Warm Yellow Icon Bubble */}
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color="#202326" />
          </View>

          {/* Middle Title & Subtitle */}
          <View style={styles.rowTextContainer}>
            <Text numberOfLines={1} style={styles.rowLabel}>
              {label}
            </Text>
            {options?.subtitle ? (
              <Text numberOfLines={1} style={styles.rowSubtitle}>
                {options.subtitle}
              </Text>
            ) : null}
          </View>

          {/* Optional Right Value (e.g. 'Verified', 'English', 'India') */}
          {options?.rightValue ? (
            <Text
              style={[
                styles.rowRightValue,
                options.rightValueColor
                  ? { color: options.rightValueColor, fontWeight: '700' }
                  : null,
              ]}
            >
              {options.rightValue}
            </Text>
          ) : null}

          {/* Chevron on Far Right */}
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>
      </Pressable>
    );
  };

  return (
    <Screen branded={false}>
      {/* Top Header with Title and Top-Right Yellow Edit Profile Button */}
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          My Profile
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={() => onEdit?.()}
          style={({ pressed }) => [
            styles.editHeaderButton,
            pressed && styles.editHeaderButtonPressed,
          ]}
        >
          <Ionicons name="create-outline" size={22} color="#202326" />
        </Pressable>
      </View>

      {/* Main Profile Info Card with Labourly Yellow Identity */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeroRow}>
          {/* Circular Safety Yellow Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>{userInitial}</Text>
          </View>

          {/* Profile Details Column */}
          <View style={styles.profileMetaColumn}>
            <Text style={styles.profileName}>
              {user?.fullName ||
                (role === 'WORKER' ? 'Worker account' : 'Your account')}
            </Text>
            <Text style={styles.profileRole}>
              {user?.role || (role === 'WORKER' ? 'Contractor' : 'Customer')}
              {user?.customerType ? ` · ${user.customerType}` : ''}
              {user?.workerType ? ` (${user.workerType})` : ''}
              {user?.tradeName ? ` · ${user.tradeName}` : ''}
            </Text>
            {isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Ionicons name="ellipse-outline" size={14} color="#64748B" />
                <Text style={styles.unverifiedBadgeText}>Unverified</Text>
              </View>
            )}
          </View>
        </View>

        {user?.companyName ? (
          <View style={styles.companyBanner}>
            <Ionicons name="business-outline" size={18} color="#B45309" />
            <Text style={styles.companyBannerText}>{user.companyName}</Text>
          </View>
        ) : null}

        {/* Registered Work Location Banner */}
        {locationString ? (
          <View style={styles.locationBanner}>
            <View style={styles.locationHeaderRow}>
              <Ionicons name="location" size={16} color="#B45309" />
              <Text style={styles.locationHeaderLabel}>
                REGISTERED WORK LOCATION
              </Text>
            </View>
            <Text style={styles.locationTitle}>{locationString}</Text>
            {user?.postalCode && (
              <Text style={styles.locationPin}>
                PIN Code: {user.postalCode}
              </Text>
            )}

            {role === 'CUSTOMER' && user?.city && onFindWorkersInCity && (
              <Pressable
                onPress={() =>
                  onFindWorkersInCity(user.city!, user.state || '')
                }
                style={({ pressed }) => [
                  styles.findWorkersButton,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="search" size={15} color="#202326" />
                <Text style={styles.findWorkersButtonText}>
                  Find workers in {user.city}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {user?.isPhoneVerified === true && (
          <Text style={styles.phoneVerifiedNote}>
            Phone verified · not identity verification
          </Text>
        )}
      </View>

      {/* Activity & Work Navigation Card */}
      <Text style={styles.sectionHeader}>Activity & Work</Text>
      <View style={styles.menuCard}>
        {renderRow('My bookings', 'briefcase-outline', () =>
          onRowPress?.('bookings'),
        )}
        {renderRow(
          'Chat & Messages',
          'chatbubble-ellipses-outline',
          () => onRowPress?.('chat'),
          { subtitle: 'Direct messaging and assistant' },
        )}
        {role === 'CUSTOMER' ? (
          <>
            {renderRow('My jobs and quotations', 'document-text-outline', () =>
              onRowPress?.('requirements'),
            )}
            {renderRow('Saved Workers', 'heart-outline', () =>
              onRowPress?.('saved-workers'),
            )}
          </>
        ) : (
          renderRow(
            'Service areas and availability',
            'location-outline',
            () => onRowPress?.('service-areas'),
            { isLast: !canSwitchRole },
          )
        )}
        {canSwitchRole &&
          onSwitchRole &&
          renderRow(
            `Switch to ${otherRoleLabel}`,
            'swap-horizontal-outline',
            onSwitchRole,
            { isLast: true },
          )}
      </View>

      {/* Settings & Information (Matching Reference Screenshot) */}
      <Text style={styles.sectionHeader}>Settings & information</Text>
      <View style={styles.menuCard}>
        {renderRow(
          'KYC Verification',
          'shield-checkmark-outline',
          () => {
            setNotice(
              'Identity verification is not available yet. Phone verification does not establish KYC. Do not submit identity documents here.',
            );
            setActiveModal('KYC');
          },
          {
            rightValue: isVerified ? 'Verified' : 'Not available yet',
            rightValueColor: isVerified ? '#16A34A' : '#64748B',
          },
        )}
        {renderRow(
          'Language',
          'language-outline',
          () => {
            setNotice(
              'The application currently supports English. Additional languages are not available yet.',
            );
            setActiveModal('LANGUAGE');
          },
          {
            rightValue: selectedLanguage,
            rightValueColor: '#64748B',
          },
        )}
        {renderRow(
          'Country',
          'globe-outline',
          () => {
            setNotice(
              'Labourly currently serves India. Choose your project city in Workers or when posting a requirement.',
            );
            setActiveModal('COUNTRY');
          },
          {
            rightValue: 'India',
            rightValueColor: '#64748B',
          },
        )}
        {renderRow('Notifications', 'notifications-outline', () =>
          handleRowClick('notifications', () =>
            setActiveModal('NOTIFICATIONS'),
          ),
        )}
        {renderRow('Help & Support', 'help-circle-outline', () => {
          setNotice(
            'Contact Labourly at labourly.work@gmail.com. No support request has been sent.',
          );
          setActiveModal('SUPPORT');
        })}
        {onRowPress &&
          renderRow(
            'Support requests & account deletion',
            'help-circle-outline',
            () => onRowPress('support'),
          )}
        {renderRow('Privacy Policy', 'lock-closed-outline', () => {
          setNotice(
            'The published privacy policy is not available in this build. It must be provided before public launch.',
          );
          setActiveModal('PRIVACY');
        })}
        {renderRow(
          'Terms & Conditions',
          'document-outline',
          () => {
            setNotice(
              'Published terms and conditions are not available in this build. They must be provided before public launch.',
            );
            setActiveModal('TERMS');
          },
          { isLast: true },
        )}
      </View>

      {/* Information Banner (Accessible Alert) */}
      {!!notice && (
        <View style={styles.alertCard}>
          <View style={styles.alertContentRow}>
            <Ionicons name="information-circle" size={22} color="#EAB308" />
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.alertText}
            >
              {notice}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss information"
            onPress={() => {
              setNotice('');
              setActiveModal(null);
            }}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed,
            ]}
          >
            <Text style={styles.dismissButtonText}>Dismiss information</Text>
          </Pressable>
        </View>
      )}

      {/* Standalone Log Out Button with Red Icon & Text */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log Out"
        disabled={!onLogout || busy}
        onPress={() => {
          if (busy) return;
          setBusy(true);
          void Promise.resolve()
            .then(() => onLogout?.())
            .catch(() =>
              setNotice('Sign out could not be completed. Please try again.'),
            )
            .finally(() => setBusy(false));
        }}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
      >
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutButtonText}>
          {busy ? 'Signing out...' : 'Log Out'}
        </Text>
      </Pressable>

      {/* Interactive Modal Dialogs for Every Single Button */}
      <Modal
        visible={activeModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* KYC Modal */}
              {activeModal === 'KYC' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons
                        name="shield-checkmark"
                        size={28}
                        color="#202326"
                      />
                    </View>
                    <Text style={styles.modalTitle}>KYC Verification</Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      Phone Verification Status
                    </Text>
                    <View style={styles.modalStatusRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#16A34A"
                      />
                      <Text style={styles.modalStatusTextGreen}>
                        {user?.phone
                          ? `${user.phone} (OTP Verified)`
                          : 'Phone Verified'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      Government ID / Aadhaar
                    </Text>
                    <Text style={styles.modalSubText}>
                      Standard government document verification will be enabled
                      in an upcoming release. Please check back later.
                    </Text>
                  </View>
                </View>
              )}

              {/* Language Selector Modal */}
              {activeModal === 'LANGUAGE' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons name="language" size={28} color="#202326" />
                    </View>
                    <Text style={styles.modalTitle}>Select Language</Text>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Choose your preferred display language for Labourly.
                  </Text>
                  {[
                    {
                      id: 'en',
                      base: 'English',
                      label: 'English',
                      sub: 'Default',
                    },
                    {
                      id: 'ta',
                      base: 'Tamil',
                      label: 'தமிழ் (Tamil)',
                      sub: 'Coimbatore & Tamil Nadu',
                    },
                    {
                      id: 'kn',
                      base: 'Kannada',
                      label: 'ಕನ್ನಡ (Kannada)',
                      sub: 'Bengaluru & Karnataka',
                    },
                    {
                      id: 'hi',
                      base: 'Hindi',
                      label: 'हिंदी (Hindi)',
                      sub: 'National',
                    },
                  ].map((lang) => (
                    <Pressable
                      key={lang.label}
                      onPress={() => {
                        setSelectedLanguage(lang.base);
                        setNotice(
                          lang.base === 'English'
                            ? 'Display language set to English.'
                            : `Selected ${lang.base}. Full localization will apply to market listings.`,
                        );
                      }}
                      style={({ pressed }) => [
                        styles.languageOption,
                        selectedLanguage.toLowerCase() ===
                          lang.base.toLowerCase() &&
                          styles.languageOptionActive,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.languageOptionTitle}>
                          {lang.label}
                        </Text>
                        <Text style={styles.languageOptionSub}>{lang.sub}</Text>
                      </View>
                      {selectedLanguage.toLowerCase() ===
                      lang.base.toLowerCase() ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#202326"
                        />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={22}
                          color="#CBD5E1"
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Country Modal */}
              {activeModal === 'COUNTRY' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons name="globe" size={28} color="#202326" />
                    </View>
                    <Text style={styles.modalTitle}>Country & Coverage</Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      Country: India (🇮🇳 +91)
                    </Text>
                    <Text style={styles.modalSubText}>
                      Currency: Indian Rupee (INR ₹)
                    </Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      Active Regional Hubs
                    </Text>
                    <Text style={styles.modalSubText}>
                      • Bengaluru, Karnataka (LGD:29){'\n'}• Coimbatore, Tamil
                      Nadu (LGD:33){'\n'}• Chennai, Tamil Nadu (LGD:33){'\n'}•
                      Krishnagiri & Hosur (LGD:33)
                    </Text>
                  </View>
                </View>
              )}

              {/* Notification settings are not persisted until push is configured. */}
              {activeModal === 'NOTIFICATIONS' && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubText}>
                    In-app notifications are available from your notification
                    inbox. Background alerts and notification preferences are
                    not available yet.
                  </Text>
                </View>
              )}
              {/* Help & Support Modal */}
              {activeModal === 'SUPPORT' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons name="help-circle" size={28} color="#202326" />
                    </View>
                    <Text style={styles.modalTitle}>Help & Support</Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>Email Labourly</Text>
                    <Text selectable style={styles.modalSubText}>
                      labourly.work@gmail.com
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Email Labourly support"
                      onPress={async () => {
                        try {
                          await Linking.openURL(
                            'mailto:labourly.work@gmail.com?subject=Labourly%20support',
                          );
                          setSupportStatus(
                            'Your email app was opened. Review and send your message there. No support request has been sent by Labourly.',
                          );
                        } catch {
                          setSupportStatus(
                            'Could not open an email app. Write to labourly.work@gmail.com using your preferred email service.',
                          );
                        }
                      }}
                      style={styles.modalChatButton}
                    >
                      <Text style={styles.modalChatButtonText}>
                        Compose support email
                      </Text>
                    </Pressable>
                  </View>
                  {!!supportStatus && (
                    <Text accessibilityRole="alert" style={styles.modalSubText}>
                      {supportStatus}
                    </Text>
                  )}
                  <Text style={styles.modalDisclaimer}>
                    Describe the problem and include a booking reference if
                    relevant. Never send passwords, sign-in codes or payment
                    credentials. Response hours are not yet published; this is
                    not an emergency service.
                  </Text>
                </View>
              )}

              {/* Privacy Policy Modal */}
              {activeModal === 'PRIVACY' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons name="lock-closed" size={28} color="#202326" />
                    </View>
                    <Text style={styles.modalTitle}>Privacy Policy</Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      1. Location Privacy
                    </Text>
                    <Text style={styles.modalSubText}>
                      Your location is only used to query service hubs (e.g.
                      Bengaluru, Coimbatore). Exact residential GPS coordinates
                      are never shared publicly.
                    </Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      2. Encrypted Messages
                    </Text>
                    <Text style={styles.modalSubText}>
                      Worker-customer chat logs are strictly private to
                      authorized booking participants.
                    </Text>
                  </View>
                  <Text style={styles.modalDisclaimer}>
                    The published privacy policy is not available in this build.
                    It must be provided before public launch.
                  </Text>
                </View>
              )}

              {/* Terms & Conditions Modal */}
              {activeModal === 'TERMS' && (
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconCircle}>
                      <Ionicons
                        name="document-text"
                        size={28}
                        color="#202326"
                      />
                    </View>
                    <Text style={styles.modalTitle}>Terms & Conditions</Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      1. Fair Marketplace Rates
                    </Text>
                    <Text style={styles.modalSubText}>
                      Workers quote independently based on trade skill,
                      materials, and project duration.
                    </Text>
                  </View>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalBoxTitle}>
                      2. Payments & support
                    </Text>
                    <Text style={styles.modalSubText}>
                      Labourly does not currently provide wallet payments or
                      escrow. Confirm the quotation and work scope before
                      accepting a booking. Contact support if a problem occurs;
                      outcomes are not guaranteed.
                    </Text>
                  </View>
                  <Text style={styles.modalDisclaimer}>
                    Published terms and conditions are not available in this
                    build. They must be provided before public launch.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => setActiveModal(null)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#202326',
    letterSpacing: -0.5,
  },
  editHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFCC25',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFCC25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  editHeaderButtonPressed: {
    backgroundColor: '#EAB308',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#202326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
    marginBottom: 8,
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFCC25',
    borderWidth: 3,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFCC25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitialText: {
    color: '#202326',
    fontSize: 30,
    fontWeight: '800',
  },
  profileMetaColumn: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202326',
  },
  profileRole: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 2,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 2,
  },
  unverifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  companyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  companyBannerText: {
    color: '#202326',
    fontWeight: '700',
    fontSize: 14,
  },
  locationBanner: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 6,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202326',
    marginLeft: 22,
  },
  locationPin: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 22,
  },
  findWorkersButton: {
    marginTop: 8,
    backgroundColor: '#FFCC25',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  findWorkersButtonText: {
    color: '#202326',
    fontWeight: '800',
    fontSize: 13,
  },
  phoneVerifiedNote: {
    color: '#64748B',
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202326',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#202326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  rowPressable: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  rowPressableLast: {
    borderBottomWidth: 0,
  },
  rowPressablePressed: {
    backgroundColor: '#FFFBEB',
  },
  rowInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    minHeight: 56,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  rowLabel: {
    color: '#202326',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  rowRightValue: {
    color: '#64748B',
    fontSize: 14,
    marginRight: 8,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    shadowColor: '#202326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  alertContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertText: {
    color: '#202326',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#FFFDF5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  dismissButtonPressed: {
    backgroundColor: '#FEF9C3',
  },
  dismissButtonText: {
    color: '#202326',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 28,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 35, 38, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalBody: {
    gap: 14,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFCC25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202326',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalBox: {
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: 6,
  },
  modalBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202326',
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatusTextGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalSubText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  modalDisclaimer: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 4,
  },
  modalChatButton: {
    marginTop: 6,
    backgroundColor: '#FFCC25',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalChatButtonText: {
    color: '#202326',
    fontWeight: '800',
    fontSize: 13,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  languageOptionActive: {
    borderColor: '#FFCC25',
    backgroundColor: '#FFFDF5',
  },
  languageOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202326',
  },
  languageOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notificationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  notificationToggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202326',
  },
  notificationToggleSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseButton: {
    marginTop: 18,
    backgroundColor: '#202326',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
