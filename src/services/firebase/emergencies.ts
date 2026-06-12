import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './app';
import { uploadEmergencyImage } from './storage';
import { EmergencyRequest, EmergencySeverity, EmergencyStatus } from '@/types/models';

const EMERGENCIES = 'emergencies';
const USERS = 'users';

function mapEmergency(id: string, data: DocumentData): EmergencyRequest {
  return {
    id,
    patientId: data.patientId ?? '',
    patientName: data.patientName ?? '',
    patientEmail: data.patientEmail ?? '',
    patientPhone: data.patientPhone ?? '',
    title: data.title ?? '',
    description: data.description ?? '',
    severity: (data.severity ?? 'medium') as EmergencySeverity,
    status: (data.status ?? 'pending') as EmergencyStatus,
    imageUrl: data.imageUrl ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    notes: data.notes ?? '',
    history: data.history ?? [],
  };
}

function toEmergencies(snap: QuerySnapshot<DocumentData>): EmergencyRequest[] {
  return snap.docs.map((d) => mapEmergency(d.id, d.data()));
}

/**
 * Creates a new emergency request document, handles optional image uploading,
 * and saves it to Firestore.
 */
export async function createEmergencyRequest(
  uid: string,
  title: string,
  description: string,
  severity: EmergencySeverity,
  localImageUri?: string
): Promise<string> {
  // 1. Fetch patient details for information display
  const userRef = doc(db, USERS, uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const patientName = userData?.displayName || 'Unknown Patient';
  const patientEmail = userData?.email || '';
  const patientPhone = userData?.phone || '';

  // 2. Generate a document reference first to get unique emergencyId
  const emergencyCollection = collection(db, EMERGENCIES);
  const newEmergencyDocRef = doc(emergencyCollection);
  const emergencyId = newEmergencyDocRef.id;

  // 3. Upload image if provided
  let imageUrl: string | null = null;
  if (localImageUri) {
    try {
      imageUrl = await uploadEmergencyImage(uid, emergencyId, localImageUri);
    } catch (err) {
      console.error('Failed to upload emergency image:', err);
      throw new Error('Image upload failed. Please try again.');
    }
  }

  // 4. Set document fields in Firestore
  const initialLog = {
    status: 'pending' as EmergencyStatus,
    updatedBy: 'Patient',
    updatedAt: Date.now(),
    notes: 'Emergency reported by patient.',
  };

  await setDoc(newEmergencyDocRef, {
    patientId: uid,
    patientName,
    patientEmail,
    patientPhone,
    title: title.trim(),
    description: description.trim(),
    severity,
    status: 'pending' as EmergencyStatus,
    imageUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    notes: '',
    history: [initialLog],
  });

  return emergencyId;
}

/**
 * Subscribe to emergencies created by a specific patient.
 */
export function subscribeToPatientEmergencies(
  patientId: string,
  onData: (emergencies: EmergencyRequest[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, EMERGENCIES),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => onData(toEmergencies(snap)),
    (err) => {
      console.error('Error in subscribeToPatientEmergencies:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to all emergencies (for admin dashboard).
 */
export function subscribeToAllEmergencies(
  onData: (emergencies: EmergencyRequest[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, EMERGENCIES), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => onData(toEmergencies(snap)),
    (err) => {
      console.error('Error in subscribeToAllEmergencies:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to a single emergency request.
 */
export function subscribeToEmergency(
  emergencyId: string,
  onData: (emergency: EmergencyRequest | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, EMERGENCIES, emergencyId),
    (snap) => onData(snap.exists() ? mapEmergency(snap.id, snap.data()) : null),
    (err) => {
      console.error('Error in subscribeToEmergency:', err);
      onError?.(err);
    }
  );
}

/**
 * Update the status of an emergency request and log the change in the history array.
 */
export async function updateEmergencyStatus(
  emergencyId: string,
  status: EmergencyStatus,
  notes: string = '',
  adminName: string = 'Admin'
): Promise<void> {
  const emergencyRef = doc(db, EMERGENCIES, emergencyId);

  const logEntry = {
    status,
    updatedBy: adminName,
    updatedAt: Date.now(),
    notes: notes.trim() || `Status updated to ${status}.`,
  };

  await updateDoc(emergencyRef, {
    status,
    notes: notes.trim(),
    updatedAt: serverTimestamp(),
    history: arrayUnion(logEntry),
  });
}
