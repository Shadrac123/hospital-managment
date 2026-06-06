import { useMemo } from 'react';
import { usePatients } from './usePatients';

export interface PatientStats {
  totalPatients: number;
  newThisMonth: number;
  activePatients: number;
  archivedPatients: number;
}

/**
 * Derives patient statistics from the real-time patients subscription.
 * All values are computed in-memory from the live snapshot — no extra queries.
 */
export function usePatientStats(): PatientStats {
  const { patients } = usePatients();

  return useMemo<PatientStats>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let newThisMonth = 0;
    let activePatients = 0;
    let archivedPatients = 0;

    for (const p of patients) {
      const ts = typeof p.createdAt === 'number' ? p.createdAt : 0;
      if (ts >= startOfMonth) newThisMonth++;
      if (p.isActive !== false) {
        activePatients++;
      } else {
        archivedPatients++;
      }
    }

    return {
      totalPatients: patients.length,
      newThisMonth,
      activePatients,
      archivedPatients,
    };
  }, [patients]);
}
