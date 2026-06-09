import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './app';

/**
 * Read a local file or content URI into a native Blob.
 * In React Native, fetch(uri).blob() can be unreliable for local assets,
 * so we use XMLHttpRequest which reliably reads local file URIs into native Blobs.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = () => {
      reject(new Error('Failed to read the selected image.'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload a local image URI to Firebase Storage and return its public download URL.
 * Stored at a stable per-user path so a new upload always overwrites the previous one.
 */
export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  const blob = await uriToBlob(localUri);
  const avatarRef = ref(storage, `avatars/${uid}.jpg`);

  try {
    await uploadBytes(avatarRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
  } finally {
    // Free the native blob resource (RN Blobs hold a backing file handle).
    const closeable = blob as Blob & { close?: () => void };
    closeable.close?.();
  }

  return getDownloadURL(avatarRef);
}

/**
 * Upload a report document (PDF or image) to Firebase Storage and return its public download URL.
 * Stored under reports/{patientId}/{reportId}_{fileName}
 */
export async function uploadReportFile(
  patientId: string,
  reportId: string,
  localUri: string,
  fileName: string
): Promise<string> {
  const blob = await uriToBlob(localUri);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const fileRef = ref(storage, `reports/${patientId}/${reportId}_${sanitizedName}`);

  try {
    await uploadBytes(fileRef, blob, {
      contentType: blob.type || 'application/octet-stream',
    });
  } finally {
    const closeable = blob as Blob & { close?: () => void };
    closeable.close?.();
  }

  return getDownloadURL(fileRef);
}
