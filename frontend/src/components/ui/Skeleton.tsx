import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ width = '100%', height = 16, radius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Colors.surfaceSunken, opacity },
        style,
      ]}
    />
  );
};

/** A skeleton placeholder shaped like a ClientCard row, for list loading states. */
export const ClientCardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <SkeletonBlock width={54} height={54} radius={27} />
    <View style={{ flex: 1, gap: 8 }}>
      <SkeletonBlock width="60%" height={16} />
      <SkeletonBlock width="40%" height={12} />
    </View>
    <View style={{ gap: 8, alignItems: 'flex-end' }}>
      <SkeletonBlock width={48} height={16} />
      <SkeletonBlock width={64} height={10} />
    </View>
  </View>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <View style={{ gap: 16 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <ClientCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export { SkeletonBlock };
export default ListSkeleton;
