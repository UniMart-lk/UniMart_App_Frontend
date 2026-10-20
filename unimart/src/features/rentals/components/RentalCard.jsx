import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

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
 * Return the image URL only if it is a usable http(s) address
 * @param {string} url
 * @returns {string|null} null when the URL is missing, empty, or not http(s)
 */
export function getValidImageUrl(url) {
  const value = typeof url === 'string' ? url.trim() : '';

  return /^https?:\/\/\S+$/i.test(value) ? value : null;
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

function RentalCard({ item, onPress }) {
  const title = item?.title?.trim() || 'Untitled rental';
  const price = formatRentalPrice(item?.rentalPrice, item?.rentalPeriod);

  // vehicle is null for equipment rentals, so every read is optional
  const vehicleType = formatVehicleType(item?.vehicle?.vehicleType);
  const rawLocation = item?.vehicle?.pickupLocationName;
  const pickupLocation = typeof rawLocation === 'string' ? rawLocation.trim() : '';

  const imageUrl = getValidImageUrl(item?.primaryImageUrl);
  // Unique per rental so a recycled card never flashes the previous rental's image
  const imageRecyclingKey = item?.id != null ? String(item.id) : imageUrl;

  // Remember WHICH url failed (not just "failed"), so a recycled card showing a
  // different rental never inherits the previous rental's error
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const showImage = imageUrl !== null && imageUrl !== failedImageUrl;

  const cardContent = (
    <>
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          recyclingKey={imageRecyclingKey}
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>No image available</Text>
        </View>
      )}

      <View style={styles.content}>
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
    </>
  );

  // Only make the card tappable when the parent supplies a handler
  if (typeof onPress !== 'function') {
    return <View style={styles.card}>{cardContent}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${price ?? 'Price not available'}`}
    >
      {cardContent}
    </Pressable>
  );
}

// Skip re-rendering when the item and onPress props are unchanged (shallow comparison)
export default React.memo(RentalCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 12,
    // Clips the image to the card's rounded corners
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 16,
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
