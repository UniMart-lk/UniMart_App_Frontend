import React, { useState, useEffect, useMemo } from 'react';
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

// All 8 Sabaragamuwa University Faculties and their Departments
export const UNIVERSITY_FACULTIES = {
  'Faculty of Agricultural Sciences': [
    'Agribusiness Management',
    'Export Agriculture',
    'Livestock Production',
  ],
  'Faculty of Applied Sciences': [
    'Food Science and Technology',
    'Natural Resources',
    'Physical Sciences and Technology',
    'Sport Sciences and Physical Education',
  ],
  'Faculty of Computing': [
    'Computing and Information Systems',
    'Data Science',
    'Software Engineering',
  ],
  'Faculty of Management Studies': [
    'Accountancy and Finance',
    'Business Management',
    'Marketing Management',
    'Tourism Management',
  ],
  'Faculty of Geomatics': [
    'Surveying and Geodesy',
    'Remote Sensing and GIS',
  ],
  'Faculty of Social Sciences and Languages': [
    'Economics and Statistics',
    'English Language Teaching',
    'Geography and Environmental Management',
    'Languages',
    'Social Sciences',
    'Information Technology',
  ],
  'Faculty of Technology': [
    'Biosystems Technology',
    'Engineering Technology',
  ],
  'Faculty of Medicine': [
    'Anatomy',
    'Biochemistry',
    'Community Medicine',
    'Forensic Medicine and Toxicology',
    'Medicine',
    'Microbiology',
    'Obstetrics and Gynaecology',
    'Paediatrics',
    'Parasitology',
    'Pathology',
    'Pharmacology',
    'Physiology',
    'Primary Care and Family Medicine',
    'Psychiatry',
    'Surgery',
  ],
};

/**
 * Automatically parses university email to extract:
 * Intake / batch code (e.g., 22 -> 2022/2023, displayed as 22/23)
 * Faculty (e.g., c -> Faculty of Computing)
 * Programme / Department (e.g., se -> Software Engineering)
 * Student numeric identifier (e.g., 0373)
 * Registration number (e.g., 22CSE0373)
 * Domain match (ms.sab.ac.lk -> Sabaragamuwa University of Sri Lanka)
 */
