import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { searchCustomers } from '../../../api';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';

export default function ExistingCustScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { gender } = route.params || {};
  const [query, setQuery] = useState('');
  const [uniqueClients, setUniqueClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const customers = await searchCustomers(searchQuery);
      setUniqueClients(customers);
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers(query);
    }, [])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredClients = uniqueClients;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>{gender ? `${gender.charAt(0).toUpperCase() + gender.slice(1)} ${t('tab_home')} Clients` : t('select_client')}</Text>
        <View style={{ width: 32 }} />
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

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.phone || item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.clientCard}
            onPress={() => {
              if (gender === 'male') {
                navigation.navigate('MaleCategory', { client: item });
              } else {
                // For now, other genders navigate to detail or show alert
                navigation.navigate('ClientDetail', { client: item });
              }
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{item.name}</Text>
              <Text style={styles.clientPhone}>{item.phone || t('no_phone')}</Text>
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
                <Text style={styles.emptyText}>{t('no_results')}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  listContainer: { padding: 20, gap: 12 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surface, padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontSize: 20, fontWeight: '800' },
  clientName: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  clientPhone: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textDark, fontSize: 18, fontWeight: '700' },
});
