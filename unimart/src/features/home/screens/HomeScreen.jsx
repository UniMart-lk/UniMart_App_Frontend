import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import BottomNav from '@/components/BottomNav';
import authService from '@/services/authService';
import homeService from '@/services/homeService';
import marketplaceService from '@/services/marketplaceService';
import { getRentalFeed } from '@/features/rentals/services/rentalService';

// Default / fallback items matching the UI screenshots


const CATEGORIES = [
  { id: '1', name: 'Electronics', icon: 'laptop-outline', type: 'marketplace' },
  { id: '2', name: 'Books', icon: 'book-outline', type: 'marketplace' },
  { id: '3', name: 'Furniture', icon: 'sofa', isMci: true, type: 'marketplace' },
  { id: '4', name: 'Bicycles', icon: 'bicycle-outline', type: 'rentals' },
  { id: '5', name: 'Clothing', icon: 'shirt-outline', type: 'marketplace' },
  { id: '6', name: 'Academic', icon: 'school-outline', type: 'marketplace' },
  { id: '7', name: 'Vehicles', icon: 'car-outline', type: 'rentals' },
  { id: '8', name: 'Equipment', icon: 'construct-outline', type: 'rentals' },
];

export default function HomeScreen() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isProvider, setIsProvider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState('Buy'); // 'Buy', 'Rent', 'Vehicles', 'Equipment'
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [rentalsList, setRentalsList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favorites, setFavorites] = useState({});

  const checkUserAndRole = useCallback(async () => {
    try {
      const stored = await authService.getStoredUser();
      if (stored) {
        setUser(stored);
        const role = (stored.role || '').toUpperCase();
        const hasProvider = !!stored.providerProfile;
        setIsProvider(role === 'PROVIDER' || role === 'ADMIN' || hasProvider);
      }

      // Try fresh profile in background
      authService.getCurrentUser().then((fresh) => {
        if (fresh) {
          setUser(fresh);
          const role = (fresh.role || '').toUpperCase();
          const hasProvider = !!fresh.providerProfile;
          setIsProvider(role === 'PROVIDER' || role === 'ADMIN' || hasProvider);
        }
      }).catch(() => {});
    } catch {
      setIsProvider(false);
    }
  }, []);

    const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch comprehensive aggregated home feed from backend API
      const feed = await homeService.getHomeFeed({ limit: 10 });
      if (feed) {
        if (Array.isArray(feed.featuredMarketplace) && feed.featuredMarketplace.length > 0) {
          setMarketplaceProducts(feed.featuredMarketplace);
        }
        if (Array.isArray(feed.featuredRentals) && feed.featuredRentals.length > 0) {
          setRentalsList(feed.featuredRentals);
        }
        if (feed.userSummary) {
          setUser(feed.userSummary);
          setIsProvider(feed.userSummary.isProvider);
          if (typeof feed.userSummary.unreadNotifications === 'number') {
            setUnreadCount(feed.userSummary.unreadNotifications);
          }
        }
      }
    } catch (err) {
      console.log('Error loading HomeScreen data:', err.message);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkUserAndRole();
      loadData();
    }, [checkUserAndRole, loadData])
  );

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/marketplace',
        params: { search: searchQuery.trim() },
      });
    }
  };

  const handleModePress = (mode) => {
    setActiveMode(mode);
    if (mode === 'Rent') {
      router.push('/rentals');
    } else if (mode === 'Vehicles') {
      router.push('/rentals');
    } else if (mode === 'Equipment') {
      router.push('/rentals');
    } else if (mode === 'Buy') {
      router.push('/marketplace');
    }
  };

  const handleCategoryPress = (category) => {
    if (category.type === 'rentals') {
      router.push('/rentals');
    } else {
      router.push({
        pathname: '/marketplace',
        params: { category: category.name },
      });
    }
  };

  // Determine user display name and role badge
  const displayName =
    user?.userProfile?.fullName ||
    user?.providerProfile?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Kasun';

  const firstName = displayName.trim().split(' ')[0] || 'Kasun';

  const roleLabel = isProvider
    ? 'Provider'
    : user?.userProfile?.userType === 'STUDENT'
    ? 'Student'
    : 'Buyer';

  const avatarUrl =
    user?.userProfile?.profilePictureUrl ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { checkUserAndRole(); loadData(true); }} />
        }
      >
        {/* 1. Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>
              Hi, {firstName} <Text style={styles.waveEmoji}>👋</Text>
            </Text>
            <Text style={styles.roleSubtext}>{roleLabel}</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.7}
              onPress={() => router.push('/chat')}
            >
              <Ionicons name="notifications-outline" size={24} color="#0F172A" />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {/* Profile Avatar */}
            <TouchableOpacity
              style={styles.avatarButton}
              activeOpacity={0.8}
              onPress={() => router.push('/profile')}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Search & Filter Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, rentals..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push('/marketplace')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* 3. Quick Mode Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modePillsContainer}
        >
          {/* Buy Pill */}
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Buy' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => handleModePress('Buy')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bag-handle"
              size={16}
              color={activeMode === 'Buy' ? '#FFFFFF' : '#0F172A'}
            />
            <Text style={[styles.modePillText, activeMode === 'Buy' && styles.modePillTextActive]}>
              Buy
            </Text>
          </TouchableOpacity>

          {/* Rent Pill */}
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Rent' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => handleModePress('Rent')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="key"
              size={16}
              color={activeMode === 'Rent' ? '#FFFFFF' : '#0F172A'}
            />
            <Text style={[styles.modePillText, activeMode === 'Rent' && styles.modePillTextActive]}>
              Rent
            </Text>
          </TouchableOpacity>

          {/* Vehicles Pill */}
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Vehicles' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => handleModePress('Vehicles')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="car-sport"
              size={16}
              color={activeMode === 'Vehicles' ? '#FFFFFF' : '#0F172A'}
            />
            <Text style={[styles.modePillText, activeMode === 'Vehicles' && styles.modePillTextActive]}>
              Vehicles
            </Text>
          </TouchableOpacity>

          {/* Equipment Pill */}
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Equipment' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => handleModePress('Equipment')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="construct"
              size={16}
              color={activeMode === 'Equipment' ? '#FFFFFF' : '#0F172A'}
            />
            <Text style={[styles.modePillText, activeMode === 'Equipment' && styles.modePillTextActive]}>
              Equipment
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 4. Section: Featured Marketplace */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Marketplace</Text>
          <TouchableOpacity onPress={() => router.push('/marketplace')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalCardsScroll}
        >
          {marketplaceProducts.map((product) => {
            const isFav = !!favorites[product.id];
            const displayPrice =
              typeof product.price === 'string' && product.price.startsWith('Rs.')
                ? product.price
                : typeof product.price === 'string' && product.price.startsWith('LKR')
                ? product.price.replace('LKR', 'Rs.')
                : `Rs. ${Number(product.numericPrice || product.price || 0).toLocaleString()}`;

            const imgUrl =
              product.primaryImageUrl ||
              (product.images && product.images.length > 0 ? product.images[0] : null) ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80';

            return (
              <TouchableOpacity
                key={`market-${product.id}`}
                style={styles.marketCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/productDetails', params: { id: product.id } })}
              >
                {/* Image Container with Badges */}
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: imgUrl }} style={styles.cardImage} />

                  {/* Condition Badge */}
                  {product.condition ? (
                    <View style={styles.conditionBadge}>
                      <Text style={styles.conditionBadgeText}>{product.condition}</Text>
                    </View>
                  ) : null}

                  {/* Heart / Favorite Button */}
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => toggleFavorite(product.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFav ? 'heart' : 'heart-outline'}
                      size={15}
                      color={isFav ? '#EF4444' : '#0F172A'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Card Details */}
                <View style={styles.cardBody}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <Text style={styles.productPrice}>{displayPrice}</Text>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={12} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {product.location || 'Campus'}
                    </Text>
                  </View>

                  {/* Provider Pill with Icons */}
                  <View style={styles.providerPillRow}>
                    <View style={styles.purpleBadgePill}>
                      <Ionicons name="school" size={11} color="#FFFFFF" />
                      <Ionicons name="storefront" size={11} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Section: Available Rentals Near You */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Available Rentals Near You</Text>
          <TouchableOpacity onPress={() => router.push('/rentals')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalCardsScroll}
        >
          {rentalsList.map((rental) => {
            const isFav = !!favorites[`rental-${rental.id}`];
            const priceLabel = rental.priceFormatted || `Rs. ${Number(rental.rentalPrice || 0).toLocaleString()}/${rental.rentalPeriod || 'day'}`;
            const imgUrl =
              rental.primaryImageUrl ||
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80';

            return (
              <TouchableOpacity
                key={`rental-${rental.id}`}
                style={styles.rentalCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/rentalDetails', params: { id: rental.id } })}
              >
                {/* Image Container */}
                <View style={styles.rentalImageContainer}>
                  <Image source={{ uri: imgUrl }} style={styles.rentalImage} />
                </View>

                {/* Rental Card Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.rentalTitle} numberOfLines={1}>
                    {rental.title}
                  </Text>

                  {/* Price Tag (Teal/Green Badge) */}
                  <View style={styles.rentalPriceBadge}>
                    <Text style={styles.rentalPriceBadgeText}>{priceLabel}</Text>
                  </View>

                  {/* Availability Row */}
                  <View style={styles.availabilityRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.availabilityText} numberOfLines={1}>
                      {rental.availability || 'Available this week'}
                    </Text>
                  </View>

                  {/* Location Row */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={12} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {rental.location || 'Main Library · 450 m away'}
                    </Text>
                  </View>

                  {/* Rating & Provider Badge Row */}
                  <View style={styles.rentalFooterRow}>
                    <View style={styles.ratingStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name="star" size={11} color="#F59E0B" style={{ marginRight: 1 }} />
                      ))}
                      <Text style={styles.ratingNumberText}>{rental.rating || 4.8}</Text>
                      <Text style={styles.reviewsCountText}>({rental.reviewsCount || 32})</Text>
                    </View>

                    {/* Teal/Globe Provider Pill */}
                    <View style={styles.tealBadgePill}>
                      <MaterialCommunityIcons name="earth" size={12} color="#FFFFFF" />
                      <Ionicons name="storefront" size={11} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. Section: Browse Categories */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.75}
              onPress={() => handleCategoryPress(cat)}
            >
              <View style={styles.categoryIconBg}>
                {cat.isMci ? (
                  <MaterialCommunityIcons name={cat.icon} size={26} color="#2563EB" />
                ) : (
                  <Ionicons name={cat.icon} size={24} color="#2563EB" />
                )}
              </View>
              <Text style={styles.categoryLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Extra spacing at the bottom of scroll content so buttons don't overlap */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 7. Action Buttons (ONLY visible if user is a PROVIDER / ADMIN) */}
      {isProvider && (
        <View style={styles.providerActionContainer}>
          <TouchableOpacity
            style={styles.addProductBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/postProduct')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addProductBtnText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addRentalBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/createRental')}
          >
            <Ionicons name="add" size={20} color="#2563EB" />
            <Text style={styles.addRentalBtnText}>Add Rental</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 8. Bottom Navigation */}
      <BottomNav activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 15,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  waveEmoji: {
    fontSize: 20,
  },
  roleSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    position: 'relative',
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#EF4444',
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  filterButton: {
    padding: 4,
  },

  /* Quick Mode Filter Pills */
  modePillsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
    gap: 6,
  },
  modePillActive: {
    backgroundColor: '#2563EB',
  },
  modePillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Horizontal Cards Scroll */
  horizontalCardsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },

  /* Marketplace Cards */
  marketCard: {
    width: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conditionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardBody: {
    padding: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  providerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  purpleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  /* Rental Cards */
  rentalCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rentalImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9',
  },
  rentalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rentalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  rentalPriceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  rentalPriceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  rentalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 3,
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  tealBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  /* Categories Grid */
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryIconBg: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* Provider Action Buttons (Add Product & Add Rental) */
  providerActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  addProductBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 46,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addRentalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    gap: 6,
  },
  addRentalBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
});

