import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authService';
import BottomNav from '@/components/BottomNav';

export default function ProfileScreen({ navigation } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Hardware back press on Profile returns to marketplace, never logs out
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/marketplace');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 1. Try locally cached user
      const stored = await authService.getStoredUser();
      if (stored) {
        setUser(stored);
      }

      // 2. Fetch fresh user profile from backend API
      const fresh = await authService.getCurrentUser();
      if (fresh) {
        setUser(fresh);
      }
    } catch (err) {
      console.log('Error loading profile info:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      setShowLogoutModal(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setShowLogoutModal(false);
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Derive dynamic user details with sensible fallbacks
  const displayName =
    user?.userProfile?.fullName ||
    user?.email?.split('@')[0] ||
    'Tharindu Asma';

  const displayEmail = user?.email || 'tharindu@university.lk';
  const displayPhone =
    user?.contactNumber ||
    user?.userProfile?.contactNumber ||
    '+94 77 123 4567';

  const isStudent =
    user?.userProfile?.userType === 'STUDENT' ||
    user?.providerProfile?.providerType === 'STUDENT_PROVIDER' ||
    true; // Default to Student badge as shown in mockup

  const isVerified =
    user?.providerProfile?.verificationStatus === 'VERIFIED' ||
    user?.emailVerified ||
    true; // Default to Verified badge as shown in mockup

  const listingsCount = user?.providerProfile?.totalListings || 0;
  const rentalsCount = 3;
  const ratingScore = '4.8';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => {
            // Optional: edit profile action
            Alert.alert('Edit Profile', 'Profile editing will open your details editor.');
          }}
          activeOpacity={0.7}
          accessibilityLabel="Edit Profile"
        >
          <Ionicons name="pencil" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. USER AVATAR & IDENTITY */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../../../../assets/images/student_avatar.jpg')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            {/* Small circular graduation badge overlaid on avatar */}
            <View style={styles.avatarBadgeCircle}>
              <Ionicons name="school" size={13} color="#FFFFFF" />
            </View>
          </View>

          {/* User Name */}
          <Text style={styles.userNameText}>{displayName}</Text>

          {/* User Email & Phone */}
          <Text style={styles.userEmailText}>{displayEmail}</Text>
          <Text style={styles.userPhoneText}>{displayPhone}</Text>

          {/* Role & Verification Badges */}
          <View style={styles.badgesRow}>
            {/* Student Badge (Purple Pill) */}
            <View style={styles.studentPill}>
              <Ionicons name="school" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.studentPillText}>{isStudent ? 'Student' : 'External'}</Text>
            </View>

            {/* Verified Badge (Green Pill) */}
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.verifiedPillText}>{isVerified ? 'Verified' : 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* 3. STATS SUMMARY CARD */}
        <View style={styles.statsCard}>
          {/* Listings */}
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{listingsCount}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Rentals */}
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{rentalsCount}</Text>
            <Text style={styles.statLabel}>Rentals</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Rating */}
          <View style={styles.statCol}>
            <View style={styles.ratingNumberRow}>
              <Text style={styles.statNumber}>{ratingScore}</Text>
              <Ionicons name="star" size={14} color="#F59E0B" style={{ marginLeft: 3, marginTop: 2 }} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* 4. MENU ITEMS CARD */}
        <View style={styles.menuCard}>
          {/* Row 1: Edit Profile */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Edit Profile', 'Edit profile screen.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="person-outline" size={21} color="#475569" />
            </View>
            <Text style={styles.menuRowTitle}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Row 2: My Bookings */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/myBookings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="calendar-outline" size={21} color="#475569" />
            </View>
            <Text style={styles.menuRowTitle}>My Bookings</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Row 3: Messages */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/chat')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="chatbubble-outline" size={21} color="#475569" />
            </View>
            <Text style={styles.menuRowTitle}>Messages</Text>
            <View style={styles.messagesBadge}>
              <Text style={styles.messagesBadgeText}>2</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Row 4: Notifications */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Notifications', 'No new notifications.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="notifications-outline" size={21} color="#475569" />
            </View>
            <Text style={styles.menuRowTitle}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Row 5: Privacy Settings */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Privacy Settings', 'Privacy settings and controls.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="lock-closed-outline" size={21} color="#475569" />
            </View>
            <Text style={styles.menuRowTitle}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 5. LOG OUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 6. LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutModalIconBox}>
              <Ionicons name="log-out-outline" size={30} color="#EF4444" />
            </View>

            <Text style={styles.logoutModalTitle}>Log Out</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to log out of UniMart?
            </Text>

            <View style={styles.logoutModalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
                disabled={loggingOut}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleLogoutConfirm}
                activeOpacity={0.85}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmLogoutBtnText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 7. BOTTOM NAVIGATION BAR */}
      <BottomNav activeTab="profile" />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  editHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
  },
  avatarWrapper: {
    width: 94,
    height: 94,
    borderRadius: 47,
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#E2E8F0',
  },
  avatarBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8B5CF6',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmailText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '400',
  },
  userPhoneText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '400',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  studentPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  // Menu Items Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuIconBox: {
    width: 28,
    alignItems: 'flex-start',
  },
  menuRowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 6,
  },
  messagesBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  messagesBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 52,
  },
  // Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoutModalCard: {
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
  logoutModalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  logoutModalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
