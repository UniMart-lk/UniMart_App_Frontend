import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { formatRentalPrice } from './RentalCard';

// Smallest zoom span so a single rental (or rentals at one spot) is not zoomed in to street level
const MIN_REGION_DELTA = 0.02;
// Extra space around the outermost rentals so their pins are not on the map edge
const REGION_PADDING_FACTOR = 1.4;
// Largest spans react-native-maps accepts for a region
const MAX_LATITUDE_DELTA = 180;
const MAX_LONGITUDE_DELTA = 360;
// Duration of the camera move when the rental locations change
const REGION_ANIMATION_MS = 500;

// Plain decimal text such as "6.9271000", "-33.86" or "1e-7" (how a Prisma Decimal prints)
const DECIMAL_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

// Accept only numbers or decimal strings (e.g. an unconverted Prisma Decimal);
// Number() would turn null, '', true or [] into 0 or 1, and '0x1A' into 26, placing a pin at a wrong spot
function toCoordinateNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && DECIMAL_PATTERN.test(value.trim())) {
    return Number(value);
  }
  return NaN;
}

// Marker key for a rental, or null when the id is unusable ({} would become "[object Object]")
function toRentalKey(id) {
  if (typeof id === 'number') {
    return Number.isFinite(id) ? String(id) : null;
  }
  if (typeof id === 'string') {
    return id.trim() || null;
  }
  return null;
}

/**
 * Read a rental's pickup coordinates from the feed item
 * Only vehicle rentals have coordinates; equipment rentals have vehicle: null
 * @param {object} rental - rental feed item
 * @returns {{ latitude: number, longitude: number }|null} null when coordinates are missing or invalid
 */