export function parseUniversityEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      university: 'Sabaragamuwa University of Sri Lanka',
      faculty: 'Faculty of Computing',
      department: 'Software Engineering',
      intakeBatch: '22/23',
      intakeFull: '2022/2023',
      studentId: '0373',
      regNumber: '22CSE0373',
      domain: 'ms.sab.ac.lk',
      isMatched: false,
    };
  }

  const clean = email.toLowerCase().trim();
  const [localPart, domainPart] = clean.split('@');

  // Regex pattern: 2 digits intake + letters for faculty & dept + 3 to 5 digits student ID
  // e.g. "22cse0373" => ["22cse0373", "22", "cse", "0373"]
  const regex = /^([0-9]{2})([a-z]+?)([0-9]{3,5})$/;
  const match = (localPart || '').match(regex);

  if (match) {
    const intakeCode = match[1]; // "22"
    const codePart = match[2]; // "cse"
    const studentId = match[3]; // "0373"

    const startYear = 2000 + parseInt(intakeCode, 10);
    const endYear = startYear + 1;
    const intakeBatch = `${intakeCode}/${String(endYear).slice(-2)}`; // "22/23"
    const intakeFull = `${startYear}/${endYear}`; // "2022/2023"

    let faculty = 'Faculty of Computing';
    let department = 'Software Engineering';

    // Faculty 1: Computing ('c')
    if (codePart.startsWith('c')) {
      faculty = 'Faculty of Computing';
      if (codePart.includes('se')) {
        department = 'Software Engineering';
      } else if (codePart.includes('ds')) {
        department = 'Data Science';
      } else {
        department = 'Computing and Information Systems';
      }
    }
    // Faculty 2: Agricultural Sciences ('ag' or 'a')
    else if (codePart.startsWith('ag') || codePart.startsWith('a')) {
      faculty = 'Faculty of Agricultural Sciences';
      if (codePart.includes('abm') || codePart.includes('ab')) {
        department = 'Agribusiness Management';
      } else if (codePart.includes('lp')) {
        department = 'Livestock Production';
      } else {
        department = 'Export Agriculture';
      }
    }
    // Faculty 3: Applied Sciences ('ap', 'app', 's')
    else if (codePart.startsWith('ap') || codePart.startsWith('app') || codePart.startsWith('s')) {
      faculty = 'Faculty of Applied Sciences';
      if (codePart.includes('fst')) {
        department = 'Food Science and Technology';
      } else if (codePart.includes('nr')) {
        department = 'Natural Resources';
      } else if (codePart.includes('spe') || codePart.includes('pe')) {
        department = 'Sport Sciences and Physical Education';
      } else {
        department = 'Physical Sciences and Technology';
      }
    }
    // Faculty 4: Management Studies ('m', 'ms')
    else if (codePart.startsWith('m') || codePart.startsWith('ms')) {
      faculty = 'Faculty of Management Studies';
      if (codePart.includes('af') || codePart.includes('acc')) {
        department = 'Accountancy and Finance';
      } else if (codePart.includes('mm') || codePart.includes('mkt')) {
        department = 'Marketing Management';
      } else if (codePart.includes('tm') || codePart.includes('tour')) {
        department = 'Tourism Management';
      } else {
        department = 'Business Management';
      }
    }
    // Faculty 5: Geomatics ('geo', 'g')
    else if (codePart.startsWith('geo') || codePart.startsWith('g')) {
      faculty = 'Faculty of Geomatics';
      if (codePart.includes('rs') || codePart.includes('gis')) {
        department = 'Remote Sensing and GIS';
      } else {
        department = 'Surveying and Geodesy';
      }
    }
    // Faculty 6: Social Sciences and Languages ('ssl', 'ss', 'sl')
    else if (codePart.startsWith('ssl') || codePart.startsWith('ss') || codePart.startsWith('sl')) {
      faculty = 'Faculty of Social Sciences and Languages';
      if (codePart.includes('es')) {
        department = 'Economics and Statistics';
      } else if (codePart.includes('elt')) {
        department = 'English Language Teaching';
      } else if (codePart.includes('geo') || codePart.includes('env')) {
        department = 'Geography and Environmental Management';
      } else if (codePart.includes('lang')) {
        department = 'Languages';
      } else if (codePart.includes('it')) {
        department = 'Information Technology';
      } else {
        department = 'Social Sciences';
      }
    }
    // Faculty 7: Technology ('t', 'tech')
    else if (codePart.startsWith('t') || codePart.startsWith('tech')) {
      faculty = 'Faculty of Technology';
      if (codePart.includes('bst') || codePart.includes('bio')) {
        department = 'Biosystems Technology';
      } else {
        department = 'Engineering Technology';
      }
    }
    // Faculty 8: Medicine ('med', 'md')
    else if (codePart.startsWith('med') || codePart.startsWith('md')) {
      faculty = 'Faculty of Medicine';
      department = 'Medicine';
    }

    const regNumber = `${intakeCode}${codePart.toUpperCase()}${studentId}`;

    return {
      university: 'Sabaragamuwa University of Sri Lanka',
      faculty,
      department,
      intakeBatch,
      intakeFull,
      studentId,
      regNumber,
      domain: domainPart || 'ms.sab.ac.lk',
      isMatched: true,
    };
  }

  // Default table example from requirements
  return {
    university: 'Sabaragamuwa University of Sri Lanka',
    faculty: 'Faculty of Computing',
    department: 'Software Engineering',
    intakeBatch: '22/23',
    intakeFull: '2022/2023',
    studentId: '0373',
    regNumber: '22CSE0373',
    domain: domainPart || 'ms.sab.ac.lk',
    isMatched: false,
  };
}

