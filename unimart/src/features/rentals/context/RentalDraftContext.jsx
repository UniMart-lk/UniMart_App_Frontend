import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RentalDraftContext = createContext(null);

// Field names follow the backend's RentalListing / RentalVehicleDetail models
export const EMPTY_RENTAL_DRAFT = {
  title: '',
  description: '',
  condition: '',
  // Kept as typed text; converted to a number when the listing is submitted
  rentalPrice: '',
  rentalPeriod: 'DAILY',
  vehicleType: '',
  makeModel: '',
  specifications: '',
  // { latitude, longitude, pickupLocationName } confirmed on the pickup location screen, or null
  pickupLocation: null,
  // Physical assets of this listing, each { key, assetIdentifier, notes } (see the backend's RentalAsset model).
  // key is a temporary id for list rendering only; status and the real id come from the backend once saved.
  assets: [],
};

// Fields of a draft asset the provider can edit
const EDITABLE_ASSET_FIELDS = ['assetIdentifier', 'notes'];

// Temporary asset keys never repeat in a session, even after an asset is removed or the draft is reset
let lastAssetKey = 0;
function createAssetKey() {
  lastAssetKey += 1;
  return `asset-${lastAssetKey}`;
}

// Kept as typed (not trimmed or validated here), so a half-typed identifier can be stored while it is edited
function toAssetText(value) {
  return typeof value === 'string' ? value : '';
}

/**
 * Holds the rental listing being created, so its values survive moving between the form and the
 * pickup location screen (Expo Router routes cannot pass callbacks to each other)
 */
export function RentalDraftProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY_RENTAL_DRAFT);

  // Merge changed fields into the draft
  const updateDraft = useCallback((changes) => {
    setDraft((current) => ({ ...current, ...changes }));
  }, []);

  const setPickupLocation = useCallback((pickupLocation) => {
    setDraft((current) => ({ ...current, pickupLocation }));
  }, []);

  /**
   * Add an asset to the end of the draft's asset list
   * @param {{ assetIdentifier?: string, notes?: string }} [fields]
   * @returns {string} the new asset's temporary key
   */
  const addAsset = useCallback((fields = {}) => {
    // Created outside the state updater, so React calling the updater twice cannot produce two keys
    const asset = {
      key: createAssetKey(),
      assetIdentifier: toAssetText(fields?.assetIdentifier),
      notes: toAssetText(fields?.notes),
    };
    setDraft((current) => ({ ...current, assets: [...current.assets, asset] }));
    return asset.key;
  }, []);

  /**
   * Change an asset's editable fields; its key and every other asset stay the same
   * @param {string} key - temporary key from addAsset
   * @param {{ assetIdentifier?: string, notes?: string }} changes - other fields are ignored
   */
  const updateAsset = useCallback((key, changes) => {
    setDraft((current) => {
      const index = current.assets.findIndex((asset) => asset.key === key);
      if (index === -1 || changes === null || typeof changes !== 'object') {
        return current;
      }

      const asset = current.assets[index];
      const updated = { ...asset };
      EDITABLE_ASSET_FIELDS.forEach((field) => {
        if (field in changes) {
          updated[field] = toAssetText(changes[field]);
        }
      });
      if (EDITABLE_ASSET_FIELDS.every((field) => updated[field] === asset[field])) {
        return current;
      }

      const assets = [...current.assets];
      assets[index] = updated;
      return { ...current, assets };
    });
  }, []);

  /**
   * Remove an asset; an unknown key leaves the draft unchanged
   * @param {string} key - temporary key from addAsset
   */
  const removeAsset = useCallback((key) => {
    setDraft((current) => {
      const assets = current.assets.filter((asset) => asset.key !== key);
      return assets.length === current.assets.length ? current : { ...current, assets };
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_RENTAL_DRAFT);
  }, []);

  const value = useMemo(
    () => ({ draft, updateDraft, setPickupLocation, addAsset, updateAsset, removeAsset, resetDraft }),
    [draft, updateDraft, setPickupLocation, addAsset, updateAsset, removeAsset, resetDraft]
  );

  return <RentalDraftContext.Provider value={value}>{children}</RentalDraftContext.Provider>;
}

export function useRentalDraft() {
  const context = useContext(RentalDraftContext);
  if (!context) {
    throw new Error('useRentalDraft must be used within a RentalDraftProvider');
  }
  return context;
}
