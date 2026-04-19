import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { useTranslation } from 'react-i18next';
import { API } from '../../../api';

export default function ProfileScreen({ navigation, onLogout }: any) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [clientCount, setClientCount] = useState(0);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await API.get('/auth/profile');
      const data = response.data;
      setProfile(data);
      setClientCount(data.clientCount || 0);
      await AsyncStorage.setItem('@tailor_profile', JSON.stringify({
        name: data.name,
        phone: data.phone,
        companyName: data.companyName,
        logo: data.logo || '',
        userId: data._id,
        clientLimit: data.clientLimit,
        subscriptionPlan: data.subscriptionPlan,
      }));
    } catch (e) {
      const localData = await AsyncStorage.getItem('@tailor_profile');
      if (localData) setProfile(JSON.parse(localData));
    }
  };

  const openEditModal = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditCompany(profile?.companyName || profile?.shopName || '');
    setEditLogo(profile?.logo || null);
    setEditModal(true);
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to upload your logo.');
      return;
    }

    if (Platform.OS === 'android') {
      Alert.alert(
        'Quick Guide',
        'After selecting and cropping your image, look for the checkmark (✓) at the top right to save.',
        [{ text: 'Got it', onPress: () => startPicker() }]
      );
    } else {
      startPicker();
    }
  };

  const startPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Balanced quality
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      setEditLogo(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    if (editPhone && !/^\d{10}$/.test(editPhone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: editName.trim(),
        companyName: editCompany.trim(),
      };
      if (editPhone) payload.phone = editPhone;
      if (editLogo) payload.logo = editLogo;

      const response = await API.put('/auth/profile', payload);
      const data = response.data;

      await AsyncStorage.setItem('@tailor_profile', JSON.stringify({
        name: data.name,
        phone: data.phone,
        companyName: data.companyName,
        logo: data.logo || editLogo || '',
        userId: data.userId,
        clientLimit: data.clientLimit,
        subscriptionPlan: data.subscriptionPlan,
      }));

      setProfile((prev: any) => ({ ...prev, ...data, logo: data.logo || editLogo }));
      setEditModal(false);
      Alert.alert('Saved!', 'Your profile has been updated successfully.');
    } catch (e: any) {
      console.log('--- PROFILE SAVE ERROR ---');
      if (e.response) {
        console.log('Status:', e.response.status);
        console.log('Data:', JSON.stringify(e.response.data, null, 2));
      } else {
        console.error(e.message);
      }
      console.log('--------------------------');
      Alert.alert('Could Not Save', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
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

  const logoUri: string | null = profile?.logo || null;
  const initials = profile?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t('profile_title')}</Text>
        <TouchableOpacity onPress={openEditModal} style={styles.editHeaderBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar / Logo */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={openEditModal} activeOpacity={0.85}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.name || 'Tailor'}</Text>
          <Text style={styles.shopName}>{profile?.companyName || profile?.shopName || 'TailorBook'}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{t('personal_details')}</Text>
            <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

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

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
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
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.cardTitle}>Subscription</Text>
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.25)' }]}>
              <Ionicons name="diamond-outline" size={18} color="#DAA520" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Current Plan</Text>
              <Text style={styles.value}>View & Manage Plans</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </View>
        </TouchableOpacity>

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
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.qmLogo}
              resizeMode="contain"
            />
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

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Logo Upload */}
              <Text style={styles.fieldLabel}>Company Logo</Text>
              <TouchableOpacity onPress={pickLogo} style={styles.logoPickerBtn} activeOpacity={0.8}>
                {editLogo ? (
                  <Image source={{ uri: editLogo }} style={styles.logoPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.logoPickerPlaceholder}>
                    <Ionicons name="storefront-outline" size={36} color={Colors.textLight} />
                    <Text style={styles.logoPickerText}>Upload Company Logo</Text>
                    <Text style={styles.logoPickerSub}>Appears on printed receipts</Text>
                  </View>
                )}
              </TouchableOpacity>
              {editLogo && (
                <TouchableOpacity onPress={() => setEditLogo(null)} style={styles.removeLogoBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  <Text style={styles.removeLogoText}>Remove Logo</Text>
                </TouchableOpacity>
              )}

              {/* Name */}
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textLight}
              />

              {/* Phone */}
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit number"
                placeholderTextColor={Colors.textLight}
              />

              {/* Company */}
              <Text style={styles.fieldLabel}>Company / Shop Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editCompany}
                onChangeText={setEditCompany}
                placeholder="Your shop or company name"
                placeholderTextColor={Colors.textLight}
              />

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#344E41', '#588157']}
                  style={styles.saveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24, paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  headerTitle: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  editHeaderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28, marginTop: 10 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)',
    backgroundColor: 'rgba(163, 177, 138, 0.2)',
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  logoImage: {
    width: 90, height: 90, borderRadius: 45, marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(52, 78, 65, 0.2)',
  },
  avatarText: { color: Colors.primary, fontSize: 36, fontFamily: Typography.fashionBold },
  editAvatarBadge: {
    position: 'absolute', bottom: 18, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  shopName: { fontSize: 13, color: Colors.textLight, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

  // Cards
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  editBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
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

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 16, gap: 10, marginTop: 10,
    shadowColor: Colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3
  },
  logoutText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Typography.fashionBold, color: Colors.textDark },

  // Logo picker inside modal
  logoPickerBtn: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    marginBottom: 8,
  },
  logoPickerPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 8, backgroundColor: Colors.surfaceAlt },
  logoPickerText: { fontSize: 14, fontWeight: '700', color: Colors.textLight },
  logoPickerSub: { fontSize: 11, color: Colors.textLight },
  logoPreview: { width: '100%', height: 140 },
  removeLogoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'center' },
  removeLogoText: { fontSize: 13, fontWeight: '700', color: Colors.error },

  // Fields inside modal
  fieldLabel: { fontSize: 11, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  fieldInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.textDark, fontWeight: '600',
  },

  // Save button
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 28, marginBottom: 8, elevation: 4 },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  // Quantromind logo
  qmLogo: { width: 32, height: 32 },
});
