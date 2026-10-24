import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { formatRentalPrice } from './RentalCard';

// Smallest zoom span so a single rental (or rentals at one spot) is not zoomed in to street level
const MIN_REGION_DELTA = 0.02;
// Extra space around the outermost rentals so their pins are not on the map edge
const REGION_PADDING_FACTOR = 1.4;

// Accept only numbers or numeric strings (e.g. an unconverted Prisma Decimal);
// Number() would turn null, '', true or [] into 0 or 1 and place a pin at a wrong spot
function toCoordinateNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return NaN;
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
 * @returns {{ id: string, title: string, description: string|undefined, coordinate: object, rental: object }[]}
 */
export function getRentalLocations(rentals) {
  if (!Array.isArray(rentals)) {
    return [];
  }

  const locations = [];
  const seenIds = new Set();

  rentals.forEach((rental) => {
    const coordinate = getRentalCoordinate(rental);
    if (!coordinate || rental?.id === null || rental?.id === undefined) {
      return;
    }

    // Marker keys must be unique; skip a rental repeated across pages
    const id = String(rental.id);
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    const price = formatRentalPrice(rental.rentalPrice, rental.rentalPeriod);
    const pickupLocation =
      typeof rental.vehicle?.pickupLocationName === 'string' ? rental.vehicle.pickupLocationName.trim() : '';

    locations.push({
      id,
      title: rental.title?.trim() || 'Untitled rental',
      description: [price, pickupLocation].filter(Boolean).join(' · ') || undefined,
      coordinate,
      rental,
    });
  });

  return locations;
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
    latitudeDelta: Math.max((maxLatitude - minLatitude) * REGION_PADDING_FACTOR, MIN_REGION_DELTA),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * REGION_PADDING_FACTOR, MIN_REGION_DELTA),
  };
}

/**
 * Map of rental pickup locations
 * @param {object} props
 * @param {object[]} props.rentals - rental feed items (same shape as RentalFeedScreen uses)
 * @param {function} [props.onRentalPress] - called with the rental when its marker callout is tapped
 * @param {object} [props.style] - style for the outer container (give it a height or flex)
 */
function RentalMap({ rentals, onRentalPress, style }) {
  const locations = useMemo(() => getRentalLocations(rentals), [rentals]);

  // Fits the rentals present when the map first appears; the user can pan and zoom freely after that
  const initialRegion = useMemo(
    () => (locations.length > 0 ? getRegionForCoordinates(locations.map((location) => location.coordinate)) : null),
    [locations]
  );

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
        style={StyleSheet.absoluteFill}
        // Google Maps on Android; iOS keeps Apple Maps, which needs no API key
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        toolbarEnabled={false}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.title}
            description={location.description}
            onCalloutPress={typeof onRentalPress === 'function' ? () => onRentalPress(location.rental) : undefined}
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
