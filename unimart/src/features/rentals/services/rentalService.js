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

  return {
    rentals,
    nextCursor: toNextCursor(feed.nextCursor),
  };
}
