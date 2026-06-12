import { NavigatorScreenParams } from '@react-navigation/native';

/** Auth stack (logged out). */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Standalone onboarding stack — shown when patient profileComplete !== true. */
export type OnboardingStackParamList = {
  Onboarding: undefined;
};

/** Patient bottom-tab routes. */
export type PatientTabParamList = {
  Home: undefined;
  Messages: undefined;
  Schedule: undefined;
  Profile: undefined;
};

/** Patient root stack — tabs plus pushed screens. */
export type PatientStackParamList = {
  PatientTabs: NavigatorScreenParams<PatientTabParamList>;
  Booking: { doctorId?: string } | undefined;
  Chat: { bookingId: string; recipientName: string };
  Reports: undefined;
  ReportDetails: { reportId: string };
  Emergency: undefined;
  EmergencyCreate: undefined;
};

/** Admin bottom-tab routes. */
export type AdminTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  Patients: undefined;
  Doctors: undefined;
  AdminProfile: undefined;
};

/** Admin root stack — tabs plus pushed detail screens. */
export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  BookingDetails: { bookingId: string };
  PatientDetails: { patientId: string };
  PatientEdit: { patientId: string };
  Chat: { bookingId: string; recipientName: string };
  AdminChats: undefined;
  ReportsManagement: undefined;
  AdminReportsDetails: { reportId: string };
  AdminEmergencyDetails: { emergencyId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList
      extends OnboardingStackParamList,
        PatientStackParamList,
        AdminStackParamList,
        AuthStackParamList {}
  }
}
