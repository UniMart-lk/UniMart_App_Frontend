import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={{ padding: 16 }}>UniMart Home</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }
});

styles.scrollContainer = { flex: 1, backgroundColor: '#F8FAFC' };
styles.scrollContent = { paddingBottom: 15 };
