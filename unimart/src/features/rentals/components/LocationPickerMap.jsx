import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getValidCoordinate, isValidRegion } from './RentalMap';

// Same precision as the backend's Decimal(10, 7) latitude/longitude columns (~1 cm)
const COORDINATE_DECIMALS = 7;
// Zoom span used when centring on a coordinate: close enough to pick a gate or building
const PICKER_REGION_DELTA = 0.01;
// Shown when there is no valid starting coordinate (Colombo, wide enough to find the area)
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
// Duration of the camera move when the map is tapped or the value changes from outside
const REGION_ANIMATION_MS = 300;
const PIN_SIZE = 44;

/**
 * Round a coordinate to the backend's precision and keep it within world bounds
 * @param {*} latitude - number or decimal string
 * @param {*} longitude - number or decimal string
 * @returns {{ latitude: number, longitude: number }|null} null when the coordinate is missing or invalid
 */
export function toPickerCoordinate(latitude, longitude) {
  // The map can report longitudes past ±180 after panning across the date line
  const numericLongitude = typeof longitude === 'number' ? ((((longitude + 180) % 360) + 360) % 360) - 180 : longitude;
  const coordinate = getValidCoordinate(latitude, numericLongitude);
  if (!coordinate) {
    return null;
  }

  return getValidCoordinate(
    Number(coordinate.latitude.toFixed(COORDINATE_DECIMALS)),
    Number(coordinate.longitude.toFixed(COORDINATE_DECIMALS))
  );
}

/**
 * Format a coordinate for display, e.g. "6.9271000, 79.8612000"
 * @param {{ latitude: number, longitude: number }} coordinate - valid coordinate from toPickerCoordinate
 * @returns {string}
 */
export function formatCoordinate(coordinate) {
  return `${coordinate.latitude.toFixed(COORDINATE_DECIMALS)}, ${coordinate.longitude.toFixed(COORDINATE_DECIMALS)}`;
}

// Compare coordinates by their rounded value instead of by object identity
function getCoordinateKey(coordinate) {
  return coordinate ? `${coordinate.latitude}|${coordinate.longitude}` : null;
}

/**
 * Interactive map for choosing a pickup location
 * The pin stays fixed at the centre of the map; the user pans (or taps) to move the map under it and the
 * centre becomes the selected coordinate. Controlled: the parent keeps the coordinate in its own state.
 * @param {object} props
 * @param {{ latitude: number|string, longitude: number|string }|null} [props.value] - selected coordinate;
 *   null, missing or invalid values show the fallback region with nothing selected
 * @param {function} [props.onChange] - called with { latitude, longitude } (rounded to 7 decimals) after the user moves the map
 * @param {object} [props.fallbackRegion] - region shown when value is not a valid coordinate
 * @param {boolean} [props.showCoordinates=true] - show the selected coordinates over the map; turn off when
 *   the parent screen displays them itself
 * @param {object} [props.style] - style for the outer container (give it a height or flex)
 */
