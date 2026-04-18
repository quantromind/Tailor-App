import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// Use icons for now as we don't have images for ladieswear yet
export default function FemaleCategoryScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { client } = route.params || {};

  const categories = [
    {
      title: t('ladieswear_title'),
      items: [
        { id: 'f_salwar', name: t('salwar_kameez'), type: 'Pant', icon: 'shirt-outline' },
        { id: 'f_kurti', name: t('kurti_cutting'), type: 'Shirt', icon: 'shirt-outline' },
        { id: 'f_blouse', name: t('blouse_cutting'), type: 'Shirt', icon: 'cut-outline' },
      ],
    },
  ];

  const handleSelect = (item: any) => {
    if (item.type === 'Pant') navigation.navigate('PantMeasurement', { item, gender: 'female', client });
    else navigation.navigate('ShirtMeasurement', { item, gender: 'female', client });
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
        <Text style={styles.headerTitle}>{t('ladieswear_title')}</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.customBtn}
          onPress={() => navigation.navigate('AddDesign')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.gradientSecondary as [string, string]}
            style={styles.customGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="create-outline" size={28} color="#FFF" />
            <Text style={styles.customText}>{t('add_your_design')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {categories.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    <View style={styles.iconPlaceholder}>
                      <Ionicons name={item.icon as any || 'shirt-outline'} size={48} color={Colors.primary} />
                    </View>
                  </View>
                  <View style={styles.labelOverlay}>
                    <Text style={styles.labelText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
  headerTitle: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 60 },
  customBtn: { marginBottom: 24, borderRadius: 24, overflow: 'hidden', elevation: 4 },
  customGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  customText: { fontSize: 18, fontFamily: Typography.fashionBold, color: "#FFFFFF", letterSpacing: 1 },
  section: { marginBottom: 32 },
  sectionTitle: { 
    fontSize: 13, fontWeight: '800', color: Colors.textLight, 
    marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  imageContainer: { flex: 1 },
  iconPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
  },
  labelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  labelText: { color: Colors.textDark, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
