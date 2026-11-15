import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from '@/mocks/react-native-maps.web';
import Supercluster from 'supercluster';
import { formatRentalPrice } from './RentalCard';

const MIN_REGION_DELTA = 0.02;
const REGION_PADDING_FACTOR = 1.4;
const MAX_LATITUDE_DELTA = 180;
const MAX_LONGITUDE_DELTA = 360;
const REGION_ANIMATION_MS = 500;
const CLUSTER_RADIUS = 60;
const MAX_MAP_ZOOM = 20;
const CLUSTER_MAX_ZOOM = MAX_MAP_ZOOM - 1;
const CLUSTER_BOUNDS_PADDING = 0.5;
const MARKER_SPREAD_PX = 28;
const TILE_SIZE = 256;
const DECIMAL_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

function toCoordinateNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && DECIMAL_PATTERN.test(value.trim())) return Number(value);
  return NaN;
}

function toRentalKey(id) {
  if (typeof id === 'number') return Number.isFinite(id) ? String(id) : null;
  if (typeof id === 'string') return id.trim() || null;
  return null;
}

export function getRentalCoordinate(rental) {
  return getValidCoordinate(rental?.vehicle?.latitude, rental?.vehicle?.longitude);
}

export function getValidCoordinate(rawLatitude, rawLongitude) {
  const latitude = toCoordinateNumber(rawLatitude);
  const longitude = toCoordinateNumber(rawLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (latitude === 0 && longitude === 0) return null;

  return { latitude, longitude };
}

const locationCache = new WeakMap();

function toRentalLocation(rental, id, coordinate) {
  const cached = locationCache.get(rental);
  if (cached && cached.id === id) return cached;

  const title = typeof rental.title === 'string' ? rental.title.trim() : '';
  const pickupLocation =
    typeof rental.vehicle?.pickupLocationName === 'string' ? rental.vehicle.pickupLocationName.trim() : '';

  const location = {
    id,
    title: title || 'Untitled rental',
    price: formatRentalPrice(rental.rentalPrice, rental.rentalPeriod),
    pickupLocation,
    coordinate,
    rental,
  };

  locationCache.set(rental, location);
  return location;
}

export function getRentalLocations(rentals) {
  if (!Array.isArray(rentals)) return [];
  const locations = [];
  const seenIds = new Set();

  rentals.forEach((rental) => {
    const coordinate = getRentalCoordinate(rental);
    const id = toRentalKey(rental?.id);
    if (!coordinate || id === null) return;
    if (seenIds.has(id)) return;
    seenIds.add(id);
    locations.push(toRentalLocation(rental, id, coordinate));
  });

  return locations;
}

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

export function getRegionKey(region) {
  if (!region) return null;
  return [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]
    .map((value) => value.toFixed(6))
    .join('|');
}

export function getZoomForRegion(region) {
  const zoom = Math.round(Math.log2(MAX_LONGITUDE_DELTA / region.longitudeDelta));
  return Math.min(Math.max(Number.isFinite(zoom) ? zoom : 0, 0), MAX_MAP_ZOOM);
}

export function getClusterBoundingBox(region) {
  const halfLatitude = (region.latitudeDelta / 2) * (1 + 2 * CLUSTER_BOUNDS_PADDING);
  const halfLongitude = (region.longitudeDelta / 2) * (1 + 2 * CLUSTER_BOUNDS_PADDING);
  const south = Math.max(region.latitude - halfLatitude, -90);
  const north = Math.min(region.latitude + halfLatitude, 90);

  if (halfLongitude * 2 >= MAX_LONGITUDE_DELTA) {
    return [-180, south, 180, north];
  }
  return [Math.max(region.longitude - halfLongitude, -180), south, Math.min(region.longitude + halfLongitude, 180), north];
}

export function getRegionForZoom(center, zoom) {
  const delta = MAX_LONGITUDE_DELTA / Math.pow(2, Math.min(Math.max(zoom, 0), MAX_MAP_ZOOM));
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.min(delta, MAX_LATITUDE_DELTA),
    longitudeDelta: Math.min(delta, MAX_LONGITUDE_DELTA),
  };
}

function toWorldPixels({ latitude, longitude }, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function fromWorldPixels({ x, y }, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    longitude: (x / scale) * 360 - 180,
  };
}

const spreadCoordinateCache = new Map();
const SPREAD_CACHE_LIMIT = 500;

function stableCoordinate(id, coordinate) {
  const key = `${id}|${coordinate.latitude}|${coordinate.longitude}`;
  const cached = spreadCoordinateCache.get(key);
  if (cached) return cached;
  if (spreadCoordinateCache.size >= SPREAD_CACHE_LIMIT) spreadCoordinateCache.clear();
  spreadCoordinateCache.set(key, coordinate);
  return coordinate;
}

