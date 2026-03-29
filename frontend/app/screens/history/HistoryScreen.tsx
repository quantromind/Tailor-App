import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { getCustomersWithOrders } from '../../../api';

export default function HistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const fetchCustomers = async (sort: string) => {
    setIsLoading(true);
    try {
      const data = await getCustomersWithOrders(sort);
      setCustomers(data);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers(sortBy);
    }, [sortBy])
  );

  const handleSortChange = (sort: 'date' | 'name') => {
    setSortBy(sort);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>All Customers</Text>
      </LinearGradient>

      {/* Sort chips */}
      <View style={styles.filterScroll}>
        {(['date', 'name'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, sortBy === f && styles.filterChipActive]}
            onPress={() => handleSortChange(f)}
          >
            <Ionicons 
              name={f === 'date' ? 'calendar-outline' : 'text-outline'} 
              size={14} 
              color={sortBy === f ? '#FFF' : Colors.textLight} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.filterText, sortBy === f && styles.filterTextActive]}>
              {f === 'date' ? 'By Date' : 'By Name'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item, index) => item._id || item.id || `customer-${index}`}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.customerCard}
            onPress={() => navigation.navigate('ClientDetail', { 
              client: item,
              customerId: item._id
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerPhone}>{item.phone || 'No phone'}</Text>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderCount}>{item.orderCount} order{item.orderCount !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="people-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>No customers yet</Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    padding: 24, paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  filterChip: { 
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, 
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border 
  },
  filterChipActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  filterText: { fontSize: 13, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  filterTextActive: { color: '#FFFFFF' },
  listContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  customerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surface, padding: 18, borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight || 'rgba(163, 177, 138, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(52, 78, 65, 0.1)',
  },
  avatarText: { color: Colors.primary, fontSize: 22, fontWeight: '800' },
  customerName: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 2 },
  customerPhone: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  orderCount: { fontSize: 12, color: Colors.textLight, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
  },
  statusPending: { backgroundColor: 'rgba(220, 38, 38, 0.12)' },
  statusCompleted: { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.textLight },
  statusTextPending: { color: '#DC2626' },
  statusTextCompleted: { color: '#16A34A' },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textLight, fontSize: 16, fontWeight: '600' },
});
