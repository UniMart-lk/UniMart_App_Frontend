import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, BackHandler, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, FlatList } from 'react-native';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../components/ProductCard';
import FilterModal from '../components/FilterModal'; // 👈 Import FilterModal
import { products as fallbackProducts } from '../data/mockData';
import { useRouter, useFocusEffect } from 'expo-router';
import marketplaceService from '../../../services/marketplaceService';
import authService from '../../../services/authService';

const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Sports'];

export default function MarketplaceHomeScreen() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isProvider, setIsProvider] = useState(false);
  const [sortOption, setSortOption] = useState('Newest');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 👇 Filter Modal States
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    maxPrice: 100000,
    conditions: [],
    providerType: 'All',
    minRating: 0,
  });

  const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];

  const checkUserRole = useCallback(async () => {
    try {
      const user = await authService.getStoredUser();
      const role = (user?.role || '').toUpperCase();
      const hasProviderProfile = !!user?.providerProfile;
      const userIsProvider = role === 'PROVIDER' || role === 'ADMIN' || hasProviderProfile;
      setIsProvider(userIsProvider);
    } catch {
      setIsProvider(false);
    }
  }, []);

  const fetchLiveProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const data = await marketplaceService.getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProductsList(data);
      }
    } catch (err) {
      console.warn('Error fetching live marketplace products:', err.message);
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkUserRole();
      fetchLiveProducts();
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [checkUserRole, fetchLiveProducts])
  );

  const getProcessedProducts = () => {
    let filtered = productsList.filter((product) => {
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

      // 6. Provider Type Filter
      if (appliedFilters.providerType && appliedFilters.providerType !== 'All') {
        const expectedType = appliedFilters.providerType.toLowerCase();
        if (product.providerType !== expectedType) return false;
      }

      return true;
    });

    // 7. Search Query Filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    // 8. Sorting
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
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Marketplace</Text>

        {/* Spacer to keep title centered */}
        <View style={styles.backButton} />
      </View>

      {/* 2. SEARCH BAR + INBOX BUTTON */}
      <View style={styles.searchRow}>
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

        {/* INBOX ICON BUTTON */}
        <TouchableOpacity
          style={styles.inboxBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {categories.map((cat) => (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLiveProducts(true)}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />

        {/* 4. FLOATING ACTION BUTTONS */}
        {isProvider && (
          <>
            {/* My Listings FAB — above the add button */}
            <TouchableOpacity
              style={styles.fabMyListings}
              activeOpacity={0.85}
              onPress={() => router.push('/myListings')}
            >
              <Ionicons name="storefront-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Add Product FAB */}
            <TouchableOpacity
              style={styles.fab}
              activeOpacity={0.85}
              onPress={() => router.push('/postProduct')}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </>
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
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    paddingVertical: 12,
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

  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtn: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 5,
    marginHorizontal: 15,
    gap: 10,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  inboxBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  fabMyListings: {
    position: 'absolute',
    bottom: 86,
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

});