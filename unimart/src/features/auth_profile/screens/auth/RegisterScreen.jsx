import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authService';

export default function RegisterScreen({ navigation } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Step state: 1 = Basic Account Registration, 2 = Provider Verification (only for providers)
  const [step, setStep] = useState(1);

  // User type: 'buyer' ("I want to buy & rent") or 'provider' ("I'm a provider")
  const [userType, setUserType] = useState('buyer');

  // Basic Account Form State
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Provider Type: 'Student Provider' | 'External Provider'
  const [providerType, setProviderType] = useState('Student Provider');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  // Student Provider Verification Form State
  const [studentFullName, setStudentFullName] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');

  // External Provider Verification Form State
  const [externalFullName, setExternalFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessContact, setBusinessContact] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState(''); // NIC or Business Reg
  const [businessAddress, setBusinessAddress] = useState('');

  // UI States
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Navigation handlers
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setErrorMessage('');
      return;
    }

    if (navigation?.goBack) {
      navigation.goBack();
    } else {
      try {
        router.back();
      } catch {
        router.push('/login');
      }
    }
  };

  const handleNavigateToLogin = () => {
    setShowSuccessModal(false);
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

  // Validation for Step 1
  const validateBasicForm = () => {
    const trimmedEmail = email.trim();
    const trimmedContact = contactNumber.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!trimmedContact) {
      setErrorMessage('Please enter your contact number.');
      return false;
    }
    if (trimmedContact.length < 8) {
      setErrorMessage('Please enter a valid contact number.');
      return false;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return false;
    }
    if (!confirmPassword) {
      setErrorMessage('Please confirm your password.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return false;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the account terms and privacy notice.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Validation for Step 2 (Provider Verification)
  const validateVerificationForm = () => {
    if (providerType === 'Student Provider') {
      if (!studentFullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return false;
      }
      if (!universityEmail.trim()) {
        setErrorMessage('Please enter your university email address.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(universityEmail.trim())) {
        setErrorMessage('Please enter a valid university email address.');
        return false;
      }
      if (!studentId.trim()) {
        setErrorMessage('Please enter your Student ID or registration number.');
        return false;
      }
      if (!faculty.trim()) {
        setErrorMessage('Please enter your faculty or department.');
        return false;
      }
    } else {
      // External Provider
      if (!externalFullName.trim()) {
        setErrorMessage('Please enter your full name or representative name.');
        return false;
      }
      if (!businessContact.trim()) {
        setErrorMessage('Please enter your business contact details.');
        return false;
      }
      if (!identificationNumber.trim()) {
        setErrorMessage('Please enter your NIC or Business Registration (BR) number.');
        return false;
      }
      if (!businessAddress.trim()) {
        setErrorMessage('Please enter your business or operating address.');
        return false;
      }
    }

    setErrorMessage('');
    return true;
  };

  // Primary action button handler with Backend API Integration
  const handlePrimaryAction = async () => {
    if (step === 1) {
      if (!validateBasicForm()) return;

      if (userType === 'provider') {
        // Proceed to Step 2: Provider verification form
        setErrorMessage('');
        setStep(2);
      } else {
        // Buyer & renter account creation via backend
        setLoading(true);
        setErrorMessage('');
        try {
          await authService.register({
            email: email.trim(),
            password: password,
            contactNumber: contactNumber.trim(),
            role: 'USER',
          });
          setShowSuccessModal(true);
        } catch (error) {
          setErrorMessage(error.message || 'Registration failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 2) {
      if (!validateVerificationForm()) return;

      setLoading(true);
      setErrorMessage('');

      try {
        const isStudent = providerType === 'Student Provider';
        const verificationData = isStudent
          ? {
              fullName: studentFullName.trim(),
              universityEmail: universityEmail.trim(),
              studentId: studentId.trim(),
              faculty: faculty.trim(),
            }
          : {
              fullName: externalFullName.trim(),
              businessName: businessName.trim(),
              businessContact: businessContact.trim(),
              identificationNumber: identificationNumber.trim(),
              businessAddress: businessAddress.trim(),
            };

        await authService.register({
          email: email.trim(),
          password: password,
          contactNumber: contactNumber.trim(),
          role: 'PROVIDER',
          providerType: providerType,
          verificationData: verificationData,
        });

        setShowSuccessModal(true);
      } catch (error) {
        setErrorMessage(error.message || 'Verification submission failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {step === 1 ? 'Create an account' : 'Provider Verification'}
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
          {/* STEP 1: Basic Account Registration */}
          {step === 1 && (
            <>
              {/* Title and Subtitle */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>A good place{'\n'}to start.</Text>
                <Text style={styles.subtitle}>Join your community on UniMart.</Text>
              </View>

              {/* Segmented Switcher: Buyer vs Provider */}
              <View style={styles.segmentedContainer}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    userType === 'buyer' && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setUserType('buyer');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      userType === 'buyer' && styles.segmentButtonTextActive,
                    ]}
                  >
                    I want to buy & rent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    userType === 'provider' && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setUserType('provider');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      userType === 'provider' && styles.segmentButtonTextActive,
                    ]}
                  >
                    I’m a provider
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Fields */}
              <View style={styles.form}>
                {/* Email address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder=""
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Contact number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contact number</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'contact' && styles.inputFocused]}
                    value={contactNumber}
                    onChangeText={(text) => {
                      setContactNumber(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder=""
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    editable={!loading}
                    onFocus={() => setFocusedField('contact')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.passwordInputContainer, focusedField === 'password' && styles.inputFocused]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder=""
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!loading}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm password</Text>
                  <View style={[styles.passwordInputContainer, focusedField === 'confirmPassword' && styles.inputFocused]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder=""
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!loading}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Provider Type Dropdown (Only for Provider) */}
                {userType === 'provider' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Provider type</Text>
                    <TouchableOpacity
                      style={styles.dropdownSelector}
                      onPress={() => setProviderDropdownOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dropdownSelectorText}>{providerType}</Text>
                      <Ionicons name="chevron-down" size={18} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Terms and Privacy Policy Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                    {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to the account terms and privacy notice.
                  </Text>
                </TouchableOpacity>

                {/* Create Account Primary Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handlePrimaryAction}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {userType === 'provider' ? 'Continue to Verification' : 'Create account'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Bottom Informational Card */}
                <View style={styles.infoCard}>
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#2563EB"
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.infoCardText}>
                    {userType === 'provider'
                      ? 'Verification is required before you can create listings.'
                      : 'You can add your Student or External details later. They are only required when you request a rental.'}
                  </Text>
                </View>

                {/* Sign In Prompt */}
                <View style={styles.signinPrompt}>
                  <Text style={styles.signinPromptText}>Already have an account? </Text>
                  <TouchableOpacity onPress={handleNavigateToLogin} activeOpacity={0.7} disabled={loading}>
                    <Text style={styles.signinPromptLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* STEP 2: Provider Verification Form */}
          {step === 2 && (
            <>
              {/* Step indicator header */}
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
                </View>
                <Text style={styles.stepTitle}>
                  {providerType === 'Student Provider' ? 'Student Verification' : 'External Verification'}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {providerType === 'Student Provider'
                    ? 'Verify your academic status to offer student services and rentals on campus.'
                    : 'Provide your verified business information to start offering services.'}
                </Text>
              </View>

              {/* Provider Type Switch Banner */}
              <View style={styles.providerTypeBanner}>
                <View style={styles.providerTypeBannerLeft}>
                  <Ionicons
                    name={providerType === 'Student Provider' ? 'school-outline' : 'briefcase-outline'}
                    size={20}
                    color="#2563EB"
                  />
                  <Text style={styles.providerTypeBannerText}>{providerType}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setProviderDropdownOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.providerTypeChangeText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Content Based on Provider Type */}
              <View style={styles.form}>
                {providerType === 'Student Provider' ? (
                  <>
                    {/* Student Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full name</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'sName' && styles.inputFocused]}
                        value={studentFullName}
                        onChangeText={(t) => {
                          setStudentFullName(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. Kasun Perera"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('sName')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* University Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>University email</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'uEmail' && styles.inputFocused]}
                        value={universityEmail}
                        onChangeText={(t) => {
                          setUniversityEmail(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. kasun@campus.ac.lk"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                        onFocus={() => setFocusedField('uEmail')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* Student ID / Registration Number */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Student ID / Registration number</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'sId' && styles.inputFocused]}
                        value={studentId}
                        onChangeText={(t) => {
                          setStudentId(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. SC/2022/10425"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        editable={!loading}
                        onFocus={() => setFocusedField('sId')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* Faculty / Department */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Faculty or Department</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'faculty' && styles.inputFocused]}
                        value={faculty}
                        onChangeText={(t) => {
                          setFaculty(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. Faculty of Science / Computing"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('faculty')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* External Provider: Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full name or Contact person</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'extName' && styles.inputFocused]}
                        value={externalFullName}
                        onChangeText={(t) => {
                          setExternalFullName(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. Nuwan Silva"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('extName')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* Business Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Business / Store name</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'bizName' && styles.inputFocused]}
                        value={businessName}
                        onChangeText={(t) => {
                          setBusinessName(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. Campus Tech Rentals"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('bizName')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* Business Contact Details */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Contact details (Business phone / email)</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'bizContact' && styles.inputFocused]}
                        value={businessContact}
                        onChangeText={(t) => {
                          setBusinessContact(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. 077 123 4567 or contact@store.com"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('bizContact')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* National ID / Business Registration */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>National ID (NIC) / BR Number</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'idNum' && styles.inputFocused]}
                        value={identificationNumber}
                        onChangeText={(t) => {
                          setIdentificationNumber(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. 199824501234 or PV-12345"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        editable={!loading}
                        onFocus={() => setFocusedField('idNum')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>

                    {/* Business Address */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Operating / Business address</Text>
                      <TextInput
                        style={[styles.input, focusedField === 'bizAddr' && styles.inputFocused]}
                        value={businessAddress}
                        onChangeText={(t) => {
                          setBusinessAddress(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. No. 12, Station Road, Colombo"
                        placeholderTextColor="#94A3B8"
                        editable={!loading}
                        onFocus={() => setFocusedField('bizAddr')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </>
                )}

                {/* Information Notice */}
                <View style={styles.infoCard}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color="#2563EB"
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.infoCardText}>
                    Your verification information will be safely encrypted and checked to maintain a secure, trusted campus marketplace.
                  </Text>
                </View>

                {/* Submit Verification Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handlePrimaryAction}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Complete Registration</Text>
                  )}
                </TouchableOpacity>

                {/* Back to Step 1 Button */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setStep(1);
                    setErrorMessage('');
                  }}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>← Edit basic details</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Provider Type Selection Modal */}
      <Modal
        visible={providerDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProviderDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProviderDropdownOpen(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Provider Type</Text>
              <TouchableOpacity onPress={() => setProviderDropdownOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.modalOption,
                providerType === 'Student Provider' && styles.modalOptionActive,
              ]}
              onPress={() => {
                setProviderType('Student Provider');
                setProviderDropdownOpen(false);
              }}
            >
              <View style={styles.modalOptionIconCircle}>
                <Ionicons name="school" size={20} color="#2563EB" />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={styles.modalOptionTitle}>Student Provider</Text>
                <Text style={styles.modalOptionDesc}>
                  Enrolled university student offering gear, peer tutoring, or campus rentals.
                </Text>
              </View>
              {providerType === 'Student Provider' && (
                <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                providerType === 'External Provider' && styles.modalOptionActive,
              ]}
              onPress={() => {
                setProviderType('External Provider');
                setProviderDropdownOpen(false);
              }}
            >
              <View style={styles.modalOptionIconCircle}>
                <Ionicons name="business" size={20} color="#2563EB" />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={styles.modalOptionTitle}>External Provider</Text>
                <Text style={styles.modalOptionDesc}>
                  Commercial vendor, local business, or individual service provider.
                </Text>
              </View>
              {providerType === 'External Provider' && (
                <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>Account Created!</Text>
            <Text style={styles.successMessage}>
              {userType === 'provider'
                ? 'Your provider registration and verification details have been submitted successfully. You can now sign in.'
                : 'Welcome to UniMart! Your account has been registered successfully.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNavigateToLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Sign In Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '400',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  segmentButtonTextActive: {
    color: '#2563EB',
    fontWeight: '700',
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
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
  dropdownSelector: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectorText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginLeft: 10,
  },
  signinPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  signinPromptText: {
    fontSize: 14,
    color: '#64748B',
  },
  signinPromptLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  // Step 2 specific styles
  stepHeader: {
    marginBottom: 20,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 20,
  },
  providerTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  providerTypeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerTypeBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  providerTypeChangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  modalOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  // Success card
  successCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});
