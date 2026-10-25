import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  ScrollView, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';


// 👇 Make sure this path is correct based on your folder structure
import { products } from '../data/mockData'; 

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Find the product based on the ID passed from the ProductCard
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <View style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 20 }}>
          <Text style={{ color: '#2563EB' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      
      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 1. IMAGE CAROUSEL SECTION */}
        <View style={styles.imageSection}>
          <FlatList
            data={product.images}
            renderItem={renderImage}
            keyExtractor={(img, index) => index.toString()}
            horizontal
            pagingEnabled // 👈 Snaps to the next image like a carousel
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll} // 👈 Updates the dots
          />

          {/* Overlay Top Bar (Back, Share, Heart) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']} 
            style={styles.gradientOverlay}
          >
            <View style={styles.overlayHeader}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>
              
              <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="share-social-outline" size={20} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="heart-outline" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Image Counter (e.g., 1/3) */}
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {activeImageIndex + 1}/{product.images.length}
            </Text>
          </View>

          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {product.images.map((_, index) => (
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
              <MaterialCommunityIcons name="laptop" size={14} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={styles.timeAgo}>2 days ago</Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description}
          </Text>
          <TouchableOpacity>
            <Text style={styles.readMore}>Read More</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
        
        </View>
      </ScrollView>

      {/* 3. STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => alert('Navigate to Chat')}>
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatBtnText}>Chat with Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn}>
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
    backgroundColor: '#E2E8F0', // Placeholder color while image loads
  },

  productImage: {
    width: width, // Takes full width of screen
    height: 400,
  },

    gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // 👈 Controls how far down the fade goes
    paddingTop: 15, // 👈 Pushes the buttons down below the status bar
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
    height:40,
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

    locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-end'
  },

  locationText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },

  readMore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 8,
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
    paddingBottom: 30, // Extra padding for iPhone home indicator
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