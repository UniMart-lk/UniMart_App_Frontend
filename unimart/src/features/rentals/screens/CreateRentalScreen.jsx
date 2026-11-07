import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRentalDraft } from '../context/RentalDraftContext';
import { formatVehicleType } from '../components/RentalCard';
import { formatCoordinate, toPickerCoordinate } from '../components/LocationPickerMap';

// Backend VehicleType enum values
const VEHICLE_TYPES = ['MOTORCYCLE', 'CAR', 'THREE_WHEELER', 'BICYCLE'];

// Backend RentalPeriod enum values
const RENTAL_PERIODS = [
  { value: 'HOURLY', label: 'Per hour' },
  { value: 'DAILY', label: 'Per day' },
  { value: 'WEEKLY', label: 'Per week' },
  { value: 'MONTHLY', label: 'Per month' },
];

const CONDITIONS = ['Excellent', 'Good', 'Fair'];

// Same limits as the backend columns: title VarChar(200), make_model VarChar(150), rental_price Decimal(10, 2)
const TITLE_MAX_LENGTH = 200;
const MAKE_MODEL_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 1000;
const PRICE_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;

// Chip row for picking one value from a fixed list
function OptionChips({ options, selected, onSelect, accessibilityLabel }) {
  return (
    <View style={styles.chipRow} accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const VEHICLE_TYPE_OPTIONS = VEHICLE_TYPES.map((value) => ({ value, label: formatVehicleType(value) }));
const CONDITION_OPTIONS = CONDITIONS.map((value) => ({ value, label: value }));

/**
 * Form for a provider to list a rental vehicle
 * Values live in RentalDraftContext, so they are kept while the pickup location screen is open.
 * Nothing is sent to the backend yet.
 */
export default function CreateRentalScreen() {
  const router = useRouter();
  const { draft, updateDraft, resetDraft } = useRentalDraft();

  // The draft belongs to this visit to the form: leaving the form starts the next listing empty
  useEffect(() => resetDraft, [resetDraft]);

  // Only a valid confirmed location counts as selected
  const pickupCoordinate = toPickerCoordinate(draft.pickupLocation?.latitude, draft.pickupLocation?.longitude);
  const pickupName =
    typeof draft.pickupLocation?.pickupLocationName === 'string' ? draft.pickupLocation.pickupLocationName.trim() : '';
  const hasPickupLocation = pickupCoordinate !== null && pickupName !== '';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/rentals');
    }
  };

  const handlePriceChange = (text) => {
    // Ignore keystrokes that would make an invalid price (letters, a second dot, more than 2 decimals)
    if (PRICE_PATTERN.test(text)) {
      updateDraft({ rentalPrice: text });
    }
  };

  const openPickupLocation = () => {
    router.push('/rentalPickupLocation');
  };

  const handlePublish = () => {
    if (!draft.title.trim()) {
      Alert.alert('Required Field', 'Please enter a Listing Title.');
      return;
    }
    if (!draft.vehicleType) {
      Alert.alert('Required Field', 'Please select a Vehicle Type.');
      return;
    }
    if (!draft.makeModel.trim()) {
      Alert.alert('Required Field', 'Please enter the Make & Model.');
      return;
    }
    if (!draft.description.trim()) {
      Alert.alert('Required Field', 'Please provide a Description.');
      return;
    }
    if (!draft.condition) {
      Alert.alert('Required Field', 'Please select the Condition of your vehicle.');
      return;
    }
    const price = Number(draft.rentalPrice);
    if (draft.rentalPrice === '' || !Number.isFinite(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid rental price in LKR.');
      return;
    }
    if (!hasPickupLocation) {
      Alert.alert('Required Field', 'Please select the Pickup Location on the map.');
      return;
    }

    const listing = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      condition: draft.condition,
      rentalPrice: price,
      rentalPeriod: draft.rentalPeriod,
      itemType: 'VEHICLE',
      vehicle: {
        vehicleType: draft.vehicleType,
        makeModel: draft.makeModel.trim(),
        specifications: draft.specifications.trim() || null,
        pickupLocationName: pickupName,
        latitude: pickupCoordinate.latitude,
        longitude: pickupCoordinate.longitude,
      },
    };

    // Saving is not connected to the backend yet; the listing is only checked and logged
    console.log('Rental listing ready to submit:', listing);
    Alert.alert('Listing Ready', 'Your rental details are complete. Publishing rentals will be available soon.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>List a Vehicle</Text>

        {/* Empty placeholder to balance the centred title */}
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoid}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Listing Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Honda Dio scooter for daily rent"
                placeholderTextColor="#94A3B8"
                value={draft.title}
                onChangeText={(title) => updateDraft({ title })}
                maxLength={TITLE_MAX_LENGTH}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Vehicle Type <Text style={styles.requiredStar}>*</Text>
            </Text>
            <OptionChips
              options={VEHICLE_TYPE_OPTIONS}
              selected={draft.vehicleType}
              onSelect={(vehicleType) => updateDraft({ vehicleType })}
              accessibilityLabel="Vehicle type"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Make &amp; Model <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Honda Dio 110cc"
                placeholderTextColor="#94A3B8"
                value={draft.makeModel}
                onChangeText={(makeModel) => updateDraft({ makeModel })}
                maxLength={MAKE_MODEL_MAX_LENGTH}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the vehicle... (rules, what's included, e.g. helmet)"
                placeholderTextColor="#94A3B8"
                value={draft.description}
                onChangeText={(description) => updateDraft({ description })}
                multiline
                numberOfLines={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCounter}>
              {draft.description.length}/{DESCRIPTION_MAX_LENGTH}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Condition <Text style={styles.requiredStar}>*</Text>
            </Text>
            <OptionChips
              options={CONDITION_OPTIONS}
              selected={draft.condition}
              onSelect={(condition) => updateDraft({ condition })}
              accessibilityLabel="Condition"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Rental Price <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>LKR</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={draft.rentalPrice}
                onChangeText={handlePriceChange}
                accessibilityLabel="Rental price in LKR"
              />
            </View>
            <View style={styles.periodChips}>
              <OptionChips
                options={RENTAL_PERIODS}
                selected={draft.rentalPeriod}
                onSelect={(rentalPeriod) => updateDraft({ rentalPeriod })}
                accessibilityLabel="Rental period"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Pickup Location <Text style={styles.requiredStar}>*</Text>
            </Text>

            {hasPickupLocation ? (
              <View style={styles.locationCard}>
                <View style={styles.locationIconWrap}>
                  <Ionicons name="location-sharp" size={20} color="#2563EB" />
                </View>
                <View style={styles.locationTextWrap}>
                  <Text style={styles.locationName} numberOfLines={2}>
                    {pickupName}
                  </Text>
                  <Text style={styles.locationCoordinates}>{formatCoordinate(pickupCoordinate)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.changeLocationBtn}
                  onPress={openPickupLocation}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Change pickup location"
                >
                  <Text style={styles.changeLocationText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectLocationBtn}
                onPress={openPickupLocation}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Select pickup location"
              >
                <Ionicons name="map-outline" size={20} color="#2563EB" style={styles.selectLocationIcon} />
                <Text style={styles.selectLocationText}>Select Pickup Location</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Specifications <Text style={styles.optionalTag}>(optional)</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                placeholder="e.g., 110cc, automatic, fuel not included"
                placeholderTextColor="#94A3B8"
                value={draft.specifications}
                onChangeText={(specifications) => updateDraft({ specifications })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={handlePublish}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Publish rental"
        >
          <Text style={styles.publishBtnText}>Publish Rental</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },
  textAreaContainer: {
    minHeight: 115,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    width: '100%',
    minHeight: 95,
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  currencyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencyBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 14,
    height: 48,
  },
  periodChips: {
    marginTop: 10,
  },
  selectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  selectLocationIcon: {
    marginRight: 8,
  },
  selectLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  changeLocationBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  changeLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  publishBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
