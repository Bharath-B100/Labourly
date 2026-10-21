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

interface LabourlySignInScreenProps {
  onSignIn?: (phone: string, pass: string) => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
}

export function LabourlySignInScreen({
  onSignIn,
  onSignUp,
  onForgotPassword,
  onGoogleSignIn,
  onAppleSignIn,
}: LabourlySignInScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('98765 43210');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Branding */}
          <View style={styles.brandingHeader}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <View style={styles.logoRow}>
              {/* Hard hat tilted over the L */}
              <View style={styles.hardHatBadge}>
                <Text style={styles.hardHatEmoji}>👷</Text>
              </View>
              <Text style={styles.wordmark}>Labourly</Text>
            </View>
            <Text style={styles.tagline}>Hire Local Labour, Fast.</Text>
          </View>

          {/* Tabs: Sign In / Sign Up */}
          <View style={styles.tabsContainer}>
            <Pressable
              onPress={() => setActiveTab('signin')}
              style={[
                styles.tabItem,
                activeTab === 'signin' && styles.tabItemActive,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'signin' }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signin' && styles.tabTextActive,
                ]}
              >
                Sign In
              </Text>
              {activeTab === 'signin' && (
                <View style={styles.activeIndicator} />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab('signup');
                onSignUp?.();
              }}
              style={[
                styles.tabItem,
                activeTab === 'signup' && styles.tabItemActive,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'signup' }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signup' && styles.tabTextActive,
                ]}
              >
                Sign Up
              </Text>
              {activeTab === 'signup' && (
                <View style={styles.activeIndicator} />
              )}
            </Pressable>
          </View>

          {/* Form Inputs */}
          <View style={styles.inputsContainer}>
            {/* Phone Number Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIconText}>📞</Text>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.textInput}
                accessibilityLabel="Mobile number"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIconText}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={styles.textInput}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Toggle password visibility"
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIconText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Forgot Password Link */}
          <View style={styles.forgotWrapper}>
            <Pressable onPress={onForgotPassword} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Primary Action Button */}
          <Pressable
            onPress={() => onSignIn?.(phone, password)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            <Text style={styles.primaryButtonText}>
              {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </Pressable>

          {/* OR Divider */}
          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In Buttons */}
          <Pressable
            onPress={onGoogleSignIn}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Text style={styles.socialIconText}>G</Text>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={onAppleSignIn}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            <Text style={styles.socialIconText}></Text>
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </Pressable>

          {/* Footer Text */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Labourly? </Text>
            <Pressable onPress={onSignUp}>
              <Text style={styles.footerHighlight}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white, // #FFFFFF
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink, // #202326
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  hardHatBadge: {
    position: 'absolute',
    left: -16,
    top: -10,
    transform: [{ rotate: '-15deg' }],
    zIndex: 2,
  },
  hardHatEmoji: {
    fontSize: 24,
  },
  wordmark: {
    fontFamily: 'System',
    fontSize: 42,
    fontWeight: '900',
    color: palette.ink, // #202326
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink, // #202326
    marginTop: 4,
    letterSpacing: -0.2,
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.grey, // #E5E7EB
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: palette.ink, // #202326
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '60%',
    height: 3.5,
    backgroundColor: palette.yellow, // #FFCC25
    borderRadius: 4,
  },
  inputsContainer: {
    gap: 14,
    marginBottom: 10,
  },
  inputWrapper: {
    height: 54,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: palette.grey, // #E5E7EB
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  inputIconText: {
    fontSize: 16,
  },
  countryCode: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  textInput: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink, // #202326
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIconText: {
    fontSize: 16,
  },
  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink, // #202326
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 9999,
    backgroundColor: palette.yellow, // #FFCC25
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink, // #202326
    letterSpacing: -0.2,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.grey, // #E5E7EB
  },
  orText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  socialButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: palette.white, // #FFFFFF
    borderWidth: 1.5,
    borderColor: palette.grey, // #E5E7EB
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  socialButtonPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#CBD5E1',
  },
  socialIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink, // #202326
  },
  socialButtonText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink, // #202326
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    color: palette.ink, // #202326
  },
  footerHighlight: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706', // Gold / safety yellow accent
  },
});
