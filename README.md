# Hospital Management System — Mobile App

A React Native (Expo) hospital management app with role-based **Patient** and
**Admin** experiences. Built with Expo SDK 54 and runnable in **Expo Go**.

> **Phase 1:** clean UI for all screens + Firebase Authentication wiring and
> patient/admin role routing.
>
> **Phase 2:** functional Firebase wiring — real-time bookings
> (`onSnapshot`), admin doctor assignment, admin signup gated by a secret code,
> patient avatar upload to Firebase Storage, and a real-name Home greeting. Uses
> only live Firebase data (no mock data).
>
> **Phase 3 (current):** patient onboarding questionnaire (name, phone, DOB, gender,
> address, emergency contact, profile photo); age computed from DOB; Admin › Patients
> tab with real list, search, details, edit, archive/restore; Admin Dashboard patient
> statistics (total, new this month, active, archived); PDF/print patient card with
> photo, basic info, and booking summary.

### Firebase console setup required before running

1. **Authentication → Sign-in method → enable Email/Password.**
2. **Create a Firestore database** (production mode is fine — rules below).
3. **Enable Storage** (for avatar uploads).
4. Deploy the included rules/indexes (or paste them in the console):
   - `firestore.rules`, `firestore.indexes.json`, `storage.rules`
   - The patient-bookings query needs the composite index in
     `firestore.indexes.json` (`patientId ASC` + `createdAt DESC`). Without it the
     Schedule/Home lists error; Firestore also prints a one-click "create index"
     link in the console/logs the first time the query runs.
5. Set `EXPO_PUBLIC_ADMIN_SIGNUP_CODE` in `.env` — required to register an admin.

### Collections

| Collection  | Document shape (key fields)                                              |
| ----------- | ----------------------------------------------------------------------- |
| `users`     | `{ uid, email, displayName, role, phone, photoURL, dateOfBirth, gender, address, emergencyContact, profileComplete, isActive }` |
| `bookings`  | `{ patientId, patientName, date, time, status, doctorId?, doctorName? }`|
| `doctors`   | `{ name, specialty, available }`                                        |

Storage: patient avatars at `avatars/{uid}.jpg`.

---

## Stack

| Concern        | Choice                                           |
| -------------- | ------------------------------------------------ |
| Framework      | Expo SDK **54** (React Native 0.81, React 19.1)  |
| Language       | TypeScript (strict)                              |
| Navigation     | React Navigation **v7** (native-stack + tabs)    |
| Backend / Auth | **Firebase JS SDK v12** (works in Expo Go)       |
| Auth storage   | AsyncStorage persistence                         |
| Icons          | `@expo/vector-icons` (Ionicons)                  |

### Why the Firebase **JS SDK** (not React Native Firebase)?

React Native Firebase requires native modules and a custom dev build, so it does
**not** run in Expo Go. The Firebase JS SDK does. Since Phase 1 only needs Auth +
a single Firestore read, the JS SDK keeps the whole app inside Expo Go.

### Metro / Firebase compatibility (important)

Expo SDK 53+ enables `unstable_enablePackageExports` in Metro, which breaks
`firebase/auth` resolution (`Component auth has not been registered yet`).
[`metro.config.js`](./metro.config.js) disables it and adds `cjs` to `sourceExts`.
Do not remove that without re-testing auth.

---

## Project structure

```
src/
  components/
    ui/         Design-system primitives (Button, Card, Input, Text, Avatar, …)
    common/     Composed pieces (SearchBar, EmptyState, MenuRow, StatCard, …)
  config/       env access (public Firebase web config)
  context/      AuthContext — session + role, single source of truth
  navigation/   Root / Auth / Patient / Admin navigators + types
  screens/
    auth/       Login, Register (with patient/admin role selector)
    patient/    Home, Messages, Schedule, Profile, Booking
    admin/      Dashboard, Bookings, BookingDetails, Doctors, Profile
  services/
    firebase/   app init (auth + firestore), auth service
  theme/        colors, spacing, typography, shadows
  types/        Firestore-ready domain models
  utils/        validation helpers
```

Path alias `@/*` → `src/*` (see `tsconfig.json` + `babel.config.js`).

---

## Role-based routing

1. User signs in via Firebase Auth.
2. `AuthContext` reads `users/{uid}` from Firestore and uses its `role` field.
3. `RootNavigator` renders the **Admin** or **Patient** stack accordingly.
4. On sign-up, a `users/{uid}` document is created with the chosen role so future
   logins route correctly.

---

## Getting started

```bash
# 1. Configure Firebase (a Web app is already registered for this project)
cp .env.example .env      # values are pre-filled for hospital-managmentsystem

# 2. Install
npm install

# 3. Run in Expo Go
npm start                 # then scan the QR code with Expo Go (SDK 54)
```

> Enable **Email/Password** sign-in in the Firebase console
> (Authentication → Sign-in method) before logging in, and create a Firestore
> database in test mode for the `users` role documents.

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm start`       | Start the Expo dev server            |
| `npm run android` | Open on Android / emulator           |
| `npm run ios`     | Open on iOS / simulator (macOS)      |
| `npx tsc --noEmit`| Type-check the project               |

---

## Firebase config files

`google-services.json` and `GoogleService-Info.plist` are referenced from
`app.json` for future native builds. Phase 1 (Expo Go) authenticates through the
Firebase **JS SDK** using the public web config in `.env`.
