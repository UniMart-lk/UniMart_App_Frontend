import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import bookingService from '../../../services/bookingService';

const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
};

// Format date into human-friendly string (e.g. "Thu, 26 Nov 2026, 09:00 AM")
function formatDisplayDateTime(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BookRentalModal({ visible, onClose, rental, onBookingSuccess }) {
  const router = useRouter();

  // Selected rental duration in units (default 1 unit of the listing's period)
  const [durationUnits, setDurationUnits] = useState(1);
  const [startOffsetDays, setStartOffsetDays] = useState(1); // 1 = Tomorrow

  // Loading & error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  const resetModalState = () => {
    setDurationUnits(1);
    setStartOffsetDays(1);
    setErrorMessage(null);
    setConcurrencyConflict(null);
    setCreatedBooking(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const rentalPeriod = (rental?.rentalPeriod || 'DAILY').toUpperCase();
  const basePrice = Number(rental?.rentalPrice || 0);

  // Compute Start Date and End Date based on offset & duration
  const { startDate, endDate, durationLabel } = useMemo(() => {
    const start = new Date();
    // Default to start at 09:00 AM on the offset day
    start.setDate(start.getDate() + startOffsetDays);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);

    switch (rentalPeriod) {
      case 'HOURLY':
        end.setHours(end.getHours() + durationUnits);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + durationUnits * 7);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + durationUnits);
        break;
      case 'DAILY':
      default:
        end.setDate(end.getDate() + durationUnits);
        break;
    }

    let label = `${durationUnits} Day${durationUnits > 1 ? 's' : ''}`;
    if (rentalPeriod === 'HOURLY') label = `${durationUnits} Hour${durationUnits > 1 ? 's' : ''}`;
    if (rentalPeriod === 'WEEKLY') label = `${durationUnits} Week${durationUnits > 1 ? 's' : ''}`;
    if (rentalPeriod === 'MONTHLY') label = `${durationUnits} Month${durationUnits > 1 ? 's' : ''}`;

    return { startDate: start, endDate: end, durationLabel: label };
  }, [startOffsetDays, durationUnits, rentalPeriod]);

  // Live Price Calculation
  const { subtotal, securityDeposit, totalPayable } = useMemo(() => {
    const sub = basePrice * durationUnits;
    // Standard student security deposit: 25% of subtotal or min LKR 1,500
    const deposit = Math.max(1500, Math.round(sub * 0.25));
    const total = sub + deposit;
    return {
      subtotal: sub,
      securityDeposit: deposit,
      totalPayable: total,
    };
  }, [basePrice, durationUnits]);

  // Quick preset chips for days offset
  const startDayOptions = [
    { label: 'Tomorrow', offset: 1 },
    { label: 'In 2 Days', offset: 2 },
    { label: 'In 3 Days', offset: 3 },
    { label: 'This Weekend', offset: 5 },
  ];

  // Quick duration presets
  const durationPresets = rentalPeriod === 'HOURLY'
    ? [2, 4, 8, 12]
    : [1, 2, 3, 5, 7];

  // Handle Booking Submission
  const handleConfirmBooking = async () => {
    if (!rental?.id) return;

    setSubmitting(true);
    setErrorMessage(null);
    setConcurrencyConflict(null);

    try {
      const response = await bookingService.createBooking({
        rentalListingId: rental.id,
        startDate,
        endDate,
      });

      const bookingData = response.data?.booking || response.data;
      setCreatedBooking(bookingData);

      if (onBookingSuccess) {
        onBookingSuccess(bookingData);
      }
    } catch (error) {
      console.warn('Booking creation failed:', error);

      // --- 409 CONCURRENCY CONFLICT HANDLING ---
      if (error.status === 409 || error.data?.code === 'CONCURRENCY_CONFLICT') {
        setConcurrencyConflict({
          title: 'Date Slot Unavailable (Conflict)',
          message:
            error.data?.message ||
            'Another student just booked this item for the selected dates, or an overlapping reservation already exists. Please choose another date or duration.',
        });
      } else if (error.status === 401) {
        setErrorMessage('Please login to your UniMart student account to book rentals.');
      } else {
        setErrorMessage(error.message || 'Failed to place booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToBookings = () => {
    handleClose();
    router.push('/myBookings');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>
                {createdBooking ? 'Booking Confirmed' : 'Book Rental'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* SUCCESS VIEW */}
          {createdBooking ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Reservation Requested!</Text>
              <Text style={styles.successSubtitle}>
                Your booking request for <Text style={{ fontWeight: '700' }}>{rental?.title}</Text> has been placed successfully.
              </Text>

              <View style={styles.bookingCardSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Booking Reference</Text>
                  <Text style={styles.summaryValueHighlight}>
                    #{createdBooking.bookingNumber || 'UB-CONFIRMED'}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Scheduled Dates</Text>
                  <Text style={styles.summaryValue}>
                    {formatDisplayDateTime(startDate)} - {formatDisplayDateTime(endDate)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryPrice}>LKR {Number(createdBooking.totalPrice || totalPayable).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Awaiting Host Approval</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleNavigateToBookings}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>View in My Bookings</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* BOOKING CONFIGURATION VIEW */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Item Snapshot */}
              <View style={styles.itemSnapshot}>
                <View style={styles.itemSnapshotText}>
                  <Text style={styles.itemSnapshotTitle} numberOfLines={1}>
                    {rental?.title || 'Rental Item'}
                  </Text>
                  <Text style={styles.itemSnapshotRate}>
                    LKR {basePrice.toLocaleString()} / {rentalPeriod.toLowerCase()}
                  </Text>
                </View>
                <View style={styles.rateBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.rateBadgeText}>Concurrency Guard</Text>
                </View>
              </View>

              {/* 409 CONCURRENCY CONFLICT BANNER */}
              {concurrencyConflict ? (
                <View style={styles.conflictBanner}>
                  <View style={styles.conflictIconWrap}>
                    <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
                  </View>
                  <View style={styles.conflictTextWrap}>
                    <Text style={styles.conflictTitle}>{concurrencyConflict.title}</Text>
                    <Text style={styles.conflictMessage}>{concurrencyConflict.message}</Text>
                    <TouchableOpacity
                      style={styles.conflictActionBtn}
                      onPress={() => {
                        setStartOffsetDays((prev) => prev + 1);
                        setConcurrencyConflict(null);
                      }}
                    >
                      <Ionicons name="refresh" size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
                      <Text style={styles.conflictActionBtnText}>Shift Start Date +1 Day</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Standard Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 1. SELECT START DAY */}
              <Text style={styles.sectionHeading}>1. Pickup Date</Text>
              <View style={styles.chipsRow}>
                {startDayOptions.map((opt) => {
                  const isSelected = startOffsetDays === opt.offset;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setStartOffsetDays(opt.offset);
                        setConcurrencyConflict(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.selectedDateBadge}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.selectedDateText}>Starts: {formatDisplayDateTime(startDate)}</Text>
              </View>

              {/* 2. SELECT DURATION */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>2. Rental Duration</Text>
                <Text style={styles.durationValueLabel}>{durationLabel}</Text>
              </View>

              {/* Quick Duration Buttons */}
              <View style={styles.chipsRow}>
                {durationPresets.map((val) => {
                  const isSelected = durationUnits === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setDurationUnits(val);
                        setConcurrencyConflict(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {val} {rentalPeriod === 'HOURLY' ? 'hr' : val === 1 ? 'day' : 'days'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Plus / Minus Stepper */}
              <View style={styles.stepperContainer}>
                <Text style={styles.stepperLabel}>Adjust Duration:</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, durationUnits <= 1 && styles.stepperBtnDisabled]}
                    disabled={durationUnits <= 1}
                    onPress={() => {
                      setDurationUnits((prev) => Math.max(1, prev - 1));
                      setConcurrencyConflict(null);
                    }}
                  >
                    <Ionicons name="remove" size={18} color={durationUnits <= 1 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>

                  <Text style={styles.stepperValueText}>{durationUnits}</Text>

                  <TouchableOpacity
                    style={[styles.stepperBtn, durationUnits >= 30 && styles.stepperBtnDisabled]}
                    disabled={durationUnits >= 30}
                    onPress={() => {
                      setDurationUnits((prev) => Math.min(30, prev + 1));
                      setConcurrencyConflict(null);
                    }}
                  >
                    <Ionicons name="add" size={18} color={durationUnits >= 30 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.selectedDateBadge}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.selectedDateText}>Return by: {formatDisplayDateTime(endDate)}</Text>
              </View>

              {/* 3. LIVE PRICE CALCULATION CARD */}
              <Text style={styles.sectionHeading}>3. Price Breakdown</Text>
              <View style={styles.priceBreakdownCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceRowLabel}>
                    Rental Fee ({durationLabel} × LKR {basePrice.toLocaleString()})
                  </Text>
                  <Text style={styles.priceRowValue}>LKR {subtotal.toLocaleString()}</Text>
                </View>

                <View style={styles.priceRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.priceRowLabel}>Campus Security Deposit</Text>
                    <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.priceRowValue}>LKR {securityDeposit.toLocaleString()}</Text>
                </View>
                <Text style={styles.depositNote}>
                  * Refundable upon returning the item in good condition.
                </Text>

                <View style={styles.priceDivider} />

                <View style={styles.priceTotalRow}>
                  <View>
                    <Text style={styles.priceTotalLabel}>Total Amount</Text>
                    <Text style={styles.priceTotalSublabel}>Pay on pickup or online</Text>
                  </View>
                  <Text style={styles.priceTotalAmount}>LKR {totalPayable.toLocaleString()}</Text>
                </View>
              </View>

              {/* Booking Confirmation CTA */}
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
                onPress={handleConfirmBooking}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>Securing Reservation...</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>Request Booking</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.termsNote}>
                By booking, you agree to UniMart student safety guidelines and host pickup terms.
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Item Snapshot
  itemSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  itemSnapshotText: {
    flex: 1,
    marginRight: 12,
  },
  itemSnapshotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemSnapshotRate: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Conflict & Error Banners
  conflictBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.dangerBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dangerBorder,
    padding: 14,
    marginBottom: 16,
  },
  conflictIconWrap: {
    marginRight: 10,
    marginTop: 2,
  },
  conflictTextWrap: {
    flex: 1,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  conflictMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 3,
    lineHeight: 18,
  },
  conflictActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  conflictActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
  },

  // Form Sections
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  durationValueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  stepperLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },

  // Price Breakdown Card
  priceBreakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceRowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  depositNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -2,
    marginBottom: 8,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  priceTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceTotalSublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  priceTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Primary Confirm Button
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  termsNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },

  // Success Screen
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  successIconWrap: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    marginBottom: 20,
  },
  bookingCardSummary: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
  pendingBadge: {
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    paddingVertical: 10,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
