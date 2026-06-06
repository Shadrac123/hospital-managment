import { useEffect, useState } from 'react';
import { subscribeToAllPatients } from '@/services/firebase';
import { AppUser } from '@/types/models';

interface UsePatientsResult {
  patients: AppUser[];
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time subscription to all users with role === 'patient'.
 * Returns the full list ordered by creation date descending.
 */
export function usePatients(): UsePatientsResult {
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllPatients(
      (data) => {
        setPatients(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { patients, loading, error };
}
