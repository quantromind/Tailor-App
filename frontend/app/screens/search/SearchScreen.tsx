import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientCard } from '../../../src/components/ClientCard';
import { Colors, Typography } from '../../../src/constants/colors';

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const isYesterday = (dateStr: string) => {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
};

export default function SearchScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await AsyncStorage.getItem('@orders');
        if (data) setAllOrders(JSON.parse(data));
        
        const history = await AsyncStorage.getItem('@search_history');
        if (history) setSearchHistory(JSON.parse(history));
      })();
    }, [])
  );

  const saveSearchToHistory = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newHistory = [searchTerm, ...searchHistory.filter(s => s !== searchTerm)].slice(0, 5);
    setSearchHistory(newHistory);
    await AsyncStorage.setItem('@search_history', JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem('@search_history');
  };

  // Group by today / yesterday
  const todayOrders = allOrders.filter(o => o.createdAt && isToday(o.createdAt));
  const yesterdayOrders = allOrders.filter(o => o.createdAt && isYesterday(o.createdAt));

  // Search filter
  const searchResults = query.trim()
    ? allOrders.filter(o => {
      const name = (o.name || o.clientName || '').toLowerCase();
      const phone = (o.phone || '').toLowerCase();
      const q = query.toLowerCase();
      return name.includes(q) || phone.includes(q);
    })
    : [];

  const handleSelectOrder = (item: any) => {
    saveSearchToHistory(query || item.name || item.clientName);
    navigation.navigate('ClientDetail', { client: item, targetOrderId: item.id });
  };

  const isSearching = query.trim().length > 0;

  const sections = [];
  if (todayOrders.length > 0) sections.push({ title: t('today_orders'), data: todayOrders });
  if (yesterdayOrders.length > 0) sections.push({ title: t('yesterday_orders'), data: yesterdayOrders });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>{t('search_title')}</Text>
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

      {isSearching ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item, i) => item.id || i.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <ClientCard
              name={item.name || item.clientName}
              item={item.item}
              price={item.price}
              deliveryDate={item.deliveryDate}
              onPress={() => handleSelectOrder(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>{t('no_results')}</Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.sectionHeaderHistory}>
                <Text style={styles.sectionTitle}>{t('recent_searches')}</Text>
                <Text style={styles.clearText} onPress={clearHistory}>{t('clear')}</Text>
              </View>
              <View style={styles.historyChips}>
                {searchHistory.map((item, idx) => (
                  <Text key={idx} style={styles.historyChip} onPress={() => setQuery(item)}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <SectionList
            sections={sections}
            scrollEnabled={false}
            keyExtractor={(item, i) => item.id || i.toString()}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <ClientCard
                name={item.name || item.clientName}
                item={item.item}
                price={item.price}
                deliveryDate={item.deliveryDate}
                onPress={() => handleSelectOrder(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>{t('no_activity')}</Text>
              </View>
            }
          />
        </ScrollView>
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  listContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  sectionHeader: {
    paddingVertical: 10, paddingHorizontal: 4, marginTop: 12, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  historySection: { marginBottom: 20 },
  sectionHeaderHistory: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clearText: { fontSize: 12, color: Colors.error, fontWeight: '700' },
  historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: { 
    backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, 
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, 
    fontSize: 14, color: Colors.textDark, fontWeight: '600' 
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textDark, fontSize: 18, fontWeight: '700' },
  emptySubText: { color: Colors.textLight, fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
