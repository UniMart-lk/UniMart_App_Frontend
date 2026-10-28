import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authService';

export default function ResetPasswordScreen({ navigation } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Current step in the reset password flow:
  // 1 = Forgot Password (Enter Email)
  // 2 = Check Your Email (Sent Confirmation)
  // 3 = Verify Email (6-digit OTP code)
  // 4 = Set a New Password
  // 5 = Password Updated (Success)
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // UI States
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Timers
  const [resendSeconds, setResendSeconds] = useState(60);
  const [codeExpirySeconds, setCodeExpirySeconds] = useState(600); // 10 minutes

  // OTP input refs
  const otpRefs = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setCodeExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation handlers
  const handleBackToLogin = () => {
    if (navigation?.navigate) {
      navigation.navigate('Login');
    } else {
      try {
        router.replace('/login');
      } catch {
        router.push('/login');
      }
    }
  };

  const handleHeaderBack = () => {
    setErrorMessage('');
    if (step === 1) {
      if (navigation?.goBack) {
        navigation.goBack();
      } else {
        try {
          router.back();
        } catch {
          handleBackToLogin();
        }
      }
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 5) {
      handleBackToLogin();
    }
  };

  // Step 1: Send verification code via backend
  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(trimmedEmail);
      setResendSeconds(60);
      setCodeExpirySeconds(600);
      if (res?.data?.devCode) {
        console.log(`[DEV OTP]: ${res.data.devCode}`);
      }
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendSeconds > 0) return;
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setResendSeconds(60);
      setCodeExpirySeconds(600);
      if (res?.data?.devCode) {
        console.log(`[DEV OTP Resent]: ${res.data.devCode}`);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle OTP digit input
  const handleOtpChange = (text, index) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (sanitized.length > 1) {
      // Handle paste
      const digits = sanitized.split('').slice(0, 6);
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = sanitized;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 3: Verify OTP Code via backend
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authService.verifyResetCode(email.trim(), code);
      if (res?.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setStep(4);
    } catch (error) {
      setErrorMessage(error.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Reset Password via backend
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  const handleResetPassword = async () => {
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await authService.resetPassword({
        email: email.trim(),
        newPassword,
        resetToken,
        code: otp.join(''),
      });
      setStep(5);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Header */}
      <View style={styles.header}>
        {step !== 5 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightPlaceholder} />
        )}

        <Text style={styles.headerTitle}>
          {step === 3 ? 'Verify email' : step === 5 ? 'Password updated' : 'Reset password'}
        </Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================================== */}
          {/* STEP 1: Forgot Password (Enter Email)                */}
          {/* ==================================================== */}
          {step === 1 && (
            <>
              {/* Blue Mail Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="mail" size={28} color="#FFFFFF" />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your registered email address and we’ll send you a code to reset your password.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send verification code</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>

              {/* Bottom Info Card */}
              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" style={styles.infoIcon} />
                <Text style={styles.infoBoxText}>
                  We’ll verify your email with a <Text style={styles.infoBoxBold}>6-digit one-time code.</Text>
                </Text>
              </View>
            </>
          )}

          {/* ==================================================== */}
          {/* STEP 2: Check Your Email (Sent Confirmation)        */}
          {/* ==================================================== */}
          {step === 2 && (
            <>
              {/* Blue Message Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Check Your{'\n'}Email</Text>
                <Text style={styles.subtitle}>
                  If an account exists for this email address, we’ve sent a 6-digit verification code.
                </Text>
              </View>

              {/* Email Display Card */}
              <View style={styles.emailDisplayCard}>
                <Ionicons name="mail-outline" size={20} color="#2563EB" style={{ marginRight: 10 }} />
                <Text style={styles.emailDisplayText} numberOfLines={1}>
                  {email || 'student@example.com'}
                </Text>
              </View>

              {/* Expiry Notice Card */}
              <View style={styles.noticeCard}>
                <Ionicons name="time-outline" size={20} color="#2563EB" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={styles.noticeCardText}>
                  Your code is valid for <Text style={styles.noticeCardBold}>10 minutes</Text>.{'\n'}
                  Check your spam folder if you don’t see it.
                </Text>
              </View>

              {/* Enter Verification Code Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep(3)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Enter verification code</Text>
              </TouchableOpacity>

              {/* Resend Email Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, resendSeconds === 0 && styles.secondaryButtonActive]}
                onPress={handleResendCode}
                disabled={resendSeconds > 0}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    resendSeconds === 0 && styles.secondaryButtonTextActive,
                  ]}
                >
                  {resendSeconds > 0 ? `Resend Email in ${formatTimer(resendSeconds)}` : 'Resend Email'}
                </Text>
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ==================================================== */}
          {/* STEP 3: Verify Email (6-digit OTP code)              */}
          {/* ==================================================== */}
          {step === 3 && (
            <>
              {/* Blue Shield Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Verify your{'\n'}email.</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to your email to continue.
                </Text>
              </View>

              {/* Email Display Card */}
              <View style={styles.emailDisplayCard}>
                <Ionicons name="mail-outline" size={20} color="#2563EB" style={{ marginRight: 10 }} />
                <Text style={styles.emailDisplayText} numberOfLines={1}>
                  {email || 'student@example.com'}
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 6-Digit OTP Boxes */}
              <View style={styles.otpGroup}>
                <Text style={styles.label}>Verification code</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, idx) => {
                    const isFocused = focusedField === `otp_${idx}`;
                    return (
                      <TextInput
                        key={idx}
                        ref={(ref) => (otpRefs.current[idx] = ref)}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          isFocused ? styles.otpBoxFocused : null,
                        ]}
                        value={digit}
                        onChangeText={(t) => handleOtpChange(t, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        onFocus={() => setFocusedField(`otp_${idx}`)}
                        onBlur={() => setFocusedField(null)}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Expiry Countdown */}
              <View style={styles.expiryRow}>
                <Ionicons name="time-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.expiryText}>
                  Code expires in <Text style={styles.expiryTextBold}>{formatTimer(codeExpirySeconds)}</Text>
                </Text>
              </View>

              {/* Verify Email Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify email</Text>
                )}
              </TouchableOpacity>

              {/* Didn't get the code? Resend */}
              <View style={styles.resendRow}>
                <Text style={styles.resendPromptText}>Didn’t get the code? </Text>
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resendSeconds > 0}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      resendSeconds > 0 && styles.resendLinkDisabled,
                    ]}
                  >
                    {resendSeconds > 0 ? `Resend in ${formatTimer(resendSeconds)}` : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Change email address link */}
              <TouchableOpacity
                style={styles.changeEmailButton}
                onPress={() => {
                  setErrorMessage('');
                  setStep(1);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.changeEmailText}>Change email address</Text>
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ==================================================== */}
          {/* STEP 4: Set a New Password                          */}
          {/* ==================================================== */}
          {step === 4 && (
            <>
              {/* Blue Lock Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Set a new{'\n'}password.</Text>
                <Text style={styles.subtitle}>
                  Your email is verified. Choose a new password to secure your account.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New password</Text>
                <View style={[styles.passwordInputContainer, focusedField === 'newPassword' && styles.inputFocused]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword((prev) => !prev)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm new password</Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    focusedField === 'confirmNewPassword' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmNewPassword}
                    onChangeText={(t) => {
                      setConfirmNewPassword(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmNewPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    onFocus={() => setFocusedField('confirmNewPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmNewPassword((prev) => !prev)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showConfirmNewPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Requirements Checklist */}
              <View style={styles.checklistContainer}>
                <View style={styles.checklistItem}>
                  <Ionicons
                    name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={hasMinLength ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.checklistText, hasMinLength && styles.checklistTextMet]}>
                    At least 8 characters
                  </Text>
                </View>

                <View style={styles.checklistItem}>
                  <Ionicons
                    name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordsMatch ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.checklistText, passwordsMatch && styles.checklistTextMet]}>
                    Both passwords must match
                  </Text>
                </View>
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>

              {/* Footer subtext */}
              <Text style={styles.footerNote}>
                Your new password takes effect after reset.
              </Text>
            </>
          )}

          {/* ==================================================== */}
          {/* STEP 5: Password Updated (Success Screen)            */}
          {/* ==================================================== */}
          {step === 5 && (
            <>
              {/* Green Checkmark Icon Badge */}
              <View style={[styles.iconBadge, styles.iconBadgeSuccess]}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Password{'\n'}Updated</Text>
                <Text style={styles.subtitle}>
                  Your password has been reset successfully. You can now sign in with your new password.
                </Text>
              </View>

              {/* Success Callout Card */}
              <View style={styles.successCallout}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" style={{ marginRight: 10, marginTop: 1 }} />
                <Text style={styles.successCalloutText}>
                  <Text style={styles.successCalloutBold}>You’re all set.</Text>{'\n'}
                  Your account is ready to use again.
                </Text>
              </View>

              {/* Back to Login Primary Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleBackToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Footer subtext */}
              <Text style={styles.footerNote}>
                Use your new password the next time you sign in.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBadgeSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '400',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  passwordInputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
  },
  eyeButton: {
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: '#2563EB',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonTextActive: {
    color: '#2563EB',
  },
  backToLoginContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginTop: 4,
  },
  backToLoginText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  infoBoxBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  emailDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  emailDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  noticeCardText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    flex: 1,
  },
  noticeCardBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  // OTP Styles
  otpGroup: {
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpBox: {
    width: 48,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  expiryText: {
    fontSize: 13,
    color: '#64748B',
  },
  expiryTextBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendPromptText: {
    fontSize: 13,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  resendLinkDisabled: {
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 20,
    marginBottom: 16,
  },
  changeEmailButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeEmailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  // Checklist
  checklistContainer: {
    marginBottom: 20,
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  checklistTextMet: {
    color: '#0F172A',
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  // Success Step
  successCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  successCalloutText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 19,
    flex: 1,
  },
  successCalloutBold: {
    fontWeight: '700',
    color: '#064E3B',
  },
});
