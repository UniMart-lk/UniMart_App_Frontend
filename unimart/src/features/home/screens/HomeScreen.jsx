import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import authService from '@/services/authService';
import marketplaceService from '@/services/marketplaceService';
import { getRentalFeed } from '@/features/rentals/services/rentalService';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_MARKETPLACE = [
  {
    id: '1',
    title: 'Calculus Textbook',
    price: 'Rs. 4,500',
    numericPrice: 4500,
    condition: 'Like New',
    location: 'Engineering Block B',
    providerType: 'student',
    rating: '4.8',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
  },
  {
    id: '2',
    title: 'iPhone 11',
    price: 'Rs. 95,000',
    numericPrice: 95000,
    condition: 'Good',
    location: 'Engineering Block B',
    providerType: 'student',
    rating: '4.9',
    images: ['https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80'],
  },
];

const INITIAL_RENTALS = [
  {
    id: 101,
    title: 'Honda CB150R',
    rentalPrice: 3500,
    rentalPeriod: 'day',
    primaryImageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
    location: 'Main Library · 450 m away',
    availability: 'Available this week',
    rating: 4.8,
    reviewsCount: 32,
    providerType: 'external',
  },
];

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
  useEffect(() => {
    marketplaceService.getProducts().then(res => {
      if (Array.isArray(res) && res.length > 0) setMarketplaceProducts(res.slice(0, 10));
    }).catch(() => {});
  }, []);
  const [user, setUser] = useState(null);
  const [isProvider, setIsProvider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState('Buy');
  const [marketplaceProducts, setMarketplaceProducts] = useState(INITIAL_MARKETPLACE);
  const [rentalsList, setRentalsList] = useState(INITIAL_RENTALS);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState({});

  const displayName =
    user?.userProfile?.fullName ||
    user?.providerProfile?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Kasun';
  const firstName = displayName.trim().split(' ')[0] || 'Kasun';
  const roleLabel = isProvider ? 'Provider' : user?.userProfile?.userType === 'STUDENT' ? 'Student' : 'Buyer';
  const avatarUrl = user?.userProfile?.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* 1. Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>
              Hi, {firstName} <Text style={styles.waveEmoji}>👋</Text>
            </Text>
            <Text style={styles.roleSubtext}>{roleLabel}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7} onPress={() => router.push('/chat')}>
              <Ionicons name="notifications-outline" size={24} color="#0F172A" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8} onPress={() => router.push('/profile')}>
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
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/marketplace')} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
        {/* 3. Quick Mode Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modePillsContainer}>
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Buy' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => setActiveMode('Buy')}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-handle" size={16} color={activeMode === 'Buy' ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.modePillText, activeMode === 'Buy' && styles.modePillTextActive]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Rent' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => { setActiveMode('Rent'); router.push('/rentals'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="key" size={16} color={activeMode === 'Rent' ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.modePillText, activeMode === 'Rent' && styles.modePillTextActive]}>Rent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Vehicles' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => { setActiveMode('Vehicles'); router.push('/rentals'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="car-sport" size={16} color={activeMode === 'Vehicles' ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.modePillText, activeMode === 'Vehicles' && styles.modePillTextActive]}>Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, activeMode === 'Equipment' ? styles.modePillActive : styles.modePillInactive]}
            onPress={() => { setActiveMode('Equipment'); router.push('/rentals'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="construct" size={16} color={activeMode === 'Equipment' ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.modePillText, activeMode === 'Equipment' && styles.modePillTextActive]}>Equipment</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* 4. Section: Featured Marketplace */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Marketplace</Text>
          <TouchableOpacity onPress={() => router.push('/marketplace')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsScroll}>
          {marketplaceProducts.map((product) => {
            const isFav = !!favorites[product.id];
            return (
              <TouchableOpacity
                key={`market-${product.id}`}
                style={styles.marketCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/productDetails', params: { id: product.id } })}
              >
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: product.images[0] }} style={styles.cardImage} />
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionBadgeText}>{product.condition}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => setFavorites(f => ({ ...f, [product.id]: !f[product.id] }))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={15} color={isFav ? '#EF4444' : '#0F172A'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={12} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText} numberOfLines={1}>{product.location}</Text>
                  </View>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsScroll}>
          {rentalsList.map((rental) => {
            const priceLabel = `Rs. ${Number(rental.rentalPrice || 0).toLocaleString()}/${rental.rentalPeriod || 'day'}`;
            return (
              <TouchableOpacity
                key={`rental-${rental.id}`}
                style={styles.rentalCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/rentalDetails', params: { id: rental.id } })}
              >
                <View style={styles.rentalImageContainer}>
                  <Image source={{ uri: rental.primaryImageUrl }} style={styles.rentalImage} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.rentalTitle} numberOfLines={1}>{rental.title}</Text>
                  <View style={styles.rentalPriceBadge}>
                    <Text style={styles.rentalPriceBadgeText}>{priceLabel}</Text>
                  </View>
                  <View style={styles.availabilityRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.availabilityText} numberOfLines={1}>{rental.availability}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={12} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText} numberOfLines={1}>{rental.location}</Text>
                  </View>
                  <View style={styles.rentalFooterRow}>
                    <View style={styles.ratingStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name="star" size={11} color="#F59E0B" style={{ marginRight: 1 }} />
                      ))}
                      <Text style={styles.ratingNumberText}>{rental.rating}</Text>
                      <Text style={styles.reviewsCountText}>({rental.reviewsCount})</Text>
                    </View>
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
              onPress={() => cat.type === 'rentals' ? router.push('/rentals') : router.push({ pathname: '/marketplace', params: { category: cat.name } })}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }
});

styles.scrollContainer = { flex: 1, backgroundColor: '#F8FAFC' };
styles.scrollContent = { paddingBottom: 15 };
