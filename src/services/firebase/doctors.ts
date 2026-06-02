import {
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './app';
import { Doctor } from '@/types/models';

const DOCTORS = 'doctors';

function toDoctors(snap: QuerySnapshot<DocumentData>): Doctor[] {
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      specialty: data.specialty,
      photoURL: data.photoURL ?? null,
      rating: data.rating,
      available: data.available ?? true,
    };
  });
}

/** Real-time subscription to the doctors directory (alphabetical). */
export function subscribeToDoctors(
  onData: (doctors: Doctor[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(collection(db, DOCTORS), orderBy('name'));
  return onSnapshot(
    q,
    (snap) => onData(toDoctors(snap)),
    (err) => onError?.(err),
  );
}

/**
 * Seed the `doctors` collection once if it is empty so admins have a real,
 * assignable medical team without manual console entry. This writes real
 * Firestore documents — it is a one-time bootstrap, not in-memory mock data.
 */
const SEED: Omit<Doctor, 'id'>[] = [
  { name: 'Dr. Shamim Ahmed', specialty: 'Neurologist', available: true },
  { name: 'Dr. Farhana Islam', specialty: 'Cardiologist', available: true },
  { name: 'Dr. Arif Rahman', specialty: 'Dermatologist', available: true },
  { name: 'Dr. Nabila Khan', specialty: 'Pediatrician', available: true },
  { name: 'Dr. Rohan Mehta', specialty: 'General Physician', available: true },
];

export async function seedDoctorsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, DOCTORS));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  SEED.forEach((d) => {
    batch.set(doc(collection(db, DOCTORS)), d);
  });
  await batch.commit();
}
