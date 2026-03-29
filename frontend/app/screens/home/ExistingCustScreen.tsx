import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { searchCustomers } from '../../../api';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';

const GENDER_ICONS: Record<string, any> = {
  male: 'male-outline',
  female: 'female-outline',
  kids: 'happy-outline',
};

const GENDER_COLORS: Record<string, string> = {
  male: '#4A90D9',
  female: '#E91E8C',
  kids: '#FF9800',
};

export default function ExistingCustScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const customers = await searchCustomers(searchQuery);
      // Deduplicate by phone — one row per unique client
      const seen = new Set<string>();
      const unique = customers.filter((c: any) => {
        const key = c.phone || c._id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setClients(unique);
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers('');
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectClient = (item: any) => {
    const gender = item.gender;
    if (gender === 'male') {
      navigation.navigate('MaleCategory', { client: item });
    } else if (gender === 'female' || gender === 'kids') {
      Alert.alert('Coming Soon', t('coming_soon') || 'This section is under development');
    } else {
      Alert.alert('Info', 'Client gender not set. Please update the client profile first.');
    }
  };

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
        <Text style={styles.title}>{t('select_client')}</Text>
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
          autoFocus
        />
        {query.length > 0 && (
          <Ionicons name="close-circle-outline" size={20} color={Colors.textLight} onPress={() => setQuery('')} />
        )}
      </View>

      {isLoading && clients.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item, index) => item._id || `c-${index}`}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const gender = item.gender;
            const genderIcon = GENDER_ICONS[gender] || 'person-outline';
            const genderColor = GENDER_COLORS[gender] || Colors.primary;

            return (
              <View style={styles.clientCardWrapper}>
                {/* Main tap — starts new order */}
                <TouchableOpacity
                  style={styles.clientCard}
                  onPress={() => handleSelectClient(item)}
                >
                  <View style={[styles.avatar, { backgroundColor: genderColor + '18' }]}>
                    <Ionicons name={genderIcon} size={24} color={genderColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <Text style={styles.clientPhone}>{item.phone || t('no_phone')}</Text>
                  </View>
                  <View style={styles.newOrderBadge}>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.newOrderText}>{t('new_order')}</Text>
                  </View>
                </TouchableOpacity>

                {/* Secondary tap — view history */}
                <TouchableOpacity
                  style={styles.historyBtn}
                  onPress={() => navigation.navigate('ClientDetail', { client: item, customerId: item._id })}
                >
                  <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                  <Text style={styles.historyBtnText}>{t('view_history')}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>{t('no_results')}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: Typography.fashionBold, color: Colors.textDark },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  listContainer: { padding: 20, gap: 16 },
  clientCardWrapper: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  clientName: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  clientPhone: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  newOrderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  newOrderText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6, backgroundColor: 'rgba(52, 78, 65, 0.03)',
  },
  historyBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: Colors.textDark, fontSize: 18, fontWeight: '700' },
});
