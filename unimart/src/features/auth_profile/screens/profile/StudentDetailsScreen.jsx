import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authService';

const SRI_LANKAN_UNIVERSITIES = [
  'Sabaragamuwa University of Sri Lanka',
  'University of Colombo',
  'University of Peradeniya',
  'University of Moratuwa',
  'University of Sri Jayewardenepura',
  'University of Kelaniya',
  'University of Ruhuna',
  'Rajarata University of Sri Lanka',
  'Wayamba University of Sri Lanka',
  'South Eastern University of Sri Lanka',
  'Eastern University, Sri Lanka',
  'Uva Wellassa University',
  'University of Jaffna',
];

const FACULTIES = [
  'Faculty of Computing',
  'Faculty of Applied Sciences',
  'Faculty of Technology',
  'Faculty of Management Studies',
  'Faculty of Social Sciences & Languages',
  'Faculty of Agricultural Sciences',
  'Faculty of Geomatics',
  'Faculty of Medicine',
  'Faculty of Engineering',
  'Faculty of Science',
  'Faculty of Arts',
];

export default function StudentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // User type mode: 'STUDENT_BUYER', 'STUDENT_PROVIDER', or 'EXTERNAL_PROVIDER'
  const [activeUserType, setActiveUserType] = useState('STUDENT_BUYER');

  // Banner visibility state
  const [showBanner, setShowBanner] = useState(true);

  // Registered credentials (read-only, reused without asking again)
  const [registeredEmail, setRegisteredEmail] = useState('22cse0589@ms.sab.ac.lk');
  const [registeredContact, setRegisteredContact] = useState('+94 77 123 4567');

  // Form Fields
  const [fullName, setFullName] = useState('Tharindu Asma');
  const [dob, setDob] = useState('2001-05-12');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  // Student specific fields
  const [university, setUniversity] = useState('Sabaragamuwa University of Sri Lanka');
  const [studentRegNumber, setStudentRegNumber] = useState('22/COM/0589');
  const [studentEvidenceFile, setStudentEvidenceFile] = useState('Student_ID_Proof.pdf');
  const [faculty, setFaculty] = useState('Faculty of Computing');

  // External Provider specific fields
  const [nicNumber, setNicNumber] = useState('200113304567');
  const [identityEvidenceFile, setIdentityEvidenceFile] = useState('NIC_Front_Back_Proof.pdf');

  // Provider common fields (Student Provider & External Provider)
  const [providerDisplayName, setProviderDisplayName] = useState('Tharindu Campus Services');
  const [serviceArea, setServiceArea] = useState('Sabaragamuwa University Main Campus');
  const [providerDescription, setProviderDescription] = useState('Providing electronics, textbooks, and campus mobility rentals.');
  const [businessName, setBusinessName] = useState('');

  // Input focus tracking
  const [focusedField, setFocusedField] = useState(null);

  // Selection Modals
  const [showUniModal, setShowUniModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadExistingUserData();
  }, []);

  const loadExistingUserData = async () => {
    try {
      const stored = await authService.getStoredUser();
      if (stored) {
        // Reused credentials
        if (stored.email) setRegisteredEmail(stored.email);
        if (stored.contactNumber) setRegisteredContact(stored.contactNumber);

        // Detect user type
        const isProv = stored.role === 'PROVIDER' || Boolean(stored.providerProfile);
        const isExt =
          stored.providerProfile?.providerType === 'EXTERNAL_PROVIDER' ||
          stored.userProfile?.userType === 'EXTERNAL';

        if (isProv) {
          setActiveUserType(isExt ? 'EXTERNAL_PROVIDER' : 'STUDENT_PROVIDER');
        } else {
          setActiveUserType('STUDENT_BUYER');
        }

        // Pre-fill profile info if exists
        if (stored.userProfile?.fullName) setFullName(stored.userProfile.fullName);
        if (stored.userProfile?.university) setUniversity(stored.userProfile.university);
        if (stored.userProfile?.faculty) setFaculty(stored.userProfile.faculty);
        if (stored.userProfile?.universityIdNumber) setStudentRegNumber(stored.userProfile.universityIdNumber);
        if (stored.userProfile?.nicNumber) setNicNumber(stored.userProfile.nicNumber);
        if (stored.userProfile?.profilePictureUrl) setProfilePhotoUrl(stored.userProfile.profilePictureUrl);

        if (stored.providerProfile?.displayName) setProviderDisplayName(stored.providerProfile.displayName);
        if (stored.providerProfile?.description) setProviderDescription(stored.providerProfile.description);
      }
    } catch {
      // Keep sensible initial defaults
    }
  };

  const isStudentBuyer = activeUserType === 'STUDENT_BUYER';
  const isStudentProvider = activeUserType === 'STUDENT_PROVIDER';
  const isExternalProvider = activeUserType === 'EXTERNAL_PROVIDER';

  const handleSave = async () => {
    // 1. Validate Full Name (Required for all 3)
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    // 2. Validate Student fields (Required for Student buyer & Student provider)
    if (isStudentBuyer || isStudentProvider) {
      if (!university.trim()) {
        Alert.alert('Required', 'Please select your university.');
        return;
      }
      if (!studentRegNumber.trim()) {
        Alert.alert('Required', 'Please enter your student registration number.');
        return;
      }
      if (!studentEvidenceFile) {
        Alert.alert('Required', 'Please attach your student ID or enrolment evidence.');
        return;
      }
    }

    // 3. Validate External Provider fields
    if (isExternalProvider) {
      if (!nicNumber.trim()) {
        Alert.alert('Required', 'Please enter your NIC number.');
        return;
      }
      if (!identityEvidenceFile) {
        Alert.alert('Required', 'Please attach your identity evidence (NIC/Passport).');
        return;
      }
    }

    // 4. Validate Provider fields (Student provider & External provider)
    if (isStudentProvider || isExternalProvider) {
      if (!providerDisplayName.trim()) {
        Alert.alert('Required', 'Please enter your provider display name.');
        return;
      }
      if (!serviceArea.trim()) {
        Alert.alert('Required', 'Please specify your service or pickup area.');
        return;
      }
    }

    setSaving(true);

    try {
      // Update profile locally and on backend
      await authService.updateProfile({
        fullName: fullName.trim(),
        university: !isExternalProvider ? university.trim() : null,
        faculty: !isExternalProvider && faculty ? faculty.trim() : null,
        studentRegistrationNumber: !isExternalProvider ? studentRegNumber.trim() : null,
        studentEvidenceUrl: !isExternalProvider ? studentEvidenceFile : null,
        nicNumber: isExternalProvider ? nicNumber.trim() : null,
        identityEvidenceUrl: isExternalProvider ? identityEvidenceFile : null,
        providerDisplayName: !isStudentBuyer ? providerDisplayName.trim() : null,
        serviceArea: !isStudentBuyer ? serviceArea.trim() : null,
        description: !isStudentBuyer ? providerDescription.trim() : null,
        businessName: !isStudentBuyer && businessName ? businessName.trim() : null,
        profilePictureUrl: profilePhotoUrl,
        isProvider: !isStudentBuyer,
        providerType: isExternalProvider ? 'EXTERNAL_PROVIDER' : 'STUDENT_PROVIDER',
      });

      setSaving(false);
      setShowSuccessModal(true);
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', error.message || 'Failed to update profile details.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isStudentBuyer
            ? 'Student Details'
            : isStudentProvider
            ? 'Student Provider Details'
            : 'External Provider Details'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. BLUE INFO BANNER */}
          {showBanner && (
            <View style={styles.infoBanner}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="information-circle" size={22} color="#2563EB" />
              </View>

              <Text style={styles.infoBannerText}>
                {isStudentBuyer
                  ? 'Complete these details to enable rental and purchase requests.'
                  : 'Complete these details to enable selling and renting items.'}
              </Text>

              <TouchableOpacity
                style={styles.closeBannerBtn}
                onPress={() => setShowBanner(false)}
                activeOpacity={0.7}
                accessibilityLabel="Close notice"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. ROLE BADGE PILL */}
          <View style={styles.badgeWrapper}>
            {isStudentBuyer && (
              <View style={styles.studentBadge}>
                <Ionicons name="school" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.studentBadgeText}>Student</Text>
              </View>
            )}

            {isStudentProvider && (
              <View style={styles.studentProviderBadge}>
                <Ionicons name="school" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.studentBadgeText}>Student Provider</Text>
              </View>
            )}

            {isExternalProvider && (
              <View style={styles.externalProviderBadge}>
                <Ionicons name="business" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.studentBadgeText}>External Provider</Text>
              </View>
            )}
          </View>

          {/* 4. REUSED REGISTERED CREDENTIALS (READ-ONLY) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeading}>Registered Account Information</Text>
            </View>
            <Text style={styles.sectionSubtext}>
              Reused from your registered account. You do not need to enter them again.
            </Text>

            {/* Reused Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {isExternalProvider ? 'Email Address' : 'University Email'}
              </Text>
              <View style={[styles.inputBox, styles.inputBoxReadOnly]}>
                <Ionicons name="mail" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {registeredEmail}
                </Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="lock-closed" size={11} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedTagText}>Registered</Text>
                </View>
              </View>
            </View>

            {/* Reused Contact Number */}
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Contact Number</Text>
              <View style={[styles.inputBox, styles.inputBoxReadOnly]}>
                <Ionicons name="call" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {registeredContact}
                </Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="lock-closed" size={11} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedTagText}>Registered</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 5. PROFILE PHOTO (OPTIONAL FOR ALL) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Profile Photo (Optional)</Text>
            <View style={styles.photoRow}>
              <View style={styles.photoAvatarWrapper}>
                <Image
                  source={require('../../../../../assets/images/student_avatar.jpg')}
                  style={styles.photoAvatar}
                  resizeMode="cover"
                />
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoLabel}>Display Picture</Text>
                <Text style={styles.photoHint}>Optional. Helps other users identify you safely.</Text>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={() => Alert.alert('Profile Photo', 'Photo selected from library.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changePhotoBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 6. PRIMARY IDENTITY DETAILS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Personal Details</Text>

            {/* Full Name (Required) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'fullName' && styles.inputBoxFocused,
                ]}
              >
                <Ionicons name="person" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedField === 'dob' && styles.inputBoxFocused,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputLeadingIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numbers-and-punctuation"
                  onFocus={() => setFocusedField('dob')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>

          {/* 7. ACADEMIC VERIFICATION (Student Buyer & Student Provider) */}
          {!isExternalProvider && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Academic Details</Text>

              {/* University (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  University <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowUniModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="school" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <Text
                    style={[
                      styles.selectorText,
                      !university && styles.selectorPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {university || 'Select University'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#64748B" style={styles.inputTrailingIcon} />
                </TouchableOpacity>
              </View>

              {/* Student Registration Number (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Student Registration Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'studentReg' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons name="card-outline" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={studentRegNumber}
                    onChangeText={setStudentRegNumber}
                    placeholder="e.g. 22/COM/0589 or S/18/123"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    onFocus={() => setFocusedField('studentReg')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Current Student ID or Enrolment Evidence (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Current Student ID or Enrolment Evidence <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={() => {
                    setStudentEvidenceFile('Student_ID_Proof.pdf');
                    Alert.alert('Evidence Uploaded', 'Student ID document has been attached.');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#2563EB" />
                  </View>
                  <View style={styles.uploadTextContainer}>
                    <Text style={styles.uploadCardTitle}>
                      {studentEvidenceFile || 'Upload Student ID / Enrolment Letter'}
                    </Text>
                    <Text style={styles.uploadCardSubtitle}>
                      {studentEvidenceFile
                        ? 'Attachment ready for review (Tap to replace)'
                        : 'PDF or image format, max 5MB'}
                    </Text>
                  </View>
                  {studentEvidenceFile && (
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Faculty / Department (Optional) */}
              <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                <Text style={styles.fieldLabel}>Faculty / Department (Optional)</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowFacultyModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="business" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <Text
                    style={[
                      styles.selectorText,
                      !faculty && styles.selectorPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {faculty || 'Select Faculty'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#64748B" style={styles.inputTrailingIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 8. EXTERNAL IDENTITY VERIFICATION (External Provider Only) */}
          {isExternalProvider && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Identity Verification</Text>

              {/* NIC Number (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  NIC Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'nic' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons name="id-card-outline" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={nicNumber}
                    onChangeText={setNicNumber}
                    placeholder="e.g. 200113304567 or 981234567V"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    onFocus={() => setFocusedField('nic')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Identity Evidence (Required) */}
              <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                <Text style={styles.fieldLabel}>
                  NIC Number & Identity Evidence <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={() => {
                    setIdentityEvidenceFile('NIC_Front_Back_Proof.pdf');
                    Alert.alert('Identity Evidence', 'NIC front & back scan attached.');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#0D9488" />
                  </View>
                  <View style={styles.uploadTextContainer}>
                    <Text style={styles.uploadCardTitle}>
                      {identityEvidenceFile || 'Upload NIC Front & Back / Passport'}
                    </Text>
                    <Text style={styles.uploadCardSubtitle}>
                      {identityEvidenceFile
                        ? 'Evidence attached for manual review (Tap to replace)'
                        : 'Required for proposed manual identity review'}
                    </Text>
                  </View>
                  {identityEvidenceFile && (
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 9. PROVIDER DETAILS (Student Provider & External Provider) */}
          {(isStudentProvider || isExternalProvider) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Provider & Business Details</Text>

              {/* Provider Display Name (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Provider Display Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'providerName' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons name="storefront-outline" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={providerDisplayName}
                    onChangeText={setProviderDisplayName}
                    placeholder="e.g. Apex Tech or Amaya's Shop"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setFocusedField('providerName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Service / Pickup Area (Required) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Service / Pickup Area <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'serviceArea' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons name="location-outline" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={serviceArea}
                    onChangeText={setServiceArea}
                    placeholder="e.g. Belihuloya Campus & Surrounding Area"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setFocusedField('serviceArea')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Short Provider Description (Optional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Short Provider Description (Optional)</Text>
                <View
                  style={[
                    styles.textAreaBox,
                    focusedField === 'desc' && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textAreaInput}
                    value={providerDescription}
                    onChangeText={setProviderDescription}
                    placeholder="Briefly describe your equipment, services or rental terms..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    onFocus={() => setFocusedField('desc')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Business Name (If applicable) */}
              <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                <Text style={styles.fieldLabel}>Business Name (If applicable)</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'bizName' && styles.inputBoxFocused,
                  ]}
                >
                  <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputLeadingIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Registered business name (optional)"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setFocusedField('bizName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 10. SAVE ACTION BUTTON */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Save & Complete Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 11. UNIVERSITY SELECTION MODAL */}
      <Modal
        visible={showUniModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUniModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUniModal(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select University</Text>
              <TouchableOpacity onPress={() => setShowUniModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {SRI_LANKAN_UNIVERSITIES.map((item, index) => {
                const isSelected = university === item;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionRowActive,
                    ]}
                    onPress={() => {
                      setUniversity(item);
                      setShowUniModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 12. FACULTY SELECTION MODAL */}
      <Modal
        visible={showFacultyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFacultyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFacultyModal(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Faculty</Text>
              <TouchableOpacity onPress={() => setShowFacultyModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {FACULTIES.map((item, index) => {
                const isSelected = faculty === item;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionRowActive,
                    ]}
                    onPress={() => {
                      setFaculty(item);
                      setShowFacultyModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 13. SUCCESS CONFIRMATION MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Profile Completed!</Text>
            <Text style={styles.successMessage}>
              Your details have been saved successfully and your verification badge is now active.
            </Text>
            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneBtnText}>Done</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Blue Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoIconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E3A8A',
    lineHeight: 18,
  },
  closeBannerBtn: {
    padding: 4,
    marginLeft: 6,
  },
  // Role Badges
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  studentProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  externalProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  studentBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  // Profile Photo Row
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  photoAvatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  photoAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563EB',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoInfo: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  photoHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  changePhotoBtn: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  // Form Field Groups
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
  },
  inputBoxReadOnly: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  inputBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FAFCFF',
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  inputTrailingIcon: {
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
  },
  textAreaBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  textAreaInput: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: '#94A3B8',
  },
  // Upload Card
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  uploadCardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
  // Save Button
  saveButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    borderRadius: 8,
  },
  modalOptionRowActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  modalOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  // Success Modal
  successModalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  successIconCircle: {
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successDoneBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
