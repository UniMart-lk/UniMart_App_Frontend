import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { FlatList } from 'react-native';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../components/ProductCard';

  // --- MOCK DATA ---
const categories= ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

const products = [
  {
    id: '1',
    title: 'Calculus Textbook',
    price: 'LKR 1,500',
    condition: 'Like New',
    location: 'Sabaragamuwa Uni',
    providerType: 'student', // 'student' or 'external',
    rating: '4.8', 
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
  },
  {
    id: '2',
    title: 'iPhone 11 64GB',
    price: 'LKR 85,000',
    condition: 'Good',
    location: 'Kandy',
    providerType: 'external',
    rating: '4.9', 
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
  },
  {
    id: '3',
    title: 'Wooden Study Table',
    price: 'LKR 8,500',
    condition: 'Used',
    location: 'Belihuloya',
    providerType: 'student',
    rating: '4.5', 
    category: 'Furniture',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80',
  },
  {
    id: '4',
    title: 'Mountain Bike',
    price: 'LKR 22,000',
    condition: 'Like New',
    location: 'Balangoda',
    providerType: 'student',
    rating: '4.8', 
    category: 'Bicycles',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
  },
];

export default function MarketplaceHomeScreen() {

const [activeCategory, setActiveCategory] = React.useState('All');
const [activeTab, setActiveTab] = React.useState('marketplace'); // Default to marketplace
const [userRole, setUserRole] = React.useState('provider');
  const filteredProducts = products.filter((product) => {
    if (activeCategory === 'All') return true;
    return product.category === activeCategory;
  });

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
        <Text style={styles.result}>results: {filteredProducts.length} </Text>
        <TouchableOpacity style={styles.sortbtn}>
          <Text style={styles.sortText}>Sort: Newest</Text>
          <Ionicons name="caret-down" size={15} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 3. PRODUCT GRID */}
      <View style={styles.productGridContainer}>
        <FlatList 
         data={filteredProducts}
         renderItem={({ item }) => <ProductCard item={item} />}
         keyExtractor={(item) => item.id}
         numColumns={2}
         columnWrapperStyle={styles.row}
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingBottom: 15 }} />

        {/* 4. FLOATING ACTION BUTTON (FAB) */}
       {userRole === 'provider' && (
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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
    marginBottom: 10,
  },

  row: { 
    justifyContent: 'space-between', 
    marginBottom: 15
  },

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