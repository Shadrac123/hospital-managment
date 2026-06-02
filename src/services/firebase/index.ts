export { firebaseApp, auth, db, storage } from './app';
export {
  subscribeToAuth,
  fetchUserProfile,
  signIn,
  signUp,
  signOut,
  updateUserAvatar,
  authErrorMessage,
  InvalidAdminCodeError,
} from './auth';
export type { SignUpInput } from './auth';
export {
  createBooking,
  subscribeToPatientBookings,
  subscribeToAllBookings,
  subscribeToBooking,
  assignDoctorToBooking,
} from './bookings';
export { subscribeToDoctors, seedDoctorsIfEmpty } from './doctors';
export { uploadAvatar } from './storage';
