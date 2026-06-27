import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../constants/colors';

interface ClientCardProps {
  name: string;
  item: string;
  price: number;
  deliveryDate?: string;
  onPress: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  name,
  item,
  price,
  deliveryDate,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.itemText}>{item}</Text>
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
    borderColor: Colors.border, // Subtle sage border
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
    color: Colors.textDark, // Forest Green
    marginBottom: 2,
    fontFamily: Typography.fashionBold,
    letterSpacing: -0.5,
  },
  itemText: {
    fontSize: 13,
    color: Colors.textLight, // Muted olive
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.primary, // Forest Green
    fontFamily: Typography.fashionBold,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase', // Added from original
    letterSpacing: 0.5, // Added from original
  },
});
