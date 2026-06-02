import { useEffect, useState } from 'react';
import { subscribeToAllBookings } from '@/services/firebase';
import { Booking } from '@/types/models';

interface State {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

/** Real-time list of all bookings (admin view, newest first). */
export function useAllBookings(): State {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllBookings(
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
  }, []);

  return { bookings, loading, error };
}
