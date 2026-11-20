import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import authService from '@/services/authService';
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }
});

styles.scrollContainer = { flex: 1, backgroundColor: '#F8FAFC' };
styles.scrollContent = { paddingBottom: 15 };
