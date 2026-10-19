import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Backend sends Prisma RentalPeriod enum values (HOURLY, DAILY, WEEKLY, MONTHLY)
const PERIOD_LABELS = {
  HOURLY: 'hour',
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
};

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
});
