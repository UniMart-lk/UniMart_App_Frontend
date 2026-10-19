import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Backend sends Prisma RentalPeriod enum values (HOURLY, DAILY, WEEKLY, MONTHLY)
const PERIOD_LABELS = {
  HOURLY: 'hour',
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
};

// Backend sends Prisma VehicleType enum values
const VEHICLE_TYPE_LABELS = {
  MOTORCYCLE: 'Motorcycle',
  CAR: 'Car',
  THREE_WHEELER: 'Three-wheeler',
  BICYCLE: 'Bicycle',
};

/**
 * Turn a VehicleType enum value into a readable label
 * @param {string} vehicleType - e.g. 'THREE_WHEELER'
 * @returns {string|null} null when the value is missing or empty
 */
export function formatVehicleType(vehicleType) {
  const value = typeof vehicleType === 'string' ? vehicleType.trim() : '';

  if (!value) {
    return null;
  }

  const known = VEHICLE_TYPE_LABELS[value.toUpperCase()];
  if (known) {
    return known;
  }

  // Unknown future values: 'SCOOTER' -> 'Scooter'
  const words = value.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Format a rental price like "Rs. 1,500 / day"
 * @param {number|string} price
 * @param {string} period - RentalPeriod enum value (e.g. 'DAILY') or a plain label (e.g. 'day')
 * @returns {string|null} null when the price is missing or invalid
 */
export function formatRentalPrice(price, period) {
  const amount = Number(price);

  if (price === null || price === undefined || price === '' || !Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const [whole, cents] = amount.toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = cents === '00' ? withCommas : `${withCommas}.${cents}`;

  const periodKey = typeof period === 'string' ? period.trim() : '';
  const periodLabel = PERIOD_LABELS[periodKey.toUpperCase()] || periodKey.toLowerCase();

  return periodLabel ? `Rs. ${formatted} / ${periodLabel}` : `Rs. ${formatted}`;
}

export default function RentalCard({ item }) {
  const title = item?.title?.trim() || 'Untitled rental';
  const price = formatRentalPrice(item?.rentalPrice, item?.rentalPeriod);

  // vehicle is null for equipment rentals, so every read is optional
  const vehicleType = formatVehicleType(item?.vehicle?.vehicleType);
  const rawLocation = item?.vehicle?.pickupLocationName;
  const pickupLocation = typeof rawLocation === 'string' ? rawLocation.trim() : '';

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {price ? (
        <Text style={styles.price}>{price}</Text>
      ) : (
        <Text style={styles.priceUnavailable}>Price not available</Text>
      )}

      {vehicleType || pickupLocation ? (
        <View style={styles.vehicleRow}>
          {vehicleType ? (
            <View style={styles.vehicleTypeBadge}>
              <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
            </View>
          ) : null}

          {pickupLocation ? (
            <Text style={styles.pickupLocation} numberOfLines={1}>
              Pickup: {pickupLocation}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  price: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  priceUnavailable: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  vehicleTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  pickupLocation: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
});
