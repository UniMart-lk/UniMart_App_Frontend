import { apiRequest } from '../../../services/api';

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

  return {
    rentals: feed.rentals,
    nextCursor: feed.nextCursor ?? null,
  };
}
