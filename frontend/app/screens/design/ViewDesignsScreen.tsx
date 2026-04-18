import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { getUserDesigns, deleteDesign } from '../../../api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const CATEGORY_LABELS: Record<string, string> = {
  mens: "Men's Wear",
  womens: "Women's Wear",
  kids: "Kids' Wear",
};

const CATEGORY_ICONS: Record<string, string> = {
  mens: 'man-outline',
  womens: 'woman-outline',
  kids: 'happy-outline',
};

export default function ViewDesignsScreen({ navigation }: any) {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadDesigns();
    }, [])
  );

  const loadDesigns = async () => {
    setIsLoading(true);
    try {
      const data = await getUserDesigns();
      setGrouped(data.grouped || {});
    } catch (e) {
      console.error('Failed to load designs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Object.keys(grouped);

  const handleShareWhatsApp = async () => {
    if (!selectedDesign) return;
    
    const msg = `*${selectedDesign.name}*%0A%0A${selectedDesign.description ? selectedDesign.description + '%0A' : ''}Price: ₹${selectedDesign.price || 0}`;
    const plainMsg = `*${selectedDesign.name}*\n\n${selectedDesign.description ? selectedDesign.description + '\n' : ''}Price: ₹${selectedDesign.price || 0}`;

    // First try sharing the image directly
    if (selectedDesign.image) {
      try {
        await Clipboard.setStringAsync(plainMsg);
        
        const base64Data = selectedDesign.image.includes('base64,') 
          ? selectedDesign.image.split('base64,')[1] 
          : selectedDesign.image;
          
        const fileUri = FileSystem.cacheDirectory + `design_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' });
        
        Alert.alert(
          'Caption Copied!',
          'The design details have been copied to your clipboard. Paste them as a caption when WhatsApp opens.',
          [{ 
            text: 'Share Image', 
            onPress: async () => {
              try {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'image/jpeg',
                  dialogTitle: `Share ${selectedDesign.name}`,
                });
              } catch (e) { console.error(e); }
            } 
          }]
        );
        return; // Stop here if image sharing native sheet succeeds
      } catch (error) {
        console.error('Error sharing image:', error);
        // Fallback to text link if throws exception
      }
    }

    // Fallback if no image or filesystem throws error
    Linking.openURL('whatsapp://send?text=' + msg).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
  };

  const handleGmail = () => {
    if (!selectedDesign) return;
    const subject = encodeURIComponent(`Design: ${selectedDesign.name}`);
    const body = encodeURIComponent(`${selectedDesign.name}\n\n${selectedDesign.description ? selectedDesign.description + '\n' : ''}Price: ₹${selectedDesign.price || 0}`);
    const gmailUrl = 'googlegmail:///co?subject=' + subject + '&body=' + body;
    Linking.openURL(gmailUrl).catch(() => {
      Linking.openURL('https://mail.google.com/mail/?view=cm&su=' + subject + '&body=' + body);
    });
  };

  const handleDeleteDesign = async () => {
    if (!selectedDesign || !selectedDesign.isCustom) return;
    Alert.alert(
      'Delete Design',
      'Are you sure you want to delete this design?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDesign(selectedDesign._id);
              setSelectedDesign(null);
              loadDesigns();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to delete design');
            }
          },
        },
      ]
    );
  };

  const handleSharePDF = async () => {
    if (!selectedDesign) return;
    const imgHtml = selectedDesign.image ? `<img src="${selectedDesign.image}" style="max-width:100%; border-radius: 12px; margin-bottom: 20px;" />` : '';
    const html = `<html><head><style>
      body { font-family: Helvetica; padding: 40px; text-align: center; color: #333; }
      h1 { color: #344E41; margin-bottom: 10px; }
      p { color: #666; font-size: 16px; margin-bottom: 20px; }
      .price { font-size: 20px; font-weight: bold; color: #16A34A; }
    </style></head>
    <body>
      <h1>${selectedDesign.name}</h1>
      ${imgHtml}
      <p>${selectedDesign.description || ''}</p>
      <div class="price">Price: ₹${selectedDesign.price || 0}</div>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Could not share PDF');
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
        <Text style={styles.headerTitle}>My Designs</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddDesign')} style={styles.addBtn}>
          <Ionicons name="add-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="color-palette-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No Designs Yet</Text>
          <Text style={styles.emptySub}>Tap + to create your first design</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add Design Button */}
          <TouchableOpacity
            style={styles.newDesignBtn}
            onPress={() => navigation.navigate('AddDesign')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientSecondary as [string, string]}
              style={styles.newDesignGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              <Text style={styles.newDesignText}>Add New Design</Text>
            </LinearGradient>
          </TouchableOpacity>

          {categories.map((category) => (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={(CATEGORY_ICONS[category] || 'shirt-outline') as any}
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>
                  {CATEGORY_LABELS[category] || category.toUpperCase()}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{grouped[category].length}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                {grouped[category].map((design: any) => (
                  <TouchableOpacity key={design._id} style={styles.card} onPress={() => setSelectedDesign(design)} activeOpacity={0.9}>
                    <View style={styles.imageContainer}>
                      {design.image ? (
                        <Image source={{ uri: design.image }} style={styles.image} resizeMode="cover" />
                      ) : (
                        <View style={styles.iconPlaceholder}>
                          <Ionicons name="shirt-outline" size={40} color={Colors.primary} />
                        </View>
                      )}
                      {design.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>CUSTOM</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.labelOverlay}>
                      <Text style={styles.labelText} numberOfLines={1}>{design.name}</Text>
                      <Text style={styles.descText} numberOfLines={1}>₹{design.price || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Design Detail Modal */}
      <Modal visible={!!selectedDesign} transparent animationType="fade" onRequestClose={() => setSelectedDesign(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setSelectedDesign(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close-circle" size={32} color={Colors.textDark} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {selectedDesign?.image ? (
                <Image source={{ uri: selectedDesign.image }} style={styles.modalImage} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                  <Ionicons name="shirt-outline" size={80} color={Colors.primary} />
                </View>
              )}

              <View style={styles.modalInfo}>
                <Text style={styles.modalTitle}>{selectedDesign?.name}</Text>
                {selectedDesign?.description ? (
                  <Text style={styles.modalDesc}>{selectedDesign.description}</Text>
                ) : null}

                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPriceLabel}>Price</Text>
                  <Text style={styles.modalPriceValue}>₹{selectedDesign?.price || 0}</Text>
                </View>

                <Text style={styles.shareLabel}>SHARE DESIGN TO CLIENT</Text>
                <View style={styles.shareRow}>
                  <TouchableOpacity style={[styles.shareBtnModal, { backgroundColor: '#25D366' }]} onPress={handleShareWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.shareBtnModal, { backgroundColor: '#EA4335' }]} onPress={handleGmail}>
                    <Ionicons name="mail-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.shareBtnModal, { backgroundColor: '#6B705C' }]} onPress={handleSharePDF}>
                    <Ionicons name="document-text-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                {selectedDesign?.isCustom && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteDesign}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFF" />
                    <Text style={styles.deleteBtnText}>Delete Design</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)',
  },
  backBtn: { padding: 4 },
  addBtn: {
    padding: 8, borderRadius: 12,
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)'
  },
  headerTitle: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 120 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark },
  emptySub: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  newDesignBtn: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', elevation: 4 },
  newDesignGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  newDesignText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, textTransform: 'uppercase' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 1.5, flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10
  },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: CARD_WIDTH, height: CARD_WIDTH * 1.3,
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  imageContainer: { flex: 1 },
  image: { width: '100%', height: '100%' },
  iconPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
  },
  customBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  customBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  labelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  labelText: { color: Colors.textDark, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { color: Colors.textLight, fontSize: 8, fontWeight: '600', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '90%', backgroundColor: Colors.background, borderRadius: 24, overflow: 'hidden' },
  modalCloseBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16 },
  modalImage: { width: '100%', height: width * 0.8, backgroundColor: Colors.surfaceAlt },
  modalImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  modalInfo: { padding: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: Colors.textLight, marginBottom: 20, lineHeight: 20 },
  modalPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  modalPriceLabel: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase' },
  modalPriceValue: { fontSize: 20, fontWeight: '900', color: '#16A34A' },
  shareLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  shareRow: { flexDirection: 'row', gap: 10 },
  shareBtnModal: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 6 },
  shareBtnTextModal: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 14,
    marginTop: 16,
  },
  deleteBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
