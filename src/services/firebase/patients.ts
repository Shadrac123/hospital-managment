import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './app';
import { AppUser, Booking } from '@/types/models';

const USERS = 'users';
const BOOKINGS = 'bookings';

function mapUser(data: DocumentData, uid: string): AppUser {
  return {
    uid,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    role: data.role ?? 'patient',
    phone: data.phone ?? undefined,
    photoURL: data.photoURL ?? null,
    createdAt: data.createdAt?.seconds
      ? data.createdAt.seconds * 1000
      : data.createdAt ?? undefined,
    dateOfBirth: data.dateOfBirth ?? undefined,
    gender: data.gender ?? undefined,
    address: data.address ?? undefined,
    emergencyContact: data.emergencyContact ?? undefined,
    profileComplete: data.profileComplete ?? false,
    isActive: data.isActive !== false, // default to true when missing
    settings: data.settings ?? undefined,
  };
}

/**
 * Real-time subscription to all users with role === 'patient', ordered by
 * creation date descending. Returns the unsubscribe function.
 */
export function subscribeToAllPatients(
  onData: (patients: AppUser[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(db, USERS),
    where('role', '==', 'patient'),
  );
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const mapped = snap.docs.map((d) => mapUser(d.data(), d.id));
      // Sort by creation time descending in memory, putting missing timestamps at the end
      mapped.sort((a, b) => {
        const timeA = a.createdAt ?? 0;
        const timeB = b.createdAt ?? 0;
        return timeB - timeA;
      });
      onData(mapped);
    },
    (err) => onError?.(err),
  );
}

/**
 * Merge-update a patient's profile fields. Automatically sets `updatedAt`.
 */
export async function updatePatientProfile(
  uid: string,
  data: Partial<Omit<AppUser, 'uid' | 'role'>>,
): Promise<void> {
  await setDoc(
    doc(db, USERS, uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Soft-archive a patient (sets isActive: false). The account and data are
 * preserved; the patient just appears as "Archived" in admin views.
 */
export async function archivePatient(uid: string): Promise<void> {
  await setDoc(
    doc(db, USERS, uid),
    { isActive: false, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Restore a previously archived patient (sets isActive: true).
 */
export async function restorePatient(uid: string): Promise<void> {
  await setDoc(
    doc(db, USERS, uid),
    { isActive: true, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * One-time fetch of a patient's bookings for use in the patient card / summary.
 * Returns an array of Booking-shaped objects (id + key fields only).
 */
export async function fetchPatientBookingsSummary(
  patientId: string,
): Promise<Pick<Booking, 'id' | 'status' | 'date' | 'doctorName'>[]> {
  const q = query(
    collection(db, BOOKINGS),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    status: d.data().status ?? 'pending',
    date: d.data().date ?? '',
    doctorName: d.data().doctorName ?? null,
  }));
}
