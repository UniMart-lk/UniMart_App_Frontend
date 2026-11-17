import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getValidCoordinate } from './RentalMap';

// Close enough to see the streets around the pickup point
const PICKUP_REGION_DELTA = 0.01;
const MAP_HEIGHT = 180;

/**
 * Static map preview of a rental's pickup location: one pin, no gestures
 * Missing or invalid coordinates show a message instead of a map, so the map is never centred on a wrong spot.
 * @param {object} props
 * @param {number|string} [props.latitude] - number or decimal string (e.g. rental.vehicle.latitude)
 * @param {number|string} [props.longitude]
 * @param {string} [props.locationName] - used for the screen reader label
 * @param {object} [props.style] - style for the outer container (e.g. margins)
 */
function RentalPickupMap({ latitude, longitude, locationName, style }) {
  const coordinate = getValidCoordinate(latitude, longitude);

  // Memoized on the values, so re-renders with the same coordinate do not move the native map
  const region = useMemo(
    () =>
      coordinate
        ? {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: PICKUP_REGION_DELTA,
            longitudeDelta: PICKUP_REGION_DELTA,
          }
        : null,
    [coordinate?.latitude, coordinate?.longitude]
  );

  if (!region) {
    return (
      <View style={[styles.container, styles.unavailable, style]} accessibilityRole="text">
        <Ionicons name="map-outline" size={28} color="#94A3B8" />
        <Text style={styles.unavailableText}>Map location unavailable</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      // Touches pass through to the parent ScrollView, so the preview never pans or opens anything
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={locationName ? `Map showing the pickup location: ${locationName}` : 'Map showing the pickup location'}
    >
      <MapView
        style={StyleSheet.absoluteFill}
        // Google Maps on Android; iOS keeps Apple Maps, which needs no API key
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        // Android draws a lightweight bitmap instead of a full interactive map
        liteMode={Platform.OS === 'android'}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        zoomTapEnabled={false}
        zoomControlEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollDuringRotateOrZoomEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        <Marker coordinate={region} pinColor="#2563EB" />
      </MapView>
    </View>
  );
}

export default React.memo(RentalPickupMap);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unavailableText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
});
