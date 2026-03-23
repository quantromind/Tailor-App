import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { createCustomer, createCustomDesign, createOrder } from '../../../api';
export default function BillPreviewScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { billData } = route.params;

  const measurementsEntries = billData.measurements ? Object.entries(billData.measurements).filter(([_, v]) => v !== '') : [];
  const measurementsHtml = measurementsEntries.length > 0 
    ? `<div class="section"><div class="st">${t('precision_measurements')}</div><div class="meas-grid">` + 
      measurementsEntries.map(([k, v]) => '<div class="meas-item"><span class="meas-val">' + v + '"</span><span class="meas-lab">' + k + '</span></div>').join('') + 
      '</div></div>'
    : '';

  const receiptHtml = '<html><head><style>' +
    'body { font-family: "Helvetica"; padding: 40px; background-color: #F8F9F5; color: #344E41; }' +
    '.container { max-width: 600px; margin: auto; border: 1px solid #EDF1E4; border-radius: 20px; padding: 30px; background-color: #FFFFFF; box-shadow: 0 4px 20px rgba(52, 78, 65, 0.05); }' +
    'h1 { text-align: center; color: #344E41; margin-bottom: 4px; font-weight: 800; letter-spacing: 2px; }' +
    '.sub { text-align: center; color: #6B705C; margin-bottom: 30px; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; font-weight: 700; }' +
    '.section { border-bottom: 1px solid #EDF1E4; padding: 15px 0; }' +
    '.st { font-weight: 800; color: #344E41; margin-bottom: 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px; }' +
    '.row { display: flex; justify-content: space-between; padding: 8px 0; }' +
    '.l { color: #6B705C; font-size: 14px; }' +
    '.v { font-weight: 700; color: #344E41; font-size: 14px; }' +
    '.total-row { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 2px dashed #A3B18A; }' +
    '.total-label { font-size: 20px; font-weight: 800; }' +
    '.total-val { font-size: 26px; font-weight: 900; color: #344E41; }' +
    '.meas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }' +
    '.meas-item { background: #F8F9F5; padding: 10px; border-radius: 12px; text-align: center; border: 1px solid #EDF1E4; }' +
    '.meas-val { font-weight: 800; font-size: 14px; display: block; color: #344E41; }' +
    '.meas-lab { font-size: 9px; color: #6B705C; text-transform: uppercase; margin-top: 2px; font-weight: 700; }' +
    '</style></head><body>' +
    '<div class="container">' +
    '<h1>' + t('receipt_header') + '</h1><div class="sub">' + t('receipt_sub') + '</div>' +
    '<div class="section"><div class="st">' + t('client_info') + '</div>' +
    '<div class="row"><span class="l">' + t('full_name_label').replace(' *', '') + '</span><span class="v">' + billData.clientName + '</span></div>' +
    '<div class="row"><span class="l">' + t('phone_placeholder') + '</span><span class="v">' + billData.phone + '</span></div>' +
    '</div>' +
    '<div class="section"><div class="st">' + t('order_info') + '</div>' +
    '<div class="row"><span class="l">' + t('category') + '</span><span class="v">' + billData.item + '</span></div>' +
    '<div class="row"><span class="l">' + t('handover_date') + '</span><span class="v">' + billData.deliveryDate + '</span></div>' +
    '</div>' + measurementsHtml +
    '<div class="total-row"><span class="total-label">' + t('grand_total') + '</span><span class="total-val">₹' + billData.price + '</span></div>' +
    '</div></body></html>';

  const handleSave = async () => {
    try {
      // 1. Save or get Customer
      const customerRes = await createCustomer({ 
        name: billData.clientName, 
        phone: billData.phone 
      });

      // 2. Save or get Design
      const category = billData.gender === 'male' ? 'mens' : (billData.gender === 'female' ? 'womens' : 'kids');
      const designRes = await createCustomDesign({ 
        name: billData.item, 
        category 
      });

      // 3. Format measurements
      const formattedMeasurements = Object.entries(billData.measurements || {})
        .filter(([_, v]) => v !== '')
        .map(([k, v]: any) => ({ name: k, value: v.toString() }));

      // 4. Create Order in Backend
      const orderRes = await createOrder({
        customer: customerRes._id,
        design: designRes._id,
        measurements: formattedMeasurements,
        notes: `Delivery Date: ${billData.deliveryDate}, Price: ₹${billData.price}`
      });

      // 5. Also save locally for backward compatibility with UI
      const newOrder = { 
        ...billData, 
        gender: billData.gender || (billData.type === 'Pant' || billData.type === 'Shirt' ? 'male' : 'female'),
        id: orderRes._id, 
        createdAt: new Date().toISOString(), 
        status: 'Pending' 
      };
      
      const existing = await AsyncStorage.getItem('@orders');
      const history = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('@orders', JSON.stringify([newOrder, ...history]));
      
      Alert.alert(t('success'), t('save_success'), [{ text: 'OK', onPress: () => navigation.navigate('MainTabs') }]);
    } catch (e: any) { 
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || t('save_error')); 
    }
  };

  const handleShareWhatsApp = () => {
    const msg = `*${t('receipt_header')}* %0A%0A${t('client_name_placeholder')}: ` + billData.clientName + `%0A${t('category')}: ` + billData.item + `%0A${t('grand_total')}: ₹` + billData.price + `%0A${t('handover_date')}: ` + billData.deliveryDate;
    Linking.openURL('whatsapp://send?text=' + msg).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(`${t('receipt_header')} – ` + billData.clientName);
    const body = encodeURIComponent(`${t('client_name_placeholder')}: ` + billData.clientName + `\n${t('category')}: ` + billData.item + `\n${t('grand_total')}: ₹` + billData.price + `\n${t('handover_date')}: ` + billData.deliveryDate);
    const gmailUrl = 'googlegmail:///co?subject=' + subject + '&body=' + body;
    Linking.openURL(gmailUrl).catch(() => {
      Linking.openURL('https://mail.google.com/mail/?view=cm&su=' + subject + '&body=' + body);
    });
  };

  const handlePrint = async () => {
    try { const { uri } = await Print.printToFileAsync({ html: receiptHtml }); await Print.printAsync({ uri }); } catch (e) { Alert.alert('Error', 'Could not print'); }
  };

  const handleSharePDF = async () => {
    try { const { uri } = await Print.printToFileAsync({ html: receiptHtml }); await Sharing.shareAsync(uri); } catch (e) { Alert.alert('Error', 'Could not share'); }
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
        <Text style={styles.title}>Atelier Design</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.billCard}>
          <Text style={styles.shopTitle}>{t('receipt_header')}</Text>
          <Text style={styles.shopSub}>{t('receipt_sub')}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client_info')}</Text>
            <View style={styles.row}><Text style={styles.label}>{t('full_name_label').replace(' *', '')}</Text><Text style={styles.value}>{billData.clientName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t('phone_placeholder')}</Text><Text style={styles.value}>{billData.phone}</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('order_info')}</Text>
            <View style={styles.row}><Text style={styles.label}>{t('category')}</Text><Text style={styles.value}>{billData.item}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t('handover_date')}</Text><Text style={styles.value}>{billData.deliveryDate}</Text></View>
          </View>

          {billData.measurements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('precision_measurements')}</Text>
              <View style={styles.measGrid}>
                {Object.entries(billData.measurements || {}).filter(([_, v]) => v !== '').map(([k, v]: any) => (
                  <View key={k} style={styles.measItem}>
                    <Text style={styles.measValue}>{v}"</Text>
                    <Text style={styles.measLabel}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('grand_total')}</Text>
            <Text style={styles.totalValue}>₹{billData.price}</Text>
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.actionBtn}>
            <LinearGradient colors={['#344E41', '#1B2621']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>{t('finalize_save')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.shareRow}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={handleShareWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>{t('whatsapp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#EA4335' }]} onPress={handleGmail}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>{t('gmail')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shareRow}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#6B705C' }]} onPress={handleSharePDF}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>{t('share_pdf')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#344E41' }]} onPress={handlePrint}>
              <Ionicons name="print-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>{t('print')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  billCard: { 
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  shopTitle: { fontSize: 24, fontFamily: Typography.fashionBold, color: Colors.textDark, textAlign: 'center', marginBottom: 4 },
  shopSub: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  section: { 
    marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.03)' 
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  value: { fontSize: 14, color: Colors.textDark, fontWeight: '700' },
  measGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measItem: { 
    width: '30%', backgroundColor: Colors.surfaceAlt, padding: 10, borderRadius: 14, 
    borderWidth: 1, borderColor: Colors.border
  },
  measValue: { fontSize: 15, fontWeight: '800', color: Colors.textDark, textAlign: 'center' },
  measLabel: { fontSize: 10, color: Colors.textLight, textAlign: 'center', marginTop: 2, textTransform: 'uppercase', fontWeight: '700' },
  totalRow: { 
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, 
    paddingTop: 16, borderTopWidth: 2, borderTopColor: Colors.primary, borderStyle: 'dotted' 
  },
  totalLabel: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  footerActions: { gap: 16 },
  actionBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  actionText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  shareRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8, elevation: 2 },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
});
