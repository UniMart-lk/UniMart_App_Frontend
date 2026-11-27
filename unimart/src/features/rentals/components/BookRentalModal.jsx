import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return next;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeLabel(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = String(minute).padStart(2, '0');
  return `${String(hour12).padStart(2, '0')}:${minStr} ${period}`;
}

// 30-minute campus pickup slots from 07:00 AM to 09:00 PM
const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 7; hour <= 21; hour += 1) {
    slots.push({ hour, minute: 0, label: formatTimeLabel(hour, 0) });
    if (hour < 21) {
      slots.push({ hour, minute: 30, label: formatTimeLabel(hour, 30) });
    }
  }
  return slots;
})();

const QUICK_TIME_SLOTS = [
  { hour: 9, minute: 0, label: '09:00 AM' },
  { hour: 11, minute: 0, label: '11:00 AM' },
  { hour: 14, minute: 0, label: '02:00 PM' },
  { hour: 17, minute: 0, label: '05:00 PM' },
];

function isSlotInPast(dateOnly, hour, minute, now = new Date()) {
  const slotDate = new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    hour,
    minute,
    0,
    0
  );
  return slotDate.getTime() <= now.getTime();
}

function getNextValidSlotForDate(dateOnly, preferredTime) {
  const now = new Date();
  if (!isSlotInPast(dateOnly, preferredTime.hour, preferredTime.minute, now)) {
    return preferredTime;
  }
  const firstValid = TIME_SLOTS.find((slot) => !isSlotInPast(dateOnly, slot.hour, slot.minute, now));
  return firstValid ? { hour: firstValid.hour, minute: firstValid.minute } : null;
}

function buildCalendarDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const leadingEmpty = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

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

function formatDurationChip(val, rentalPeriod) {
  switch (rentalPeriod) {
    case 'HOURLY':
      return `${val} ${val === 1 ? 'hr' : 'hrs'}`;
    case 'WEEKLY':
      return `${val} ${val === 1 ? 'wk' : 'wks'}`;
    case 'MONTHLY':
      return `${val} ${val === 1 ? 'mo' : 'mos'}`;
    case 'DAILY':
    default:
      return `${val} ${val === 1 ? 'day' : 'days'}`;
  }
}

function interpretAvailabilityResponse(response) {
  const payload = response?.data ?? response ?? {};
  const conflicts = Array.isArray(payload.conflictingBookings)
    ? payload.conflictingBookings
    : [];
  const explicitlyUnavailable =
    payload.available === false ||
    payload.isAvailable === false ||
    payload.hasConflict === true ||
    conflicts.length > 0;

  return {
    isAvailable: !explicitlyUnavailable,
    message:
      payload.message ||
      (explicitlyUnavailable
        ? 'This rental is already reserved for part of the selected time slot. Please choose another start date or duration.'
        : 'Slot is available for your selected dates.'),
    conflictingBookings: conflicts,
  };
}

