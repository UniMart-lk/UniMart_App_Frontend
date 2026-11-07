import React from 'react';
import { useRouter } from 'expo-router';
import RentalMapLocationScreen from '@/features/rentals/screens/RentalMapLocationScreen';
import { useRentalDraft } from '@/features/rentals/context/RentalDraftContext';

// Opened from the rental form; the confirmed location goes back through the shared rental draft
export default function RentalPickupLocationRoute() {
  const router = useRouter();
  const { draft, setPickupLocation } = useRentalDraft();

  const returnToForm = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Opened directly (e.g. a deep link), so there is no form underneath to go back to
      router.replace('/createRental');
    }
  };

  const handleConfirm = (location) => {
    setPickupLocation(location);
    returnToForm();
  };

  return (
    <RentalMapLocationScreen
      // Reopening the picker starts from the location already chosen, so it can be adjusted
      initialLocation={draft.pickupLocation}
      onConfirm={handleConfirm}
      onCancel={returnToForm}
    />
  );
}
