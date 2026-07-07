import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientCard } from '../../../src/components/ClientCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ListSkeleton } from '../../../src/components/ui/Skeleton';
import { Colors, Typography } from '../../../src/constants/colors';

export default function HistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed'>('all');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      const data = await AsyncStorage.getItem('@orders');
      if (data) setOrders(JSON.parse(data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  // Fallback dummy data when no real orders exist yet
  const displayData = filtered.length > 0 ? filtered : [
    { id: '1', clientName: 'Rahul Sharma', item: 'Slim Fit Shirt', price: 300, deliveryDate: '18 March', status: 'Pending' },
    { id: '2', clientName: 'Amit Kumar', item: 'Pleated Pant', price: 350, deliveryDate: '20 March', status: 'Completed' },
  ];

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>{t('history_title')}</Text>
        {orders.length > 0 && (
          <Text style={styles.headerMeta}>{pendingCount} pending · {completedCount} completed</Text>
        )}
      </LinearGradient>

      {/* Filter chips */}
      <View style={styles.filterScroll}>
        {(['all', 'Pending', 'Completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? t('filter_all') : f === 'Pending' ? t('filter_pending') : t('filter_completed')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <ListSkeleton rows={5} />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, i) => item.id || i.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <ClientCard
              name={item.name || item.clientName}
              item={item.item}
              price={item.price}
              deliveryDate={item.deliveryDate}
              status={item.status}
              onPress={() => navigation.navigate('ClientDetail', { client: item })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title={t('no_orders')}
              subtitle="Orders you create will show up here so you can track delivery status at a glance."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    padding: 24, paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44, 66, 56, 0.05)',
  },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  headerMeta: { fontSize: 12, fontFamily: Typography.semiBold, color: Colors.textLight, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  filterScroll: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  filterChip: { 
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, 
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border 
  },
  filterChipActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  filterText: { fontSize: 13, fontFamily: Typography.bold, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  filterTextActive: { color: '#FFFFFF' },
  listContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 12 },
  sectionTitle: { fontSize: 13, fontFamily: Typography.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
});