export function getSpreadCoordinates(locations, zoom) {
  const spread = new Map();
  const points = locations.map((location) => ({ location, pixels: toWorldPixels(location.coordinate, zoom) }));
  const grouped = new Array(points.length).fill(false);

  for (let i = 0; i < points.length; i++) {
    if (grouped[i]) continue;
    const group = [points[i]];
    for (let j = i + 1; j < points.length; j++) {
      if (
        !grouped[j] &&
        Math.hypot(points[j].pixels.x - points[i].pixels.x, points[j].pixels.y - points[i].pixels.y) < MARKER_SPREAD_PX
      ) {
        grouped[j] = true;
        group.push(points[j]);
      }
    }
    if (group.length < 2) continue;
    group.sort((a, b) => (a.location.id < b.location.id ? -1 : a.location.id > b.location.id ? 1 : 0));
    const centre = {
      x: group.reduce((sum, point) => sum + point.pixels.x, 0) / group.length,
      y: group.reduce((sum, point) => sum + point.pixels.y, 0) / group.length,
    };
    const radius = Math.max(MARKER_SPREAD_PX, (MARKER_SPREAD_PX * group.length) / (2 * Math.PI));
    group.forEach((point, k) => {
      const angle = (2 * Math.PI * k) / group.length - Math.PI / 2;
      spread.set(
        point.location.id,
        stableCoordinate(
          point.location.id,
          fromWorldPixels({ x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) }, zoom)
        )
      );
    });
  }
  return spread;
}

export function createClusterIndex(locations) {
  const index = new Supercluster({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM });
  index.load(
    locations.map((location) => ({
      type: 'Feature',
      properties: { locationId: location.id },
      geometry: { type: 'Point', coordinates: [location.coordinate.longitude, location.coordinate.latitude] },
    }))
  );
  return index;
}

export function isValidRegion(region) {
  return (
    region != null &&
    [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta].every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    ) &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

const ClusterMarker = React.memo(function ClusterMarker({ clusterId, latitude, longitude, count, label, onPress }) {
  const coordinate = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);
  const handlePress = useCallback(() => onPress(clusterId, latitude, longitude), [onPress, clusterId, latitude, longitude]);
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  return (
    <Marker coordinate={coordinate} onPress={handlePress}>
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.clusterText}>{label}</Text>
      </View>
    </Marker>
  );
});

const RentalMarker = React.memo(function RentalMarker({ location, coordinate, onSelect }) {
  const handleCalloutPress = useCallback(() => onSelect(location.rental), [onSelect, location]);
  return (
    <Marker coordinate={coordinate ?? location.coordinate} onCalloutPress={onSelect ? handleCalloutPress : undefined}>
      <Callout>
        <View style={styles.callout}>
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

function RentalMap({ rentals, onRentalPress, style }) {
  const locations = useMemo(() => getRentalLocations(rentals), [rentals]);
  const region = useMemo(
    () => (locations.length > 0 ? getRegionForCoordinates(locations.map((location) => location.coordinate)) : null),
    [locations]
  );

  const mapRef = useRef(null);
  const [visibleRegion] = useState(null);

  const clusterIndex = useMemo(() => createClusterIndex(locations), [locations]);
  const locationsById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);

  const clusterRegion = visibleRegion ?? region;
  const clusterZoom = clusterRegion ? getZoomForRegion(clusterRegion) : 0;
  const clusters = useMemo(
    () => (clusterRegion ? clusterIndex.getClusters(getClusterBoundingBox(clusterRegion), clusterZoom) : []),
    [clusterIndex, clusterRegion, clusterZoom]
  );

  const spreadCoordinates = useMemo(
    () =>
      getSpreadCoordinates(
        clusters
          .filter((feature) => !feature.properties.cluster)
          .map((feature) => locationsById.get(feature.properties.locationId))
          .filter(Boolean),
        clusterZoom
      ),
    [clusters, locationsById, clusterZoom]
  );

  const zoomIntoCluster = useCallback(
    (clusterId, latitude, longitude) => {
      let expansionZoom;
      try {
        expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
      } catch {
        return;
      }
      mapRef.current?.animateToRegion(getRegionForZoom({ latitude, longitude }, expansionZoom), REGION_ANIMATION_MS);
    },
    [clusterIndex]
  );

  const hasPressHandler = typeof onRentalPress === 'function';
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
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={region}>
        {clusters.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          if (feature.properties.cluster) {
            return (
              <ClusterMarker
                key={`cluster:${feature.properties.cluster_id}`}
                clusterId={feature.properties.cluster_id}
                latitude={latitude}
                longitude={longitude}
                count={feature.properties.point_count}
                label={String(feature.properties.point_count_abbreviated)}
                onPress={zoomIntoCluster}
              />
            );
          }
          const location = locationsById.get(feature.properties.locationId);
          return location ? (
            <RentalMarker
              key={`rental:${location.id}`}
              location={location}
              coordinate={spreadCoordinates.get(location.id)}
              onSelect={hasPressHandler ? selectRental : undefined}
            />
          ) : null;
        })}
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
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  callout: {
    padding: 8,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  calloutPrice: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  calloutPriceUnavailable: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  calloutPickup: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  calloutAction: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
