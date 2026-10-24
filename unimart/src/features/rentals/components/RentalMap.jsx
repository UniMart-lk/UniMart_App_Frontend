import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Supercluster from 'supercluster';
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

// Clustering: CLUSTER_RADIUS is in supercluster's 512-px tile units, so pins closer than ~30 dp on screen
// (map tiles are 256 dp) are grouped. Above CLUSTER_MAX_ZOOM every rental
// is shown on its own; that is one level below the map's max zoom, so a dense area is never drawn as hundreds of
// single pins and every cluster can still be zoomed into until it splits.
const CLUSTER_RADIUS = 60;
const MAX_MAP_ZOOM = 20;
const CLUSTER_MAX_ZOOM = MAX_MAP_ZOOM - 1;
// Clusters are computed for the visible area plus this fraction of it on each side,
// so pins just off screen are ready when the user pans
const CLUSTER_BOUNDS_PADDING = 0.5;
// Single pins closer than this many screen pixels would cover each other (e.g. several rentals at one
// hostel gate); they are fanned out around their shared spot so each one can be tapped
const MARKER_SPREAD_PX = 28;
// Map tiles are 256 px, so the world is 256 * 2^zoom pixels wide
const TILE_SIZE = 256;

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
 * Approximate map zoom level for a region (each level halves the visible longitude span)
 * @param {{ longitudeDelta: number }} region
 * @returns {number} integer between 0 and MAX_MAP_ZOOM
 */
export function getZoomForRegion(region) {
  const zoom = Math.round(Math.log2(MAX_LONGITUDE_DELTA / region.longitudeDelta));
  return Math.min(Math.max(Number.isFinite(zoom) ? zoom : 0, 0), MAX_MAP_ZOOM);
}

/**
 * Bounding box [west, south, east, north] of a region, padded on each side and kept within world bounds
 * @param {{ latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number }} region
 * @returns {number[]}
 */
export function getClusterBoundingBox(region) {
  const halfLatitude = (region.latitudeDelta / 2) * (1 + 2 * CLUSTER_BOUNDS_PADDING);
  const halfLongitude = (region.longitudeDelta / 2) * (1 + 2 * CLUSTER_BOUNDS_PADDING);

  const south = Math.max(region.latitude - halfLatitude, -90);
  const north = Math.min(region.latitude + halfLatitude, 90);

  // A padded box wider than the world covers every longitude
  if (halfLongitude * 2 >= MAX_LONGITUDE_DELTA) {
    return [-180, south, 180, north];
  }

  return [Math.max(region.longitude - halfLongitude, -180), south, Math.min(region.longitude + halfLongitude, 180), north];
}

/**
 * Region centred on a point at a given zoom level (used to zoom into a cluster)
 * @param {{ latitude: number, longitude: number }} center
 * @param {number} zoom
 * @returns {{ latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number }}
 */
export function getRegionForZoom(center, zoom) {
  // Capped at the map's max zoom only: a cluster that splits just above CLUSTER_MAX_ZOOM must be reachable,
  // otherwise tapping it zooms to the same level again and its rentals can never be opened
  const delta = MAX_LONGITUDE_DELTA / Math.pow(2, Math.min(Math.max(zoom, 0), MAX_MAP_ZOOM));

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.min(delta, MAX_LATITUDE_DELTA),
    longitudeDelta: Math.min(delta, MAX_LONGITUDE_DELTA),
  };
}

// Web-Mercator position in screen pixels at a zoom level (how the map itself draws coordinates)
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

/**
 * Display positions for single pins that would overlap on screen
 * Pins closer than MARKER_SPREAD_PX at this zoom are grouped and placed on a small circle around the group's
 * centre (ordered by id, so a pin never jumps between renders). Pins that do not overlap are not returned.
 * @param {object[]} locations - items from getRentalLocations that are shown as single pins
 * @param {number} zoom
 * @returns {Map<string, { latitude: number, longitude: number }>} location id -> display coordinate
 */
export function getSpreadCoordinates(locations, zoom) {
  const spread = new Map();
  const points = locations.map((location) => ({ location, pixels: toWorldPixels(location.coordinate, zoom) }));
  const grouped = new Array(points.length).fill(false);

  for (let i = 0; i < points.length; i++) {
    if (grouped[i]) {
      continue;
    }

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

    if (group.length < 2) {
      continue;
    }

    group.sort((a, b) => (a.location.id < b.location.id ? -1 : a.location.id > b.location.id ? 1 : 0));
    const centre = {
      x: group.reduce((sum, point) => sum + point.pixels.x, 0) / group.length,
      y: group.reduce((sum, point) => sum + point.pixels.y, 0) / group.length,
    };
    // Big enough that neighbouring pins on the circle are at least MARKER_SPREAD_PX apart
    const radius = Math.max(MARKER_SPREAD_PX, (MARKER_SPREAD_PX * group.length) / (2 * Math.PI));

    group.forEach((point, k) => {
      const angle = (2 * Math.PI * k) / group.length - Math.PI / 2;
      spread.set(
        point.location.id,
        fromWorldPixels({ x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) }, zoom)
      );
    });
  }

  return spread;
}

