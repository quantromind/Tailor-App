import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../constants/colors';

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
  const isPending = status?.toLowerCase() === 'pending' || status?.toLowerCase() === 'in-progress';
  const isCompleted = status?.toLowerCase() === 'completed' || status?.toLowerCase() === 'delivered';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.itemText}>{item}</Text>
        {status && (
          <View style={[
            styles.statusBadge,
            isPending && styles.statusPending,
            isCompleted && styles.statusCompleted,
          ]}>
            <Text style={[
              styles.statusText,
              isPending && styles.statusTextPending,
              isCompleted && styles.statusTextCompleted,
            ]}>
              {status}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.price}>₹{price}</Text>
        {deliveryDate && (
          <Text style={styles.dateText}>Delivery: {deliveryDate}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 78, 65, 0.1)',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Typography.fashionBold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 2,
    fontFamily: Typography.fashionBold,
    letterSpacing: -0.5,
  },
  itemText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.textLight,
  },
  statusTextPending: {
    color: '#DC2626',
  },
  statusTextCompleted: {
    color: '#16A34A',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.primary,
    fontFamily: Typography.fashionBold,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
