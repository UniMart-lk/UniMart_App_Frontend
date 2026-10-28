import React from 'react';
import { View, StyleSheet } from 'react-native';
import RentalFeedScreen from '@/features/rentals/screens/RentalFeedScreen';
import BottomNav from '@/components/BottomNav';

export default function RentalsRoute() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <RentalFeedScreen />
      </View>
      <BottomNav activeTab="rentals" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
