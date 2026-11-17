import { getValidCoordinate } from '../components/RentalMap';

/**
 * Directions to a rental's pickup location
 * Plain functions with no UI, so any screen or component can use them. Builds on the same coordinate
 * validation as the rental maps, so directions are only offered for a point a map would also show.
 */

/**
 * Build a validated directions destination from pickup coordinates
 * @param {number|string} latitude - number or decimal string (e.g. an unconverted Prisma Decimal)
 * @param {number|string} longitude
 * @param {string} [pickupLocationName] - shown as the destination label where the maps app supports one
 * @returns {{ latitude: number, longitude: number, name: string|null }|null}
 *   null when the coordinates are missing or invalid (including the 0,0 placeholder)
 */
export function getPickupDestination(latitude, longitude, pickupLocationName) {
  const coordinate = getValidCoordinate(latitude, longitude);
  if (!coordinate) {
    return null;
  }

  const name = typeof pickupLocationName === 'string' ? pickupLocationName.trim() : '';

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    name: name || null,
  };
}

/**
 * Directions destination for a rental feed item
 * Only vehicle rentals have pickup coordinates; equipment rentals (vehicle: null) have no destination
 * @param {object} rental - rental feed item
 * @returns {{ latitude: number, longitude: number, name: string|null }|null}
 */
export function getRentalPickupDestination(rental) {
  return getPickupDestination(
    rental?.vehicle?.latitude,
    rental?.vehicle?.longitude,
    rental?.vehicle?.pickupLocationName
  );
}

/**
 * Whether directions can be offered for a rental (e.g. to show or hide a Get Directions button)
 * @param {object} rental - rental feed item
 * @returns {boolean}
 */
export function canGetDirections(rental) {
  return getRentalPickupDestination(rental) !== null;
}
