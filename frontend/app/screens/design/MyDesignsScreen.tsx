import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyDesigns } from '../../../api';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Colors, Typography } from '../../../src/constants/colors';

interface Design {
  _id: string;
  name: string;
  category: string;
  image?: string;
  description?: string;
  measurements?: string[];
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  kids: "Kids",
};

export default function MyDesignsScreen({ navigation }: any) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDesigns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getMyDesigns();
      setDesigns(data);
    } catch (e) {
      console.error('[MyDesigns] Failed to load designs', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const renderDesign = ({ item }: { item: Design }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="shirt-outline" size={40} color={Colors.secondary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.designName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{CATEGORY_LABEL[item.category] ?? item.category}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {item.measurements && item.measurements.length > 0 && (
          <View style={styles.measurementsRow}>
            <Ionicons name="resize-outline" size={13} color={Colors.primary} />
            <Text style={styles.measurementsText} numberOfLines={1}>
              {item.measurements.join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="albums-outline" size={44} color={Colors.secondary} />
      </View>
      <Text style={styles.emptyTitle}>No Designs Yet</Text>
      <Text style={styles.emptySubtitle}>
        You haven't saved any custom designs. Tap below to add your first one.
      </Text>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddDesign')}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add New Design</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="My Designs"
        subtitle="Your saved atelier collection"
        onBack={() => navigation.goBack()}
      />

      {/* Add Design FAB */}
      {!loading && !error && designs.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddDesign')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading designs...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Couldn't Load Designs</Text>
          <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={loadDesigns} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={designs}
          keyExtractor={(item) => item._id}
          renderItem={renderDesign}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[styles.list, designs.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.medium,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  designName: {
    fontSize: 17,
    fontFamily: Typography.extraBold,
    color: Colors.textDark,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    lineHeight: 19,
  },
  measurementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measurementsText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.medium,
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Typography.extraBold,
    color: Colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    textAlign: 'center',
    lineHeight: 21,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  addBtnText: {
    color: '#fff',
    fontFamily: Typography.bold,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 999,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
});
