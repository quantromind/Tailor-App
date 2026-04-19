import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MeasurementInput } from '../../../src/components/MeasurementInput';
import { Colors, Typography } from '../../../src/constants/colors';
import { calculatePrice } from '../../../src/utils/priceCalculator';
import { getLastMeasurements } from '../../../api';

export default function PantMeasurementScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const clientData = route.params?.client;
  const item = route.params?.item || { name: 'Pant', type: 'Pant' };

  const [clientName, setClientName] = useState(clientData?.name || '');
  const [phone, setPhone] = useState(clientData?.phone || '');
  const [gender, setGender] = useState<'male' | 'female' | 'kids'>(clientData?.gender || 'male');
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    length: clientData?.measurements?.length || '',
    waist: clientData?.measurements?.waist || '',
    hip: clientData?.measurements?.hip || '',
    thigh: clientData?.measurements?.thigh || '',
    knee: clientData?.measurements?.knee || '',
    bottom: clientData?.measurements?.bottom || '',
  });
  const [newMeasName, setNewMeasName] = useState('');
  const [newMeasValue, setNewMeasValue] = useState('');
  const [isExistingMeasurement, setIsExistingMeasurement] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [designImage, setDesignImage] = useState<string | null>(null);

  // Auto-fill from last order for this design type
  useEffect(() => {
    if (clientData?._id) {
      getLastMeasurements(clientData._id, 'Pant', item?.name).then(data => {
        if (data.found && data.measurements?.length > 0) {
          const filled: Record<string, string> = {};
          data.measurements.forEach((m: any) => { filled[m.name] = m.value; });
          setMeasurements(prev => ({ ...prev, ...filled }));
          setIsExistingMeasurement(true);
        }
      }).catch(() => { });
    }
  }, []);
  const [showAddFields, setShowAddFields] = useState(false);

  const updateMeasurement = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleAddNewMeasurement = () => {
    const name = newMeasName.trim();
    const value = newMeasValue.trim();
    if (name && !measurements.hasOwnProperty(name)) {
      setMeasurements(prev => ({ ...prev, [name]: value }));
      setNewMeasName('');
      setNewMeasValue('');
    }
  };

  const pickDesignImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add a design image.');
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
      quality: 0.2, // Balanced quality
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      setDesignImage(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const handleCalculateBill = () => {
    if (!clientName || !phone) { Alert.alert('Error', t('error_fill_fields')); return; }
    if (!/^\d{10}$/.test(phone)) { Alert.alert('Error', 'Please enter a valid 10-digit phone number'); return; }

    const hasAtLeastOneMeasurement = Object.values(measurements).some(val => val && val.trim() !== '');
    if (!hasAtLeastOneMeasurement) {
      Alert.alert('Error', 'Add atleast one field');
      return;
    }

    const price = calculatePrice('Pant');
    navigation.navigate('BillPreview', {
      billData: { 
        clientName, phone, gender,
        item: item.name, type: 'Pant',
        measurements, price,
        deliveryDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString(),
        designImage: designImage || null,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={Colors.gradientPrimary as [string, string]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{item.name} {t('finalize_design')}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>

        <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" enableOnAndroid={true} keyboardOpeningTime={0}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client_details')}</Text>
            <TextInput style={styles.input} placeholder={t('client_name_placeholder')} value={clientName} onChangeText={setClientName} placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} placeholder={t('phone_placeholder')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} placeholderTextColor={Colors.textLight} />
            {/* Gender Radio */}
            <Text style={styles.genderLabel}>{t('gender')}</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'kids'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                    {t(`gender_${g}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.measHeader}>
              <Text style={styles.sectionTitle}>{t('bespoke_measurements')}</Text>
              {isExistingMeasurement && (
                <TouchableOpacity
                  style={[styles.editToggle, isEditing && styles.editToggleActive]}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  <Ionicons name={isEditing ? 'lock-open-outline' : 'pencil-outline'} size={14} color={isEditing ? Colors.primary : Colors.textLight} />
                  <Text style={[styles.editToggleText, isEditing && { color: Colors.primary }]}>
                    {isEditing ? 'Editing' : t('edit_measurements')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {isExistingMeasurement && !isEditing && (
              <View style={styles.autoFillBanner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.autoFillText}>{t('auto_filled')}</Text>
              </View>
            )}
            <View style={styles.inputGrid}>
              {Object.entries(measurements).map(([key, value]) => (
                <View style={styles.gridItem} key={key}>
                  <MeasurementInput
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={value}
                    onChangeText={(v: string) => updateMeasurement(key, v)}
                    editable={!isExistingMeasurement || isEditing}
                  />
                </View>
              ))}
            </View>

            {!showAddFields ? (
              <TouchableOpacity onPress={() => setShowAddFields(true)} style={styles.showAddBtn}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.showAddBtnText}>Add Custom Measurement</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addMeasRow}>
                <TextInput
                  style={[styles.input, { flex: 2, marginBottom: 0 }]}
                  placeholder="Name (e.g. Cuffs)"
                  value={newMeasName}
                  onChangeText={setNewMeasName}
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Value"
                  value={newMeasValue}
                  onChangeText={setNewMeasValue}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <TouchableOpacity onPress={() => { handleAddNewMeasurement(); setShowAddFields(false); }} style={styles.addMeasBtn}>
                  <Ionicons name="checkmark" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Design Reference Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sample Image</Text>
            <TouchableOpacity onPress={pickDesignImage} style={styles.imagePickerBtn} activeOpacity={0.8}>
              {designImage ? (
                <Image source={{ uri: designImage }} style={styles.designImagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textLight} />
                  <Text style={styles.imagePickerText}>Tap to add sample image</Text>
                  <Text style={styles.imagePickerSubText}>(Optional)</Text>
                </View>
              )}
            </TouchableOpacity>
            {designImage && (
              <TouchableOpacity onPress={() => setDesignImage(null)} style={styles.removeImageBtn}>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={handleCalculateBill} activeOpacity={0.85} style={styles.calculateBtn}>
            <LinearGradient
              colors={Colors.gradientSecondary as [string, string]}
              style={styles.calculateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles-outline" size={22} color="#FFFFFF" />
              <Text style={styles.calculateBtnText}>{t('finalize_design')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
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
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)'
  },
  backBtn: { padding: 4 },
  title: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 60 },
  section: {
    marginBottom: 24, backgroundColor: Colors.surface, padding: 22, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: Colors.primary,
    marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5
  },
  input: {
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: Colors.textDark, marginBottom: 16, fontWeight: '600'
  },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridItem: { width: '50%', paddingHorizontal: 5, paddingVertical: 5 },
  showAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(52, 78, 65, 0.05)', borderRadius: 12, alignSelf: 'flex-start' },
  showAddBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  addMeasRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  addMeasBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  calculateBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10, elevation: 4 },
  calculateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  calculateBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  genderLabel: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceAlt },
  genderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderChipText: { fontSize: 13, fontWeight: '700', color: Colors.textLight },
  genderChipTextActive: { color: '#FFF' },
  measHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  editToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  editToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  editToggleText: { fontSize: 12, fontWeight: '700', color: Colors.textLight },
  autoFillBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4CAF5015', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#4CAF5040' },
  autoFillText: { fontSize: 12, fontWeight: '700', color: '#4CAF50', flex: 1 },
  imagePickerBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  imagePickerPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8, backgroundColor: Colors.surfaceAlt },
  imagePickerText: { fontSize: 14, fontWeight: '700', color: Colors.textLight },
  imagePickerSubText: { fontSize: 11, color: Colors.textLight },
  designImagePreview: { width: '100%', height: 200 },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'center' },
  removeImageText: { fontSize: 13, fontWeight: '700', color: Colors.error },
});