export function getRentalCoordinate(rental) {
  const latitude = toCoordinateNumber(rental?.vehicle?.latitude);
  const longitude = toCoordinateNumber(rental?.vehicle?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  // 0,0 is in the ocean off Africa; treat it as a placeholder rather than a real pickup point
  if (latitude === 0 && longitude === 0) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Keep only rentals that can be placed on the map
 * @param {object[]} rentals - rental feed items
 * @returns {{ id: string, title: string, price: string|null, pickupLocation: string, coordinate: object, rental: object }[]}
 */
export function getRentalLocations(rentals) {
  if (!Array.isArray(rentals)) {
    return [];
  }

  const locations = [];
  const seenIds = new Set();

  rentals.forEach((rental) => {
    const coordinate = getRentalCoordinate(rental);
    const id = toRentalKey(rental?.id);
    if (!coordinate || id === null) {
      return;
    }

    // Marker keys must be unique; skip a rental repeated across pages
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    locations.push(toRentalLocation(rental, id, coordinate));
  });

  return locations;
}

// One location object per rental object. The feed keeps existing rental objects when it appends a page,
// so reusing their location objects lets the memoized markers skip re-rendering.
// Rentals are treated as immutable (React state); a refreshed rental is a new object and gets a new location.
const locationCache = new WeakMap();

function toRentalLocation(rental, id, coordinate) {
  const cached = locationCache.get(rental);
  if (cached && cached.id === id) {
    return cached;
  }

  const title = typeof rental.title === 'string' ? rental.title.trim() : '';
  const pickupLocation =
    typeof rental.vehicle?.pickupLocationName === 'string' ? rental.vehicle.pickupLocationName.trim() : '';

  const location = {
    id,
    title: title || 'Untitled rental',
    // null when the price is missing or invalid; the callout shows a fallback
    price: formatRentalPrice(rental.rentalPrice, rental.rentalPeriod),
    // empty string when there is no pickup name; the callout hides that line
    pickupLocation,
    coordinate,
    rental,
  };

  locationCache.set(rental, location);
  return location;
}

/**
 * Map region that fits all given coordinates
 * @param {{ latitude: number, longitude: number }[]} coordinates - must not be empty
 * @returns {{ latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number }}
 */
export function getRegionForCoordinates(coordinates) {
  let minLatitude = coordinates[0].latitude;
  let maxLatitude = coordinates[0].latitude;
  let minLongitude = coordinates[0].longitude;
  let maxLongitude = coordinates[0].longitude;

  coordinates.forEach(({ latitude, longitude }) => {
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
  });

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.min(
      Math.max((maxLatitude - minLatitude) * REGION_PADDING_FACTOR, MIN_REGION_DELTA),
      MAX_LATITUDE_DELTA
    ),
    longitudeDelta: Math.min(
      Math.max((maxLongitude - minLongitude) * REGION_PADDING_FACTOR, MIN_REGION_DELTA),
      MAX_LONGITUDE_DELTA
    ),
  };
}

/**
 * Compare regions by value (rounded to ~10 cm) instead of by object identity
 * @param {{ latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number }|null} region
 * @returns {string|null}
 */
export function getRegionKey(region) {
  if (!region) {
    return null;
  }

  return [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]
    .map((value) => value.toFixed(6))
    .join('|');
}

/**
 * One rental pin with its callout
 * Memoized: re-renders only when its location object or the select handler changes
 * @param {object} props
 * @param {object} props.location - item from getRentalLocations
 * @param {function} [props.onSelect] - called with the rental when the callout is tapped
 */
const RentalMarker = React.memo(function RentalMarker({ location, onSelect }) {
  const handleCalloutPress = useCallback(() => onSelect(location.rental), [onSelect, location]);

  return (
    <Marker
      coordinate={location.coordinate}
      // Tapping the pin opens the callout; tapping the callout selects the rental
      onCalloutPress={onSelect ? handleCalloutPress : undefined}
    >
      <Callout>
        <View style={styles.callout} accessibilityLabel={`${location.title}, ${location.price ?? 'Price not available'}`}>
          <Text style={styles.calloutTitle} numberOfLines={2}>
            {location.title}
          </Text>

          {location.price ? (
            <Text style={styles.calloutPrice}>{location.price}</Text>
          ) : (
            <Text style={styles.calloutPriceUnavailable}>Price not available</Text>
          )}

          {location.pickupLocation ? (
            <Text style={styles.calloutPickup} numberOfLines={2}>
              Pickup: {location.pickupLocation}
            </Text>
          ) : null}

          {onSelect ? <Text style={styles.calloutAction}>Tap to view details</Text> : null}
        </View>
      </Callout>
    </Marker>
  );
});

/**
 * Map of rental pickup locations
 * @param {object} props
 * @param {object[]} props.rentals - rental feed items (same shape as RentalFeedScreen uses)
 * @param {function} [props.onRentalPress] - called with the rental when its marker callout is tapped
 * @param {object} [props.style] - style for the outer container (give it a height or flex)
 */
function RentalMap({ rentals, onRentalPress, style }) {
  const locations = useMemo(() => getRentalLocations(rentals), [rentals]);

  // Region that fits every valid rental; recalculated whenever the locations change
  const region = useMemo(
    () => (locations.length > 0 ? getRegionForCoordinates(locations.map((location) => location.coordinate)) : null),
    [locations]
  );

  const mapRef = useRef(null);
  const isMapReady = useRef(false);
  // Set once the user pans or zooms; from then on the viewport is theirs and is never reset
  const userMovedMap = useRef(false);
  // Region the map was last given by this component (initialRegion or animateToRegion)
  const shownRegionKey = useRef(null);
  const latestRegion = useRef(region);

  const fitToRegion = useCallback((target) => {
    if (!target || !isMapReady.current || userMovedMap.current) {
      return;
    }

    const key = getRegionKey(target);
    // New pins inside the current bounds give the same region, so the camera does not move
    if (key === shownRegionKey.current) {
      return;
    }

    shownRegionKey.current = key;
    mapRef.current?.animateToRegion(target, REGION_ANIMATION_MS);
  }, []);

  useEffect(() => {
    latestRegion.current = region;

    if (!region) {
      // The empty state replaces the map, so the next map starts fresh
      isMapReady.current = false;
      userMovedMap.current = false;
      shownRegionKey.current = null;
      return;
    }

    if (shownRegionKey.current === null) {
      // Just mounted: initialRegion already shows this region
      shownRegionKey.current = getRegionKey(region);
      return;
    }

    fitToRegion(region);
  }, [region, fitToRegion]);

  // Locations can change before the native map is ready, when animateToRegion would be lost
  const handleMapReady = useCallback(() => {
    isMapReady.current = true;
    fitToRegion(latestRegion.current);
  }, [fitToRegion]);

  // isGesture is false for this component's own animateToRegion, so only user moves count
  // (reported by Google Maps, i.e. Android); onPanDrag also catches drags
  const handleRegionChangeStart = useCallback((_region, details) => {
    if (details?.isGesture) {
      userMovedMap.current = true;
    }
  }, []);

  const handlePanDrag = useCallback(() => {
    userMovedMap.current = true;
  }, []);

  const hasPressHandler = typeof onRentalPress === 'function';

  // Markers get one handler that never changes, so a parent passing an inline onRentalPress
  // does not re-render every marker; the handler always calls the latest onRentalPress
  const onRentalPressRef = useRef(onRentalPress);
  useEffect(() => {
    onRentalPressRef.current = onRentalPress;
  }, [onRentalPress]);

  const selectRental = useCallback((rental) => {
    if (typeof onRentalPressRef.current === 'function') {
      onRentalPressRef.current(rental);
    }
  }, []);

  if (locations.length === 0) {
    return (
      <View style={[styles.container, styles.emptyState, style]}>
        <Text style={styles.emptyTitle}>No rental locations to show</Text>
        <Text style={styles.emptyText}>Rentals with a pickup location will appear here on the map.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Google Maps on Android; iOS keeps Apple Maps, which needs no API key
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        // Applied once when the map mounts; later location changes animate the camera instead
        initialRegion={region}
        onMapReady={handleMapReady}
        onRegionChangeStart={handleRegionChangeStart}
        onPanDrag={handlePanDrag}
        toolbarEnabled={false}
      >
        {locations.map((location) => (
          <RentalMarker
            key={location.id}
            location={location}
            onSelect={hasPressHandler ? selectRental : undefined}
          />
        ))}
      </MapView>
    </View>
  );
}

export default React.memo(RentalMap);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  // Fixed width: Android draws the callout as a snapshot and clips content sized to fit its text
  callout: {
    width: 220,
    paddingVertical: 4,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  calloutPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  calloutPriceUnavailable: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  calloutPickup: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  calloutAction: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
