import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography } from '../../../src/constants/colors';
import { useTranslation } from 'react-i18next';
import { getSubscriptionStatus } from '../../../api';
import { AnimatedPressable } from '../../../src/components/ui/AnimatedPressable';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

export default function ProfileScreen({ navigation, onLogout }: any) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      fetchSubscription();
    }, [])
  );

  const fetchSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubStatus(status);
    } catch (e) {
      console.log('Failed to fetch subscription', e);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem('@tailor_profile');
      if (data) setProfile(JSON.parse(data));
    } catch (e) {
      console.error(e);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t('profile_title')}</Text>
        <Text style={styles.headerSubtitle}>Manage your account & shop settings</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Artisan Tailor'}</Text>
          <Text style={styles.shopName}>{profile?.companyName || profile?.shopName || 'Organic Atelier Boutique'}</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>

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

        {/* Subscription Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={styles.cardTitle}>Subscription</Text>
            {subStatus?.isActive ? (
              <StatusBadge label="Active" tone="gold" />
            ) : (
              <StatusBadge label="Free Plan" tone="neutral" />
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Clients Used</Text>
              <Text style={styles.value}>
                {subStatus?.currentClients || 0} / {subStatus?.maxClients === 1000000 ? 'Unlimited' : (subStatus?.maxClients || 30)}
              </Text>
            </View>
          </View>

          {subStatus?.isActive && subStatus?.endDate && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Valid Until</Text>
                <Text style={styles.value}>{new Date(subStatus.endDate).toLocaleDateString()}</Text>
              </View>
            </View>
          )}

          {!subStatus?.isActive && (
            <AnimatedPressable 
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Subscription')}
              scaleTo={0.97}
            >
              <LinearGradient 
                colors={Colors.gradientGold as [string, string]} 
                style={styles.upgradeGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={18} color="#FFF" />
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              </LinearGradient>
            </AnimatedPressable>
          )}
        </View>

        {/* Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <AnimatedPressable style={styles.infoRow} onPress={handleChangeLanguage} scaleTo={0.98}>
            <View style={styles.iconCircle}>
              <Ionicons name="language-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Language</Text>
              <Text style={styles.value}>
                {i18n.language === 'en' ? 'English' : 
                 i18n.language === 'hi' ? 'Hindi' : 
                 i18n.language === 'mr' ? 'Marathi' : 
                 i18n.language === 'gu' ? 'Gujarati' : 
                 i18n.language === 'ta' ? 'Tamil' : i18n.language}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </AnimatedPressable>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Info</Text>
          <View style={styles.simpleRow}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </View>

        {/* Logout */}
        <AnimatedPressable onPress={handleLogout} scaleTo={0.97}>
          <LinearGradient 
            colors={[Colors.error, '#8C2C2C']} 
            style={styles.logoutBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </LinearGradient>
        </AnimatedPressable>
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
  headerSubtitle: { fontSize: 12, fontFamily: Typography.semiBold, color: Colors.textLight, marginTop: 4 },
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
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.5 },
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
  badgeActive: { backgroundColor: 'rgba(255, 183, 3, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFB703' },
  badgeTextActive: { color: '#FB8500', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  badgeFree: { backgroundColor: 'rgba(107, 112, 92, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeTextFree: { color: Colors.textLight, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  upgradeBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  upgradeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  upgradeText: { color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
