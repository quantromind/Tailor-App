import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Colors, Typography } from '../../../src/constants/colors';
import { useTranslation } from 'react-i18next';
import { registerUser } from '../../../api';

export default function RegisterScreen({ onNavigateToLogin, onRegisterSuccess }: { onNavigateToLogin: () => void, onRegisterSuccess: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Error', t('error_fill_fields'));
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Error', t('error_invalid_phone'));
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({ name, phone, password, companyName });

      // Store token and profile (new users get free plan)
      await AsyncStorage.setItem('@auth_token', response.token);
      const profileData = { 
        name, 
        phone, 
        companyName, 
        userId: response.userId,
        clientLimit: response.clientLimit || 30,
        subscriptionPlan: response.subscriptionPlan || 'free',
        clientCount: 0
      };
      await AsyncStorage.setItem('@tailor_profile', JSON.stringify(profileData));

      Alert.alert(t('success'), t('registration_success'), [
        { text: 'OK', onPress: () => onRegisterSuccess() }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || t('error_failed_save');
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        keyboardOpeningTime={0}
      >
          <View style={styles.header}>
            <LinearGradient 
              colors={Colors.gradientPrimary as [string, string]} 
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person-add-outline" size={48} color={Colors.primary} />
            </LinearGradient>
            <Text style={styles.title}>{t('register_title')}</Text>
            <Text style={styles.subtitle}>{t('register_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('full_name_label')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <TextInput 
                  style={styles.input} 
                  placeholder="John Doe" 
                  value={name} 
                  onChangeText={setName} 
                  placeholderTextColor={Colors.textLight} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('phone_hint')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <TextInput 
                  style={styles.input} 
                  placeholder="9876543210" 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  maxLength={10}
                  placeholderTextColor={Colors.textLight} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('company_name_label')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={Colors.primary} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Atelier Boutique" 
                  value={companyName} 
                  onChangeText={setCompanyName} 
                  placeholderTextColor={Colors.textLight} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password_label')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword} 
                  placeholderTextColor={Colors.textLight} 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} style={styles.registerBtn}>
              <LinearGradient 
                colors={Colors.gradientSecondary as [string, string]} 
                style={styles.registerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.registerBtnText}>{t('register_button')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerText}>
                {t('already_have_account')} <Text style={styles.loginText}>{t('login')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  logoGradient: { 
    width: 100, height: 100, borderRadius: 50, 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)'
  },
  title: { fontSize: 32, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4, letterSpacing: 0.8, fontWeight: '700', textTransform: 'uppercase' },
  form: { 
    backgroundColor: Colors.surface, 
    borderRadius: 24, padding: 24, 
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: Colors.surfaceAlt, 
    borderRadius: 14, paddingHorizontal: 16, 
    borderWidth: 1, borderColor: Colors.border
  },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, color: Colors.textDark, fontSize: 15, fontWeight: '600' },
  registerBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  registerGradient: { paddingVertical: 18, alignItems: 'center' },
  registerBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { color: Colors.textLight, fontSize: 14, fontWeight: '500' },
  loginText: { color: Colors.primary, fontWeight: '800' },
});
