import { apiRequest } from '../../../services/api';

// A rental the app can show: an object with a usable id (list keys and map markers depend on it).
// null, numbers or an item without an id would crash the list or give every card the same key.
function isUsableRental(rental) {
  if (rental === null || typeof rental !== 'object' || Array.isArray(rental)) {
    return false;
  }

  const { id } = rental;
  return (typeof id === 'number' && Number.isFinite(id)) || (typeof id === 'string' && id.trim() !== '');
}

// The backend's cursor is a rental id, a positive whole number. Anything else would be rejected with 400
// on every next-page request, so it is treated as "no more pages".
function toNextCursor(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim()) && Number(value) > 0) {
    return Number(value);
  }
  return null;
}

// Rentals loaded by the feed, by id, so the details screen can show one without another request.
// Keyed by String(id), like the feed's list keys, so 5 and '5' are the same rental.
// Capped so a long scrolling session does not keep every rental in memory; the oldest are dropped first.
const loadedRentals = new Map();
const LOADED_RENTALS_LIMIT = 500;

function rememberRental(rental) {
  const key = String(rental.id).trim();
  // Re-inserting moves a refreshed rental to the newest end, so it is dropped last
  loadedRentals.delete(key);
  loadedRentals.set(key, rental);

  if (loadedRentals.size > LOADED_RENTALS_LIMIT) {
    loadedRentals.delete(loadedRentals.keys().next().value);
  }
}

/**
 * Read a rental id from a route param
 * Rental ids are positive whole numbers; anything else (missing, '', 'abc', '1.5', a repeated param
 * that arrives as an array) cannot be a real rental
 * @param {*} value - e.g. the id from useLocalSearchParams()
 * @returns {number|null} null when the value is not a valid rental id
 */
export function parseRentalId(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  return null;
}

/**
 * Find a rental the feed has already loaded in this session
 * There is no GET /api/rentals/:id yet, so this is the only lookup: a rental the feed has not loaded
 * (e.g. opened from a link after the app restarts) is not found.
 * @param {number|string} id
 * @returns {object|null} the feed item, or null when it has not been loaded
 */
export function getLoadedRental(id) {
  if (id === null || id === undefined) {
    return null;
  }
  return loadedRentals.get(String(id).trim()) ?? null;
}

/**
 * Fetch one page of active rental listings for the feed
 * GET /api/rentals?limit=20&cursor=123
 * @param {object} [options]
 * @param {number} [options.limit=20] - Number of rentals per page (backend allows 1-50)
 * @param {number|null} [options.cursor] - nextCursor from the previous page
 * @returns {Promise<{ rentals: object[], nextCursor: number|null }>}
 */
export async function getRentalFeed({ limit = 20, cursor } = {}) {
  const params = [`limit=${encodeURIComponent(limit)}`];

  if (cursor !== undefined && cursor !== null) {
    params.push(`cursor=${encodeURIComponent(cursor)}`);
  }

  const response = await apiRequest(`/rentals?${params.join('&')}`, { method: 'GET' });

  const feed = response?.data;

  if (!feed || !Array.isArray(feed.rentals)) {
    throw new Error('Invalid rental feed response from server.');
  }

  const rentals = feed.rentals.filter(isUsableRental);
  if (rentals.length !== feed.rentals.length) {
    console.warn(`Skipped ${feed.rentals.length - rentals.length} malformed rental(s) in the feed response.`);
  }

  rentals.forEach(rememberRental);

  return {
    rentals,
    nextCursor: toNextCursor(feed.nextCursor),
  };
}
