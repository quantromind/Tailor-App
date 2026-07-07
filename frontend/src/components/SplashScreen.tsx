import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Colors, Typography } from '../constants/colors';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const containerFade = useRef(new Animated.Value(1)).current;   // whole screen (for exit)
  const imageFade = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.7)).current;
  const imageRotate = useRef(new Animated.Value(-8)).current;   // subtle tilt-in
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(0)).current;
  const dot2Scale = useRef(new Animated.Value(0)).current;
  const dot3Scale = useRef(new Animated.Value(0)).current;

  // Continuous gentle float for the image
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 1. Entrance: image pops in with spring + slight rotation ──
    Animated.parallel([
      Animated.timing(imageFade, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 5,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.spring(imageRotate, {
        toValue: 0,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ── 2. Float animation loop ──
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -10,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // ── 3. Staggered title & subtitle reveal ──
      Animated.stagger(160, [
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(titleY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start();

      // ── 4. Dot indicator pop-in ──
      Animated.stagger(120, [
        Animated.spring(dot1Scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]).start();
    });

    // ── 5. Exit after 3.4 s ──
    const timer = setTimeout(() => {
      Animated.timing(containerFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 3400);

    return () => clearTimeout(timer);
  }, []);

  const spin = imageRotate.interpolate({
    inputRange: [-8, 0],
    outputRange: ['-8deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      {/* Soft background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobCenter} />

      {/* Sewing tools illustration */}
      <Animated.View
        style={[
          styles.imageWrapper,
          {
            opacity: imageFade,
            transform: [
              { scale: imageScale },
              { rotate: spin },
              { translateY: floatY },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/animations/sewing_tools.json')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.Text
        style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
      >
        eTailoring
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Crafted for every stitch
      </Animated.Text>

      {/* Dot loader */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { transform: [{ scale: dot1Scale }] }]} />
        <Animated.View style={[styles.dot, styles.dotActive, { transform: [{ scale: dot2Scale }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ scale: dot3Scale }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Blobs ──
  blobTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primaryLight,
    opacity: 0.55,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.accent,
    opacity: 0.3,
  },
  blobCenter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.surfaceAlt,
    opacity: 0.7,
  },

  // ── Image ──
  imageWrapper: {
    width: width * 0.68,
    height: width * 0.68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // ── Text ──
  title: {
    fontFamily: Typography.black,
    fontSize: 38,
    color: Colors.primary,
    letterSpacing: 1.8,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },

  // ── Dot indicator ──
  dotsRow: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});
