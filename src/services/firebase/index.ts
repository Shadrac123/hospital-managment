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
export {
  subscribeToDoctors,
  seedDoctorsIfEmpty,
  addDoctor,
  updateDoctor,
  deleteDoctor,
} from './doctors';
export { uploadAvatar, uploadReportFile } from './storage';
export {
  subscribeToAllPatients,
  updatePatientProfile,
  archivePatient,
  restorePatient,
  fetchPatientBookingsSummary,
} from './patients';
export { sendMessage, subscribeToMessages, markChatAsRead, subscribeToUnreadCount, subscribeToAllUnread } from './chats';
export type { ChatMessage } from './chats';
export {
  requestReport,
  subscribeToPatientReports,
  subscribeToAllReports,
  subscribeToReport,
  approveReportRequest,
  rejectReportRequest,
} from './reports';

