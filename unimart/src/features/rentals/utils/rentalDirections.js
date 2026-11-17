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

const GOOGLE_MAPS_DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1';
// Same precision as the backend's Decimal(10, 7) latitude/longitude columns (~1 cm)
const URL_COORDINATE_DECIMALS = 7;

// Plain decimal text for a URL: String(0.0000001) would give "1e-7", which a maps app may not read.
// Up to 7 decimals with trailing zeros removed, e.g. 6.9271 -> "6.9271", 80 -> "80"
function formatUrlCoordinate(value) {
  const text = value.toFixed(URL_COORDINATE_DECIMALS).replace(/\.?0+$/, '');
  // A tiny negative value rounds to "-0"
  return text === '-0' ? '0' : text;
}

/**
 * Google Maps directions URL to a pickup destination
 * The destination is validated again, so a hand-built or stale object can never produce a broken URL.
 * @param {{ latitude: number|string, longitude: number|string }|null} destination - e.g. from getRentalPickupDestination
 * @returns {string|null} e.g. "https://www.google.com/maps/dir/?api=1&destination=6.9271,79.8612";
 *   null when the destination is missing or its coordinates are invalid
 */
export function getGoogleMapsDirectionsUrl(destination) {
  const valid = getPickupDestination(destination?.latitude, destination?.longitude);
  if (!valid) {
    return null;
  }

  const coordinates = `${formatUrlCoordinate(valid.latitude)},${formatUrlCoordinate(valid.longitude)}`;
  return `${GOOGLE_MAPS_DIRECTIONS_URL}&destination=${coordinates}`;
}

/**
 * Google Maps directions URL to a rental's pickup location
 * @param {object} rental - rental feed item
 * @returns {string|null} null when the rental has no valid pickup coordinates (e.g. equipment rentals)
 */
export function getRentalDirectionsUrl(rental) {
  return getGoogleMapsDirectionsUrl(getRentalPickupDestination(rental));
}
