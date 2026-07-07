import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../src/constants/colors';
import { AnimatedPressable } from '../src/components/ui/AnimatedPressable';
import { Button } from '../src/components/ui/Button';

const languages = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { id: 'ml', name: 'Malayalam', nativeName: 'मलयालम' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬी' },
];

interface LanguageSelectionScreenProps {
  onContinue: () => void;
}

export default function LanguageSelectionScreen({ onContinue }: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageSelect = async (langId: string) => {
    setSelectedLanguage(langId);
    await i18n.changeLanguage(langId);
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem('user-language', selectedLanguage);
    await AsyncStorage.setItem('has-selected-language', 'true');
    if (onContinue) {
      onContinue();
    }
  };

  const renderItem = ({ item }: { item: typeof languages[0] }) => {
    const active = selectedLanguage === item.id;
    return (
      <AnimatedPressable
        style={[styles.languageItem, active && styles.selectedItem]}
        onPress={() => handleLanguageSelect(item.id)}
        scaleTo={0.98}
      >
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, active && styles.selectedText]}>{item.name}</Text>
          <Text style={[styles.nativeName, active && styles.selectedNativeText]}>{item.nativeName}</Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientSecondary as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.brandCircle}>
          <Ionicons name="cut-outline" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('select_language')}</Text>
      </LinearGradient>

      <FlatList
        data={languages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button label={t('continue')} icon="arrow-forward" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 44,
    paddingBottom: 34,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 16,
    alignItems: 'center',
  },
  brandCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 26,
    fontFamily: Typography.extraBold,
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Typography.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  selectedItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 17,
    fontFamily: Typography.bold,
    color: Colors.textDark,
  },
  nativeName: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    marginTop: 3,
  },
  selectedText: {
    color: Colors.primary,
  },
  selectedNativeText: {
    color: Colors.primary,
    opacity: 0.75,
  },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(247, 248, 242, 0.92)',
  },
});
