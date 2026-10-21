import React, { useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// UniMart Project Theme Colors
const COLORS = {
  primary: '#2563EB',        // UniMart Blue
  primaryLight: '#EFF6FF',   // Tinted Blue Background
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',     // Clean slate background
  surface: '#FFFFFF',        // Card white
  border: '#E2E8F0',         // Subtle border
  text: '#0F172A',           // Dark slate text
  textSecondary: '#64748B',  // Slate gray
  textMuted: '#94A3B8',      // Muted gray
  success: '#16A34A',        // Green
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#D97706',        // Amber
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
  danger: '#DC2626',         // Red
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
};

// Realistic mock data reflecting UniMart's RentalBooking Prisma model and Sri Lankan campus life
const INITIAL_BOOKINGS = [
  {
    id: '1',
    bookingNumber: 'UB-2026-8492',
    title: 'Honda Dio 110cc Scooter',
    category: 'Vehicle',
    vehicleType: 'Scooter / Motorcycle',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
    startDate: '2026-10-24',
    endDate: '2026-10-26',
    formattedDates: '24 Oct - 26 Oct 2026',
    duration: '2 Days',
    pricePerDay: 2500,
    totalPrice: 5000,
    securityDeposit: 2000,
    status: 'ACCEPTED', // Confirmed / Ongoing
    pickupLocation: 'Main Campus Gate, Sabaragamuwa University',
    host: {
      name: 'Kavindu Perera',
      role: 'Verified Campus Provider',
      phone: '+94 77 123 4567',
      rating: '4.9 ★ (42 reviews)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    },
    pickupInstructions: 'Collect vehicle key and helmet at the security gate office. Please present your student ID card.',
    paymentStatus: 'Paid Online',
  },
  {
    id: '2',
    bookingNumber: 'UB-2026-7731',
    title: 'Canon EOS 200D DSLR Camera Kit',
    category: 'Equipment',
    vehicleType: null,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    startDate: '2026-10-28',
    endDate: '2026-10-29',
    formattedDates: '28 Oct - 29 Oct 2026',
    duration: '1 Day',
    pricePerDay: 1800,
    totalPrice: 1800,
    securityDeposit: 3000,
    status: 'PENDING', // Awaiting Provider Confirmation
    pickupLocation: 'Faculty of Applied Sciences, Media Lab',
    host: {
      name: 'Media Club Sabra',
      role: 'Student Club Host',
      phone: '+94 71 987 6543',
      rating: '4.8 ★ (19 reviews)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
    },
    pickupInstructions: 'Meet with lab coordinator outside Lab 2. Camera includes 18-55mm lens and 64GB high-speed SD card.',
    paymentStatus: 'Pay on Pickup',
  },
  {
    id: '3',
    bookingNumber: 'UB-2026-6120',
    title: 'Trek Marlin 5 Mountain Bike',
    category: 'Vehicle',
    vehicleType: 'Bicycle',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
    startDate: '2026-10-14',
    endDate: '2026-10-16',
    formattedDates: '14 Oct - 16 Oct 2026',
    duration: '2 Days',
    pricePerDay: 800,
    totalPrice: 1600,
    securityDeposit: 1000,
    status: 'COMPLETED',
    pickupLocation: 'Hostel Block C Bicycle Stand',
    host: {
      name: 'Nuwan Bandara',
      role: 'Student Host (3rd Year)',
      phone: '+94 76 555 4321',
      rating: '5.0 ★ (8 reviews)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    },
    pickupInstructions: 'Returned in excellent condition. Security deposit refunded.',
    paymentStatus: 'Completed',
  },
  {
    id: '4',
    bookingNumber: 'UB-2026-5389',
    title: 'Texas Instruments TI-84 Plus CE Calculator',
    category: 'Equipment',
    vehicleType: null,
    image: 'https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=600&q=80',
    startDate: '2026-10-02',
    endDate: '2026-10-05',
    formattedDates: '02 Oct - 05 Oct 2026',
    duration: '3 Days',
    pricePerDay: 300,
    totalPrice: 900,
    securityDeposit: 1500,
    status: 'COMPLETED',
    pickupLocation: 'Main Library 1st Floor Study Area',
    host: {
      name: 'Engineering Faculty Society',
      role: 'Student Society',
      phone: '+94 70 333 2211',
      rating: '4.9 ★ (55 reviews)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
    pickupInstructions: 'Returned on schedule. Battery and accessories inspected.',
    paymentStatus: 'Completed',
  },
  {
    id: '5',
    bookingNumber: 'UB-2026-4911',
    title: '4-Person Waterproof Camping Tent & Mat',
    category: 'Equipment',
    vehicleType: null,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80',
    startDate: '2026-09-20',
    endDate: '2026-09-22',
    formattedDates: '20 Sep - 22 Sep 2026',
    duration: '2 Days',
    pricePerDay: 1200,
    totalPrice: 2400,
    securityDeposit: 2500,
    status: 'CANCELLED',
    cancellationReason: 'Cancelled by user due to exam timetable clash.',
    pickupLocation: 'Belihuloya Town Center, near Bus Stand',
    host: {
      name: 'Outdoor Adventure Club',
      role: 'Campus Club',
      phone: '+94 72 444 8899',
      rating: '4.7 ★ (31 reviews)',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&q=80',
    },
    pickupInstructions: 'Cancelled before scheduled start date. No cancellation fee charged.',
    paymentStatus: 'Refunded',
  },
];

// Student's own listings (Marketplace items & Rentals they offer)
const INITIAL_MY_LISTINGS = [
  {
    id: 'L1',
    title: 'Calculus Early Transcendentals Textbook',
    type: 'Marketplace',
    price: 1500,
    status: 'Active',
    views: 45,
    inquiries: 3,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    date: 'Listed 3 days ago',
  },
  {
    id: 'L2',
    title: 'Solid Teak Study Table with Drawer',
    type: 'Marketplace',
    price: 8500,
    status: 'Active',
    views: 112,
    inquiries: 7,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80',
    date: 'Listed 5 days ago',
  },
  {
    id: 'L3',
    title: 'Yamaha Ray ZR 125 Scooter for Daily Rent',
    type: 'Rental',
    price: 2200,
    status: 'Active',
    views: 184,
    inquiries: 12,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80',
    date: 'Listed 1 week ago',
  },
  {
    id: 'L4',
    title: 'Rechargeable LED Desk Lamp',
    type: 'Marketplace',
    price: 2200,
    status: 'Sold',
    views: 89,
    inquiries: 4,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
    date: 'Sold 2 weeks ago',
  },
];

const BOOKING_TABS = ['All', 'Active', 'Pending', 'Completed', 'Cancelled'];
const LISTING_TABS = ['All', 'Active', 'Sold'];

export default function MyBookingsScreen({
  onBack,
  onNavigate,
  initialSection = 'bookings',
}) {
  // Main section toggle: 'bookings' (items I booked) vs 'listings' (my published items)
  const [activeSection, setActiveSection] = useState(initialSection);

  // Filter tabs
  const [bookingFilter, setBookingFilter] = useState('All');
  const [listingFilter, setListingFilter] = useState('All');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Data states
  const [bookings, setListingsData] = useState(INITIAL_BOOKINGS);
  const [myListings, setMyListings] = useState(INITIAL_MY_LISTINGS);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  // Active bottom navigation item
  const [currentNav, setCurrentNav] = useState('Rentals');

  // Filtered Bookings calculation
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      // Status tab filter
      if (bookingFilter === 'Active' && item.status !== 'ACCEPTED') return false;
      if (bookingFilter === 'Pending' && item.status !== 'PENDING') return false;
      if (bookingFilter === 'Completed' && item.status !== 'COMPLETED') return false;
      if (bookingFilter === 'Cancelled' && item.status !== 'CANCELLED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchNumber = item.bookingNumber.toLowerCase().includes(query);
        const matchHost = item.host.name.toLowerCase().includes(query);
        const matchLocation = item.pickupLocation.toLowerCase().includes(query);
        return matchTitle || matchNumber || matchHost || matchLocation;
      }

      return true;
    });
  }, [bookings, bookingFilter, searchQuery]);

  // Filtered Listings calculation
  const filteredListings = useMemo(() => {
    return myListings.filter((item) => {
      if (listingFilter !== 'All' && item.status !== listingFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [myListings, listingFilter, searchQuery]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  // Handle bottom navigation
  const handleNavPress = (label) => {
    setCurrentNav(label);
    if (onNavigate) return onNavigate(label);

    switch (label) {
      case 'Home':
        router.push('/home');
        break;
      case 'Marketplace':
        router.push('/marketplace');
        break;
      case 'Rentals':
        // Already on bookings / rentals
        break;
      case 'Messages':
        router.push('/chat');
        break;
      case 'Profile':
        router.push('/home');
        break;
      default:
        break;
    }
  };

  // Open Chat with Provider
  const handleContactHost = (hostName) => {
    if (selectedBooking) {
      setSelectedBooking(null);
    }
    Alert.alert(
      'Message Provider',
      `Open chat conversation with ${hostName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            router.push('/chat');
          },
        },
      ]
    );
  };

  // Call Provider
  const handleCallHost = (phoneNumber) => {
    Alert.alert('Call Provider', `Dial ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => {} },
    ]);
  };

  // Re-book / Rent Again
  const handleRentAgain = (item) => {
    Alert.alert(
      'Rent Again',
      `Would you like to make a new rental reservation for "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert('Booking Request', 'Redirecting to rental listing details...');
          },
        },
      ]
    );
  };

  // Cancel Booking prompt
  const initiateCancel = (booking) => {
    setBookingToCancel(booking);
    setIsCancelModalVisible(true);
  };

  // Confirm Cancellation
  const confirmCancel = () => {
    if (!bookingToCancel) return;

    setListingsData((current) =>
      current.map((item) =>
        item.id === bookingToCancel.id
          ? {
              ...item,
              status: 'CANCELLED',
              cancellationReason: cancelReason,
              paymentStatus: 'Refund Processing',
            }
          : item
      )
    );

    setIsCancelModalVisible(false);
    setSelectedBooking(null);
    setBookingToCancel(null);

    Alert.alert(
      'Booking Cancelled',
      `Booking #${bookingToCancel.bookingNumber} has been successfully cancelled. Any applicable refund will be processed to your account.`
    );
  };

  // Format status badge metadata
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          label: 'Active / Confirmed',
          icon: 'checkmark-circle',
          bg: COLORS.successBg,
          text: COLORS.success,
          border: COLORS.successBorder,
        };
      case 'PENDING':
        return {
          label: 'Pending Approval',
          icon: 'time',
          bg: COLORS.warningBg,
          text: COLORS.warning,
          border: COLORS.warningBorder,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: 'checkmark-done-circle',
          bg: '#F1F5F9',
          text: '#475569',
          border: '#E2E8F0',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: 'close-circle',
          bg: COLORS.dangerBg,
          text: COLORS.danger,
          border: COLORS.dangerBorder,
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
  };

  // Render a single booking card
  const renderBookingCard = ({ item }) => {
    const statusMeta = getStatusBadge(item.status);

    return (
      <View style={styles.bookingCard}>
        {/* Card Header: Booking Reference & Status Badge */}
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

        {/* Card Body: Thumbnail & Details */}
        <View style={styles.cardBody}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {item.vehicleType ? item.vehicleType : item.category}
              </Text>
            </View>

            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Host Details */}
            <View style={styles.hostRow}>
              <Ionicons name="person-circle-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.hostText} numberOfLines={1}>
                {item.host.name} • {item.host.rating}
              </Text>
            </View>

            {/* Dates & Duration */}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
              <Text style={styles.detailText}>{item.formattedDates}</Text>
              <View style={styles.durationPill}>
                <Text style={styles.durationPillText}>{item.duration}</Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.danger} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.pickupLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer: Price & Quick Action Buttons */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.priceValue}>
              LKR {item.totalPrice.toLocaleString('en-US')}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {/* Contact Host Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleContactHost(item.host.name)}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${item.host.name}`}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Chat</Text>
            </TouchableOpacity>

            {/* View Details Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSelectedBooking(item)}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${item.title}`}
            >
              <Text style={styles.primaryButtonText}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Secondary Action Row for Cancel / Rebook */}
        {item.status === 'PENDING' && (
          <View style={styles.subActionRow}>
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => initiateCancel(item)}
            >
              <Ionicons name="close-circle-outline" size={14} color={COLORS.danger} />
              <Text style={styles.cancelLinkText}>Cancel Booking Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'COMPLETED' && (
          <View style={styles.subActionRow}>
            <TouchableOpacity
              style={styles.rebookLink}
              onPress={() => handleRentAgain(item)}
            >
              <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
              <Text style={styles.rebookLinkText}>Rent Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render a listing card (items the user is offering)
  const renderListingCard = ({ item }) => {
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.type}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.status === 'Active' ? COLORS.successBg : '#F1F5F9',
                borderColor: item.status === 'Active' ? COLORS.successBorder : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: item.status === 'Active' ? COLORS.success : COLORS.textSecondary },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.priceValue}>
              LKR {item.price.toLocaleString('en-US')}
            </Text>
            <Text style={styles.hostText}>{item.date}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.statText}>{item.views} views</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubbles-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.statText}>{item.inquiries} inquiries</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* 1. TOP APP BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerIconButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeSection === 'bookings' ? 'My Bookings' : 'My Listings'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeSection === 'bookings'
              ? 'Campus vehicle & equipment rentals'
              : 'Items you have posted for rent/sale'}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Toggle search"
          style={styles.headerIconButton}
          onPress={() => setShowSearchBar((prev) => !prev)}
        >
          <Ionicons
            name={showSearchBar ? 'close' : 'search-outline'}
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* 2. SECTION SWITCHER (Segmented control: Rented by Me vs My Listings) */}
      <View style={styles.sectionSwitcherContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSection === 'bookings' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSection('bookings')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'bookings' }}
          >
            <Ionicons
              name="calendar"
              size={15}
              color={activeSection === 'bookings' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                activeSection === 'bookings' && styles.segmentTextActive,
              ]}
            >
              My Bookings ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSection === 'listings' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSection('listings')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'listings' }}
          >
            <Ionicons
              name="pricetags"
              size={15}
              color={activeSection === 'listings' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                activeSection === 'listings' && styles.segmentTextActive,
              ]}
            >
              My Listings ({myListings.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. SEARCH BAR (Collapsible) */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder={
              activeSection === 'bookings'
                ? 'Search by title, booking #, or location...'
                : 'Search your listings...'
            }
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

      {/* 4. FILTER TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {activeSection === 'bookings'
            ? BOOKING_TABS.map((tab) => {
                const isSelected = bookingFilter === tab;
                let count = bookings.length;
                if (tab === 'Active') count = bookings.filter((b) => b.status === 'ACCEPTED').length;
                if (tab === 'Pending') count = bookings.filter((b) => b.status === 'PENDING').length;
                if (tab === 'Completed') count = bookings.filter((b) => b.status === 'COMPLETED').length;
                if (tab === 'Cancelled') count = bookings.filter((b) => b.status === 'CANCELLED').length;

                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabChip, isSelected && styles.tabChipActive]}
                    onPress={() => setBookingFilter(tab)}
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
              })
            : LISTING_TABS.map((tab) => {
                const isSelected = listingFilter === tab;
                let count = myListings.length;
                if (tab !== 'All') count = myListings.filter((l) => l.status === tab).length;

                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabChip, isSelected && styles.tabChipActive]}
                    onPress={() => setListingFilter(tab)}
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

      {/* 5. MAIN CONTENT LIST */}
      <View style={styles.mainContainer}>
        {activeSection === 'bookings' ? (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBookingCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No {bookingFilter.toLowerCase()} bookings</Text>
                <Text style={styles.emptyDescription}>
                  {searchQuery
                    ? `No reservations matching "${searchQuery}" found.`
                    : bookingFilter === 'All'
                    ? 'You have not booked any rental vehicles or equipment yet.'
                    : `You have no ${bookingFilter.toLowerCase()} rental reservations at the moment.`}
                </Text>

                <TouchableOpacity
                  style={styles.emptyCtaButton}
                  onPress={() => router.push('/marketplace')}
                  accessibilityRole="button"
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyCtaButtonText}>Explore Rentals</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            renderItem={renderListingCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="albums-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptyDescription}>
                  Post items you want to rent or sell to other university students.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* 6. BOTTOM NAVIGATION (Consistent with UniMart App style) */}
      <View style={styles.bottomNavContainer}>
        {[
          { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
          { label: 'Marketplace', icon: 'storefront-outline', activeIcon: 'storefront' },
          { label: 'Rentals', icon: 'car-outline', activeIcon: 'car' },
          { label: 'Messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
          { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
        ].map((nav) => {
          const isCurrent = currentNav === nav.label;

          return (
            <TouchableOpacity
              key={nav.label}
              style={styles.navItem}
              onPress={() => handleNavPress(nav.label)}
              accessibilityRole="button"
              accessibilityLabel={nav.label}
              accessibilityState={{ selected: isCurrent }}
            >
              <View style={isCurrent ? styles.activeNavPill : styles.inactiveNavPill}>
                <Ionicons
                  name={isCurrent ? nav.activeIcon : nav.icon}
                  size={22}
                  color={isCurrent ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.navText, isCurrent && styles.navTextActive]}>
                {nav.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 7. BOOKING DETAILS MODAL */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <Text style={styles.modalSubtitle}>
                  Ref: #{selectedBooking?.bookingNumber}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setSelectedBooking(null)}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedBooking && (
                <>
                  {/* Status Banner */}
                  {(() => {
                    const meta = getStatusBadge(selectedBooking.status);
                    return (
                      <View
                        style={[
                          styles.modalStatusBanner,
                          { backgroundColor: meta.bg, borderColor: meta.border },
                        ]}
                      >
                        <Ionicons name={meta.icon} size={18} color={meta.text} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.modalStatusText, { color: meta.text }]}>
                            {meta.label}
                          </Text>
                          <Text style={styles.modalStatusSubtext}>
                            Payment: {selectedBooking.paymentStatus}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Item Summary Card */}
                  <View style={styles.modalItemCard}>
                    <Image
                      source={{ uri: selectedBooking.image }}
                      style={styles.modalItemImage}
                    />
                    <View style={styles.modalItemDetails}>
                      <Text style={styles.modalItemTitle}>{selectedBooking.title}</Text>
                      <Text style={styles.modalCategoryText}>
                        {selectedBooking.vehicleType || selectedBooking.category}
                      </Text>
                      <Text style={styles.modalDailyRate}>
                        LKR {selectedBooking.pricePerDay.toLocaleString('en-US')} / day
                      </Text>
                    </View>
                  </View>

                  {/* Provider Card */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionBoxTitle}>Rental Provider / Host</Text>
                    <View style={styles.providerRow}>
                      <Image
                        source={{ uri: selectedBooking.host.avatar }}
                        style={styles.providerAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.providerName}>{selectedBooking.host.name}</Text>
                        <Text style={styles.providerRole}>{selectedBooking.host.role}</Text>
                        <Text style={styles.providerRating}>{selectedBooking.host.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.contactButtonsRow}>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleContactHost(selectedBooking.host.name)}
                      >
                        <Ionicons name="chatbubble" size={15} color={COLORS.primary} />
                        <Text style={styles.contactBtnText}>Message</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleCallHost(selectedBooking.host.phone)}
                      >
                        <Ionicons name="call" size={15} color={COLORS.primary} />
                        <Text style={styles.contactBtnText}>Call Host</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Reservation Timetable */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionBoxTitle}>Reservation Schedule</Text>
                    <View style={styles.timelineRow}>
                      <View style={styles.timelineIconCol}>
                        <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
                        <View style={styles.timelineLine} />
                        <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
                      </View>

                      <View style={styles.timelineContentCol}>
                        <View style={styles.timelineItem}>
                          <Text style={styles.timelineLabel}>Pickup Date & Time</Text>
                          <Text style={styles.timelineValue}>
                            {selectedBooking.startDate} • 09:00 AM
                          </Text>
                        </View>

                        <View style={[styles.timelineItem, { marginTop: 16 }]}>
                          <Text style={styles.timelineLabel}>Return Date & Time</Text>
                          <Text style={styles.timelineValue}>
                            {selectedBooking.endDate} • 06:00 PM
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Pickup Location & Instructions */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionBoxTitle}>Pickup Location</Text>
                    <View style={styles.locationDetailRow}>
                      <Ionicons name="location" size={18} color={COLORS.danger} />
                      <Text style={styles.locationDetailText}>
                        {selectedBooking.pickupLocation}
                      </Text>
                    </View>
                    <View style={styles.instructionsBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.instructionsText}>
                        {selectedBooking.pickupInstructions}
                      </Text>
                    </View>
                  </View>

                  {/* Price Breakdown */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionBoxTitle}>Payment Breakdown</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>
                        Rental Rate (LKR {selectedBooking.pricePerDay} × {selectedBooking.duration})
                      </Text>
                      <Text style={styles.priceRowValue}>
                        LKR {selectedBooking.totalPrice.toLocaleString('en-US')}
                      </Text>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>Security Deposit (Refundable)</Text>
                      <Text style={styles.priceRowValue}>
                        LKR {selectedBooking.securityDeposit.toLocaleString('en-US')}
                      </Text>
                    </View>

                    <View style={[styles.priceRow, styles.priceRowTotal]}>
                      <Text style={styles.totalLabel}>Total Estimated</Text>
                      <Text style={styles.totalValue}>
                        LKR{' '}
                        {(
                          selectedBooking.totalPrice + selectedBooking.securityDeposit
                        ).toLocaleString('en-US')}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button: Cancel Booking or Rent Again */}
                  {selectedBooking.status === 'PENDING' && (
                    <TouchableOpacity
                      style={styles.cancelBookingBtn}
                      onPress={() => initiateCancel(selectedBooking)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  )}

                  {selectedBooking.status === 'COMPLETED' && (
                    <TouchableOpacity
                      style={styles.rentAgainModalBtn}
                      onPress={() => handleRentAgain(selectedBooking)}
                    >
                      <Ionicons name="repeat" size={16} color="#FFFFFF" />
                      <Text style={styles.rentAgainModalBtnText}>Rent Again</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 8. CANCELLATION CONFIRMATION MODAL */}
      <Modal
        visible={isCancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelConfirmContainer}>
            <View style={styles.cancelAlertIcon}>
              <Ionicons name="warning-outline" size={28} color={COLORS.danger} />
            </View>

            <Text style={styles.cancelAlertTitle}>Cancel Booking?</Text>
            <Text style={styles.cancelAlertMessage}>
              Are you sure you want to cancel booking #{bookingToCancel?.bookingNumber}?
            </Text>

            <Text style={styles.reasonLabel}>Please specify a reason:</Text>
            {['Change of plans', 'Found alternative rental', 'Timetable / Exam conflict', 'Other'].map(
              (reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    cancelReason === reason && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Ionicons
                    name={cancelReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={cancelReason === reason ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.reasonOptionText,
                      cancelReason === reason && styles.reasonOptionTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={styles.cancelDismissBtn}
                onPress={() => setIsCancelModalVisible(false)}
              >
                <Text style={styles.cancelDismissBtnText}>Keep Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelConfirmBtn} onPress={confirmCancel}>
                <Text style={styles.cancelConfirmBtnText}>Confirm Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Named export for backwards-compatibility
export { MyBookingsScreen as MyListings };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // 2. Segmented Switcher
  sectionSwitcherContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // 3. Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },

  // 4. Tabs
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // 5. Main List & Cards
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  bookingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  hostText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  durationPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFCFF',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subActionRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.danger,
  },
  rebookLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rebookLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCtaButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // 6. Bottom Navigation
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavPill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  inactiveNavPill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  navText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // 7. Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalStatusSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  modalItemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  modalItemImage: {
    width: 75,
    height: 75,
    borderRadius: 8,
  },
  modalItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCategoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalDailyRate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  sectionBox: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  providerRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  providerRating: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
    marginTop: 1,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  timelineIconCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    height: 38,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineContentCol: {
    flex: 1,
    marginLeft: 8,
  },
  timelineItem: {},
  timelineLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationDetailText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  instructionsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  instructionsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  priceRowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceRowValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  priceRowTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  cancelBookingBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  rentAgainModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  rentAgainModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // 8. Cancel Confirmation Modal
  cancelConfirmContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cancelAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  cancelAlertTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  cancelAlertMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
    gap: 8,
  },
  reasonOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  reasonOptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reasonOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelDismissBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelDismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
