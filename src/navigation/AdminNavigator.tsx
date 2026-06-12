import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  DashboardScreen,
  BookingsScreen,
  DoctorsScreen,
  AdminProfileScreen,
  BookingDetailsScreen,
  PatientsScreen,
  PatientDetailsScreen,
  PatientEditScreen,
  AdminChatsScreen,
  ReportsManagementScreen,
  AdminReportsDetailsScreen,
  AdminEmergencyDetailsScreen,
} from '@/screens/admin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminTabParamList, AdminStackParamList } from './types';
import { buildTabScreenOptions, tabIcon } from './tabBarOptions';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={buildTabScreenOptions(insets.bottom)}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: tabIcon('grid-outline') }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ tabBarIcon: tabIcon('documents-outline') }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsScreen}
        options={{ tabBarIcon: tabIcon('people-outline') }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{ tabBarIcon: tabIcon('medkit-outline') }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('person-outline') }}
      />
    </Tab.Navigator>
  );
}

import { ChatScreen } from '@/screens/common/ChatScreen';

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PatientDetails"
        component={PatientDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PatientEdit"
        component={PatientEditScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AdminChats"
        component={AdminChatsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ReportsManagement"
        component={ReportsManagementScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AdminReportsDetails"
        component={AdminReportsDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AdminEmergencyDetails"
        component={AdminEmergencyDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
