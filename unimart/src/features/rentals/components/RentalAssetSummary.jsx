import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ASSET_STATUSES,
  countAssetsByStatus,
  getAssetStatusLabel,
  getAvailableAssetCount,
  getTotalAssetCount,
  isValidAssetStatus,
} from '../utils/rentalAssets';

// Colour pairs (text, background) already used across the app for these meanings
const STATUS_COLORS = {
  AVAILABLE: { text: '#16A34A', background: '#F0FDF4' },
  RENTED: { text: '#2563EB', background: '#EFF6FF' },
  MAINTENANCE: { text: '#D97706', background: '#FEF3C7' },
  RETIRED: { text: '#64748B', background: '#F1F5F9' },
};

const assetWord = (count) => (count === 1 ? 'asset' : 'assets');

/**
 * Availability of a listing's physical assets (e.g. 3 of 5 bikes available)
 * Counts come only from the asset records passed in, by each asset's own status (booking dates are not considered).
 * Renders nothing when there is no asset data, so a listing without assets never shows made-up inventory.
 * @param {object} props
 * @param {{ status: string }[]} [props.assets] - RentalAsset records from the backend, e.g. rental.assets
 * @param {object} [props.style] - style for the outer container (e.g. margins)
 */
function RentalAssetSummary({ assets, style }) {
  if (!Array.isArray(assets)) {
    return null;
  }

  const total = getTotalAssetCount(assets);
  if (total === 0) {
    return null;
  }

  const available = getAvailableAssetCount(assets);
  const counts = countAssetsByStatus(assets);
  // Records with a status this app does not know are left out of the counts rather than shown as a real status
  const notCounted = assets.filter((asset) => asset !== null && typeof asset === 'object' && !isValidAssetStatus(asset.status)).length;

  const summary = `${available} of ${total} ${assetWord(total)} available`;
  const breakdown = ASSET_STATUSES.map((status) => `${counts[status]} ${getAssetStatusLabel(status).toLowerCase()}`).join(', ');

  return (
    <View style={style}>
      <Text style={styles.sectionTitle}>Physical Assets</Text>

      <View
        style={styles.card}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Physical assets: ${summary}. ${breakdown}.`}
      >
        <View style={styles.headlineRow}>
          <Text style={styles.headline}>
            <Text style={styles.headlineCount}>{available}</Text> of {total} {assetWord(total)} available
          </Text>
        </View>

        <View style={styles.statusGrid}>
          {ASSET_STATUSES.map((status) => {
            const colors = STATUS_COLORS[status];
            return (
              <View key={status} style={[styles.statusTile, { backgroundColor: colors.background }]}>
                <Text style={[styles.statusCount, { color: colors.text }]}>{counts[status]}</Text>
                <Text style={[styles.statusLabel, { color: colors.text }]}>{getAssetStatusLabel(status)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total physical assets</Text>
          <Text style={styles.totalValue}>{total}</Text>
        </View>

        {notCounted > 0 ? (
          <Text style={styles.note}>
            {notCounted} {assetWord(notCounted)} with an unrecognised status {notCounted === 1 ? 'is' : 'are'} not included.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default React.memo(RentalAssetSummary);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headlineRow: {
    marginBottom: 12,
  },
  headline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  headlineCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  // Two tiles per row on phones, wrapping instead of shrinking the text
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusTile: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
  },
});