function LocationPickerMap({ value, onChange, fallbackRegion, showCoordinates = true, style }) {
  const selected = toPickerCoordinate(value?.latitude, value?.longitude);

  // Applied once when the map mounts; later value changes animate the camera instead
  const [initialRegion] = useState(() =>
    selected
      ? { ...selected, latitudeDelta: PICKER_REGION_DELTA, longitudeDelta: PICKER_REGION_DELTA }
      : isValidRegion(fallbackRegion)
        ? fallbackRegion
        : DEFAULT_REGION
  );

  const mapRef = useRef(null);
  const isMapReady = useRef(false);
  // Last region reported by the map, so camera moves keep the user's zoom level
  const currentRegion = useRef(initialRegion);
  // Coordinate the map is centred on as far as this component knows (last emitted or last moved to)
  const centreKey = useRef(getCoordinateKey(selected));
  // The map also reports regions on mount and after this component's own camera moves; only a user's
  // pan, zoom or tap selects a location, so an empty picker never selects the fallback region by itself
  const userMovedMap = useRef(false);

  // Always call the latest onChange without re-subscribing map handlers
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const moveCameraTo = useCallback((coordinate) => {
    const { latitudeDelta, longitudeDelta } = currentRegion.current;
    mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta, longitudeDelta }, REGION_ANIMATION_MS);
  }, []);

  // A value set by the parent (e.g. loading a saved listing) moves the map to it
  const selectedKey = getCoordinateKey(selected);
  const latestSelected = useRef(selected);
  useEffect(() => {
    latestSelected.current = selected;
  });
  useEffect(() => {
    if (selectedKey === null) {
      // Cleared: the next user move selects the centre again, even if it is the same spot
      centreKey.current = null;
      return;
    }
    if (selectedKey === centreKey.current) {
      return;
    }

    centreKey.current = selectedKey;
    if (isMapReady.current) {
      moveCameraTo(latestSelected.current);
    }
  }, [selectedKey, moveCameraTo]);

  // A value that arrived before the native map was ready would have been lost by animateToRegion
  const handleMapReady = useCallback(() => {
    isMapReady.current = true;
    if (latestSelected.current && getCoordinateKey(latestSelected.current) !== getCoordinateKey(initialRegion)) {
      moveCameraTo(latestSelected.current);
    }
  }, [initialRegion, moveCameraTo]);

  // onRegionChangeComplete fires once per finished pan/zoom (not every frame)
  const handleRegionChangeComplete = useCallback((nextRegion) => {
    if (!isValidRegion(nextRegion)) {
      return;
    }
    currentRegion.current = nextRegion;

    if (!userMovedMap.current) {
      return;
    }

    const coordinate = toPickerCoordinate(nextRegion.latitude, nextRegion.longitude);
    const key = getCoordinateKey(coordinate);
    // Zooming without panning keeps the same centre, so nothing new is selected
    if (!coordinate || key === centreKey.current) {
      return;
    }

    centreKey.current = key;
    if (typeof onChangeRef.current === 'function') {
      onChangeRef.current(coordinate);
    }
  }, []);

  // isGesture is false for this component's own animateToRegion (reported by Google Maps, i.e. Android);
  // onPanDrag also catches drags on iOS
  const handleRegionChangeStart = useCallback((_region, details) => {
    if (details?.isGesture) {
      userMovedMap.current = true;
    }
  }, []);

  const handlePanDrag = useCallback(() => {
    userMovedMap.current = true;
  }, []);

  // Tapping a spot centres the map there, which then selects it like a pan
  const handleMapPress = useCallback(
    (event) => {
      const coordinate = toPickerCoordinate(
        event?.nativeEvent?.coordinate?.latitude,
        event?.nativeEvent?.coordinate?.longitude
      );
      if (!coordinate) {
        return;
      }

      userMovedMap.current = true;
      moveCameraTo(coordinate);
    },
    [moveCameraTo]
  );

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Google Maps on Android; iOS keeps Apple Maps, which needs no API key
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        onRegionChangeStart={handleRegionChangeStart}
        onPanDrag={handlePanDrag}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />

      {/* Drawn over the map (not a Marker) so it stays at the centre while the map moves underneath.
          The pin's tip sits on the exact centre point; touches pass through to the map. */}
      <View style={styles.pinOverlay} pointerEvents="none">
        <View style={styles.pin}>
          <Ionicons name="location" size={PIN_SIZE} color="#2563EB" />
        </View>
        <View style={styles.pinDot} />
      </View>

      {showCoordinates ? (
        <View style={styles.readout} pointerEvents="none" accessibilityLiveRegion="polite">
          {selected ? (
            <>
              <Text style={styles.readoutTitle}>Pickup location</Text>
              <Text style={styles.readoutCoordinates}>{formatCoordinate(selected)}</Text>
            </>
          ) : (
            <Text style={styles.readoutHint}>Move the map to place the pin on the pickup location</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(LocationPickerMap);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lifted by its own height so the bottom tip of the icon, not its middle, marks the centre
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    marginBottom: PIN_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pinDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  readout: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readoutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  readoutCoordinates: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  readoutHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
});
