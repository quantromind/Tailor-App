import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initI18n } from '../i18n'; // Import initialization function

import LoginScreen from '../../app/screens/auth/LoginScreen';
import RegisterScreen from '../../app/screens/auth/RegisterScreen';
import BottomTabs from './BottomTabs';
import GenderScreen from '../../app/screens/gender/GenderScreen';
import MaleCategoryScreen from '../../app/screens/male/MaleCategoryScreen';
import PantMeasurementScreen from '../../app/screens/measurement/PantMeasurementScreen';
import ShirtMeasurementScreen from '../../app/screens/measurement/ShirtMeasurementScreen';
import BillPreviewScreen from '../../app/screens/billing/BillPreviewScreen';
import ClientDetailScreen from '../../app/screens/history/ClientDetailScreen';
import ExistingCustScreen from '../../app/screens/home/ExistingCustScreen';
import LanguageSelectionScreen from '../../app/language-selection';
import AddDesignScreen from '../../app/screens/design/AddDesignScreen';
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean | null>(null);
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    checkInitialState();
    // Test API
    fetch('http://10.145.237.210:5000/api/debug/test')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        } else {
          throw new Error("Oops, we haven't got JSON!");
        }
      })
      .then(d => console.log('[DEBUG] App initialization test:', d))
      .catch(e => console.error('[DEBUG] App initialization test failed:', e.message));
  }, []);

  const checkInitialState = async () => {
    try {
      await initI18n(); // Ensure i18n is ready first
      setIsI18nInitialized(true);
      
      const [profile, languageSelected] = await Promise.all([
        AsyncStorage.getItem('@tailor_profile'),
        AsyncStorage.getItem('has-selected-language'),
      ]);
      setHasSelectedLanguage(languageSelected === 'true');
      setIsLoggedIn(!!profile);
    } catch (error) {
      console.error('Error checking initial state:', error);
      setIsI18nInitialized(true);
      setHasSelectedLanguage(false);
      setIsLoggedIn(false);
    }
  };

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  const handleLanguageSuccess = () => {
    setHasSelectedLanguage(true);
  };

  if (isLoggedIn === null || hasSelectedLanguage === null || !isI18nInitialized) return null; // loading

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!hasSelectedLanguage ? (
          <Stack.Screen name="LanguageSelection">
            {(props) => <LanguageSelectionScreen onContinue={handleLanguageSuccess} />}
          </Stack.Screen>
        ) : !isLoggedIn ? (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen 
                  onLogin={() => setIsLoggedIn(true)} 
                  onNavigateToRegister={() => props.navigation.navigate('Register')} 
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => (
                <RegisterScreen 
                  onNavigateToLogin={() => props.navigation.navigate('Login')} 
                  onRegisterSuccess={() => setIsLoggedIn(true)} 
                />
              )}
            </Stack.Screen>
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
              {(props) => <BottomTabs {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Gender" component={GenderScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="MaleCategory" component={MaleCategoryScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PantMeasurement" component={PantMeasurementScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ShirtMeasurement" component={ShirtMeasurementScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="BillPreview" component={BillPreviewScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ExistingCust" component={ExistingCustScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AddDesign" component={AddDesignScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="MyDesigns" component={AddDesignScreen} options={{ animation: 'slide_from_right' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
