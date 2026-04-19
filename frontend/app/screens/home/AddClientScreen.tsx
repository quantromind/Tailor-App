import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, Typography } from '../../../src/constants/colors';
import { createCustomer } from '../../../api';

type Gender = 'male' | 'female' | 'kids';

const GENDER_OPTIONS: { key: Gender; icon: string; label: string }[] = [
  { key: 'male', icon: 'male-outline', label: 'gender_male' },
  { key: 'female', icon: 'female-outline', label: 'gender_female' },
  { key: 'kids', icon: 'happy-outline', label: 'gender_kids' },
];

const GENDER_COLORS: Record<Gender, string> = {
  male: '#4A90D9',
  female: '#E91E8C',
  kids: '#FF9800',
};

export default function AddClientScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    if (!/^\d{10}$/.test(phone)) { Alert.alert('Error', t('error_invalid_phone')); return; }
    if (!gender) { Alert.alert('Error', t('select_gender')); return; }

    setLoading(true);
    try {
      const customer = await createCustomer({ name: name.trim(), phone, gender });
      // Navigate directly to the right category
      if (gender === 'male') {
        navigation.navigate('MaleCategory', { client: customer });
      } else if (gender === 'female') {
        navigation.navigate('FemaleCategory', { client: customer });
      } else if (gender === 'kids') {
        navigation.navigate('KidsCategory', { client: customer });
      }
    } catch (e: any) {
      // Log full error details for developers
      console.log('--- CLIENT SAVE ERROR ---');
      console.log('API Endpoint: POST /customers');
      if (e.response) {
        console.log('Status Code:', e.response.status);
        console.log('Response Data:', JSON.stringify(e.response.data, null, 2));
      } else {
        console.error('Error:', e.message);
      }
      console.log('-------------------------');

      const data = e.response?.data;
      
      if (data?.code === 'NO_SUBSCRIPTION' || data?.code === 'CLIENT_LIMIT_REACHED') {
        const isLimit = data.code === 'CLIENT_LIMIT_REACHED';
        const title = isLimit ? 'Plan Limit Reached' : 'Subscription Required';
        const message = isLimit 
          ? "You have reached the client limit for your current plan. Please upgrade to continue adding more clients."
          : "An active subscription is required to add new clients and manage your business. Choose a plan that fits your needs.";

        Alert.alert(
          title,
          message,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'View Plans', 
              onPress: () => navigation.navigate('Subscription'),
              style: 'default'
            }
          ]
        );
      } else {
        // Generic clean message for other errors
        Alert.alert(
          'Could Not Save Client',
          'Something went wrong while saving the client. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>New Client</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('full_name_label')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Client full name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('phone_placeholder')}</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('gender')}</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = gender === opt.key;
              const color = GENDER_COLORS[opt.key];
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.genderCard, isSelected && { borderColor: color, backgroundColor: color + '12' }]}
                  onPress={() => setGender(opt.key)}
                >
                  <Ionicons name={opt.icon as any} size={28} color={isSelected ? color : Colors.textLight} />
                  <Text style={[styles.genderLabel, isSelected && { color }]}>{t(opt.label)}</Text>
                  {isSelected && (
                    <View style={[styles.checkDot, { backgroundColor: color }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={['#344E41', '#588157']}
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="arrow-forward-circle-outline" size={24} color="#FFF" />
                <Text style={styles.saveBtnText}>Save & Continue</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: Typography.fashionBold, color: Colors.textDark },
  content: { padding: 24, gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 16, color: Colors.textDark, fontWeight: '600',
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20, gap: 8, borderRadius: 18,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.surface,
    position: 'relative',
  },
  genderLabel: { fontSize: 13, fontWeight: '700', color: Colors.textLight },
  checkDot: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: { borderRadius: 18, overflow: 'hidden', elevation: 4, marginTop: 8 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
