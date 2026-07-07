import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/**
 * Consistent "nothing here yet" visual used across list screens
 * (History, Search, Client orders, etc.) instead of ad-hoc plain text.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={compact ? 26 : 34} color={Colors.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 6 },
  compact: { paddingVertical: 36 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 16, fontFamily: Typography.bold, color: Colors.textDark, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: Typography.regular, color: Colors.textLight, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  actionBtn: {
    marginTop: 18, backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14,
  },
  actionText: { color: '#FFFFFF', fontSize: 13, fontFamily: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
});

export default EmptyState;
