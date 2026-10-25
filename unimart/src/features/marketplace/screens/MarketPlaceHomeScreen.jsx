<<<<<<< HEAD
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native'
=======
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native'
>>>>>>> b1df116591788878b02e77674380e84707345c44
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { FlatList } from 'react-native';
<<<<<<< HEAD
import { router } from 'expo-router';
import { useChat } from '@/features/chat/ChatContext';
=======
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../components/ProductCard';
import { products } from '../data/mockData'; 
>>>>>>> b1df116591788878b02e77674380e84707345c44

  // --- MOCK DATA ---
const categories= ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

<<<<<<< HEAD
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

export default function MarketPlaceHomeScreen() {
  const { createOrGetConversation, unreadTotal } = useChat();
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [activeTab, setActiveTab] = React.useState('marketplace');

  const handleProductPress = (item) => {
    Alert.alert(
      item.title,
      `${item.price} • ${item.condition}\nLocation: ${item.location}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: '💬 Chat with Seller',
          onPress: () => {
            const sellerName = item.providerType === 'student' ? 'Student Seller' : 'Campus Merchant';
            const convId = createOrGetConversation({
              name: `${sellerName} (${item.title.split(' ')[0]})`,
              role: 'seller',
              badge: item.providerType === 'student' ? 'Student Seller' : 'Verified Merchant',
              item: {
                id: item.id,
                title: item.title,
                price: item.price,
                category: 'Marketplace',
                image: item.image,
                location: item.location,
              },
            });
            router.push({ pathname: '/chat/[id]', params: { id: convId } });
          },
        },
      ]
    );
  };

  // Render individual product card
  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={() => handleProductPress(item)}
    >
      {/* Image & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        
        {/* Condition Badge */}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>
=======
export default function MarketplaceHomeScreen() {

const [activeCategory, setActiveCategory] = React.useState('All');
const [activeTab, setActiveTab] = React.useState('marketplace'); 
const [userRole, setUserRole] = React.useState('provider');
const [sortOption, setSortOption] = React.useState('Newest');
const [isDropdownVisible, setIsDropdownVisible] = React.useState(false);
const [searchQuery, setSearchQuery] = React.useState('');

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];
>>>>>>> b1df116591788878b02e77674380e84707345c44

// --- FILTER AND SORT LOGIC ---
const getProcessedProducts = () => {
  // 1. Filter by Category
  let filtered = products.filter((product) => {
    if (activeCategory === 'All') return true;
    return product.category === activeCategory;
  });

<<<<<<< HEAD
      {/* Details */}
      <View style={styles.cardDetails}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>

        {/* Provider Badge & Chat Shortcut */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[styles.providerBadge, item.providerType === 'external' ? styles.bgTeal : styles.bgPurple]}>
            <Text style={styles.providerIcon}>{item.providerType === 'external' ? <MaterialCommunityIcons name="earth" size={12} color="#FFFFFF" /> : <Ionicons name="school" size={12} color="#FFFFFF" />}</Text>
          </View>
          <TouchableOpacity
            style={styles.quickChatIconBtn}
            onPress={() => handleProductPress(item)}
            accessibilityLabel={`Chat about ${item.title}`}
          >
            <Ionicons name="chatbubble-ellipses" size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
=======
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
>>>>>>> b1df116591788878b02e77674380e84707345c44

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

      {/* 1. HEADER */}
      <View style={styles.header}>                    
        <TouchableOpacity onPress={() => router.push('/home')}>
          <Ionicons name='arrow-back' size={24} color="#0F172A" />
        </TouchableOpacity>
       
        <View>
          <Text style={{fontSize: 20, fontWeight:'bold', color: '#0F172A' }}>Marketplace</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/chat')}
          style={{ position: 'relative', padding: 4 }}
          accessibilityLabel="Open messages"
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#2563EB" />
          {unreadTotal > 0 && (
            <View style={styles.headerChatBadge}>
              <Text style={styles.headerChatBadgeText}>{unreadTotal}</Text>
            </View>
          )}
        </TouchableOpacity>
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
<<<<<<< HEAD
      <View style={styles.bottomNavConatiner}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <View style={styles.inactiveIconBg}>
            <Ionicons name="home-sharp" size={24} color="#64748B" />
          </View>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('marketplace')}>
          <View style={styles.activeIconBg}>
            <Ionicons name="storefront" size={24} color="#2563EB" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>Marketplace</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/pages/myBookings')}>
          <View style={styles.inactiveIconBg}>
            <Ionicons name="car" size={24} color="#64748B" />
          </View>
          <Text style={styles.navText}>Rentals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat')}>
          <View style={styles.inactiveIconBg}>
            <View>
              <Ionicons name="chatbox" size={24} color="#64748B" />
              {unreadTotal > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{unreadTotal}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <View style={styles.inactiveIconBg}>
            <Ionicons name="person" size={24} color="#64748B" />
          </View>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
=======
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
>>>>>>> b1df116591788878b02e77674380e84707345c44

   </SafeAreaView>
 
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
     backgroundColor: '#F8FAFC'
  },

  header:{
    flex: 1.3,
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

<<<<<<< HEAD
  navBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' },
  quickChatIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerChatBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChatBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
=======
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
>>>>>>> b1df116591788878b02e77674380e84707345c44
  },
})