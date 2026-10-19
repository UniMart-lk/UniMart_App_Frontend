import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRentalFeed } from '../services/rentalService';
import RentalCard from '../components/RentalCard';

export default function RentalFeedScreen() {
  const insets = useSafeAreaInsets();

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Each request gets an id; only the latest request may update state.
  // Bumping the id on unmount makes any in-flight request outdated.
  const latestRequestId = useRef(0);

  const loadRentals = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const { rentals: firstPage } = await getRentalFeed();

      if (requestId === latestRequestId.current) {
        setRentals(firstPage);
      }
    } catch (err) {
      if (requestId === latestRequestId.current) {
        setError(err?.message || 'Something went wrong while loading rentals.');
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRentals();

    return () => {
      latestRequestId.current += 1;
    };
  }, [loadRentals]);

  const renderItem = useCallback(({ item }) => <RentalCard item={item} />, []);

  let content;

  if (loading) {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Loading rentals...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load rentals</Text>
        <Text style={styles.statusText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          onPress={loadRentals}
          accessibilityRole="button"
          accessibilityLabel="Retry loading rentals"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <FlatList
        data={rentals}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) },
          rentals.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={<Text style={styles.statusText}>No rentals available</Text>}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rentals</Text>
        <Text style={styles.headerSubtitle}>Vehicles and equipment near your university</Text>
      </View>

      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  listContent: {
    paddingTop: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
