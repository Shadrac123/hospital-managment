import { useEffect, useState } from 'react';
import { subscribeToPatientBookings } from '@/services/firebase';
import { Booking } from '@/types/models';

interface State {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

/** Real-time list of the given patient's bookings (newest first). */
export function usePatientBookings(patientId: string | undefined): State {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToPatientBookings(
      patientId,
      (data) => {
        setBookings(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [patientId]);

  return { bookings, loading, error };
}
