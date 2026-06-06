import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePatientBookings } from './usePatientBookings';
import { useNotification } from '@/context/NotificationContext';
import { Booking } from '@/types/models';
import { formatBookingDate } from '@/utils/validation';

/**
 * Background hook that listens to the patient's bookings and triggers
 * an in-app slide-down notification banner whenever an appointment status
 * changes or a doctor is assigned.
 */
export function useBookingNotifications() {
  const { user } = useAuth();
  const { bookings } = usePatientBookings(user?.uid);
  const { showNotification } = useNotification();
  
  // Cache of the previous bookings array to detect delta changes
  const prevBookingsRef = useRef<Booking[] | null>(null);

  useEffect(() => {
    // If we don't have a user or bookings, clear the cache and return
    if (!user || bookings.length === 0) {
      prevBookingsRef.current = null;
      return;
    }

    // On initial mount or after logging in, seed the cache without alerts
    if (prevBookingsRef.current === null) {
      prevBookingsRef.current = bookings;
      return;
    }

    const prevBookings = prevBookingsRef.current;

    // Detect updates by comparing current bookings with the cached ones
    bookings.forEach((current) => {
      const prev = prevBookings.find((b) => b.id === current.id);
      if (!prev) return; // Ignore newly created bookings (triggered by the patient themselves)

      // 1. Doctor newly assigned
      const doctorNewlyAssigned = !prev.doctorName && current.doctorName;
      // 2. Status changed (e.g., pending -> assigned, or pending -> cancelled)
      const statusChanged = prev.status !== current.status;

      if (doctorNewlyAssigned || statusChanged) {
        let msg = '';
        let type: 'info' | 'success' | 'warning' = 'info';

        const formattedDate = formatBookingDate(current.date);

        if (current.status === 'assigned' && current.doctorName) {
          msg = `Your appointment on ${formattedDate} at ${current.time} has been assigned to ${current.doctorName} (${current.doctorSpecialty}).`;
          type = 'success';
        } else if (current.status === 'cancelled') {
          msg = `Your appointment on ${formattedDate} at ${current.time} was cancelled.`;
          type = 'warning';
        } else if (current.status === 'completed') {
          msg = `Your appointment on ${formattedDate} has been marked completed.`;
          type = 'success';
        } else if (statusChanged) {
          msg = `Your appointment on ${formattedDate} at ${current.time} status updated to: ${current.status}.`;
        }

        if (msg) {
          showNotification(msg, { type });
        }
      }
    });

    // Update the cache
    prevBookingsRef.current = bookings;
  }, [bookings, user, showNotification]);
}
