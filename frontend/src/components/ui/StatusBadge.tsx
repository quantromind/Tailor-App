import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../constants/colors';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: Colors.successBg, fg: Colors.success },
  warning: { bg: Colors.warningBg, fg: '#95721E' },
  error: { bg: Colors.errorBg, fg: Colors.error },
  info: { bg: Colors.infoBg, fg: Colors.info },
  neutral: { bg: Colors.primaryLight, fg: Colors.primary },
  gold: { bg: 'rgba(200, 155, 60, 0.15)', fg: Colors.gold },
};

/** Small pill used for order status, subscription status, etc. */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => {
  const { bg, fg } = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
};

/** Convenience helper: pick a tone from a common order status string. */
export const toneForOrderStatus = (status?: string): Tone => {
  if (status === 'Completed') return 'success';
  if (status === 'Pending') return 'warning';
  return 'neutral';
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontFamily: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
});

export default StatusBadge;
