import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './app';

/**
 * Upload a local image (from expo-image-picker) to Firebase Storage and return
 * its public download URL.
 *
 * In React Native the picked asset is a `file://` URI; we fetch it into a Blob
 * before handing it to the Firebase JS SDK. The avatar is stored at a stable
 * per-user path so a new upload overwrites the previous one.
 */
export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const avatarRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(avatarRef, blob, { contentType: blob.type || 'image/jpeg' });

  return getDownloadURL(avatarRef);
}
