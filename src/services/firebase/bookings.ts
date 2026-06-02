import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './app';
import { Booking, BookingStatus, Doctor, NewBookingInput } from '@/types/models';

const BOOKINGS = 'bookings';

function mapBooking(id: string, data: DocumentData): Booking {
  return {
    id,
    patientId: data.patientId,
    patientName: data.patientName,
    patientEmail: data.patientEmail,
    date: data.date,
    time: data.time,
    reason: data.reason ?? '',
    status: (data.status ?? 'pending') as BookingStatus,
    doctorId: data.doctorId ?? null,
    doctorName: data.doctorName ?? null,
    doctorSpecialty: data.doctorSpecialty ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function toBookings(snap: QuerySnapshot<DocumentData>): Booking[] {
  return snap.docs.map((d) => mapBooking(d.id, d.data()));
}

/** Create a new booking in `pending` status. Returns the new document id. */
export async function createBooking(input: NewBookingInput): Promise<string> {
  const ref = await addDoc(collection(db, BOOKINGS), {
    ...input,
    reason: input.reason ?? '',
    status: 'pending' as BookingStatus,
    doctorId: null,
    doctorName: null,
    doctorSpecialty: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Real-time subscription to a single patient's bookings (newest first).
 * Returns the unsubscribe function.
 */
export function subscribeToPatientBookings(
  patientId: string,
  onData: (bookings: Booking[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    collection(db, BOOKINGS),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onData(toBookings(snap)),
    (err) => onError?.(err),
  );
}

/** Real-time subscription to all bookings for the admin dashboard (newest first). */
export function subscribeToAllBookings(
  onData: (bookings: Booking[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(collection(db, BOOKINGS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(toBookings(snap)),
    (err) => onError?.(err),
  );
}

/** Real-time subscription to a single booking document. */
export function subscribeToBooking(
  bookingId: string,
  onData: (booking: Booking | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, BOOKINGS, bookingId),
    (snap) => onData(snap.exists() ? mapBooking(snap.id, snap.data()) : null),
    (err) => onError?.(err),
  );
}

/** Admin assigns a doctor and moves the booking to `assigned`. */
export async function assignDoctorToBooking(
  bookingId: string,
  doctor: Doctor,
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS, bookingId), {
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    status: 'assigned' as BookingStatus,
    updatedAt: serverTimestamp(),
  });
}
