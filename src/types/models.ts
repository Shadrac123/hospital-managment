/**
 * Firestore-backed domain models. `users`, `bookings`, and `doctors` are live
 * collections in Phase 2.
 */
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'patient' | 'admin';

/** Stored at `users/{uid}`. */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  photoURL?: string | null;
  createdAt?: number;
}

/** Stored at `doctors/{id}`. */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photoURL?: string | null;
  rating?: number;
  available?: boolean;
}

/**
 * Booking lifecycle for Phase 2:
 *  - `pending`   — created by a patient, awaiting admin action
 *  - `assigned`  — admin assigned a doctor
 *  - `completed` / `cancelled` — terminal states (reserved for later use)
 */
export type BookingStatus = 'pending' | 'assigned' | 'completed' | 'cancelled';

/** Stored at `bookings/{id}`. */
export interface Booking {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  date: string; // e.g. "2025-06-22"
  time: string; // e.g. "10:30"
  reason?: string;
  status: BookingStatus;
  // Populated when an admin assigns a doctor.
  doctorId?: string | null;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

/** Payload used when a patient creates a booking. */
export interface NewBookingInput {
  patientId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  reason?: string;
}

export interface MessageThread {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  unread: number;
  avatarUrl?: string | null;
  kind: 'doctor' | 'system' | 'care-team';
}
