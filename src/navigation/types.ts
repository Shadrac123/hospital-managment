import { NavigatorScreenParams } from '@react-navigation/native';

/** Auth stack (logged out). */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Patient bottom-tab routes (matches the patient mockups). */
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
};

/** Admin bottom-tab routes (matches the admin mockups). */
export type AdminTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  Doctors: undefined;
  AdminProfile: undefined;
};

/** Admin root stack — tabs plus pushed detail screens. */
export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  BookingDetails: { bookingId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList
      extends PatientStackParamList,
        AdminStackParamList,
        AuthStackParamList {}
  }
}
