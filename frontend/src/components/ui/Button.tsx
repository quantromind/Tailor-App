import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Typography } from '../../constants/colors';
import { AnimatedPressable } from './AnimatedPressable';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const gradientFor = (variant: ButtonProps['variant']): [string, string] => {
  switch (variant) {
    case 'gold': return Colors.gradientGold as [string, string];
    case 'danger': return [Colors.error, '#8C2C2C'];
    default: return Colors.gradientSecondary as [string, string];
  }
};

/**
 * Shared CTA button used across the app. Wraps AnimatedPressable for a
 * consistent tactile feel and centralizes the gradient / disabled / loading
 * treatment that used to be re-implemented per screen.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.outlineBtn,
          variant === 'ghost' && styles.ghostBtn,
          fullWidth && { alignSelf: 'stretch' },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View style={styles.content}>
            {icon && <Ionicons name={icon} size={18} color={Colors.primary} />}
            <Text style={styles.outlineText}>{label}</Text>
          </View>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[fullWidth && { alignSelf: 'stretch' }, isDisabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={gradientFor(variant)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBtn}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.content}>
            {icon && <Ionicons name={icon} size={19} color="#FFFFFF" />}
            <Text style={styles.gradientText}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gradientBtn: {
    paddingVertical: 17, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 5,
  },
  gradientText: { color: '#FFFFFF', fontSize: 15, fontFamily: Typography.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
  outlineBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: 'transparent',
  },
  ghostBtn: { borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  outlineText: { color: Colors.primary, fontSize: 14, fontFamily: Typography.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  disabled: { opacity: 0.55 },
});

export default Button;
