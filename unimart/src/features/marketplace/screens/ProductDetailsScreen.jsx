import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  ScrollView, 
  FlatList, 
  Dimensions,
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { products } from '../data/mockData'; 

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarFavorites, setSimilarFavorites] = useState({});

  // Find the product based on ID, fallback to product 2 (iPhone 11) if testing or no ID passed
  const product = id 
    ? products.find((p) => p.id === id) 
    : (products.find((p) => p.id === '2') || products[0]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 50, fontSize: 16, color: '#64748B' }}>
          Product not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 20 }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Toggle favorite for similar products
  const toggleSimilarFavorite = (itemId) => {
    setSimilarFavorites((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Update dots when user swipes images
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveImageIndex(index);
  };

  // Render individual image in the carousel
  const renderImage = ({ item }) => (
    <Image 
      source={{ uri: item }} 
      style={styles.productImage} 
      resizeMode="cover" 
    />
  );

  // Data loaded directly from product in mockData.js
  const details = product.details || [];
  const locationDetails = product.locationDetails || {
    address: product.location || '',
    mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
  };
  const providerDetails = product.provider || {};

  // Similar products sorted to display Mountain Bike first, Calculus Textbook second, Study Table third
  const similarProducts = products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const order = { '4': 1, '1': 2, '3': 3 };
      return (order[a.id] || 99) - (order[b.id] || 99);
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      
      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        
        {/* 1. IMAGE CAROUSEL SECTION */}
        <View style={styles.imageSection}>
          <FlatList
            data={product.images}
            renderItem={renderImage}
            keyExtractor={(img, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          />

          {/* Overlay Top Bar (Back, Share, Heart) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']} 
            style={styles.gradientOverlay}
          >
            <View style={styles.overlayHeader}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>
              
              <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                  <Ionicons name="share-social-outline" size={20} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconBtn} 
                  activeOpacity={0.8}
                  onPress={() => setIsFavorite(!isFavorite)}
                >
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isFavorite ? "#EF4444" : "#0F172A"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Image Counter (e.g., 1/3) */}
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {activeImageIndex + 1}/{product.images?.length || 1}
            </Text>
          </View>

          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {product.images?.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, activeImageIndex === index && styles.activeDot]} 
              />
            ))}
          </View>
        </View>

        {/* 2. PRODUCT DETAILS SECTION */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{product.price}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{product.condition}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons 
                name={product.category === 'Books' ? 'book-open-page-variant' : product.category === 'Electronics' ? 'cellphone' : product.category === 'Furniture' ? 'table-chair' : 'laptop'} 
                size={14} 
                color="#475569" 
                style={{ marginRight: 4 }} 
              />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={styles.timeAgo}>2 days ago</Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description} numberOfLines={isExpanded ? undefined : 3}>
            {product.description}
          </Text>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
            <Text style={styles.readMore}>
              {isExpanded ? 'Read Less' : 'Read More'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Details Section */}
          {details.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailsTable}>
                {details.map((item, index) => (
                  <View key={index}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                    {index < details.length - 1 && <View style={styles.detailRowDivider} />}
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <Image 
              source={{ uri: locationDetails.mapImage }} 
              style={styles.mapImage} 
              resizeMode="cover" 
            />

            {/* Centered Map Pin */}
            <View style={styles.mapPinContainer}>
              <Ionicons name="location-sharp" size={40} color="#2563EB" />
              <View style={styles.mapPinDot} />
            </View>

            {/* Floating "View on Map" Button on Map Preview */}
            <TouchableOpacity 
              style={styles.mapBadgeButton} 
              activeOpacity={0.85}
              onPress={() => Alert.alert('Location', locationDetails.address)}
            >
              <Text style={styles.mapBadgeText}>View on Map</Text>
              <Ionicons name="open-outline" size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Location Address & View on Map Link */}
          <View style={styles.locationFooterRow}>
            <Text style={styles.locationAddressText}>{locationDetails.address}</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => Alert.alert('Location', locationDetails.address)}
            >
              <Text style={styles.viewOnMapLink}>View on Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Provider's Details Card */}
          <View style={styles.providerCard}>
            {/* Top Row: Avatar & Name & Badges */}
            <View style={styles.providerTopRow}>
              {providerDetails.avatar ? (
                <Image 
                  source={{ uri: providerDetails.avatar }} 
                  style={styles.providerAvatar} 
                />
              ) : (
                <View style={[styles.providerAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={28} color="#94A3B8" />
                </View>
              )}
              <View style={styles.providerInfoColumn}>
                <Text style={styles.providerName}>{providerDetails.name || 'Provider'}</Text>
                
                <View style={styles.providerBadgesRow}>
                  {/* Provider Type Badge */}
                  <View style={styles.providerTypeBadge}>
                    {providerDetails.type === 'External Provider' ? (
                      <>
                        <MaterialCommunityIcons name="earth" size={13} color="#0F172A" />
                        <MaterialCommunityIcons name="storefront" size={13} color="#0F172A" />
                      </>
                    ) : (
                      <>
                        <Ionicons name="school" size={13} color="#0F172A" />
                        <MaterialCommunityIcons name="storefront" size={13} color="#0F172A" />
                      </>
                    )}
                    <Text style={styles.providerBadgeText}>{providerDetails.type || 'Provider'}</Text>
                  </View>

                  {/* Verified Badge */}
                  {providerDetails.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#0F172A" />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Rating Stars & View Profile Link */}
            <View style={styles.providerRatingRow}>
              <View style={styles.ratingGroup}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4].map((star) => (
                    <Ionicons key={star} name="star" size={14} color="#F59E0B" style={{ marginRight: 2 }} />
                  ))}
                  <Ionicons name="star-half" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                </View>
                <Text style={styles.ratingScoreText}>{providerDetails.rating || '4.8'}</Text>
                <Text style={styles.reviewCountText}>({providerDetails.reviewsCount || 25})</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => Alert.alert('Provider Profile', `Viewing ${providerDetails.name || 'Provider'}'s profile`)}
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Member Since Row */}
            <Text style={styles.memberSinceText}>
              Member since {providerDetails.memberSince || 'Jan 2025'}
            </Text>
          </View>

          {/* Similar Products Section */}
          <Text style={styles.similarSectionTitle}>Similar Products</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScrollContainer}
            style={styles.similarScrollView}
          >
            {similarProducts.map((item) => {
              const isFav = similarFavorites[item.id] || false;
              const cardImageUri = (item.id === '1' && item.images && item.images.length > 1)
                ? item.images[1]
                : (item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150');

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.similarCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/productDetails', params: { id: item.id } })}
                >
                  {/* Product Image & Badges */}
                  <View style={styles.similarImageContainer}>
                    <Image 
                      source={{ uri: cardImageUri }} 
                      style={styles.similarImage} 
                      resizeMode="cover" 
                    />

                    {/* Condition Badge */}
                    <View style={styles.similarConditionBadge}>
                      <Text style={styles.similarConditionText}>{item.condition}</Text>
                    </View>

                    {/* Heart Button */}
                    <TouchableOpacity 
                      style={styles.similarHeartButton}
                      activeOpacity={0.7}
                      onPress={() => toggleSimilarFavorite(item.id)}
                    >
                      <Ionicons 
                        name={isFav ? "heart" : "heart-outline"} 
                        size={15} 
                        color={isFav ? "#EF4444" : "#0F172A"} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Similar Product Info */}
                  <View style={styles.similarInfoContainer}>
                    <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.similarPrice}>{item.price}</Text>

                    {/* Location */}
                    <View style={styles.similarLocationRow}>
                      <Ionicons name="location-sharp" size={12} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.similarLocationText} numberOfLines={1}>{item.location}</Text>
                    </View>

                    {/* Provider Badge */}
                    <View style={[
                      styles.similarProviderBadge,
                      item.providerType === 'external' ? styles.bgTeal : styles.bgPurple
                    ]}>
                      {item.providerType === 'external' ? (
                        <>
                          <MaterialCommunityIcons name="earth" size={12} color="#FFFFFF" />
                          <MaterialCommunityIcons name="storefront" size={12} color="#FFFFFF" />
                        </>
                      ) : (
                        <>
                          <Ionicons name="school" size={12} color="#FFFFFF" />
                          <MaterialCommunityIcons name="storefront" size={12} color="#FFFFFF" />
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.divider, { marginTop: 16 }]} />
        
        </View>
      </ScrollView>

      {/* 3. STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => Alert.alert('Chat', 'Navigating to chat with seller...')}>
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatBtnText}>Chat with Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => Alert.alert('Report', 'Report listing')}>
          <Ionicons name="flag-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // --- IMAGE CAROUSEL STYLES ---
  imageSection: {
    width: '100%',
    height: 400,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  productImage: {
    width: width,
    height: 400,
  },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: 15,
    zIndex: 10,
  },

  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  paginationDots: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // --- DETAILS STYLES ---
  detailsContainer: {
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },

  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 16,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  conditionBadge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },

  conditionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },

  categoryText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  timeAgo: {
    fontSize: 12,
    color: '#64748B',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },

  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 8,
  },

  // --- DETAILS TABLE STYLES ---
  detailsTable: {
    marginTop: 4,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  detailLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '400',
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  detailRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // --- LOCATION STYLES ---
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 12,
  },

  mapImage: {
    width: '100%',
    height: '100%',
  },

  mapPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapPinDot: {
    position: 'absolute',
    top: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },

  mapBadgeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },

  mapBadgeText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },

  locationFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },

  locationAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },

  viewOnMapLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  // --- PROVIDER CARD STYLES ---
  providerCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 6,
  },

  providerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  providerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E2E8F0',
  },

  providerInfoColumn: {
    marginLeft: 14,
    flex: 1,
  },

  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  providerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  providerTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008CA5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },

  providerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C48C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },

  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },

  providerRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingScoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },

  reviewCountText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },

  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  memberSinceText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 14,
  },

  // --- SIMILAR PRODUCTS STYLES ---
  similarSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 14,
  },

  similarScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },

  similarScrollContainer: {
    paddingRight: 10,
    paddingBottom: 4,
  },

  similarCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginRight: 14,
  },

  similarImageContainer: {
    width: '100%',
    height: 135,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  similarImage: {
    width: '100%',
    height: '100%',
  },

  similarConditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  similarConditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },

  similarHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  similarInfoContainer: {
    padding: 12,
  },

  similarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    minHeight: 40,
    lineHeight: 20,
  },

  similarPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },

  similarLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  similarLocationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },

  similarProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },

  bgPurple: {
    backgroundColor: '#8B5CF6',
  },

  bgTeal: {
    backgroundColor: '#06B6D4',
  },

  // --- BOTTOM ACTION BAR STYLES ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },

  chatBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
  },

  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  reportBtn: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});