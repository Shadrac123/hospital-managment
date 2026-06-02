/**
 * Turn a Firebase/Firestore/Storage error into a short, actionable message.
 * Helps distinguish "rules not deployed" from real app bugs at runtime.
 */
export function firebaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';

  switch (code) {
    case 'permission-denied':
    case 'storage/unauthorized':
      return 'Permission denied. Your Firebase security rules may not be deployed yet.';
    case 'unavailable':
      return 'Service unavailable. Check your connection and that Firestore is enabled.';
    case 'failed-precondition':
      // Typically a missing composite index — Firestore includes a create link.
      return raw || 'A required Firestore index is missing. Check the console logs for a create-index link.';
    case 'unauthenticated':
      return 'You are signed out. Please sign in again.';
    case 'storage/retry-limit-exceeded':
      return 'Upload timed out. Please try again on a stronger connection.';
    case 'storage/object-not-found':
      return 'File not found.';
    default:
      return raw || 'Something went wrong. Please try again.';
  }
}
