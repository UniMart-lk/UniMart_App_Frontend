import React from 'react';
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <Text>UniMart Home</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }
});
