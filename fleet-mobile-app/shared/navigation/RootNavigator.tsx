import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Auth Screens
import { LoginScreen } from '../features/auth/LoginScreen';

// Driver Screens
import { DashboardScreen } from '../features/driver/DashboardScreen';

// Trips Screens
import { TripsScreen } from '../features/trips/TripsScreen';
import { ActiveTripScreen } from '../features/trips/ActiveTripScreen';
import { TripDetailsScreen } from '../features/trips/TripDetailsScreen';

// Notifications Screen
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';

// Profile Screen
import { ProfileScreen } from '../features/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen
        name="TripDetails"
        component={DashboardScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripsList" component={TripsScreen} />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function ActiveTripStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActiveTripMain" component={ActiveTripScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsList" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.gray[200],
          paddingBottom: spacing.sm,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: spacing.sm,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsStack}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="route-variant"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ActiveTrip"
        component={ActiveTripStack}
        options={{
          tabBarLabel: 'Active',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="progress-clock"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return <MainTabs />;
}

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}