import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { FlatList } from 'react-native';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../components/ProductCard';
import { products } from '../data/mockProducts'; 

  // --- MOCK DATA ---
const categories= ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

export default function MarketplaceHomeScreen() {

const [activeCategory, setActiveCategory] = React.useState('All');
const [activeTab, setActiveTab] = React.useState('marketplace'); 
const [userRole, setUserRole] = React.useState('provider');
const [sortOption, setSortOption] = React.useState('Newest');
const [isDropdownVisible, setIsDropdownVisible] = React.useState(false);
const [searchQuery, setSearchQuery] = React.useState('');

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];

// --- FILTER AND SORT LOGIC ---
const getProcessedProducts = () => {
  // 1. Filter by Category
  let filtered = products.filter((product) => {
    if (activeCategory === 'All') return true;
    return product.category === activeCategory;
  });

  // 2. Filter by Search Query (Case-insensitive)
  if (searchQuery.trim() !== '') {
    filtered = filtered.filter((product) => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }

  // 3. Sort
  if (sortOption === 'Price: Low to High') {
    filtered.sort((a, b) => a.numericPrice - b.numericPrice);
  } else if (sortOption === 'Price: High to Low') {
    filtered.sort((a, b) => b.numericPrice - a.numericPrice);
  } else if (sortOption === 'Highest Rated') {
    filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }
  
  return filtered;
};

const displayProducts = getProcessedProducts();

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
          <TextInput 
            placeholder="Search Products..." 
            style={styles.placeholder}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
          {/* CLEAR BUTTON */}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
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
        <Text style={styles.result}>{displayProducts.length} results</Text>
        <TouchableOpacity style={styles.sortbtn} onPress={() => setIsDropdownVisible(true)}>
          <Text style={styles.sortText}>Sort: {sortOption}</Text>
          <Ionicons name="caret-down" size={15} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 3. PRODUCT GRID */}
      <View style={styles.productGridContainer}>
        <FlatList 
         data={displayProducts}
         renderItem={({ item }) => <ProductCard item={item} />}
         keyExtractor={(item) => item.id}
         numColumns={2}
         columnWrapperStyle={styles.row}
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingBottom: 80 }} 
         ListEmptyComponent={
           <View style={{ alignItems: 'center', marginTop: 40 }}>
             <Text style={{ fontSize: 16, color: '#64748B' }}>No products found.</Text>
           </View>
         }
        />

        {/* 4. FLOATING ACTION BUTTON (FAB) */}
       {userRole === 'provider' && (
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

       {/* 5. BOTTOM NAVIGATION */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* --- SORT DROPDOWN MODAL --- */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            
            <View style={styles.dropdownMenu}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSortOption(option);
                    setIsDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownText, 
                    sortOption === option && styles.dropdownTextActive
                  ]}>
                    {option}
                  </Text>
                  {sortOption === option && (
                    <Ionicons name="checkmark" size={16} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
    flex: 1, 
    color:"#0F172A8D"
  },

  placeholder:{
      fontSize: 15, 
      flex: 1,
      paddingVertical: 0, 
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
    bottom: 15, 
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  
  dropdownMenu: {
    position: 'absolute',
    top: 220, 
    right: 15, 
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  dropdownText: {
    fontSize: 14,
    color: '#0F172A',
  },

  dropdownTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
})