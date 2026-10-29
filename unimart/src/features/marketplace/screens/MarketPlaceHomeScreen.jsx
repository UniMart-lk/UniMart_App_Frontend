import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, BackHandler } from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, FlatList } from 'react-native';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../components/ProductCard';
import FilterModal from '../components/FilterModal'; // 👈 Import FilterModal
import { products } from '../data/mockData'; 
import { useRouter, useFocusEffect } from 'expo-router';

const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

export default function MarketplaceHomeScreen() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('marketplace'); 
  const [userRole, setUserRole] = useState('provider'); 
  const [sortOption, setSortOption] = useState('Newest');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 👇 Filter Modal States
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    maxPrice: 100000,
    conditions: [],
    providerType: 'All',
    minRating: 0,
  });

  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuIconRef = useRef(null);

  const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const getProcessedProducts = () => {
    let filtered = products.filter((product) => {
      // 1. Horizontal Category Filter
      if (activeCategory !== 'All' && product.category !== activeCategory) return false;
      
      // 2. Modal Category Filter
      if (appliedFilters.category && product.category !== appliedFilters.category) return false;
      
      // 3. Max Price Filter
      if (product.numericPrice > appliedFilters.maxPrice) return false;
      
      // 4. Condition Filter
      if (appliedFilters.conditions.length > 0 && !appliedFilters.conditions.includes(product.condition)) return false;
      
      // 5. Rating Filter
      if (parseFloat(product.rating) < appliedFilters.minRating) return false;

      return true;
    });

    // 6. Search Query Filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((product) => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    // 7. Sorting
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

  const openMenu = () => {
    if (menuIconRef.current) {
      menuIconRef.current.measure((fx, fy, width, height, px, py) => {
        setMenuPosition({
          top: py + height + 8, 
          right: 15, 
        });
        setIsMenuVisible(true);
      });
    }
  };

  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

       {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Marketplace</Text>
        
        <TouchableOpacity 
          ref={menuIconRef}
          style={styles.backButton}
          onPress={openMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

       {/* 2. SEARCH BAR */}
      <View style={styles.searchBarContainer}>
        <Ionicons name='search-outline' size={20} color="#64748B" />
        <TextInput 
          placeholder="Search Products..." 
          style={styles.placeholder}
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
        <View style={styles.searchDivider} />
        
        {/* 👇 Opens Filter Modal */}
        <TouchableOpacity onPress={() => setIsFilterVisible(true)}>
          <Ionicons name="options-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {categories.map((cat) =>(
          <TouchableOpacity 
              key={cat} 
              style={[styles.chip, activeCategory === cat && styles.chipActive]} 
              onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>      
          </TouchableOpacity>
        ))}
      </ScrollView>

       {/* Results & Sort */}
      <View style={styles.resultsAndSortContainer}>
        <Text style={styles.result}>{displayProducts.length} results</Text>
        <TouchableOpacity style={styles.sortbtn} onPress={() => setIsDropdownVisible(true)}>
          <Text style={styles.sortText}>Sort: {sortOption}</Text>
          <Ionicons name="caret-down" size={14} color="#2563EB" />
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
         contentContainerStyle={{ paddingBottom: 120 }} 
         ListEmptyComponent={
           <View style={styles.emptyState}>
             <Ionicons name="search" size={40} color="#CBD5E1" />
             <Text style={styles.emptyText}>No products found.</Text>
           </View>
         }
        />

        {/* 4. FLOATING ACTION BUTTON (FAB) */}
       {userRole === 'provider' && (
          <TouchableOpacity 
            style={styles.fab}
            activeOpacity={0.85}
            onPress={() => router.push('/postProduct')}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
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

      {/* --- MORE MENU DROPDOWN --- */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            
            <View style={[styles.moreMenuBox, { top: menuPosition.top, right: menuPosition.right }]}>
              
              {userRole === 'provider' && (
                <>
                  <TouchableOpacity
                    style={styles.moreMenuItem}
                    onPress={() => {
                      setIsMenuVisible(false);
                      router.push('/myListings');
                    }}
                  >
                    <Ionicons name="storefront-outline" size={18} color="#2563EB" />
                    <Text style={[styles.moreMenuText, { color: '#2563EB', fontWeight: '600' }]}>
                      My Store
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.moreMenuItem}
                    onPress={() => {
                      setIsMenuVisible(false);
                    }}
                  >
                    <Ionicons name="chatbubbles-outline" size={18} color="#475569" />
                    <Text style={styles.moreMenuText}>Inbox</Text>
                  </TouchableOpacity>
                  
                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
                </>
              )}

              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                }}
              >
                <Ionicons name="settings-outline" size={18} color="#475569" />
                <Text style={styles.moreMenuText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                }}
              >
                <Ionicons name="help-circle-outline" size={18} color="#475569" />
                <Text style={styles.moreMenuText}>Help & Support</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- FILTER MODAL --- */}
      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          // Clear horizontal chip filter if they use the modal
          setActiveCategory('All'); 
        }}
        currentFilters={appliedFilters}
      />

   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor:'#E2E8F0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
  },

  searchBarContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  placeholder: {
    flex: 1,
    fontSize: 15, 
    paddingVertical: 0, 
    marginLeft: 10,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },

  chipScroll: { 
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
    flexGrow: 0
  },
  chipContainer: { 
    gap: 8
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipText: { 
    fontSize: 14, 
    color: '#475569',
    fontWeight: '500',
  },
  chipActive: { 
    backgroundColor: '#2563EB', 
  },
  chipTextActive: { 
    color: '#FFFFFF', 
    fontWeight: '600' 
  },

  resultsAndSortContainer: {
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  result: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  sortbtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  sortText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },

  productGridContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  row: { 
    justifyContent: 'space-between', 
    marginBottom: 15
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 20, 
    right: 5,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  
  dropdownMenu: {
    position: 'absolute',
    top: 210, 
    right: 15, 
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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

  moreMenuBox: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  moreMenuText: {
    fontSize: 14,
    color: '#0F172A',
  },
});