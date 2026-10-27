import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { products } from '../data/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProductReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [helpfulMap, setHelpfulMap] = useState({});

  // Locate the product by ID or fallback
  const product = id
    ? products.find((p) => p.id === id)
    : (products.find((p) => p.id === '2') || products[0]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>
        <Text style={styles.emptyText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const allReviews = product.reviews || [];
  const reviewsCountDisplay = product.reviewsCount || `${allReviews.length}`;
  const averageRating = parseFloat(product.rating || '4.8');

  // Filter reviews
  const filteredReviews = allReviews.filter((item) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === '5 ★') return item.rating >= 4.8;
    if (selectedFilter === '4 ★') return item.rating >= 4.0 && item.rating < 4.8;
    if (selectedFilter === '3 ★') return item.rating >= 3.0 && item.rating < 4.0;
    return true;
  });

  const toggleHelpful = (reviewId) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const renderStars = (ratingScore, size = 14) => {
    const full = Math.floor(ratingScore);
    const hasHalf = ratingScore % 1 >= 0.3;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#F59E0B" style={{ marginRight: 2 }} />
        );
      } else if (i === full + 1 && hasHalf) {
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#F59E0B" style={{ marginRight: 2 }} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#CBD5E1" style={{ marginRight: 2 }} />
        );
      }
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderReviewItem = ({ item }) => {
    const isHelpful = helpfulMap[item.id];
    return (
      <View style={styles.reviewCard}>
        {/* Header: Avatar, Name, Verified Badge, Date */}
        <View style={styles.reviewerRow}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.reviewerAvatar} />
          ) : (
            <View style={styles.reviewerAvatarFallback}>
              <Text style={styles.reviewerAvatarText}>
                {item.name ? item.name.charAt(0) : 'U'}
              </Text>
            </View>
          )}

          <View style={styles.reviewerMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.reviewerName}>{item.name}</Text>
              <Text style={styles.reviewDate}>{item.date}</Text>
            </View>

            <View style={styles.ratingAndVerifiedRow}>
              {renderStars(item.rating, 13)}
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Verified Buyer</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Comment Text */}
        <Text style={styles.reviewComment}>{item.comment}</Text>

        {/* Footer: Helpful button */}
        <View style={styles.reviewFooter}>
          <TouchableOpacity
            style={[styles.helpfulBtn, isHelpful && styles.helpfulBtnActive]}
            activeOpacity={0.7}
            onPress={() => toggleHelpful(item.id)}
          >
            <Ionicons
              name={isHelpful ? "thumbs-up" : "thumbs-up-outline"}
              size={13}
              color={isHelpful ? "#2563EB" : "#64748B"}
            />
            <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
              Helpful {isHelpful ? '(1)' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{product.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Scrollable Reviews List */}
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Rating Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryScoreCol}>
                <Text style={styles.bigScoreText}>{averageRating.toFixed(1)}</Text>
                {renderStars(averageRating, 18)}
                <Text style={styles.basedOnText}>
                  Based on {reviewsCountDisplay} reviews
                </Text>
              </View>

              <View style={styles.summaryBarsCol}>
                {[
                  { star: '5', pct: '82%' },
                  { star: '4', pct: '12%' },
                  { star: '3', pct: '4%' },
                  { star: '2', pct: '1%' },
                  { star: '1', pct: '1%' },
                ].map((row) => (
                  <View key={row.star} style={styles.barRow}>
                    <Text style={styles.barLabel}>{row.star}</Text>
                    <Ionicons name="star" size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: row.pct }]} />
                    </View>
                    <Text style={styles.barPercent}>{row.pct}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>
                All Reviews ({filteredReviews.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}
              >
                {['All', '5 ★', '4 ★', '3 ★'].map((filter) => {
                  const isActive = selectedFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setSelectedFilter(filter)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                      >
                        {filter === 'All' ? `All (${reviewsCountDisplay})` : filter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No reviews found for this filter</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listContentContainer: {
    paddingBottom: 40,
  },
  listHeader: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  summaryScoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 18,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    width: '42%',
  },
  bigScoreText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basedOnText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryBarsCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    width: 10,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  barPercent: {
    fontSize: 10,
    color: '#64748B',
    width: 24,
    textAlign: 'right',
  },
  filterSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  reviewerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  reviewerMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  ratingAndVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    marginTop: 2,
    marginBottom: 10,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  helpfulBtnActive: {
    backgroundColor: '#EFF6FF',
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  helpfulTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
});
