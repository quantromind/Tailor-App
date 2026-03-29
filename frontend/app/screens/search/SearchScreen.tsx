import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientCard } from '../../../src/components/ClientCard';
import { Colors, Typography } from '../../../src/constants/colors';
import { searchOrders } from '../../../api';

export default function SearchScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async (q: string, sort: string) => {
    setIsLoading(true);
    try {
      const data = await searchOrders(q, sort);
      setOrders(data);
    } catch (e) {
      console.error('Failed to search orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(query, sortBy);
    }, [])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders(query, sortBy);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, sortBy]);

  const getDesignName = (order: any) => order.design?.name || 'Unknown';
  const getPrice = (order: any) => {
    const priceMatch = order.notes?.match(/Price:\s?[₹$€]?\s?(\d+)/i);
    return priceMatch ? parseInt(priceMatch[1]) : 0;
  };
  const getDeliveryDate = (order: any) => {
    const dateMatch = order.notes?.match(/Delivery Date:\s?([^,]+)/i);
    return dateMatch ? dateMatch[1].trim() : '';
  };

  const handleSelectOrder = (item: any) => {
    navigation.navigate('ClientDetail', { 
      client: item.customer, 
      customerId: item.customer?._id,
      targetOrderId: item._id 
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>Search Orders</Text>
        {orders.length > 0 && (
          <Text style={styles.subtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} found</Text>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_placeholder')}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={Colors.textLight}
        />
        {query.length > 0 && (
          <Ionicons name="close-circle-outline" size={20} color={Colors.textLight} onPress={() => setQuery('')} />
        )}
      </View>

      {/* Sort chips */}
      <View style={styles.sortRow}>
        {(['date', 'name'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.sortChip, sortBy === f && styles.sortChipActive]}
            onPress={() => setSortBy(f)}
          >
            <Ionicons 
              name={f === 'date' ? 'calendar-outline' : 'text-outline'} 
              size={14} 
              color={sortBy === f ? '#FFF' : Colors.textLight} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sortText, sortBy === f && styles.sortTextActive]}>
              {f === 'date' ? 'By Date' : 'By Name'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => item._id || item.id || `order-${index}`}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <ClientCard
              name={item.customer?.name || 'Unknown'}
              item={getDesignName(item)}
              price={getPrice(item)}
              deliveryDate={getDeliveryDate(item)}
              status={item.status}
              onPress={() => handleSelectOrder(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>{query ? t('no_results') : 'Search for orders'}</Text>
            </View>
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
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textLight, fontWeight: '700', marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  sortRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, gap: 10 },
  sortChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortText: { fontSize: 12, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  sortTextActive: { color: '#FFF' },
  listContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textDark, fontSize: 18, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', marginTop: 80 },
});
