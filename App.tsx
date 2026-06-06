import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NotificationProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
