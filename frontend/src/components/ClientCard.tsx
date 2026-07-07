import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { StatusBadge, toneForOrderStatus } from './ui/StatusBadge';

interface ClientCardProps {
  name: string;
  item: string;
  price: number;
  deliveryDate?: string;
  status?: string;
  onPress: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  name,
  item,
  price,
  deliveryDate,
  status,
  onPress,
}) => {
  return (
    <AnimatedPressable style={styles.container} onPress={onPress} scaleTo={0.98}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.itemText} numberOfLines={1}>{item}</Text>
        {status ? (
          <View style={{ marginTop: 6 }}>
            <StatusBadge label={status} tone={toneForOrderStatus(status)} />
          </View>
        ) : null}
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.price}>₹{price}</Text>
        {deliveryDate && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={Colors.textLight} />
            <Text style={styles.dateText}>{deliveryDate}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.border} style={{ marginTop: 6 }} />
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(44, 66, 56, 0.1)',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 20,
    fontFamily: Typography.extraBold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: Colors.textDark,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  itemText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 17,
    fontFamily: Typography.extraBold,
    color: Colors.primary,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  dateText: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: Typography.semiBold,
  },
});
