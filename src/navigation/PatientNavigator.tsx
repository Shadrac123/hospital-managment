import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  MessagesScreen,
  ScheduleScreen,
  ProfileScreen,
  BookingScreen,
  ReportsScreen,
  ReportDetailsScreen,
} from '@/screens/patient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { usePatientBookings } from '@/hooks';
import { subscribeToAllUnread } from '@/services/firebase';
import { PatientTabParamList, PatientStackParamList } from './types';
import { buildTabScreenOptions, tabIcon } from './tabBarOptions';

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

function PatientTabs() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookings } = usePatientBookings(user?.uid);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user || bookings.length === 0) {
      setTotalUnread(0);
      return;
    }

    const unsub = subscribeToAllUnread((unreadMap) => {
      let sum = 0;
      bookings.forEach((booking) => {
        const counts = unreadMap[booking.id];
        if (counts && counts.patient) {
          sum += counts.patient;
        }
      });
      setTotalUnread(sum);
    });

    return unsub;
  }, [user, bookings]);

  return (
    <Tab.Navigator screenOptions={buildTabScreenOptions(insets.bottom)}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon('home-outline') }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: tabIcon('chatbubble-outline'),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon('person-outline') }}
      />
    </Tab.Navigator>
  );
}

/**
 * Patient tab + pushed screens stack.
 * Onboarding is handled at the RootNavigator level (state-driven),
 * so this navigator only renders when profileComplete === true.
 */
import { ChatScreen } from '@/screens/common/ChatScreen';

export function PatientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabs" component={PatientTabs} />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
