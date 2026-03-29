import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { getOrders } from '../../../api';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_OPTIONS = ['all', 'pending', 'in-progress', 'completed', 'delivered', 'cancelled'] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF6B6B',
  'in-progress': '#FF9800',
  completed: '#4CAF50',
  delivered: '#2196F3',
  cancelled: '#9E9E9E',
  all: Colors.primary,
};

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function HistoryOrdersScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Status>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOrders({
        status: status !== 'all' ? status : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setIsLoading(false);
    }
  }, [status, fromDate, toDate]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>{t('all_orders')}</Text>
        <TouchableOpacity onPress={() => setShowDateFilter(!showDateFilter)} style={styles.filterIcon}>
          <Ionicons name="calendar-outline" size={22} color={Colors.textDark} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Status filter chips */}
      <View style={styles.chipScroll}>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, status === s && { backgroundColor: STATUS_COLORS[s] }]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date filter */}
      {showDateFilter && (
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>{t('date_from')}</Text>
            <TextInput
              style={styles.dateField}
              placeholder="YYYY-MM-DD"
              value={fromDate}
              onChangeText={setFromDate}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>{t('date_to')}</Text>
            <TextInput
              style={styles.dateField}
              placeholder="YYYY-MM-DD"
              value={toDate}
              onChangeText={setToDate}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <TouchableOpacity onPress={fetchOrders} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => item._id || `o-${idx}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>{t('no_orders')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] || '#999';
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
            const deliveryDate = item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : null;
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('ClientDetail', { client: item.customer, customerId: item.customer?._id })}
              >
                <View style={styles.orderTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{item.customer?.name || t('no_client')}</Text>
                    <Text style={styles.designName}>{item.design?.name || '—'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[item.status] || item.status}</Text>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.textLight} />
                    <Text style={styles.metaText}>{date}</Text>
                  </View>
                  {item.price > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={12} color={Colors.textLight} />
                      <Text style={styles.metaText}>₹{item.price}</Text>
                    </View>
                  )}
                  {deliveryDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color={Colors.textLight} />
                      <Text style={styles.metaText}>Due: {deliveryDate}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark },
  filterIcon: { padding: 4 },
  chipScroll: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipTextActive: { color: '#FFF' },
  dateRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
  },
  dateInput: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginBottom: 4 },
  dateField: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.textDark,
  },
  applyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  applyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clientName: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  designName: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  orderBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight },
  empty: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textDark, fontSize: 18, fontWeight: '700' },
});
