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
};

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

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_RENTAL_DRAFT);
  }, []);

  const value = useMemo(
    () => ({ draft, updateDraft, setPickupLocation, resetDraft }),
    [draft, updateDraft, setPickupLocation, resetDraft]
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
