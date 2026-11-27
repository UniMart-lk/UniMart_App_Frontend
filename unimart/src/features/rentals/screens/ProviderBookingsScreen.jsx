import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '@/components/BottomNav';
import { useChat } from '@/features/chat/ChatContext';
import bookingService from '@/services/bookingService';

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
};

const FILTER_TABS = ['All', 'Pending', 'Active', 'Completed', 'Rejected'];

const REJECTION_REASONS = [
  'Item is currently booked or unavailable for those dates',
  'Vehicle / equipment is undergoing maintenance',
  'Pickup schedule does not match availability',
  'Renter verification details incomplete',
  'Other',
];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80';
const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80';

function formatDateTimeShort(isoValue) {
  if (!isoValue) return 'Not scheduled';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeProviderBooking(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const listing = raw.rentalListing || raw.listing || {};
  const renterObj = raw.renter || raw.student || raw.user || {};
  const renterProfile = renterObj.userProfile || {};

  const start = new Date(raw.startDate);
  const end = new Date(raw.endDate);
  const validDates = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());

  const diffDays = validDates
    ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalPrice = Number(raw.totalPrice || listing.rentalPrice || 0);
  const securityDeposit =
    raw.securityDeposit !== undefined && raw.securityDeposit !== null
      ? Number(raw.securityDeposit)
      : Math.max(1500, Math.round(totalPrice * 0.25));

  const renterName =
    renterProfile.fullName ||
    renterObj.fullName ||
    renterObj.displayName ||
    renterObj.name ||
    'Campus Student';

  return {
    id: String(raw.id),
    rentalListingId: listing.id ?? raw.rentalListingId ?? null,
    bookingNumber: raw.bookingNumber || `UB-${raw.id}`,
    status: String(raw.status || 'PENDING').toUpperCase(),
    title: listing.title || raw.title || 'Rental Listing',
    category: listing.itemType || raw.category || 'Rental',
    vehicleType: listing.vehicleDetail?.vehicleType || raw.vehicleType || null,
    image: listing.primaryImageUrl || listing.images?.[0] || raw.image || FALLBACK_IMAGE,
    pickupLocation:
      listing.pickupLocationName ||
      listing.vehicleDetail?.pickupLocationName ||
      raw.pickupLocation ||
      'Campus Pickup Point',
    startDate: raw.startDate || null,
    endDate: raw.endDate || null,
    formattedStart: formatDateTimeShort(raw.startDate),
    formattedEnd: formatDateTimeShort(raw.endDate),
    duration: `${diffDays} Day${diffDays > 1 ? 's' : ''}`,
    pricePerDay: Number(listing.rentalPrice || totalPrice || 0),
    totalPrice,
    securityDeposit,
    rejectionReason: raw.rejectionReason || null,
    cancellationReason: raw.cancellationReason || null,
    userDetailsPdfUrl: raw.userDetailsPdfUrl || null,
    renter: {
      name: renterName,
      email: renterObj.email || '',
      phone: renterObj.contactNumber || renterProfile.contactNumber || '',
      regNumber: renterProfile.registrationNumber || renterProfile.regNumber || '',
      avatar: renterObj.avatar || renterProfile.avatarUrl || FALLBACK_AVATAR,
    },
  };
}