export default function BookRentalModal({ visible, onClose, rental, onBookingSuccess }) {
  const router = useRouter();
  const rentalId = rental?.id ?? null;

  const defaultTomorrow = useMemo(() => addDays(startOfDay(new Date()), 1), []);

  // Selected rental duration, pickup date & pickup time
  const [durationUnits, setDurationUnits] = useState(1);
  const [selectedDate, setSelectedDate] = useState(defaultTomorrow);
  const [selectedTime, setSelectedTime] = useState({ hour: 9, minute: 0 });
  const [calendarMonth, setCalendarMonth] = useState({
    year: defaultTomorrow.getFullYear(),
    month: defaultTomorrow.getMonth(),
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);

  // Availability pre-check result scoped to a specific rangeKey
  const [availabilityResult, setAvailabilityResult] = useState({
    rangeKey: null,
    status: 'idle',
    title: null,
    message: null,
  });

  // Loading & error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  const latestCheckIdRef = useRef(0);

  const resetModalState = useCallback(() => {
    const tomorrow = addDays(startOfDay(new Date()), 1);
    latestCheckIdRef.current += 1;
    setDurationUnits(1);
    setSelectedDate(tomorrow);
    setSelectedTime({ hour: 9, minute: 0 });
    setCalendarMonth({ year: tomorrow.getFullYear(), month: tomorrow.getMonth() });
    setShowCalendar(false);
    setShowAllTimes(false);
    setAvailabilityResult({ rangeKey: null, status: 'idle', title: null, message: null });
    setErrorMessage(null);
    setCreatedBooking(null);
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const rentalPeriod = (rental?.rentalPeriod || 'DAILY').toUpperCase();
  const basePrice = Number(rental?.rentalPrice || 0);

  // Compute Start Date and End Date based on selected calendar date, pickup time & duration
  const { startDate, endDate, durationLabel } = useMemo(() => {
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.hour,
      selectedTime.minute,
      0,
      0
    );

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
  }, [selectedDate, selectedTime, durationUnits, rentalPeriod]);

  const currentRangeKey = useMemo(() => {
    if (!rentalId) return null;
    return `${rentalId}:${startDate.toISOString()}:${endDate.toISOString()}`;
  }, [rentalId, startDate, endDate]);

  // Derived availability status for the currently selected rangeKey
  const isCurrentRangeMatched = Boolean(currentRangeKey && availabilityResult.rangeKey === currentRangeKey);
  const availabilityStatus = !visible || !rentalId || createdBooking
    ? 'idle'
    : isCurrentRangeMatched
      ? availabilityResult.status
      : 'checking';

  const availabilityMessage = isCurrentRangeMatched ? availabilityResult.message : null;
  const concurrencyConflict =
    availabilityStatus === 'unavailable'
      ? {
          title: availabilityResult.title || 'Date Slot Unavailable',
          message:
            availabilityResult.message ||
            'Another student has already reserved this item for the selected dates. Please choose another date or duration.',
        }
      : null;

  const runAvailabilityCheck = useCallback(async () => {
    if (!rentalId || !currentRangeKey) return null;

    const requestId = ++latestCheckIdRef.current;

    try {
      const response = await bookingService.checkAvailability({
        rentalListingId: rentalId,
        startDate,
        endDate,
      });

      if (requestId !== latestCheckIdRef.current) return null;

      const { isAvailable, message } = interpretAvailabilityResponse(response);

      if (isAvailable) {
        setAvailabilityResult({
          rangeKey: currentRangeKey,
          status: 'available',
          title: null,
          message,
        });
        return { status: 'available', message };
      }

      setAvailabilityResult({
        rangeKey: currentRangeKey,
        status: 'unavailable',
        title: 'Date Slot Unavailable',
        message,
      });
      return { status: 'unavailable', message };
    } catch (error) {
      if (requestId !== latestCheckIdRef.current) return null;

      if (error?.status === 409 || error?.data?.code === 'CONCURRENCY_CONFLICT') {
        const conflictMsg =
          error.data?.message ||
          error.message ||
          'Another student has already reserved this item for the selected dates. Please choose another date or duration.';
        setAvailabilityResult({
          rangeKey: currentRangeKey,
          status: 'unavailable',
          title: 'Date Slot Unavailable (Conflict)',
          message: conflictMsg,
        });
        return { status: 'unavailable', message: conflictMsg };
      }

      const errMsg =
        error?.status === 401
          ? 'Please login to your UniMart student account to verify live availability.'
          : error?.message || 'Could not verify availability right now.';
      setAvailabilityResult({
        rangeKey: currentRangeKey,
        status: 'error',
        title: null,
        message: errMsg,
      });
      return { status: 'error', message: errMsg, error };
    }
  }, [rentalId, startDate, endDate, currentRangeKey]);

  // Pre-check availability automatically (debounced) whenever dates or duration change
  useEffect(() => {
    if (!visible || !rentalId || createdBooking) {
      return undefined;
    }

    const timer = setTimeout(() => {
      runAvailabilityCheck();
    }, 300);

    return () => {
      clearTimeout(timer);
      latestCheckIdRef.current += 1;
    };
  }, [visible, rentalId, createdBooking, runAvailabilityCheck]);

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

  const today = startOfDay(new Date());
  const todayHasSlots = Boolean(getNextValidSlotForDate(today, { hour: 7, minute: 0 }));

  // Upcoming weekend (Saturday, or Sunday if today is Saturday)
  const dayOfWeek = today.getDay();
  const weekendOffset = dayOfWeek === 6 ? 1 : 6 - dayOfWeek;

  // Quick preset shortcuts for pickup date
  const startDayOptions = [
    ...(todayHasSlots ? [{ label: 'Today', date: today }] : []),
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'In 2 Days', date: addDays(today, 2) },
    { label: 'This Weekend', date: addDays(today, weekendOffset) },
  ];

  const handleSelectDate = (date) => {
    const normalized = startOfDay(date);
    const validTime = getNextValidSlotForDate(normalized, selectedTime);
    if (!validTime) {
      const tomorrow = addDays(startOfDay(new Date()), 1);
      setSelectedDate(tomorrow);
      setCalendarMonth({ year: tomorrow.getFullYear(), month: tomorrow.getMonth() });
      return;
    }
    setSelectedDate(normalized);
    setSelectedTime(validTime);
    setCalendarMonth({ year: normalized.getFullYear(), month: normalized.getMonth() });
  };

  const handleShiftNextDay = () => {
    handleSelectDate(addDays(selectedDate, 1));
  };

  const canGoPrevMonth =
    calendarMonth.year > today.getFullYear() ||
    (calendarMonth.year === today.getFullYear() && calendarMonth.month > today.getMonth());

  const handleChangeMonth = (delta) => {
    const nextMonthDate = new Date(calendarMonth.year, calendarMonth.month + delta, 1);
    const minMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (nextMonthDate < minMonthDate) return;
    setCalendarMonth({
      year: nextMonthDate.getFullYear(),
      month: nextMonthDate.getMonth(),
    });
  };

  const calendarCells = buildCalendarDays(calendarMonth.year, calendarMonth.month);
  const calendarMonthLabel = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Quick duration presets
  const durationPresets = rentalPeriod === 'HOURLY'
    ? [2, 4, 8, 12]
    : [1, 2, 3, 5, 7];

  // Handle Booking Submission
  const handleConfirmBooking = async () => {
    if (!rentalId || submitting || availabilityStatus === 'unavailable') return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Ensure availability is verified for the exact selected range before submitting
      if (!isCurrentRangeMatched || availabilityResult.status !== 'available') {
        const preCheck = await runAvailabilityCheck();
        if (!preCheck || preCheck.status === 'unavailable') {
          return;
        }
        if (preCheck.status === 'error' && preCheck.error?.status === 401) {
          setErrorMessage('Please login to your UniMart student account to book rentals.');
          return;
        }
      }

      const response = await bookingService.createBooking({
        rentalListingId: rentalId,
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
        setAvailabilityResult({
          rangeKey: currentRangeKey,
          status: 'unavailable',
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
      onShow={resetModalState}
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
                      onPress={handleShiftNextDay}
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

              {/* 1. SELECT PICKUP DATE & TIME */}
              <View style={styles.sectionHeaderRowNoTop}>
                <Text style={styles.sectionHeading}>1. Pickup Date & Time</Text>
                <TouchableOpacity
                  style={styles.calendarToggleBtn}
                  onPress={() => setShowCalendar((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={showCalendar ? 'chevron-up' : 'calendar-outline'}
                    size={14}
                    color={COLORS.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.calendarToggleText}>
                    {showCalendar ? 'Hide Calendar' : 'Pick on Calendar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipsRow}>
                {startDayOptions.map((opt) => {
                  const isSelected = isSameDay(selectedDate, opt.date);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        handleSelectDate(opt.date);
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

              {/* Interactive Month Calendar */}
              {showCalendar ? (
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      style={[styles.calendarNavBtn, !canGoPrevMonth && styles.calendarNavBtnDisabled]}
                      disabled={!canGoPrevMonth}
                      onPress={() => handleChangeMonth(-1)}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={canGoPrevMonth ? COLORS.text : COLORS.textMuted}
                      />
                    </TouchableOpacity>

                    <Text style={styles.calendarMonthText}>{calendarMonthLabel}</Text>

                    <TouchableOpacity
                      style={styles.calendarNavBtn}
                      onPress={() => handleChangeMonth(1)}
                    >
                      <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.calendarWeekdaysRow}>
                    {WEEKDAYS.map((day) => (
                      <Text key={day} style={styles.calendarWeekdayText}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {calendarCells.map((cellDate, idx) => {
                      if (!cellDate) {
                        return <View key={`empty-${idx}`} style={styles.calendarDayCell} />;
                      }

                      const isPast =
                        cellDate.getTime() < today.getTime() ||
                        (isSameDay(cellDate, today) && !todayHasSlots);
                      const isSelected = isSameDay(cellDate, selectedDate);
                      const isTodayCell = isSameDay(cellDate, today);

                      return (
                        <TouchableOpacity
                          key={cellDate.toISOString()}
                          style={[
                            styles.calendarDayCell,
                            isSelected && styles.calendarDayCellSelected,
                            !isSelected && isTodayCell && styles.calendarDayCellToday,
                            isPast && styles.calendarDayCellDisabled,
                          ]}
                          disabled={isPast}
                          onPress={() => {
                            handleSelectDate(cellDate);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isPast && styles.calendarDayTextDisabled,
                            ]}
                          >
                            {cellDate.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Pickup Time Selector */}
              <View style={styles.timeSectionHeader}>
                <Text style={styles.timeSubheading}>Pickup Time</Text>
                <TouchableOpacity
                  onPress={() => setShowAllTimes((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarToggleText}>
                    {showAllTimes ? 'Compact Slots' : 'All 30-min Slots'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAllTimes ? (
                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const disabled = isSlotInPast(selectedDate, slot.hour, slot.minute);
                    const isSelected =
                      selectedTime.hour === slot.hour && selectedTime.minute === slot.minute;
                    return (
                      <TouchableOpacity
                        key={slot.label}
                        style={[
                          styles.timeGridChip,
                          isSelected && styles.chipActive,
                          disabled && styles.timeChipDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() => setSelectedTime({ hour: slot.hour, minute: slot.minute })}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            isSelected && styles.chipTextActive,
                            disabled && styles.timeChipTextDisabled,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeScrollRow}
                >
                  {QUICK_TIME_SLOTS.concat(
                    TIME_SLOTS.filter(
                      (slot) =>
                        !QUICK_TIME_SLOTS.some(
                          (q) => q.hour === slot.hour && q.minute === slot.minute
                        )
                    )
                  ).map((slot) => {
                    const disabled = isSlotInPast(selectedDate, slot.hour, slot.minute);
                    const isSelected =
                      selectedTime.hour === slot.hour && selectedTime.minute === slot.minute;
                    return (
                      <TouchableOpacity
                        key={slot.label}
                        style={[
                          styles.timeChip,
                          isSelected && styles.chipActive,
                          disabled && styles.timeChipDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() => setSelectedTime({ hour: slot.hour, minute: slot.minute })}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            isSelected && styles.chipTextActive,
                            disabled && styles.timeChipTextDisabled,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.selectedDateBadge}
                onPress={() => setShowCalendar((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.selectedDateText}>Starts: {formatDisplayDateTime(startDate)}</Text>
              </TouchableOpacity>

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
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {formatDurationChip(val, rentalPeriod)}
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

              {/* LIVE AVAILABILITY STATUS */}
              {availabilityStatus === 'checking' && (
                <View style={styles.availabilityCheckingBox}>
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.availabilityCheckingText}>Checking live slot availability...</Text>
                </View>
              )}

              {availabilityStatus === 'available' && (
                <View style={styles.availabilitySuccessBox}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
                  <Text style={styles.availabilitySuccessText}>
                    {availabilityMessage || 'Slot is available for your selected dates.'}
                  </Text>
                </View>
              )}

              {availabilityStatus === 'error' && availabilityMessage ? (
                <View style={styles.availabilityWarningBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.warning} style={{ marginRight: 8 }} />
                  <Text style={styles.availabilityWarningText}>{availabilityMessage}</Text>
                  <TouchableOpacity
                    style={styles.retryCheckBtn}
                    onPress={runAvailabilityCheck}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.retryCheckBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

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
                style={[
                  styles.confirmBtn,
                  (submitting || availabilityStatus === 'checking' || availabilityStatus === 'unavailable') &&
                    styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirmBooking}
                disabled={submitting || availabilityStatus === 'checking' || availabilityStatus === 'unavailable'}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>Securing Reservation...</Text>
                  </View>
                ) : availabilityStatus === 'checking' ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>Checking Availability...</Text>
                  </View>
                ) : availabilityStatus === 'unavailable' ? (
                  <View style={styles.btnRow}>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmBtnText}>Selected Slot Unavailable</Text>
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
  sectionHeaderRowNoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  calendarToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  calendarCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    opacity: 0.4,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarWeekdayText: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarDayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  calendarDayCellDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: COLORS.textMuted,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  timeSubheading: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeScrollRow: {
    gap: 8,
    paddingBottom: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeGridChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipDisabled: {
    opacity: 0.4,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeChipTextDisabled: {
    color: COLORS.textMuted,
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
  availabilityCheckingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  availabilityCheckingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  availabilitySuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    marginBottom: 14,
  },
  availabilitySuccessText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  availabilityWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    marginBottom: 14,
  },
  availabilityWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    marginRight: 8,
  },
  retryCheckBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryCheckBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
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
