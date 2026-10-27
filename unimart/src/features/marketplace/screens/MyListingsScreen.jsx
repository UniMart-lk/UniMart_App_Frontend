import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { products } from '../data/mockData';

const { width } = Dimensions.get('window');

export default function MyListingsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'drafts' | 'sold'
  const [myProducts, setMyProducts] = useState(() => {
    // Show products where providerType is student or user provider items, default to mockData
    return products.map((item, idx) => ({
      ...item,
      viewsCount: 24 + idx * 17,
      status: idx === 3 ? 'sold' : 'active',
      inquiriesCount: 2 + idx,
    }));
  });

  const activeCount = myProducts.filter((p) => p.status === 'active').length;
  const soldCount = myProducts.filter((p) => p.status === 'sold').length;
  const draftsCount = 1; // 1 saved draft

  const displayedListings = myProducts.filter((item) => {
    if (activeTab === 'active') return item.status === 'active';
    if (activeTab === 'sold') return item.status === 'sold';
    return false;
  });

  const handleMarkAsSold = (id) => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold? It will no longer appear in the active marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          onPress: () => {
            setMyProducts((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: 'sold' } : item
              )
            );
          },
        },
      ]
    );
  };

  const handleDeleteListing = (id, title) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to remove "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMyProducts((prev) => prev.filter((item) => item.id !== id));
            // Also remove from products in mockData if present
            const index = products.findIndex((p) => p.id === id);
            if (index > -1) {
              products.splice(index, 1);
            }
          },
        },
      ]
    );
  };

  const renderListingCard = ({ item }) => {
    const isSold = item.status === 'sold';

    return (
      <TouchableOpacity
        style={[styles.listingCard, isSold && styles.listingCardSold]}
        onPress={() =>
          router.push({
            pathname: '/productDetails',
            params: { id: item.id },
          })
        }
        activeOpacity={0.85}
      >
        {/* Left: Thumbnail with status badge */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{
              uri:
                item.images && item.images.length > 0
                  ? item.images[0]
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
            }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {isSold ? (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </View>
          ) : (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>{item.condition}</Text>
            </View>
          )}
        </View>

        {/* Right: Info and Actions */}
        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardDate}>2 days ago</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.cardPrice}>{item.price}</Text>

          {/* Stats row (views & inquiries) */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={13} color="#64748B" />
              <Text style={styles.statText}>{item.viewsCount || 38} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color="#64748B" />
              <Text style={styles.statText}>{item.inquiriesCount || 3} inquiries</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {!isSold && (
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => handleMarkAsSold(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={14} color="#059669" />
                <Text style={styles.actionBtnSecondaryText}>Mark Sold</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() =>
                router.push({
                  pathname: '/productDetails',
                  params: { id: item.id },
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={14} color="#2563EB" />
              <Text style={styles.actionBtnPrimaryText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => handleDeleteListing(item.id, item.title)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* --- 1. HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Listings</Text>
        </View>
      </View>

      {/* --- 2. STATS SUMMARY ROW --- */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active Items</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>142</Text>
          <Text style={styles.summaryLabel}>Total Views</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{soldCount}</Text>
          <Text style={styles.summaryLabel}>Items Sold</Text>
        </View>
      </View>

      {/* --- 3. FILTER TABS --- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}
          >
            Active ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drafts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drafts')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'drafts' && styles.tabTextActive]}
          >
            Drafts ({draftsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sold' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sold')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}
          >
            Sold ({soldCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- 4. LISTINGS FEED --- */}
      {activeTab === 'drafts' ? (
        <View style={styles.draftsContainer}>
          <View style={styles.draftCard}>
            <View style={styles.draftIconWrap}>
              <Ionicons name="document-text-outline" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftTitle}>Unpublished Draft</Text>
              <Text style={styles.draftSubtitle}>
                Engineering Graphics Kit • Saved today
              </Text>
            </View>
            <TouchableOpacity
              style={styles.draftResumeBtn}
              onPress={() => router.push('/postProduct')}
            >
              <Text style={styles.draftResumeText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={displayedListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                  ? "You don't have any active listings currently. Post an item to start selling on campus."
                  : 'You have not marked any items as sold yet.'}
              </Text>
              {activeTab === 'active' && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => router.push('/postProduct')}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Post a Product</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/postProduct')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },

  backButton: {
    padding: 6,
    marginLeft: -6,
  },

  headerTitleWrap: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  headerPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },

  headerPostBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Summary Metrics
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },

  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '70%',
    alignSelf: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },

  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },

  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // Listing Cards
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 80,
    gap: 12,
  },

  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  listingCardSold: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
  },

  thumbnailContainer: {
    width: 95,
    height: 95,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  conditionBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  conditionBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0F172A',
  },

  soldBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  soldBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardCategory: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },

  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statText: {
    fontSize: 11,
    color: '#64748B',
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },

  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },

  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  actionBtnDelete: {
    padding: 4,
  },

  // Drafts
  draftsContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },

  draftIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  draftTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  draftSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  draftResumeBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  draftResumeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },

  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