function getStatusMeta(status) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending Approval',
        icon: 'time',
        bg: COLORS.warningBg,
        text: COLORS.warning,
        border: COLORS.warningBorder,
      };
    case 'ACCEPTED':
      return {
        label: 'Accepted / Active',
        icon: 'checkmark-circle',
        bg: COLORS.successBg,
        text: COLORS.success,
        border: COLORS.successBorder,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        icon: 'checkmark-done-circle',
        bg: COLORS.primaryLight,
        text: COLORS.primary,
        border: '#BFDBFE',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        icon: 'close-circle',
        bg: COLORS.dangerBg,
        text: COLORS.danger,
        border: COLORS.dangerBorder,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled by Student',
        icon: 'ban-outline',
        bg: '#F1F5F9',
        text: COLORS.textSecondary,
        border: COLORS.border,
      };
    default:
      return {
        label: status,
        icon: 'information-circle',
        bg: '#F1F5F9',
        text: COLORS.textSecondary,
        border: COLORS.border,
      };
  }
}

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const { createOrGetConversation } = useChat();

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Action states
  const [actionBookingId, setActionBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  const isLoadingMoreRef = useRef(false);

  const fetchBookings = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const response = await bookingService.getProviderBookings({ limit: 20 });
      const rawList = Array.isArray(response?.data?.bookings)
        ? response.data.bookings
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalized = rawList.map(normalizeProviderBooking).filter(Boolean);
      setBookings(normalized);
      setNextCursor(response?.data?.nextCursor ?? null);
    } catch (error) {
      console.warn('Failed to fetch provider bookings:', error?.message);
      setLoadError(error?.message || 'Could not load incoming rental bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMoreBookings = useCallback(async () => {
    if (loading || refreshing || isLoadingMoreRef.current || nextCursor === null) {
      return;
    }

    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await bookingService.getProviderBookings({
        limit: 20,
        cursor: nextCursor,
      });
      const rawList = Array.isArray(response?.data?.bookings) ? response.data.bookings : [];
      const normalized = rawList.map(normalizeProviderBooking).filter(Boolean);

      setBookings((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const additions = normalized.filter((item) => !seen.has(item.id));
        return [...prev, ...additions];
      });
      setNextCursor(response?.data?.nextCursor ?? null);
    } catch (error) {
      console.warn('Failed to load more provider bookings:', error?.message);
    } finally {
      isLoadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, refreshing, nextCursor]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const statusCounts = useMemo(() => {
    let pending = 0;
    let active = 0;
    let completed = 0;
    let rejected = 0;

    bookings.forEach((b) => {
      if (b.status === 'PENDING') pending += 1;
      else if (b.status === 'ACCEPTED') active += 1;
      else if (b.status === 'COMPLETED') completed += 1;
      else if (b.status === 'REJECTED' || b.status === 'CANCELLED') rejected += 1;
    });

    return {
      All: bookings.length,
      Pending: pending,
      Active: active,
      Completed: completed,
      Rejected: rejected,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      if (activeTab === 'Pending' && item.status !== 'PENDING') return false;
      if (activeTab === 'Active' && item.status !== 'ACCEPTED') return false;
      if (activeTab === 'Completed' && item.status !== 'COMPLETED') return false;
      if (
        activeTab === 'Rejected' &&
        item.status !== 'REJECTED' &&
        item.status !== 'CANCELLED'
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.bookingNumber.toLowerCase().includes(q) ||
          item.renter.name.toLowerCase().includes(q) ||
          item.renter.email.toLowerCase().includes(q) ||
          item.renter.regNumber.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  const applyStatusUpdateLocally = (bookingId, nextStatus, extra = {}) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId ? { ...item, status: nextStatus, ...extra } : item
      )
    );
    setSelectedBooking((prev) =>
      prev && prev.id === bookingId ? { ...prev, status: nextStatus, ...extra } : prev
    );
  };

  const handleAcceptBooking = (booking) => {
    if (!booking || actionBookingId) return;

    Alert.alert(
      'Accept Booking Request',
      `Accept booking #${booking.bookingNumber} from ${booking.renter.name} for "${booking.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionBookingId(booking.id);
            try {
              await bookingService.acceptBooking(booking.id);
              applyStatusUpdateLocally(booking.id, 'ACCEPTED');
              Alert.alert(
                'Booking Accepted',
                `Booking #${booking.bookingNumber} is now active. The student has been notified.`
              );
            } catch (error) {
              Alert.alert(
                'Accept Failed',
                error?.message || 'Could not accept booking. Please try again.'
              );
            } finally {
              setActionBookingId(null);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (booking) => {
    setSelectedRejectReason(REJECTION_REASONS[0]);
    setCustomRejectNote('');
    setRejectModalBooking(booking);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalBooking || actionBookingId) return;

    const finalReason =
      selectedRejectReason === 'Other'
        ? customRejectNote.trim() || 'Declined by provider'
        : selectedRejectReason;

    const target = rejectModalBooking;
    setActionBookingId(target.id);

    try {
      await bookingService.rejectBooking(target.id, finalReason);
      applyStatusUpdateLocally(target.id, 'REJECTED', { rejectionReason: finalReason });
      setRejectModalBooking(null);
      Alert.alert(
        'Booking Rejected',
        `Booking #${target.bookingNumber} has been declined and the time slot has been released.`
      );
    } catch (error) {
      Alert.alert(
        'Reject Failed',
        error?.message || 'Could not reject booking. Please try again.'
      );
    } finally {
      setActionBookingId(null);
    }
  };

  const handleCompleteBooking = (booking) => {
    if (!booking || actionBookingId) return;

    Alert.alert(
      'Mark Rental Completed',
      `Confirm that "${booking.title}" has been returned by ${booking.renter.name} and any security deposit is settled?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            setActionBookingId(booking.id);
            try {
              await bookingService.completeBooking(booking.id);
              applyStatusUpdateLocally(booking.id, 'COMPLETED');
              Alert.alert(
                'Rental Completed',
                `Booking #${booking.bookingNumber} has been marked as completed.`
              );
            } catch (error) {
              Alert.alert(
                'Update Failed',
                error?.message || 'Could not mark booking as completed. Please try again.'
              );
            } finally {
              setActionBookingId(null);
            }
          },
        },
      ]
    );
  };

  const handleChatWithRenter = (booking) => {
    if (!booking) return;
    if (selectedBooking) setSelectedBooking(null);

    const convId = createOrGetConversation({
      name: booking.renter.name,
      role: 'seller',
      badge: 'Student Renter',
      isVerified: true,
      avatar: booking.renter.avatar,
      item: {
        id: booking.rentalListingId || booking.id,
        title: booking.title,
        price: `LKR ${booking.totalPrice.toLocaleString()}`,
        category: 'Rental',
        image: booking.image,
        location: booking.pickupLocation,
      },
    });
    router.push({ pathname: '/chat/[id]', params: { id: convId } });
  };

  const handleCallRenter = async (phone) => {
    if (!phone) {
      Alert.alert('Phone Unavailable', 'This student has not provided a contact number.');
      return;
    }
    const telUrl = `tel:${phone.replace(/\s+/g, '')}`;
    try {
      await Linking.openURL(telUrl);
    } catch {
      Alert.alert('Call Unavailable', `Could not open dialer for ${phone}.`);
    }
  };

  const handleOpenPdf = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Document Unavailable', 'Could not open the student verification document.');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const renderBookingCard = ({ item }) => {
    const statusMeta = getStatusMeta(item.status);
    const isBusy = actionBookingId === item.id;

    return (
      <View style={styles.bookingCard}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.bookingIdBadge}>
            <Ionicons name="receipt-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.bookingIdText}>#{item.bookingNumber}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
            ]}
          >
            <Ionicons name={statusMeta.icon} size={13} color={statusMeta.text} />
            <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.renterRow}>
              <Ionicons name="person-circle-outline" size={15} color={COLORS.primary} />
              <Text style={styles.renterName} numberOfLines={1}>
                {item.renter.name}
                {item.renter.regNumber ? ` (${item.renter.regNumber})` : ''}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.formattedStart}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                Return: {item.formattedEnd} ({item.duration})
              </Text>
            </View>
          </View>
        </View>

        {/* Rejection / Cancellation Note */}
        {(item.rejectionReason || item.cancellationReason) && (
          <View style={styles.reasonBanner}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.reasonBannerText} numberOfLines={2}>
              Reason: {item.rejectionReason || item.cancellationReason}
            </Text>
          </View>
        )}

        {/* Footer Price + Quick Actions */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Booking Total</Text>
            <Text style={styles.priceValue}>LKR {item.totalPrice.toLocaleString()}</Text>
          </View>

          <View style={styles.utilityRow}>
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => handleChatWithRenter(item)}
              accessibilityLabel={`Chat with ${item.renter.name}`}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => handleCallRenter(item.renter.phone)}
              accessibilityLabel={`Call ${item.renter.name}`}
            >
              <Ionicons name="call-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => setSelectedBooking(item)}
            >
              <Text style={styles.detailsBtnText}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* State Transition Action Buttons */}
        {item.status === 'PENDING' && (
          <View style={styles.decisionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, isBusy && styles.actionBtnDisabled]}
              onPress={() => openRejectModal(item)}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptBtn, isBusy && styles.actionBtnDisabled]}
              onPress={() => handleAcceptBooking(item)}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accept Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'ACCEPTED' && (
          <View style={styles.decisionRow}>
            <TouchableOpacity
              style={[styles.completeBtn, isBusy && styles.actionBtnDisabled]}
              onPress={() => handleCompleteBooking(item)}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark as Completed</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Incoming Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage rental requests for your listings</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setShowSearchBar((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel="Toggle search"
        >
          <Ionicons name={showSearchBar ? 'close' : 'search-outline'} size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.warningBg }]}>
          <Text style={[styles.summaryCount, { color: COLORS.warning }]}>{statusCounts.Pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.successBg }]}>
          <Text style={[styles.summaryCount, { color: COLORS.success }]}>{statusCounts.Active}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={[styles.summaryCount, { color: COLORS.primary }]}>{statusCounts.Completed}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.dangerBg }]}>
          <Text style={[styles.summaryCount, { color: COLORS.danger }]}>{statusCounts.Rejected}</Text>
          <Text style={styles.summaryLabel}>Declined</Text>
        </View>
      </View>

      {/* Search Bar */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Search by booking #, item, or student name..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            const count = statusCounts[tab] ?? 0;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {tab}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    isSelected ? styles.tabBadgeActive : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isSelected && styles.tabBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Banner */}
      {loadError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBookings()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Main List */}
      <View style={styles.mainContainer}>
        {loading && bookings.length === 0 ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Loading incoming booking requests...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBookingCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreBookings}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchBookings({ refresh: true })}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ marginVertical: 14 }}
                />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-clear-outline" size={38} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'All'
                    ? 'No incoming bookings yet'
                    : `No ${activeTab.toLowerCase()} bookings`}
                </Text>
                <Text style={styles.emptyDescription}>
                  {searchQuery.trim()
                    ? `No requests matching "${searchQuery}" were found.`
                    : 'When students book your vehicles or equipment rentals, their requests will appear here for approval.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyCtaButton}
                  onPress={() => router.push('/createRental')}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyCtaText}>Create Rental Listing</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <BottomNav activeTab="rentals" />

      {/* Booking Details Modal */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Details</Text>
                <Text style={styles.modalSubtitle}>Ref: #{selectedBooking?.bookingNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setSelectedBooking(null)}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {(() => {
                  const meta = getStatusMeta(selectedBooking.status);
                  return (
                    <View
                      style={[
                        styles.modalStatusBanner,
                        { backgroundColor: meta.bg, borderColor: meta.border },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.text} />
                      <Text style={[styles.modalStatusText, { color: meta.text }]}>
                        {meta.label}
                      </Text>
                    </View>
                  );
                })()}

                {/* Listing Snapshot */}
                <View style={styles.modalItemCard}>
                  <Image source={{ uri: selectedBooking.image }} style={styles.modalItemImage} />
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemTitle}>{selectedBooking.title}</Text>
                    <Text style={styles.modalCategoryText}>
                      {selectedBooking.vehicleType || selectedBooking.category}
                    </Text>
                    <Text style={styles.modalDailyRate}>
                      {selectedBooking.pickupLocation}
                    </Text>
                  </View>
                </View>

                {/* Student Renter Details */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionBoxTitle}>Student Renter</Text>
                  <View style={styles.providerRow}>
                    <Image
                      source={{ uri: selectedBooking.renter.avatar }}
                      style={styles.providerAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.providerName}>{selectedBooking.renter.name}</Text>
                      {selectedBooking.renter.regNumber ? (
                        <Text style={styles.providerMeta}>
                          Reg No: {selectedBooking.renter.regNumber}
                        </Text>
                      ) : null}
                      {selectedBooking.renter.email ? (
                        <Text style={styles.providerMeta}>{selectedBooking.renter.email}</Text>
                      ) : null}
                      {selectedBooking.renter.phone ? (
                        <Text style={styles.providerMeta}>{selectedBooking.renter.phone}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.contactButtonsRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleChatWithRenter(selectedBooking)}
                    >
                      <Ionicons name="chatbubble" size={15} color={COLORS.primary} />
                      <Text style={styles.contactBtnText}>Message Student</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCallRenter(selectedBooking.renter.phone)}
                    >
                      <Ionicons name="call" size={15} color={COLORS.primary} />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedBooking.userDetailsPdfUrl ? (
                    <TouchableOpacity
                      style={styles.pdfBtn}
                      onPress={() => handleOpenPdf(selectedBooking.userDetailsPdfUrl)}
                    >
                      <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.pdfBtnText}>View Student Verification PDF</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Schedule */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionBoxTitle}>Requested Schedule</Text>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Pickup:</Text>
                    <Text style={styles.scheduleValue}>{selectedBooking.formattedStart}</Text>
                  </View>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Return:</Text>
                    <Text style={styles.scheduleValue}>{selectedBooking.formattedEnd}</Text>
                  </View>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Duration:</Text>
                    <Text style={styles.scheduleValue}>{selectedBooking.duration}</Text>
                  </View>
                </View>

                {/* Payment */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionBoxTitle}>Earnings & Deposit</Text>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Rental Charge</Text>
                    <Text style={styles.scheduleValue}>
                      LKR {selectedBooking.totalPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Refundable Security Deposit</Text>
                    <Text style={styles.scheduleValue}>
                      LKR {selectedBooking.securityDeposit.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Modal Action Buttons */}
                {selectedBooking.status === 'PENDING' && (
                  <View style={styles.modalDecisionRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => {
                        const target = selectedBooking;
                        setSelectedBooking(null);
                        openRejectModal(target);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptBooking(selectedBooking)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>Accept Request</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBooking.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteBooking(selectedBooking)}
                  >
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.completeBtnText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={!!rejectModalBooking}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalBooking(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.rejectModalBox}>
            <View style={styles.rejectIconWrap}>
              <Ionicons name="close-circle" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.rejectModalTitle}>Reject Booking Request?</Text>
            <Text style={styles.rejectModalSubtitle}>
              Select a reason for declining #{rejectModalBooking?.bookingNumber}:
            </Text>

            {REJECTION_REASONS.map((reason) => {
              const selected = selectedRejectReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                  onPress={() => setSelectedRejectReason(reason)}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.reasonOptionText,
                      selected && styles.reasonOptionTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {selectedRejectReason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Enter rejection reason..."
                placeholderTextColor={COLORS.textMuted}
                value={customRejectNote}
                onChangeText={setCustomRejectNote}
                multiline
              />
            )}

            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.cancelDismissBtn}
                onPress={() => setRejectModalBooking(null)}
                disabled={Boolean(actionBookingId)}
              >
                <Text style={styles.cancelDismissBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleConfirmReject}
                disabled={Boolean(actionBookingId)}
              >
                {actionBookingId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  summaryStrip: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeInactive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dangerBorder,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    marginLeft: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centeredLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  renterName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  reasonBannerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    gap: 3,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Details Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeModalButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  modalItemImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
  },
  modalItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCategoryText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalDailyRate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  sectionBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  providerMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  pdfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scheduleLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDecisionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  // Reject Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  rejectModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  rejectIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  rejectModalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    gap: 8,
  },
  reasonOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  reasonOptionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reasonOptionTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    fontSize: 13,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelDismissBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelDismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmRejectBtn: {
    flex: 1.3,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  confirmRejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
