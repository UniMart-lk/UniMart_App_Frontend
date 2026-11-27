import { apiRequest } from './api';

class BookingService {
  /**
   * Submit a new rental booking request
   * Protected with concurrency locking in the backend
   * @param {Object} params - { rentalListingId, startDate, endDate }
   */
  async createBooking({ rentalListingId, startDate, endDate }) {
    return await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        rentalListingId,
        startDate: typeof startDate === 'string' ? startDate : startDate.toISOString(),
        endDate: typeof endDate === 'string' ? endDate : endDate.toISOString(),
      }),
    });
  }

  /**
   * Pre-check availability for a rental listing over a date range
   * @param {Object} params - { rentalListingId, startDate, endDate }
   */
  async checkAvailability({ rentalListingId, startDate, endDate }) {
    const listingIdStr = encodeURIComponent(String(rentalListingId));
    const startStr = encodeURIComponent(typeof startDate === 'string' ? startDate : startDate.toISOString());
    const endStr = encodeURIComponent(typeof endDate === 'string' ? endDate : endDate.toISOString());
    return await apiRequest(
      `/bookings/check-availability?rentalListingId=${listingIdStr}&startDate=${startStr}&endDate=${endStr}`,
      { method: 'GET' }
    );
  }

  /**
   * Get all bookings placed by the logged-in student
   * @param {Object} params - { status, limit, cursor }
   */
  async getMyBookings({ status, limit = 20, cursor } = {}) {
    let query = `?limit=${limit}`;
    if (status && status !== 'ALL') {
      query += `&status=${encodeURIComponent(status)}`;
    }
    if (cursor) {
      query += `&cursor=${cursor}`;
    }
    return await apiRequest(`/bookings/my-bookings${query}`);
  }

  /**
   * Cancel an active or pending booking
   * @param {number|string} bookingId
   * @param {string} cancellationReason
   */
  async cancelBooking(bookingId, cancellationReason) {
    return await apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancellationReason }),
    });
  }
}

export default new BookingService();
