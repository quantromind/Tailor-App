import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { AnimatedPressable } from '../../../src/components/ui/AnimatedPressable';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';

export default function GenderScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { customerType } = route.params || { customerType: 'new' };

  const handleGenderSelect = (gender: string) => {
    if (customerType === 'existing') {
      navigation.navigate('ExistingCust', { gender });
    } else {
      if (gender === 'male') navigation.navigate('MaleCategory');
      else if (gender === 'female') Alert.alert('Info', t('coming_soon'));
      else if (gender === 'kids') Alert.alert('Info', t('coming_soon'));
    }
  };

  const options = [
    { id: 'male', icon: 'male-outline', label: t('menswear'), tint: 'rgba(58, 102, 219, 0.12)', iconColor: Colors.info },
    { id: 'female', icon: 'female-outline', label: t('ladieswear'), tint: 'rgba(178, 58, 116, 0.10)', iconColor: '#B23A74' },
    { id: 'kids', icon: 'happy-outline', label: t('kidswear'), tint: 'rgba(200, 155, 60, 0.14)', iconColor: Colors.gold },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('gender_selection_title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.instruction}>{t('gender_selection_subtitle')}</Text>

        {options.map((opt) => (
          <AnimatedPressable key={opt.id} style={styles.optionBtn} onPress={() => handleGenderSelect(opt.id)}>
            <View style={[styles.iconCircle, { backgroundColor: opt.tint }]}>
              <Ionicons name={opt.icon as any} size={28} color={opt.iconColor} />
            </View>
            <Text style={styles.optionText}>{opt.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </AnimatedPressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 32, gap: 16 },
  instruction: { 
    fontSize: 12, color: Colors.textLight, marginBottom: 6, 
    fontFamily: Typography.bold, textTransform: 'uppercase', letterSpacing: 1.5 
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 20,
    padding: 20, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 20, fontFamily: Typography.extraBold, color: Colors.textDark, letterSpacing: 0.2 },
});
