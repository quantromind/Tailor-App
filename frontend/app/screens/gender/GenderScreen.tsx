import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';

export default function GenderScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { customerType, client } = route.params || { customerType: 'new' };

  const handleGenderSelect = (gender: string) => {
    if (gender === 'male') {
      navigation.navigate('MaleCategory', { client });
    } else if (gender === 'female') {
      // Assuming FemaleCategory exists or will be added, for now showing Alert
      Alert.alert('Info', t('coming_soon'));
    } else if (gender === 'kids') {
      Alert.alert('Info', t('coming_soon'));
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
          <Text style={styles.title}>{t('gender_selection_title')}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.instruction}>{t('gender_selection_subtitle')}</Text>

          <TouchableOpacity onPress={() => handleGenderSelect('male')} activeOpacity={0.85}>
            <LinearGradient 
              colors={Colors.gradientPrimary as [string, string]} 
              style={styles.optionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="male-outline" size={32} color={Colors.primary} />
              <Text style={styles.optionText}>{t('menswear')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleGenderSelect('female')} activeOpacity={0.85}>
            <LinearGradient 
              colors={Colors.gradientPrimary as [string, string]} 
              style={styles.optionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="female-outline" size={32} color={Colors.primary} />
              <Text style={styles.optionText}>{t('ladieswear')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleGenderSelect('kids')} activeOpacity={0.85}>
            <LinearGradient 
              colors={Colors.gradientPrimary as [string, string]} 
              style={styles.optionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="happy-outline" size={32} color={Colors.primary} />
              <Text style={styles.optionText}>{t('kidswear')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  content: { padding: 24, paddingTop: 40, gap: 20 },
  instruction: { 
    fontSize: 13, color: Colors.textLight, marginBottom: 10, 
    fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 24,
    padding: 28, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 3,
  },
  optionText: { fontSize: 24, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: 0.5 },
});
