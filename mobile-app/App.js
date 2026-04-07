import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar }           from 'expo-status-bar';
import { AuthProvider }        from './src/context/AuthContext';
import { AppLockProvider }     from './src/context/AppLockContext';
import AppNavigator            from './src/navigation/AppNavigator';

export default function App() {
  return (
    // Single NavigationContainer at the root — never nested
    <NavigationContainer>
      <AuthProvider>
        <AppLockProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AppLockProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
