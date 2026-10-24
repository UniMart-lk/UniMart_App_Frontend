import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { FlatList } from 'react-native';
import BottomNav from '../../../components/BottomNav';

  // --- MOCK DATA ---
const categories= ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

const products = [
  {
    id: '1',
    title: 'Calculus Textbook',
    price: 'LKR 1,500',
    condition: 'Like New',
    location: 'Sabaragamuwa Uni',
    providerType: 'student', // 'student' or 'external'
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
  },
  {
    id: '2',
    title: 'iPhone 11 64GB',
    price: 'LKR 85,000',
    condition: 'Good',
    location: 'Kandy',
    providerType: 'external',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
  },
  {
    id: '3',
    title: 'Wooden Study Table',
    price: 'LKR 8,500',
    condition: 'Used',
    location: 'Belihuloya',
    providerType: 'student',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80',
  },
  {
    id: '4',
    title: 'Mountain Bike',
    price: 'LKR 22,000',
    condition: 'Like New',
    location: 'Balangoda',
    providerType: 'student',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
  },
];

export default function MarketplaceHomeScreen() {

const [activeCategory, setActiveCategory] = React.useState('All');
const [activeTab, setActiveTab] = React.useState('marketplace'); // Default to marketplace

// Render individual product card
const renderProduct = ({ item }) => (
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

  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

       {/* 1. HEADER */}
      <View style={styles.header}>                    
        <TouchableOpacity>
          <Ionicons name='arrow-back' size={25} color="#0F172A" />
        </TouchableOpacity>
       
        <View>
         <Text style={{fontSize: 20, fontWeight:'bold', color: '#0F172A' }}>Marketplace</Text>
        </View>

        <View style={{width: 25, borderWidth:1, borderColor:'#ffffff'}}></View>

      </View>

       {/* 2. SEARCH & CATEGORIES */}
      <View style={styles.searchBarContainer}>
        <View style={styles.placeholderContainer}>
          <Ionicons name='search-outline' size={20} color="#0F172A8D" />
          <TextInput placeholder="Search Products..." style={styles.placeholder} />
        </View>

        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {categories.map ((cat) =>(
          <TouchableOpacity 
              key={cat} style={[styles.chip, activeCategory === cat && styles.chipActive]} 
              onPress={() =>setActiveCategory(cat)}>
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>      
          </TouchableOpacity>
        ))}
      </ScrollView>

       {/* Results & Sort */}
      <View style={styles.resultsAndSortContainer}>
        <Text style={styles.result}>1234 results</Text>
        <TouchableOpacity style={styles.sortbtn}>
          <Text style={styles.sortText}>Sort: Newest</Text>
          <Ionicons name="caret-down" size={15} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 3. PRODUCT GRID */}
      <View style={styles.productGridContainer}>
        <FlatList 
         data={products}
         renderItem={renderProduct}
         keyExtractor={(item) => item.id}
         numColumns={2}
         columnWrapperStyle={styles.row}
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingBottom: 15 }} />

        {/* 4. FLOATING ACTION BUTTON (FAB) */}
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

       {/* 5. BOTTOM NAVIGATION */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

   </SafeAreaView>
 
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
     backgroundColor: '#F8FAFC'
  },

  header:{
    flex: 1.4,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor:'#E2E8F0',
    paddingHorizontal: 15,
  },

  searchBarContainer:{
    flexDirection: 'row',
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 15,
  },

  placeholderContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    color:"#0F172A8D"
    
  },

  placeholder:{
      fontSize: 15, 
      width:'83%', 
  },

  chipScroll: { 
    marginHorizontal: 15,
    marginBottom: 20,
    flexGrow: 0
    
  },

  chipContainer: { 
    gap:8
  },

  chip:{
    paddingVertical: 5,
    paddingHorizontal:15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth:1,
    borderColor: '#E2E8F0'
  },

  chipText: { 
    fontSize: 15, 
    color: '#0F172A' 
  },

  chipActive: { 
    backgroundColor: '#2563EB', 
    borderColor: '#2563EB' 
  },

  chipTextActive: { 
    color: '#FFFFFF', 
    fontWeight: '500' },

  resultsAndSortContainer:{
    marginHorizontal:15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  result:{
    fontSize:12,
    color:'#0F172A',
    fontWeight: '500'
  },

  sortbtn:{
    padding: 5,
    flexDirection:'row',
    alignItems:'center',
    gap: 5

  },

  sortText:{
    color: '#2563EB',
    fontWeight:'500'
  },

  productGridContainer:{
    flex:10,
    marginHorizontal: 15,
    marginBottom: 10
  },

  cardContainer: {
    width: '48%', // 2 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  row: { 
    justifyContent: 'space-between', 
    marginBottom: 15
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

  fab: {
    position: 'absolute',
    bottom: 15, // Above bottom nav
    right: 15,
    width: 45,
    height: 45,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  fabIcon: { fontSize: 28, color: '#FFFFFF', marginTop: -2 },


})