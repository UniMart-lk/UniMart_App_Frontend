/**
 * Physical assets of a rental listing (e.g. the three individual bikes under one "Honda bikes" listing)
 * Plain functions with no UI, so the form, the details screen or any other component can use them.
 * Limits and statuses follow the backend's RentalAsset model.
 */

// Same limits as the backend columns: asset_identifier VarChar(100), notes VarChar(255)
export const ASSET_IDENTIFIER_MAX_LENGTH = 100;
export const ASSET_NOTES_MAX_LENGTH = 255;

// Backend AssetStatus enum values
export const ASSET_STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED'];

const ASSET_STATUS_LABELS = {
  AVAILABLE: 'Available',
  RENTED: 'Rented',
  MAINTENANCE: 'Under maintenance',
  RETIRED: 'Retired',
};

// Characters as the database counts them: '🚲' is one character in a utf8mb4 VarChar but has a .length of 2
function characterCount(text) {
  return Array.from(text).length;
}

/**
 * Validate an asset identifier (e.g. "Bike 01" or a plate number)
 * @param {*} identifier
 * @returns {{ isValid: boolean, value: string, error: string|null }}
 *   value is the trimmed identifier ('' when missing); error explains why it is invalid
 */
export function validateAssetIdentifier(identifier) {
  const value = typeof identifier === 'string' ? identifier.trim() : '';

  if (!value) {
    return { isValid: false, value, error: 'Please enter an asset identifier.' };
  }
  if (characterCount(value) > ASSET_IDENTIFIER_MAX_LENGTH) {
    return {
      isValid: false,
      value,
      error: `Asset identifier must be ${ASSET_IDENTIFIER_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { isValid: true, value, error: null };
}

/**
 * Key for comparing identifiers: trimmed and lower-case, so "Bike 01" and " bike 01 " match
 * @param {*} identifier
 * @returns {string} '' when the identifier is missing or not a string
 */
export function normalizeAssetIdentifier(identifier) {
  return typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
}

/**
 * Whether an identifier is already used by other assets of the same listing
 * @param {*} identifier - the identifier being added or edited
 * @param {*[]} otherIdentifiers - identifiers of the listing's other assets (leave out the asset being edited)
 * @returns {boolean} false for a missing identifier, which validateAssetIdentifier reports instead
 */
export function isDuplicateAssetIdentifier(identifier, otherIdentifiers) {
  const key = normalizeAssetIdentifier(identifier);
  if (!key || !Array.isArray(otherIdentifiers)) {
    return false;
  }

  return otherIdentifiers.some((other) => normalizeAssetIdentifier(other) === key);
}

/**
 * Identifiers used by more than one asset in a list
 * @param {*[]} assets - asset objects with an assetIdentifier
 * @returns {string[]} one normalized key per repeated identifier, in first-seen order; [] when there are none
 */
export function getDuplicateAssetIdentifiers(assets) {
  if (!Array.isArray(assets)) {
    return [];
  }

  const seen = new Set();
  const duplicates = new Set();
  assets.forEach((asset) => {
    const key = normalizeAssetIdentifier(asset?.assetIdentifier);
    if (!key) {
      return;
    }
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  });

  return [...duplicates];
}

/**
 * Validate optional asset notes (e.g. "New tyres fitted in March")
 * @param {*} notes
 * @returns {{ isValid: boolean, value: string|null, error: string|null }}
 *   value is the trimmed notes, or null when there are none (null, undefined, '' or only spaces)
 */
export function validateAssetNotes(notes) {
  if (notes === null || notes === undefined) {
    return { isValid: true, value: null, error: null };
  }
  if (typeof notes !== 'string') {
    return { isValid: false, value: null, error: 'Asset notes must be text.' };
  }

  const value = notes.trim();
  if (!value) {
    return { isValid: true, value: null, error: null };
  }
  if (characterCount(value) > ASSET_NOTES_MAX_LENGTH) {
    return { isValid: false, value, error: `Asset notes must be ${ASSET_NOTES_MAX_LENGTH} characters or fewer.` };
  }

  return { isValid: true, value, error: null };
}

/**
 * Whether a value is one of the backend's asset statuses (exact match, e.g. 'AVAILABLE')
 * @param {*} status
 * @returns {boolean}
 */
export function isValidAssetStatus(status) {
  return typeof status === 'string' && ASSET_STATUSES.includes(status);
}

/**
 * Readable label for an asset status
 * @param {string} status - AssetStatus enum value, e.g. 'MAINTENANCE'
 * @returns {string|null} e.g. 'Under maintenance'; null for a missing or unknown status
 */
export function getAssetStatusLabel(status) {
  return isValidAssetStatus(status) ? ASSET_STATUS_LABELS[status] : null;
}

/**
 * Number of assets in each status
 * Only asset objects with a known status are counted; missing or malformed entries are skipped.
 * Availability is the asset's own status; booking dates are not considered.
 * @param {*[]} assets - asset objects with a status
 * @returns {{ AVAILABLE: number, RENTED: number, MAINTENANCE: number, RETIRED: number }} all 0 for an empty or missing list
 */
export function countAssetsByStatus(assets) {
  const counts = { AVAILABLE: 0, RENTED: 0, MAINTENANCE: 0, RETIRED: 0 };
  if (!Array.isArray(assets)) {
    return counts;
  }

  assets.forEach((asset) => {
    if (isValidAssetStatus(asset?.status)) {
      counts[asset.status] += 1;
    }
  });

  return counts;
}

/**
 * Total number of assets, counted the same way as countAssetsByStatus (all statuses, including retired)
 * @param {*[]} assets
 * @returns {number}
 */
export function getTotalAssetCount(assets) {
  const counts = countAssetsByStatus(assets);
  return ASSET_STATUSES.reduce((total, status) => total + counts[status], 0);
}

/**
 * Number of assets whose status is AVAILABLE
 * @param {*[]} assets
 * @returns {number}
 */
export function getAvailableAssetCount(assets) {
  return countAssetsByStatus(assets).AVAILABLE;
}
