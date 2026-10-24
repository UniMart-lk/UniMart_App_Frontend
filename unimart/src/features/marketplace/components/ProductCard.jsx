import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProductCard({ item }) {
  return (
   <TouchableOpacity style={styles.cardContainer}>
         {/* Image & Badges */}
         <View style={styles.imageContainer}>
           <Image source={{ uri: item.image }} style={styles.image} />
           
           {/* Condition Badge */}
           <View style={styles.conditionBadge}>
             <Text style={styles.conditionText}>{item.condition}</Text>
           </View>
   
           {/* Heart Icon (Mock) */}
           <View style={styles.heartIcon}>
             <Ionicons name="heart-outline" size={15} color="#0F172A" />
           </View>
         </View>
   
         {/* Details */}
         <View style={styles.cardDetails}>
           <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
           <Text style={styles.productPrice}>{item.price}</Text>
           
           <View style={styles.locationRow}>
             <Ionicons name="location" size={12} color="#EF4444" style={{ marginRight: 4 }} 
     />
             <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
           </View>
   
           {/* Provider Badge */}
           <View style={[styles.providerBadge, item.providerType === 'external' ? styles.bgTeal : styles.bgPurple]}>
             <Text style={styles.providerIcon}>{item.providerType === 'external' ? <MaterialCommunityIcons name="earth" size={12} color="#FFFFFF" /> : <Ionicons name="school" size={12} color="#FFFFFF" />}</Text>
           </View>
         </View>
       </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    cardContainer: {
    width: '48%', // 2 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  imageContainer: { 
    width: '100%', 
    aspectRatio: 1, 
    position: 'relative' 
  },

  image: { 
    width: '100%', 
    height: '100%' 
  },

  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  conditionText: { 
    fontSize: 10, 
    fontWeight: '500',
     color: '#0F172A' 
  },

  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardDetails: { padding: 12 },
  productTitle: { fontSize: 14, fontWeight: '500', color: '#0F172A', marginBottom: 4, minHeight: 40 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#2563EB', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationText: { fontSize: 11, color: '#64748B', flex: 1 },
  
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bgPurple: { backgroundColor: '#8B5CF6' },
  bgTeal: { backgroundColor: '#06B6D4' },
});