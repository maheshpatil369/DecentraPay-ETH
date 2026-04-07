import React from 'react';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { Text, View }                  from 'react-native';

import { useAuth }    from '../context/AuthContext';
import { useAppLock } from '../context/AppLockContext';

import AppLockScreen   from '../screens/AppLockScreen';
import LoginScreen     from '../screens/LoginScreen';
import RegisterScreen  from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SendScreen      from '../screens/SendScreen';
import QRScreen        from '../screens/QRScreen';
import HistoryScreen   from '../screens/HistoryScreen';
import ProfileScreen   from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = { Dashboard: '⬡', Send: '↑', QR: '▣', History: '◷', Profile: '◎' };

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 18, color: focused ? '#6c63ff' : '#5555aa' }}>
          {TAB_ICONS[route.name]}
        </Text>
      ),
      tabBarStyle: {
        backgroundColor: '#11112a',
        borderTopColor: 'rgba(255,255,255,0.06)',
        height: 62,
        paddingBottom: 8,
      },
      tabBarLabelStyle:     { fontSize: 10, fontWeight: '700' },
      tabBarActiveTintColor:   '#6c63ff',
      tabBarInactiveTintColor: '#5555aa',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Send"      component={SendScreen} />
    <Tab.Screen name="QR"        component={QRScreen}   options={{ tabBarLabel: 'QR Pay' }} />
    <Tab.Screen name="History"   component={HistoryScreen} />
    <Tab.Screen name="Profile"   component={ProfileScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"    component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Loading splash
const Splash = () => (
  <View style={{ flex:1, backgroundColor:'#0a0a1a', alignItems:'center', justifyContent:'center' }}>
    <Text style={{ fontSize:52, color:'#6c63ff', fontWeight:'800' }}>Ð</Text>
  </View>
);

/**
 * AppNavigator — does NOT wrap in NavigationContainer.
 * NavigationContainer lives in App.js (root level only).
 */
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { locked }        = useAppLock();

  if (loading) return <Splash />;

  // Not logged in
  if (!user) return <AuthStack />;

  // Logged in but locked
  if (locked) return <AppLockScreen />;

  // Fully unlocked
  return <MainTabs />;
};

export default AppNavigator;
