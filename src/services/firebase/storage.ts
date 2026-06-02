import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './app';

/**
 * Read a local `file://` URI into a Blob.
 *
 * `fetch(uri).blob()` is unreliable for local files in React Native (it can throw
 * "Network request failed" depending on the RN/Hermes version), so we use an
 * XMLHttpRequest, which reliably reads local file URIs into a Blob.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to read the selected image.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload a local image (from expo-image-picker) to Firebase Storage and return
 * its public download URL. Stored at a stable per-user path so a new upload
 * overwrites the previous one.
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