/**
 * Build the cluster index for the valid rental locations
 * @param {object[]} locations - items from getRentalLocations (coordinates already validated)
 * @returns {Supercluster}
 */
export function createClusterIndex(locations) {
  const index = new Supercluster({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM });

  index.load(
    locations.map((location) => ({
      type: 'Feature',
      properties: { locationId: location.id },
      // GeoJSON order is [longitude, latitude]
      geometry: { type: 'Point', coordinates: [location.coordinate.longitude, location.coordinate.latitude] },
    }))
  );

  return index;
}

// Only use a region reported by the map if every value is usable
function isValidRegion(region) {
  return (
    region != null &&
    [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta].every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    ) &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

/**
 * Pin for a group of nearby rentals, showing how many it contains
 * Memoized on primitive props, since the cluster index returns new objects on every query
 */
const ClusterMarker = React.memo(function ClusterMarker({ clusterId, latitude, longitude, count, label, onPress }) {
  const coordinate = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);
  const handlePress = useCallback(() => onPress(clusterId, latitude, longitude), [onPress, clusterId, latitude, longitude]);

  // Bigger groups get a bigger circle
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;

  return (
    <Marker
      coordinate={coordinate}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel={`${count} rentals, tap to zoom in`}
    >
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.clusterText}>{label}</Text>
      </View>
    </Marker>
  );
});

/**
 * One rental pin with its callout
 * Memoized: re-renders only when its location object or the select handler changes
 * @param {object} props
 * @param {object} props.location - item from getRentalLocations
 * @param {object} [props.coordinate] - display position when the pin is fanned out; defaults to the rental's own
 * @param {function} [props.onSelect] - called with the rental when the callout is tapped
 */
const RentalMarker = React.memo(function RentalMarker({ location, coordinate, onSelect }) {
  const handleCalloutPress = useCallback(() => onSelect(location.rental), [onSelect, location]);

  return (
    <Marker
      coordinate={coordinate ?? location.coordinate}
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

  // Area the user is looking at, reported by the map after each pan/zoom; null until the map reports one,
  // when the fitted region (what initialRegion shows) is used
  const [visibleRegion, setVisibleRegion] = useState(null);

  // Locations can change before the native map is ready, when animateToRegion would be lost
  const handleMapReady = useCallback(() => {
    isMapReady.current = true;
    // A newly mounted map (e.g. after the empty state) starts at the fitted region, not an old map's view
    setVisibleRegion(null);
    fitToRegion(latestRegion.current);
  }, [fitToRegion]);

  // onRegionChangeComplete fires once per finished pan/zoom (not every frame), which keeps reclustering cheap
  const handleRegionChangeComplete = useCallback((nextRegion) => {
    if (!isValidRegion(nextRegion)) {
      return;
    }
    setVisibleRegion((current) => (getRegionKey(current) === getRegionKey(nextRegion) ? current : nextRegion));
  }, []);

  const clusterIndex = useMemo(() => createClusterIndex(locations), [locations]);
  const locationsById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);

  // Re-queried when the visible area or the rental locations change
  const clusterRegion = visibleRegion ?? region;
  const clusterZoom = clusterRegion ? getZoomForRegion(clusterRegion) : 0;
  const clusters = useMemo(
    () => (clusterRegion ? clusterIndex.getClusters(getClusterBoundingBox(clusterRegion), clusterZoom) : []),
    [clusterIndex, clusterRegion, clusterZoom]
  );

  // Above CLUSTER_MAX_ZOOM nearby rentals come back as separate pins that can cover each other; fan those out
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

  // Zoom in just far enough for the cluster to split into smaller groups or single rentals
  const zoomIntoCluster = useCallback(
    (clusterId, latitude, longitude) => {
      let expansionZoom;
      try {
        expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
      } catch {
        // The cluster belongs to an index replaced by newer locations; the next render shows the new clusters
        return;
      }

      // Zooming in is the user taking control of the viewport, so automatic refits stop
      userMovedMap.current = true;
      mapRef.current?.animateToRegion(getRegionForZoom({ latitude, longitude }, expansionZoom), REGION_ANIMATION_MS);
    },
    [clusterIndex]
  );

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
        onRegionChangeComplete={handleRegionChangeComplete}
        toolbarEnabled={false}
      >
        {clusters.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates;

          if (feature.properties.cluster) {
            return (
              <ClusterMarker
                // Prefixed so a cluster key can never equal a rental key
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
              // undefined for pins that do not overlap, so they keep their memoized props
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  clusterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
