import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../../app/screens/home/HomeScreen';
import SearchScreen from '../../app/screens/search/SearchScreen';
import HistoryScreen from '../../app/screens/history/HistoryScreen';
import HistoryOrdersScreen from '../../app/screens/history/HistoryOrdersScreen';
import ProfileScreen from '../../app/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Customers') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 4,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tab_home') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: t('tab_search') }}
      />
      <Tab.Screen
        name="Customers"
        component={HistoryScreen}
        options={{ tabBarLabel: t('tab_customers') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryOrdersScreen}
        options={{ tabBarLabel: t('tab_history') }}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: t('tab_profile') }}
      >
        {(props: any) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
