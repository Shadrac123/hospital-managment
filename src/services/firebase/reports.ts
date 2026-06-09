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
import { Report, ReportType, ReportStatus } from '@/types/models';

const REPORTS = 'reports';

function mapReport(id: string, data: DocumentData): Report {
  return {
    id,
    patientId: data.patientId,
    patientName: data.patientName,
    patientEmail: data.patientEmail,
    reportType: data.reportType as ReportType,
    patientNote: data.patientNote ?? '',
    status: (data.status ?? 'pending') as ReportStatus,
    adminNote: data.adminNote ?? '',
    fileUrl: data.fileUrl ?? null,
    fileName: data.fileName ?? null,
    fileType: data.fileType ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function toReports(snap: QuerySnapshot<DocumentData>): Report[] {
  return snap.docs.map((d) => mapReport(d.id, d.data()));
}

/** Create a new report request in pending status. */
export async function requestReport(
  patientId: string,
  patientName: string,
  patientEmail: string,
  reportType: ReportType,
  patientNote?: string
): Promise<string> {
  const ref = await addDoc(collection(db, REPORTS), {
    patientId,
    patientName,
    patientEmail,
    reportType,
    patientNote: patientNote ?? '',
    status: 'pending' as ReportStatus,
    adminNote: '',
    fileUrl: null,
    fileName: null,
    fileType: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Subscribe to reports requested by a specific patient. */
export function subscribeToPatientReports(
  patientId: string,
  onData: (reports: Report[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, REPORTS),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => onData(toReports(snap)),
    (err) => onError?.(err)
  );
}

/** Subscribe to all reports for the admin dashboard. */
export function subscribeToAllReports(
  onData: (reports: Report[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, REPORTS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(toReports(snap)),
    (err) => onError?.(err)
  );
}

/** Subscribe to a single report request. */
export function subscribeToReport(
  reportId: string,
  onData: (report: Report | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, REPORTS, reportId),
    (snap) => onData(snap.exists() ? mapReport(snap.id, snap.data()) : null),
    (err) => onError?.(err)
  );
}

/** Approve a report request, attach the report file URL, and add notes. */
export async function approveReportRequest(
  reportId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  adminNote?: string
): Promise<void> {
  await updateDoc(doc(db, REPORTS, reportId), {
    status: 'approved' as ReportStatus,
    fileUrl,
    fileName,
    fileType,
    adminNote: adminNote ?? '',
    updatedAt: serverTimestamp(),
  });
}

/** Reject a report request and add notes. */
export async function rejectReportRequest(
  reportId: string,
  adminNote?: string
): Promise<void> {
  await updateDoc(doc(db, REPORTS, reportId), {
    status: 'rejected' as ReportStatus,
    adminNote: adminNote ?? '',
    updatedAt: serverTimestamp(),
  });
}
