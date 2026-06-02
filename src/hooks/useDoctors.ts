import { useEffect, useState } from 'react';
import { subscribeToDoctors } from '@/services/firebase';
import { Doctor } from '@/types/models';

interface State {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
}

/** Real-time list of doctors (alphabetical). */
export function useDoctors(): State {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToDoctors(
      (data) => {
        setDoctors(data);
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

  return { doctors, loading, error };
}
