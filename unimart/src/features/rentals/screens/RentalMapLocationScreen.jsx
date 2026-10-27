import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LocationPickerMap, { formatCoordinate, toPickerCoordinate } from '../components/LocationPickerMap';

// Same limit as the backend's pickup_location_name VarChar(255) column
const PICKUP_NAME_MAX_LENGTH = 255;
// The map fills the space left by the header and form, but never gets too small to pick a spot on
const MAP_MIN_HEIGHT = 220;

/**
 * Screen where a provider chooses a rental vehicle's pickup location on a map and names it
 * Nothing is saved here: the confirmed location is handed to the caller (e.g. the rental form), which saves it.
 * @param {object} props
 * @param {{ latitude?: number|string, longitude?: number|string, pickupLocationName?: string }|null} [props.initialLocation]
 *   location to start from (e.g. when editing a listing); missing or invalid coordinates start with nothing selected
 * @param {function} props.onConfirm - called with { latitude: number, longitude: number, pickupLocationName: string };
 *   coordinates are rounded to 7 decimals and the name is trimmed
 * @param {function} [props.onCancel] - called when the user cancels; defaults to going back
 */
export default function RentalMapLocationScreen({ initialLocation, onConfirm, onCancel }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // null until a valid coordinate is selected; the picker only reports valid, rounded coordinates
  const [coordinate, setCoordinate] = useState(() =>
    toPickerCoordinate(initialLocation?.latitude, initialLocation?.longitude)
  );
  const [pickupName, setPickupName] = useState(() =>
    typeof initialLocation?.pickupLocationName === 'string' ? initialLocation.pickupLocationName : ''
  );
  const [nameFocused, setNameFocused] = useState(false);

  const trimmedName = pickupName.trim();
  const canConfirm = coordinate !== null && trimmedName !== '';

  const handleConfirm = () => {
    // Re-check at press time, so a stale or invalid coordinate can never be returned
    const location = toPickerCoordinate(coordinate?.latitude, coordinate?.longitude);
    if (!location || !trimmedName) {
      return;
    }

    if (typeof onConfirm === 'function') {
      onConfirm({ ...location, pickupLocationName: trimmedName });
    } else {
      console.warn('RentalMapLocationScreen: no onConfirm handler, the selected location was not returned.');
    }
  };

  const handleCancel = useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel();
    } else if (router.canGoBack()) {
      router.back();
    }
  }, [onCancel, router]);

  // Tells the user what is still missing while Confirm is disabled
  const missingHint =
    coordinate === null
      ? 'Move the map to place the pin on the pickup location.'
      : trimmedName === ''
        ? 'Enter a name for the pickup location.'
        : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pickup Location</Text>
        <Text style={styles.headerSubtitle}>
          Drag the map so the pin sits where renters will collect the vehicle, then give the spot a name.
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        {/* Coordinates are shown in the form below, so the picker's own readout is turned off */}
        <LocationPickerMap value={coordinate} onChange={setCoordinate} showCoordinates={false} style={styles.map} />

        <View style={[styles.form, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.coordinateRow} accessibilityLiveRegion="polite">
            <Ionicons
              name={coordinate ? 'location' : 'location-outline'}
              size={18}
              color={coordinate ? '#2563EB' : '#94A3B8'}
              style={styles.coordinateIcon}
            />
            {coordinate ? (
              <Text style={styles.coordinateText}>{formatCoordinate(coordinate)}</Text>
            ) : (
              <Text style={styles.coordinateMissing}>No location selected yet</Text>
            )}
          </View>

          <Text style={styles.label}>Pickup location name</Text>
          <TextInput
            style={[styles.input, nameFocused && styles.inputFocused]}
            value={pickupName}
            onChangeText={setPickupName}
            placeholder="e.g. Main gate, Faculty of Engineering"
            placeholderTextColor="#94A3B8"
            maxLength={PICKUP_NAME_MAX_LENGTH}
            autoCapitalize="words"
            returnKeyType="done"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            accessibilityLabel="Pickup location name"
          />

          {missingHint ? <Text style={styles.hint}>{missingHint}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel choosing a pickup location"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                !canConfirm && styles.confirmButtonDisabled,
                pressed && canConfirm && styles.buttonPressed,
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
              accessibilityLabel="Confirm pickup location"
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  body: {
    flex: 1,
  },
  map: {
    minHeight: MAP_MIN_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordinateIcon: {
    marginRight: 8,
  },
  coordinateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  coordinateMissing: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  inputFocused: {
    borderColor: '#2563EB',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelButton: {
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2563EB',
  },
  confirmButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
