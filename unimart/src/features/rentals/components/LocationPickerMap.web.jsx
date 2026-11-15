import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from '@/mocks/react-native-maps.web';
import { Ionicons } from '@expo/vector-icons';
import { getValidCoordinate, isValidRegion } from './RentalMap';

const COORDINATE_DECIMALS = 7;
const PICKER_REGION_DELTA = 0.01;
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
const PIN_SIZE = 44;

export function toPickerCoordinate(latitude, longitude) {
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

export function formatCoordinate(coordinate) {
  return `${coordinate.latitude.toFixed(COORDINATE_DECIMALS)}, ${coordinate.longitude.toFixed(COORDINATE_DECIMALS)}`;
}

function LocationPickerMap({ value, onChange, fallbackRegion, showCoordinates = true, style }) {
  const selected = toPickerCoordinate(value?.latitude, value?.longitude);

  const [initialRegion] = useState(() =>
    selected
      ? { ...selected, latitudeDelta: PICKER_REGION_DELTA, longitudeDelta: PICKER_REGION_DELTA }
      : isValidRegion(fallbackRegion)
        ? fallbackRegion
        : DEFAULT_REGION
  );

  const mapRef = useRef(null);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
      />

      <View style={styles.pinOverlay} pointerEvents="none">
        <View style={styles.pin}>
          <Ionicons name="location" size={PIN_SIZE} color="#2563EB" />
        </View>
        <View style={styles.pinDot} />
      </View>

      {showCoordinates ? (
        <View style={styles.readout} pointerEvents="none">
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
