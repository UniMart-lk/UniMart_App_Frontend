import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRentalFeed } from '../services/rentalService';
import RentalCard from '../components/RentalCard';
import RentalMap from '../components/RentalMap';

// Defined outside the component so FlatList receives the same function on every render
const keyExtractor = (item) => String(item.id);

// Rentals from `page` that are not already in `existing` (or earlier in `page`), keeping the first copy.
// Compared by list key, so 5 and '5' are the same rental; duplicate keys would break FlatList rendering.
function withoutDuplicates(page, existing = []) {
  const seen = new Set(existing.map(keyExtractor));
  return page.filter((rental) => {
    const key = keyExtractor(rental);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const VIEW_OPTIONS = [
  { value: 'list', label: 'List View' },
  { value: 'map', label: 'Map View' },
];

export default function RentalFeedScreen() {
  const insets = useSafeAreaInsets();

  const [rentals, setRentals] = useState([]);
  // 'list' (default) or 'map'; both views show the same loaded rentals
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cursor for the next page; null means there are no more pages
  const [nextCursor, setNextCursor] = useState(null);
  const hasMore = nextCursor !== null;
  // Drives the pagination footer (the ref below is the request guard)
  const [loadingMore, setLoadingMore] = useState(false);
  // Message shown in the footer when the next page fails; the rentals already loaded stay visible
  const [loadMoreError, setLoadMoreError] = useState(null);
  // Pull-to-refresh indicator, kept separate from the full-screen initial loading state
  const [refreshing, setRefreshing] = useState(false);
  // Non-blocking message shown above the list when a refresh fails
  const [refreshError, setRefreshError] = useState(null);

  // Each request gets an id; only the latest request may update state.
  // Bumping the id on unmount makes any in-flight request outdated.
  const latestRequestId = useRef(0);
  // Synchronous guard so two next-page requests never run at the same time
  const isLoadingMore = useRef(false);
  // Cursor of the last page that loaded successfully. An onEndReached from the previous
  // render can still hold that cursor until React re-renders, so it must not be requested twice.
  const lastLoadedCursor = useRef(null);
  // Synchronous guard so repeated pulls never start concurrent first-page refreshes
  const isRefreshing = useRef(false);

  const loadRentals = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    // A first-page (re)load replaces the list, so any next-page or refresh request in flight is now outdated
    isLoadingMore.current = false;
    isRefreshing.current = false;
    lastLoadedCursor.current = null;
    setLoadingMore(false);
    setLoadMoreError(null);
    setRefreshing(false);
    setRefreshError(null);
    setLoading(true);
    setError(null);

    try {
      const { rentals: firstPage, nextCursor: firstCursor } = await getRentalFeed();

      if (requestId === latestRequestId.current) {
        setRentals(withoutDuplicates(firstPage));
        setNextCursor(firstPage.length > 0 ? firstCursor : null);
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

  const refreshRentals = useCallback(async () => {
    if (loading || isRefreshing.current) {
      return;
    }

    const requestId = ++latestRequestId.current;
    // The refreshed first page replaces the list, so any next-page request in flight is now outdated
    // and previously loaded cursors may be requested again
    isRefreshing.current = true;
    isLoadingMore.current = false;
    lastLoadedCursor.current = null;
    setLoadingMore(false);
    setLoadMoreError(null);
    setRefreshing(true);
    setRefreshError(null);

    try {
      const { rentals: firstPage, nextCursor: firstCursor } = await getRentalFeed();

      if (requestId === latestRequestId.current) {
        setRentals(withoutDuplicates(firstPage));
        setNextCursor(firstPage.length > 0 ? firstCursor : null);
      }
    } catch (err) {
      // Keep the rentals already on screen; only report that the refresh failed
      if (requestId === latestRequestId.current) {
        setRefreshError(err?.message || 'Something went wrong while refreshing rentals.');
      }
    } finally {
      if (requestId === latestRequestId.current) {
        isRefreshing.current = false;
        setRefreshing(false);
      }
    }
  }, [loading]);

  const loadMoreRentals = useCallback(async () => {
    if (
      loading ||
      error ||
      !hasMore ||
      isRefreshing.current ||
      isLoadingMore.current ||
      nextCursor === lastLoadedCursor.current
    ) {
      return;
    }

    isLoadingMore.current = true;
    setLoadingMore(true);
    // Belongs to the current feed; outdated if the first page reloads or the screen unmounts
    const requestId = latestRequestId.current;
    const cursor = nextCursor;

    try {
      const { rentals: nextPage, nextCursor: newCursor } = await getRentalFeed({ cursor });

      if (requestId === latestRequestId.current) {
        lastLoadedCursor.current = cursor;
        // Skip rentals already shown (e.g. data changed on the server between requests)
        setRentals((current) => [...current, ...withoutDuplicates(nextPage, current)]);
        // Stop paging on an empty page or a cursor that did not move, to avoid a request loop.
        // Uses the page as received, so a page that only repeats shown rentals still moves on.
        setNextCursor(nextPage.length === 0 || newCursor === cursor ? null : newCursor);
        setLoadMoreError(null);
      }
    } catch (err) {
      // Keep the loaded rentals and the cursor so Retry requests this same page again
      console.warn('Failed to load more rentals:', err?.message);
      if (requestId === latestRequestId.current) {
        setLoadMoreError(err?.message || 'Something went wrong while loading more rentals.');
      }
    } finally {
      if (requestId === latestRequestId.current) {
        isLoadingMore.current = false;
        setLoadingMore(false);
      }
    }
  }, [loading, error, hasMore, nextCursor]);

  // While a page error is shown, scrolling does not retry on its own; the footer Retry button does
  const handleEndReached = useCallback(() => {
    if (!loadMoreError) {
      loadMoreRentals();
    }
  }, [loadMoreError, loadMoreRentals]);

  useEffect(() => {
    loadRentals();

    return () => {
      latestRequestId.current += 1;
    };
  }, [loadRentals]);

  const renderItem = useCallback(({ item }) => <RentalCard item={item} />, []);

  const isMapView = viewMode === 'map';

  // The map is created the first time Map View opens (list-only visits never load Google Maps),
  // then stays mounted and hidden in List View so its pan and zoom survive switching
  const [hasOpenedMap, setHasOpenedMap] = useState(false);
  const selectView = useCallback((mode) => {
    setViewMode(mode);
    if (mode === 'map') {
      setHasOpenedMap(true);
    }
  }, []);

  // Rentals given to the map. While the map is hidden they stay as they were, so pages loaded in the list
  // do not recluster or move a map nobody can see; it catches up when Map View opens again.
  const [mapRentals, setMapRentals] = useState(rentals);
  if (isMapView && mapRentals !== rentals) {
    setMapRentals(rentals);
  }

  // Stable style arrays, so the memoized RentalMap skips re-rendering while its props are unchanged
  const mapStyle = useMemo(() => [styles.map, { marginBottom: Math.max(insets.bottom, 16) }], [insets.bottom]);
  const hiddenMapStyle = useMemo(() => [mapStyle, styles.hidden], [mapStyle]);

  const refreshErrorBanner = refreshError ? (
    <View style={styles.refreshErrorBanner} accessibilityRole="alert">
      <Text style={styles.refreshErrorText}>{`Couldn't refresh rentals. ${refreshError}`}</Text>
    </View>
  ) : null;

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
      <>
        {refreshErrorBanner}
        {/* The list stays mounted but hidden in Map View, so its scroll position and rendered cards survive
            switching views. It keeps the same place in the tree in both views, so React never remounts it. */}
        <FlatList
          style={isMapView ? styles.hidden : undefined}
          data={rentals}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) },
            rentals.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={<Text style={styles.statusText}>No rentals available</Text>}
          // Rendering performance: keep ~5 screens of cards mounted and render new cards 5 at a time
          windowSize={5}
          maxToRenderPerBatch={5}
          // Pull-to-refresh: reload the first page and replace the list
          refreshing={refreshing}
          onRefresh={refreshRentals}
          // Infinite scroll: request the next page when within half a screen of the end.
          // Off while hidden: a hidden list measures 0 px tall and would otherwise load pages nobody sees.
          onEndReached={isMapView ? undefined : handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.footerText}>Loading more rentals...</Text>
              </View>
            ) : loadMoreError ? (
              <View style={styles.footerError} accessibilityRole="alert">
                <Text style={styles.footerErrorText}>{`Couldn't load more rentals. ${loadMoreError}`}</Text>
                <Pressable
                  style={({ pressed }) => [styles.footerRetryButton, pressed && styles.retryButtonPressed]}
                  onPress={() => loadMoreRentals()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading more rentals"
                >
                  <Text style={styles.footerRetryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
        {/* Map of the rentals loaded so far; loading, error and refresh states stay shared with the list.
            Hidden (not unmounted) in List View, in the same place in the tree, so the native map keeps its camera. */}
        {hasOpenedMap ? <RentalMap rentals={mapRentals} style={isMapView ? mapStyle : hiddenMapStyle} /> : null}
      </>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rentals</Text>
        <Text style={styles.headerSubtitle}>Vehicles and equipment near your university</Text>

        <View style={styles.viewToggle}>
          {VIEW_OPTIONS.map((option) => {
            const selected = viewMode === option.value;
            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.viewToggleButton,
                  selected && styles.viewToggleButtonSelected,
                  pressed && !selected && styles.viewToggleButtonPressed,
                ]}
                onPress={() => selectView(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Show ${option.label}`}
              >
                <Text style={[styles.viewToggleText, selected && styles.viewToggleTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
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
  viewToggle: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  viewToggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewToggleButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  viewToggleButtonPressed: {
    opacity: 0.7,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  viewToggleTextSelected: {
    color: '#2563EB',
  },
  map: {
    marginHorizontal: 16,
    borderRadius: 16,
  },
  hidden: {
    display: 'none',
  },
  listContent: {
    paddingTop: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshErrorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  refreshErrorText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748B',
  },
  footerError: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  footerErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
  },
  footerRetryButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  footerRetryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
