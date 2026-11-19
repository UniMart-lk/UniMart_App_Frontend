import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRentalDraft } from '../context/RentalDraftContext';
import {
  ASSET_IDENTIFIER_MAX_LENGTH,
  ASSET_NOTES_MAX_LENGTH,
  isDuplicateAssetIdentifier,
  validateAssetIdentifier,
  validateAssetNotes,
} from '../utils/rentalAssets';

const DUPLICATE_IDENTIFIER_ERROR = 'Another asset already uses this identifier.';

// Characters as the database counts them (an emoji is one), matching the limits in rentalAssets
function characterCount(text) {
  return Array.from(text).length;
}

/**
 * Inline errors for one asset
 * "Required" waits until the identifier field has been left (or showAllErrors is set), so a new, empty asset is not
 * flagged while the provider is still typing; length and duplicate problems show as soon as they exist.
 */
function getAssetErrors(asset, otherIdentifiers, showRequiredError) {
  const identifier = validateAssetIdentifier(asset.assetIdentifier);
  let identifierError = null;
  if (!identifier.isValid) {
    identifierError = identifier.value || showRequiredError ? identifier.error : null;
  } else if (isDuplicateAssetIdentifier(asset.assetIdentifier, otherIdentifiers)) {
    identifierError = DUPLICATE_IDENTIFIER_ERROR;
  }

  return { identifierError, notesError: validateAssetNotes(asset.notes).error };
}

function AssetCard({ asset, position, otherIdentifiers, showRequiredError, autoFocus, onChange, onRemove, onIdentifierBlur }) {
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const { identifierError, notesError } = getAssetErrors(asset, otherIdentifiers, showRequiredError);

  const assetName = asset.assetIdentifier.trim() || `Asset ${position}`;
  const notesLength = characterCount(asset.notes);

  return (
    <View style={styles.assetCard}>
      <View style={styles.assetCardHeader}>
        <Text style={styles.assetCardTitle}>Asset {position}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(asset.key)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${assetName}`}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" style={styles.removeIcon} />
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>
        Asset Identifier <Text style={styles.requiredStar}>*</Text>
      </Text>
      <View
        style={[
          styles.inputContainer,
          identifierFocused && styles.inputFocused,
          identifierError && styles.inputInvalid,
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={asset.assetIdentifier}
          onChangeText={(assetIdentifier) => onChange(asset.key, { assetIdentifier })}
          placeholder="e.g., Bike 01 or plate number"
          placeholderTextColor="#94A3B8"
          autoFocus={autoFocus}
          autoCorrect={false}
          onFocus={() => setIdentifierFocused(true)}
          onBlur={() => {
            setIdentifierFocused(false);
            onIdentifierBlur(asset.key);
          }}
          accessibilityLabel={`Asset ${position} identifier`}
          accessibilityHint={`Required, up to ${ASSET_IDENTIFIER_MAX_LENGTH} characters`}
        />
      </View>
      {identifierError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {identifierError}
        </Text>
      ) : null}

      <Text style={[styles.inputLabel, styles.notesLabel]}>
        Notes <Text style={styles.optionalTag}>(optional)</Text>
      </Text>
      <View
        style={[
          styles.inputContainer,
          styles.textAreaContainer,
          notesFocused && styles.inputFocused,
          notesError && styles.inputInvalid,
        ]}
      >
        <TextInput
          style={styles.textArea}
          value={asset.notes}
          onChangeText={(notes) => onChange(asset.key, { notes })}
          placeholder="e.g., Red frame, basket fitted"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          accessibilityLabel={`Asset ${position} notes`}
          accessibilityHint={`Optional, up to ${ASSET_NOTES_MAX_LENGTH} characters`}
        />
      </View>
      <View style={styles.notesFooter}>
        {notesError ? (
          <Text style={[styles.errorText, styles.notesError]} accessibilityRole="alert">
            {notesError}
          </Text>
        ) : (
          <View style={styles.notesError} />
        )}
        <Text style={[styles.charCounter, notesLength > ASSET_NOTES_MAX_LENGTH && styles.charCounterOver]}>
          {notesLength}/{ASSET_NOTES_MAX_LENGTH}
        </Text>
      </View>
    </View>
  );
}

/**
 * Editor for the physical assets of the rental draft (e.g. each bike under one "Honda bikes" listing)
 * Reads and changes draft.assets in RentalDraftContext; it keeps no copy of the assets, so every keystroke
 * updates the draft immediately. Validation uses rentalAssets and never changes what the provider typed.
 * @param {object} props
 * @param {boolean} [props.showAllErrors=false] - also show "required" errors for identifiers not yet visited
 *   (e.g. after the provider tries to publish)
 * @param {object} [props.style] - style for the outer container
 */
export default function AssetListEditor({ showAllErrors = false, style }) {
  const { draft, addAsset, updateAsset, removeAsset } = useRentalDraft();
  const assets = Array.isArray(draft.assets) ? draft.assets : [];

  // UI state only: identifier fields the provider has left (to show "required"), and the asset to focus once added
  const [visitedKeys, setVisitedKeys] = useState(() => new Set());
  const [focusKey, setFocusKey] = useState(null);

  const handleAdd = () => {
    setFocusKey(addAsset());
  };

  const handleIdentifierBlur = (key) => {
    setVisitedKeys((current) => (current.has(key) ? current : new Set(current).add(key)));
  };

  const countLabel = assets.length === 1 ? '1 asset' : `${assets.length} assets`;

  return (
    <View style={style}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Physical Assets</Text>
        <Text style={styles.countText} accessibilityLabel={`${countLabel} added`}>
          {countLabel}
        </Text>
      </View>
      <Text style={styles.helperText}>
        Add each physical item renters can book under this listing, such as every bike you own.
      </Text>

      {assets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No assets added yet</Text>
          <Text style={styles.emptyText}>Add at least one asset, e.g. "Bike 01".</Text>
        </View>
      ) : (
        assets.map((asset, index) => (
          <AssetCard
            key={asset.key}
            asset={asset}
            position={index + 1}
            otherIdentifiers={assets.filter((other) => other.key !== asset.key).map((other) => other.assetIdentifier)}
            showRequiredError={showAllErrors || visitedKeys.has(asset.key)}
            autoFocus={asset.key === focusKey}
            onChange={updateAsset}
            onRemove={removeAsset}
            onIdentifierBlur={handleIdentifierBlur}
          />
        ))
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add asset"
      >
        <Ionicons name="add-circle-outline" size={20} color="#2563EB" style={styles.addIcon} />
        <Text style={styles.addText}>Add Asset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  emptyTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  assetCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  assetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 8,
  },
  removeIcon: {
    marginRight: 4,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  notesLabel: {
    marginTop: 12,
  },
  requiredStar: {
    color: '#EF4444',
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: '#2563EB',
  },
  inputInvalid: {
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },
  textAreaContainer: {
    minHeight: 72,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    width: '100%',
    minHeight: 52,
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesError: {
    flex: 1,
    marginRight: 8,
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  charCounterOver: {
    color: '#DC2626',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  addIcon: {
    marginRight: 8,
  },
  addText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
});
