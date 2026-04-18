import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography } from '../../../src/constants/colors';
import { createCustomDesign } from '../../../api';

const CATEGORIES = [
  { key: 'mens', label: "Men's", icon: 'man-outline' },
  { key: 'womens', label: "Women's", icon: 'woman-outline' },
  { key: 'kids', label: "Kids", icon: 'happy-outline' },
];

export default function AddDesignScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('mens');
  const [measurementTag, setMeasurementTag] = useState('');
  const [measurements, setMeasurements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddMeasurement = () => {
    if (measurementTag.trim() !== '') {
      if (!measurements.includes(measurementTag.trim())) {
        setMeasurements([...measurements, measurementTag.trim()]);
      }
      setMeasurementTag('');
    }
  };

  const handleRemoveMeasurement = (item: string) => {
    setMeasurements(measurements.filter(m => m !== item));
  };

  const [tempImage, setTempImage] = useState('');

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Str = asset.base64 || '';
      // Check size — base64 adds ~33% overhead, limit to ~5MB raw
      if (base64Str.length > 7_000_000) {
        Alert.alert('Image Too Large', 'Please select a smaller image or take a new photo with lower resolution.');
        return;
      }
      setTempImage(`data:${asset.mimeType || 'image/jpeg'};base64,${base64Str}`);
    }
  };

  const handleConfirmImage = () => {
    setImage(tempImage);
    setTempImage('');
  };

  const handleCancelImage = () => {
    setTempImage('');
  };

  const handleSaveDesign = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a design name');
      return;
    }
    setLoading(true);
    try {
      console.log('[AddDesign] Saving design:', { name, category, hasImage: !!image, measurements });
      await createCustomDesign({ 
        name, 
        category,
        image: image || undefined, 
        description, 
        measurements,
        price: price ? Number(price) : 0 
      });
      Alert.alert('Success', 'Design saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error('[AddDesign] Save error:', e?.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save design');
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Add Your Design</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} enableOnAndroid={true} keyboardOpeningTime={0}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Details</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Design Name (e.g., Royal Sherwani)" 
            value={name} 
            onChangeText={setName} 
            placeholderTextColor={Colors.textLight} 
          />
          <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Description (Optional)" 
            multiline
            value={description} 
            onChangeText={setDescription} 
            placeholderTextColor={Colors.textLight} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Price (₹) (Optional)" 
            keyboardType="numeric"
            value={price} 
            onChangeText={setPrice} 
            placeholderTextColor={Colors.textLight} 
          />

          {/* Category Picker */}
          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={category === cat.key ? '#FFF' : Colors.textLight} 
                />
                <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image Preview with Done/Cancel or Pick */}
          {tempImage ? (
            <View>
              <View style={styles.imagePickerBtn}>
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: tempImage }} style={styles.previewImage} resizeMode="cover" />
                </View>
              </View>
              <View style={styles.imageActionRow}>
                <TouchableOpacity style={styles.imageCancelBtn} onPress={handleCancelImage}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                  <Text style={styles.imageCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageDoneBtn} onPress={handleConfirmImage}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.imageDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handlePickImage} style={styles.imagePickerBtn} activeOpacity={0.8}>
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage('')}>
                    <Ionicons name="close-circle" size={28} color="#FF6347" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={36} color={Colors.primary} />
                  <Text style={styles.imagePlaceholderText}>Upload Image (Optional)</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Measurements</Text>
          <Text style={styles.instruction}>Add the names of measurements you need for this design (e.g., Chest, Sleeve).</Text>
          
          <View style={styles.addRow}>
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              placeholder="E.g. Shoulder" 
              value={measurementTag} 
              onChangeText={setMeasurementTag} 
              placeholderTextColor={Colors.textLight} 
            />
            <TouchableOpacity onPress={handleAddMeasurement} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {measurements.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveMeasurement(item)}>
                  <Ionicons name="close-circle" size={18} color={Colors.textLight} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={handleSaveDesign} activeOpacity={0.85} style={styles.saveBtn} disabled={loading}>
          <LinearGradient 
            colors={Colors.gradientSecondary as [string, string]} 
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Design'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
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
  title: { fontSize: 24, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
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
  instruction: { fontSize: 12, color: Colors.textLight, marginBottom: 12, lineHeight: 18 },
  input: { 
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, 
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, 
    color: Colors.textDark, marginBottom: 16, fontWeight: '600' 
  },
  categoryLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textLight, 
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
  },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  categoryChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipActive: { 
    backgroundColor: Colors.primary, borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  categoryText: { fontSize: 13, fontWeight: '800', color: Colors.textLight },
  categoryTextActive: { color: '#FFF' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tagText: { color: Colors.textDark, fontSize: 13, fontWeight: '600' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10, elevation: 4 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  imagePickerBtn: { 
    height: 180, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, 
    borderRadius: 14, overflow: 'hidden', marginBottom: 16 
  },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  imagePlaceholderText: { color: Colors.textLight, fontSize: 15, fontWeight: '600' },
  imagePreviewContainer: { flex: 1, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', borderRadius: 14, padding: 2 },
  imageActionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  imageCancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  imageCancelText: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  imageDoneBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6,
    backgroundColor: Colors.primary, elevation: 2,
  },
  imageDoneText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
