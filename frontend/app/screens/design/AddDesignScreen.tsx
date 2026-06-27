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

export default function AddDesignScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
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

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const handleSaveDesign = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a design name');
      return;
    }
    setLoading(true);
    try {
      await createCustomDesign({ 
        name, 
        category: 'mens', // default to mens for now, user can choose later or it can be generic
        image, 
        description, 
        measurements 
      });
      Alert.alert('Success', 'Design saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      console.error(e);
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
});