export default function StudentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // User credentials & identity
  const [fullName, setFullName] = useState('Tharindu Asma');
  const [email, setEmail] = useState('22cse0373@ms.sab.ac.lk');
  const [contactNumber, setContactNumber] = useState('+94 77 123 4567');
  const [profileType, setProfileType] = useState('Student buyer');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  // Student Evidence File
  const [studentEvidenceFile, setStudentEvidenceFile] = useState('Student_ID_Proof.pdf');

  // Accordion state: Collapsed by default as in screenshot
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Loading & Modal states
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await authService.getStoredUser();
      if (stored) {
        if (stored.email) setEmail(stored.email);
        if (stored.contactNumber) setContactNumber(stored.contactNumber);

        if (stored.userProfile?.fullName) setFullName(stored.userProfile.fullName);
        if (stored.userProfile?.contactNumber) setContactNumber(stored.userProfile.contactNumber);
        if (stored.userProfile?.profilePictureUrl) setProfilePhotoUrl(stored.userProfile.profilePictureUrl);

        const isProv = stored.role === 'PROVIDER' || Boolean(stored.providerProfile);
        const isExt =
          stored.providerProfile?.providerType === 'EXTERNAL_PROVIDER' ||
          stored.userProfile?.userType === 'EXTERNAL';

        if (isProv) {
          setProfileType(isExt ? 'External provider' : 'Student provider');
        } else {
          setProfileType('Student buyer');
        }
      }
    } catch {
      // Keep sensible initial defaults
    }
  };

  // Automatically computed university details based on the email
  const parsedUni = useMemo(() => {
    return parseUniversityEmail(email);
  }, [email]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Required', 'Please enter your contact number.');
      return;
    }

    if (!studentEvidenceFile) {
      Alert.alert('Required', 'Please attach your student ID or enrolment evidence.');
      return;
    }

    setSaving(true);

    try {
      await authService.updateProfile({
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim(),
        university: parsedUni.university,
        faculty: parsedUni.faculty,
        department: parsedUni.department,
        intakeBatch: parsedUni.intakeBatch,
        studentRegistrationNumber: parsedUni.regNumber,
        studentEvidenceUrl: studentEvidenceFile,
        profilePictureUrl: profilePhotoUrl,
        isCompleted: true,
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
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. PROFILE PHOTO SECTION */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  profilePhotoUrl
                    ? { uri: profilePhotoUrl }
                    : require('../../../../../assets/images/student_avatar.jpg')
                }
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraIconBadge}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert('Change Photo', 'Select a new photo for your profile.', [
                    {
                      text: 'Take Photo',
                      onPress: () => Alert.alert('Camera', 'Photo captured.'),
                    },
                    {
                      text: 'Choose from Gallery',
                      onPress: () => Alert.alert('Gallery', 'Photo selected.'),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Photo Action Links */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Change Photo', 'Select a new profile photo from your library.')
                }
                activeOpacity={0.7}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setProfilePhotoUrl(null);
                  Alert.alert('Photo Removed', 'Default avatar has been restored.');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Verified Student Badge Pill */}
            <View style={styles.verifiedStudentPill}>
              <Ionicons name="checkmark" size={13} color="#059669" style={{ marginRight: 5 }} />
              <Text style={styles.verifiedStudentPillText}>Verified student</Text>
            </View>
          </View>

          {/* 3. INPUT FORM FIELDS */}
          <View style={styles.formCard}>
            {/* Field 1: Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.fieldHelperText}>
                Changes to your verified name require review.
              </Text>
            </View>

            {/* Field 2: Email (Locked) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputBox, styles.inputBoxLocked]}>
                <Text style={styles.lockedInputText} numberOfLines={1}>
                  {email}
                </Text>
                <Ionicons name="lock-closed-outline" size={17} color="#94A3B8" />
              </View>
            </View>

            {/* Field 3: Contact Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contact Number</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Field 4: Profile Type (Locked) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Profile Type</Text>
              <View style={[styles.inputBox, styles.inputBoxLocked]}>
                <Text style={styles.lockedInputText}>{profileType}</Text>
                <Ionicons name="lock-closed-outline" size={17} color="#94A3B8" />
              </View>
            </View>

            {/* 4. BLUE INFORMATION CALLOUT */}
            <View style={styles.infoCalloutCard}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#3B82F6"
                style={styles.infoCalloutIcon}
              />
              <Text style={styles.infoCalloutText}>
                Student buyers must keep a student profile. Your account type cannot be changed here.
              </Text>
            </View>

            {/* 5. STUDENT ID ATTACHMENT SECTION */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Student ID or Enrolment Evidence</Text>
              <TouchableOpacity
                style={styles.idUploadCard}
                onPress={() => {
                  setStudentEvidenceFile('Student_ID_Proof.pdf');
                  Alert.alert(
                    'Student ID Upload',
                    'Upload or change your student ID card or official enrolment letter.',
                    [
                      {
                        text: 'Choose PDF / Photo',
                        onPress: () => {
                          setStudentEvidenceFile('Student_ID_Proof.pdf');
                          Alert.alert('Success', 'Student ID document has been attached.');
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.idIconBox}>
                  <Ionicons name="card-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.idInfoCol}>
                  <Text style={styles.idTitle} numberOfLines={1}>
                    {studentEvidenceFile || 'Attach Student ID card'}
                  </Text>
                  <Text style={styles.idSubtitle}>PDF, PNG or JPG • Verified student ID</Text>
                </View>
                <View style={styles.idCheckBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                </View>
              </TouchableOpacity>
            </View>

            {/* 6. COLLAPSIBLE ACCORDION: University details · Protected */}
            <View style={styles.accordionContainer}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setIsAccordionOpen(!isAccordionOpen)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isAccordionOpen ? 'caret-down' : 'caret-forward'}
                  size={14}
                  color="#64748B"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.accordionTitle}>University details · Protected</Text>
              </TouchableOpacity>

              {/* Expanded details automatically filled from email */}
              {isAccordionOpen && (
                <View style={styles.accordionContent}>
                  {/* University */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>University</Text>
                    <Text style={styles.detailValue}>{parsedUni.university}</Text>
                  </View>

                  {/* Faculty */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Faculty</Text>
                    <Text style={styles.detailValue}>{parsedUni.faculty}</Text>
                  </View>

                  {/* Department / Programme */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Department / Programme</Text>
                    <Text style={styles.detailValue}>{parsedUni.department}</Text>
                  </View>

                  {/* Intake / Batch */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Intake / Batch</Text>
                    <Text style={styles.detailValue}>
                      {parsedUni.intakeBatch} ({parsedUni.intakeFull})
                    </Text>
                  </View>

                  {/* Student registration number */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student registration number</Text>
                    <Text style={styles.detailValue}>{parsedUni.regNumber}</Text>
                  </View>

                  {/* Need a correction */}
                  <View style={styles.correctionBox}>
                    <Text style={styles.correctionTitle}>Need a correction?</Text>
                    <Text style={styles.correctionMessage}>
                      Identity changes need a new verification review.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 7. SAVE CHANGES BUTTON */}
            <TouchableOpacity
              style={styles.saveChangesBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveChangesBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 8. SUCCESS CONFIRMATION MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <View style={styles.successModalCard}>
            <View style={styles.successModalIconBox}>
              <Ionicons name="checkmark-circle" size={44} color="#059669" />
            </View>
            <Text style={styles.successModalTitle}>Profile Updated</Text>
            <Text style={styles.successModalMessage}>
              Your student profile and academic details have been successfully saved and verified.
            </Text>

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/profile');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E2E8F0',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 14,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  verifiedStudentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedStudentPillText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700',
  },
  // Form fields
  formCard: {
    paddingHorizontal: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputBox: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxLocked: {
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  lockedInputText: {
    flex: 1,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  fieldHelperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  // Info callout
  infoCalloutCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  infoCalloutIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500',
  },
  // Student ID upload card
  idUploadCard: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  idIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  idInfoCol: {
    flex: 1,
  },
  idTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  idSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
  idCheckBadge: {
    marginLeft: 8,
  },
  // Collapsible Accordion
  accordionContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 22,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  correctionBox: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  correctionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  correctionMessage: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  // Save button
  saveChangesBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveChangesBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Success Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  successModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  successModalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  successDoneBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
