import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { getLoadedRental, parseRentalId } from '../services/rentalService';
import { formatRentalPrice, formatVehicleType, getValidImageUrl } from '../components/RentalCard';
import RentalPickupMap from '../components/RentalPickupMap';
import { getRentalDirectionsUrl } from '../utils/rentalDirections';

const IMAGE_HEIGHT = 320;

// Trimmed text, or '' when the value is missing or not a string
function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Shown in place of the details when the rental cannot be displayed
function RentalUnavailable({ title, message, onGoBack, onBrowseRentals }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={styles.errorTitle}>{title}</Text>
        <Text style={styles.errorText}>{message}</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={onGoBack}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={onBrowseRentals}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Browse rentals"
        >
          <Text style={styles.browseButtonText}>Browse Rentals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Details of one rental listing, opened with /rentalDetails?id=<rental id>
 * The rental is read from the feed data already loaded in this session (there is no single-rental endpoint yet).
 */
export default function RentalDetailsScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams();

  const rentalId = parseRentalId(idParam);
  const rental = useMemo(() => (rentalId === null ? null : getLoadedRental(rentalId)), [rentalId]);

  // Remember which image url failed, so a different rental or url tries again (same approach as RentalCard)
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  // True while a directions link is being opened, so rapid taps do not open Maps several times.
  // A ref, not state: it changes synchronously and needs no re-render or loading UI.
  const isOpeningDirections = useRef(false);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Opened directly (e.g. a link), so there is no screen to go back to
      router.replace('/rentals');
    }
  };

  // Returns to the rentals list if it is already open underneath, otherwise opens it in place of this screen
  const handleBrowseRentals = () => {
    router.dismissTo('/rentals');
  };

  if (rentalId === null) {
    return (
      <RentalUnavailable
        title="Invalid rental link"
        message="This link does not point to a rental. Please choose a rental from the rentals list."
        onGoBack={handleGoBack}
        onBrowseRentals={handleBrowseRentals}
      />
    );
  }

  // Details come from the rentals the list has loaded in this session; there is no single-rental request yet
  if (!rental) {
    return (
      <RentalUnavailable
        title="Rental not found"
        message="This rental may have been removed, or it hasn't been loaded in this session yet. Open it from the rentals list to see its details."
        onGoBack={handleGoBack}
        onBrowseRentals={handleBrowseRentals}
      />
    );
  }

  const title = toText(rental.title) || 'Untitled rental';
  const price = formatRentalPrice(rental.rentalPrice, rental.rentalPeriod);
  const condition = toText(rental.condition);
  // vehicle is null for equipment rentals, so every read is optional
  const vehicleType = formatVehicleType(rental.vehicle?.vehicleType);
  const makeModel = toText(rental.vehicle?.makeModel);
  const pickupLocation = toText(rental.vehicle?.pickupLocationName);
  // null when the rental has no valid pickup coordinates, which hides the Get Directions button
  const directionsUrl = getRentalDirectionsUrl(rental);

  // Opens the Google Maps app when installed, otherwise Google Maps in the browser
  const handleGetDirections = async () => {
    if (!directionsUrl || isOpeningDirections.current) {
      return;
    }

    isOpeningDirections.current = true;
    try {
      await Linking.openURL(directionsUrl);
    } catch (error) {
      console.warn('Could not open directions:', error?.message);
      Alert.alert('Directions Unavailable', "We couldn't open Google Maps. Please try again later.");
    } finally {
      // Reset after success or failure, so the user can try again
      isOpeningDirections.current = false;
    }
  };

  const imageUrl = getValidImageUrl(rental.primaryImageUrl);
  const showImage = imageUrl !== null && failedImageUrl !== imageUrl;

  const details = [
    { label: 'Vehicle Type', value: vehicleType },
    { label: 'Make & Model', value: makeModel },
    { label: 'Condition', value: condition },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. IMAGE */}
        <View style={styles.imageSection}>
          {showImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.rentalImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onError={() => setFailedImageUrl(imageUrl)}
              accessibilityLabel={title}
            />
          ) : (
            <View style={[styles.rentalImage, styles.imagePlaceholder]}>
              <Ionicons name="car-outline" size={48} color="#94A3B8" />
              <Text style={styles.imagePlaceholderText}>No image available</Text>
            </View>
          )}

          {/* Overlay top bar, below the status bar */}
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.gradientOverlay}>
            <SafeAreaView edges={['top']}>
              <View style={styles.overlayHeader}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleGoBack}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* 2. RENTAL DETAILS */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{title}</Text>
          {price ? (
            <Text style={styles.price}>{price}</Text>
          ) : (
            <Text style={styles.priceUnavailable}>Price not available</Text>
          )}

          {vehicleType || condition ? (
            <View style={styles.badgeRow}>
              {vehicleType ? (
                <View style={styles.vehicleTypeBadge}>
                  <Ionicons name="car-outline" size={14} color="#2563EB" style={styles.badgeIcon} />
                  <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
                </View>
              ) : null}
              {condition ? (
                <View style={styles.conditionBadge}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Details */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsTable}>
            {details.map((item, index) => (
              <View key={item.label}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  {item.value ? (
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {item.value}
                    </Text>
                  ) : (
                    <Text style={styles.detailValueMissing}>Not specified</Text>
                  )}
                </View>
                {index < details.length - 1 ? <View style={styles.detailRowDivider} /> : null}
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Pickup location */}
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-sharp" size={20} color="#2563EB" />
            </View>
            {pickupLocation ? (
              <Text style={styles.locationText}>{pickupLocation}</Text>
            ) : (
              <Text style={styles.locationMissing}>Pickup location not provided</Text>
            )}
          </View>
          {/* Equipment rentals have vehicle: null, so the map shows its "unavailable" message */}
          <RentalPickupMap
            latitude={rental.vehicle?.latitude}
            longitude={rental.vehicle?.longitude}
            locationName={pickupLocation}
            style={styles.pickupMap}
          />
          {directionsUrl ? (
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={pickupLocation ? `Get directions to ${pickupLocation}` : 'Get directions to the pickup location'}
              accessibilityHint="Opens directions in Google Maps"
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" style={styles.directionsIcon} />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // --- IMAGE STYLES ---
  imageSection: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  rentalImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    paddingBottom: 40,
    zIndex: 10,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- DETAILS STYLES ---
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 16,
  },
  priceUnavailable: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  vehicleTypeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  conditionBadge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  detailsTable: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '400',
    marginRight: 16,
  },
  detailValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  detailValueMissing: {
    fontSize: 15,
    color: '#94A3B8',
  },
  detailRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // --- LOCATION STYLES ---
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  locationMissing: {
    flex: 1,
    fontSize: 15,
    color: '#64748B',
  },
  pickupMap: {
    marginTop: 12,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  directionsIcon: {
    marginRight: 8,
  },
  directionsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // --- ERROR STATE STYLES ---
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Same minimum width as browseButton, so the stacked buttons line up
  goBackButton: {
    minWidth: 180,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  goBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  browseButton: {
    minWidth: 180,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
});
