import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { useTranslation } from 'react-i18next';
import { API } from '../../../api';

const SUBSCRIPTION_PLANS = [
  { key: 'free', label: 'Free Plan', limit: 30, price: '₹0' },
  { key: '49_clients', label: '49 Clients', limit: 49, price: '₹159' },
  { key: '99_clients', label: '99 Clients', limit: 99, price: '₹239' },
  { key: '199_clients', label: '199 Clients', limit: 199, price: '₹399' },
];

export default function ProfileScreen({ navigation, onLogout }: any) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await API.get('/auth/profile');
      const data = response.data;
      setProfile(data);
      setClientCount(data.clientCount || 0);
      // Update local storage with latest profile
      await AsyncStorage.setItem('@tailor_profile', JSON.stringify({
        name: data.name,
        phone: data.phone,
        companyName: data.companyName,
        userId: data._id,
        clientLimit: data.clientLimit,
        subscriptionPlan: data.subscriptionPlan,
      }));
    } catch (e) {
      // Fallback to local storage
      const localData = await AsyncStorage.getItem('@tailor_profile');
      if (localData) setProfile(JSON.parse(localData));
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@tailor_profile');
          await AsyncStorage.removeItem('@auth_token');
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  const handleChangeLanguage = () => {
    const languages = [
      { id: 'en', name: 'English' },
      { id: 'hi', name: 'Hindi' },
      { id: 'mr', name: 'Marathi' },
      { id: 'gu', name: 'Gujarati' },
      { id: 'ta', name: 'Tamil' },
    ];

    Alert.alert(
      t('select_language'),
      t('welcome'),
      languages.map((lang) => ({
        text: lang.name,
        onPress: async () => {
          await i18n.changeLanguage(lang.id);
          await AsyncStorage.setItem('user-language', lang.id);
          await AsyncStorage.setItem('has-selected-language', 'true');
        },
      })).concat([{ text: t('cancel'), style: 'cancel' }] as any),
      { cancelable: true }
    );
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.key === profile?.subscriptionPlan) || SUBSCRIPTION_PLANS[0];
  const clientLimit = profile?.clientLimit || 30;
  const usagePercent = Math.min(100, (clientCount / clientLimit) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t('profile_title')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Tailor'}</Text>
          <Text style={styles.shopName}>{profile?.companyName || profile?.shopName || 'eTailoring'}</Text>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>{t('subscription')}</Text>
            <View style={[styles.planBadge, currentPlan.key !== 'free' && styles.planBadgeActive]}>
              <Text style={[styles.planBadgeText, currentPlan.key !== 'free' && styles.planBadgeTextActive]}>
                {currentPlan.label}
              </Text>
            </View>
          </View>
          
          <Text style={styles.usageText}>
            {t('clients_used', { count: clientCount, limit: clientLimit })}
          </Text>
          
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { width: `${usagePercent}%` },
              usagePercent > 80 && styles.progressWarning,
              usagePercent >= 100 && styles.progressFull,
            ]} />
          </View>

          {usagePercent >= 80 && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF9800" />
              <Text style={styles.warningText}>
                {usagePercent >= 100 ? t('client_limit_reached') : `Almost at limit! ${clientLimit - clientCount} slots remaining.`}
              </Text>
            </View>
          )}

          {/* Upgrade options */}
          <Text style={[styles.cardTitle, { marginTop: 16 }]}>{t('upgrade_subscription')}</Text>
          {SUBSCRIPTION_PLANS.filter(p => p.key !== 'free').map(plan => (
            <View key={plan.key} style={[
              styles.planOption, 
              profile?.subscriptionPlan === plan.key && styles.planOptionActive
            ]}>
              <View>
                <Text style={styles.planName}>{plan.label}</Text>
                <Text style={styles.planLimit}>Up to {plan.limit} clients</Text>
              </View>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
          ))}
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('personal_details')}</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{profile?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{profile?.phone || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="business-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Company / Shop</Text>
              <Text style={styles.value}>{profile?.companyName || profile?.shopName || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings')}</Text>
          <TouchableOpacity style={styles.infoRow} onPress={handleChangeLanguage}>
            <View style={styles.iconCircle}>
              <Ionicons name="language-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('language')}</Text>
              <Text style={styles.value}>
                {i18n.language === 'en' ? 'English' : 
                 i18n.language === 'hi' ? 'Hindi' : 
                 i18n.language === 'mr' ? 'Marathi' : 
                 i18n.language === 'gu' ? 'Gujarati' : 
                 i18n.language === 'ta' ? 'Tamil' : i18n.language}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('app_info')}</Text>
          <View style={styles.simpleRow}>
            <Text style={styles.label}>{t('version')}</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={[styles.simpleRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>{t('powered_by')}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient 
            colors={[Colors.error, '#B91C1C']} 
            style={styles.logoutBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)',
    backgroundColor: 'rgba(163, 177, 138, 0.2)',
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  avatarText: { color: Colors.primary, fontSize: 36, fontFamily: Typography.fashionBold },
  name: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  shopName: { fontSize: 13, color: Colors.textLight, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  subscriptionCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
  planBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  planBadgeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase' },
  planBadgeTextActive: { color: '#FFF' },
  usageText: { fontSize: 14, color: Colors.textDark, fontWeight: '600', marginBottom: 10 },
  progressBar: {
    height: 8, borderRadius: 4, backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden', marginBottom: 12,
  },
  progressFill: {
    height: '100%', borderRadius: 4, backgroundColor: Colors.primary,
  },
  progressWarning: { backgroundColor: '#FF9800' },
  progressFull: { backgroundColor: '#DC2626' },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3E0', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  warningText: { fontSize: 12, color: '#E65100', fontWeight: '600', flex: 1 },
  planOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  planOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  planName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  planLimit: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.03)',
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(163, 177, 138, 0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.2)',
  },
  simpleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.03)',
  },
  label: { fontSize: 11, color: Colors.textLight, marginBottom: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 16, fontWeight: '600', color: Colors.textDark },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 16, gap: 10, marginTop: 10, shadowColor: Colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3
  },
  logoutText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
});
