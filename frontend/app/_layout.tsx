import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    // Hide native splash screen quickly, as we show our own
    SplashScreen.hideAsync().catch(() => {});
    setAppReady(true);
  }, []);

  const showCustomSplash = !appReady || !splashAnimationFinished;

  return (
    <View style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>

      {showCustomSplash && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
          <LottieView
            source={require('../assets/animations/sewing_tools.json')}
            autoPlay
            loop={false}
            onAnimationFinish={() => setSplashAnimationFinished(true)}
            style={{ width: '80%', height: '80%' }}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}
