import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationFinish: () => void;
}

export default function CustomSplashScreen({ onAnimationFinish }: CustomSplashScreenProps) {
  const animation = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleAnimationFinish = () => {
    // Smooth fade out before finishing
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onAnimationFinish();
    });
  };

  useEffect(() => {
    // Hide the native splash screen as soon as our Lottie splash is ready
    const hideNative = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Splash hide failed:', e);
      }
    };
    hideNative();

    // Safety timeout: if animation doesn't finish in 5 seconds, proceed anyway
    const timer = setTimeout(() => {
      console.warn('Splash animation timeout - proceeding to app');
      handleAnimationFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LottieView
        ref={animation}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        source={require('../assets/animations/sewing_tools.json')}
        style={styles.animation}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // You can change this to match your brand colors
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: width * 0.8,
    height: width * 0.8,
  },
});
