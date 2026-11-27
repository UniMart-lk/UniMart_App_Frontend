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
    return await apiRequest(`/bookings/${encodeURIComponent(String(bookingId))}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancellationReason }),
    });
  }

  /**
   * Get all incoming rental booking requests for listings owned by the logged-in provider
   * @param {Object} params - { status, limit, cursor }
   */
  async getProviderBookings({ status, limit = 20, cursor } = {}) {
    let query = `?limit=${encodeURIComponent(String(limit))}`;
    if (status && status !== 'ALL') {
      query += `&status=${encodeURIComponent(status)}`;
    }
    if (cursor !== undefined && cursor !== null) {
      query += `&cursor=${encodeURIComponent(String(cursor))}`;
    }
    return await apiRequest(`/bookings/provider-bookings${query}`, { method: 'GET' });
  }

  /**
   * Provider accepts a PENDING booking request (PENDING -> ACCEPTED)
   * @param {number|string} bookingId
   */
  async acceptBooking(bookingId) {
    return await apiRequest(`/bookings/${encodeURIComponent(String(bookingId))}/accept`, {
      method: 'PATCH',
    });
  }

  /**
   * Provider rejects a PENDING booking request (PENDING -> REJECTED)
   * @param {number|string} bookingId
   * @param {string} rejectionReason
   */
  async rejectBooking(bookingId, rejectionReason) {
    return await apiRequest(`/bookings/${encodeURIComponent(String(bookingId))}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  /**
   * Provider marks an ACCEPTED booking as completed (ACCEPTED -> COMPLETED)
   * @param {number|string} bookingId
   */
  async completeBooking(bookingId) {
    return await apiRequest(`/bookings/${encodeURIComponent(String(bookingId))}/complete`, {
      method: 'PATCH',
    });
  }
}

export default new BookingService();
