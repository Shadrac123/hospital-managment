import { useEffect, useState } from 'react';
import { subscribeToBooking } from '@/services/firebase';
import { Booking } from '@/types/models';

interface State {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
}

/** Real-time subscription to a single booking document. */
export function useBooking(bookingId: string | undefined): State {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToBooking(
      bookingId,
      (data) => {
        setBooking(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [bookingId]);

  return { booking, loading, error };
}
