import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { createCustomer, createCustomDesign, createOrder } from '../../../api';

export default function BillPreviewScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { billData } = route.params;

  const [price, setPrice] = React.useState(billData.price ? billData.price.toString() : '0');
  const [advancePayment, setAdvancePayment] = React.useState('0');
  const [deliveryDate, setDeliveryDate] = React.useState(billData.deliveryDate || '');
  const [tailorProfile, setTailorProfile] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  // base64 versions of images for HTML embedding
  const [logoBase64, setLogoBase64] = React.useState<string | null>(null);
  const [designImageBase64, setDesignImageBase64] = React.useState<string | null>(null);
  const [isImagesReady, setIsImagesReady] = React.useState(false);

  // Generate bill date/time
  const now = new Date();
  const billDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const billTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Calculate due amount
  const totalPrice = Number(price) || 0;
  const advance = Number(advancePayment) || 0;
  const dueAmount = Math.max(0, totalPrice - advance);

  // Load tailor profile for logo
  React.useEffect(() => {
    AsyncStorage.getItem('@tailor_profile').then(data => {
      if (data) setTailorProfile(JSON.parse(data));
    });
  }, []);

  // Convert local file URIs to base64 for HTML embedding
  const uriToBase64 = async (uri: string): Promise<string | null> => {
    try {
      if (uri.startsWith('data:')) return uri; // already base64
      if (uri.startsWith('http')) return uri;   // remote URL, use directly
      // Local file URI — read as base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      // Detect extension for mime type
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      return `data:${mime};base64,${base64.trim()}`;
    } catch (e) {
      console.error('[BillPreview] Failed to convert image to base64:', e);
      return null;
    }
  };

  React.useEffect(() => {
    const convertAll = async () => {
      const logoUri = tailorProfile?.logo || null;
      const designUri = billData.designImage || null;

      const [lB64, dB64] = await Promise.all([
        logoUri ? uriToBase64(logoUri) : Promise.resolve(null),
        designUri ? uriToBase64(designUri) : Promise.resolve(null)
      ]);

      setLogoBase64(lB64);
      setDesignImageBase64(dB64);
      setIsImagesReady(true);
    };
    convertAll();
  }, [tailorProfile, billData.designImage]);

  const shopName = tailorProfile?.companyName || 'TailorBook';
  const designImageUri: string | null = billData.designImage || null;

  const measurementsEntries = billData.measurements ? Object.entries(billData.measurements).filter(([_, v]) => v !== '') : [];
  const measurementsHtml = measurementsEntries.length > 0 
    ? `<div class="section"><div class="st">${t('precision_measurements')}</div><div class="meas-grid">` + 
      measurementsEntries.map(([k, v]) => '<div class="meas-item"><span class="meas-val">' + v + '"</span><span class="meas-lab">' + k + '</span></div>').join('') + 
      '</div></div>'
    : '';

  // Use base64 for HTML so images render in PDF/print (local URIs are blocked by HTML renderer)
  const logoHtml = logoBase64
    ? `<div style="text-align:center;margin-bottom:12px"><img src="${logoBase64}" style="max-height:80px;max-width:200px;object-fit:contain;border-radius:8px" /></div>`
    : '';

  const [isPreparingPDF, setIsPreparingPDF] = React.useState(false);

  const generateHtml = async () => {
    // Use the already converted base64 strings from state
    const lB64 = logoBase64;
    const dB64 = designImageBase64;

    const lHtml = lB64
      ? `<div style="text-align:center;margin-bottom:12px"><img src="${lB64}" width="200" style="max-height:80px;object-fit:contain;border-radius:8px" /></div>`
      : '';
    
    const mEntries = billData.measurements ? Object.entries(billData.measurements).filter(([_, v]) => v !== '') : [];
    const mHtml = mEntries.length > 0 
      ? `<div class="section"><div class="st">${t('precision_measurements')}</div><div class="meas-grid">` + 
        mEntries.map(([k, v]) => '<div class="meas-item"><span class="meas-val">' + v + '"</span><span class="meas-lab">' + k + '</span></div>').join('') + 
        '</div></div>'
      : '';

    return '<html><head><style>' +
      'body { font-family: "Helvetica"; padding: 40px; background-color: #F8F9F5; color: #344E41; }' +
      '.container { max-width: 600px; margin: auto; border: 1px solid #EDF1E4; border-radius: 20px; padding: 30px; background-color: #FFFFFF; box-shadow: 0 4px 20px rgba(52, 78, 65, 0.05); }' +
      'h1 { text-align: center; color: #344E41; margin-bottom: 4px; font-weight: 800; letter-spacing: 2px; }' +
      '.sub { text-align: center; color: #6B705C; margin-bottom: 20px; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; font-weight: 700; }' +
      '.bill-meta { text-align: center; color: #6B705C; font-size: 12px; margin-bottom: 20px; }' +
      '.section { border-bottom: 1px solid #EDF1E4; padding: 15px 0; }' +
      '.st { font-weight: 800; color: #344E41; margin-bottom: 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px; }' +
      '.row { display: flex; justify-content: space-between; padding: 8px 0; }' +
      '.l { color: #6B705C; font-size: 14px; }' +
      '.v { font-weight: 700; color: #344E41; font-size: 14px; }' +
      '.total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #A3B18A; }' +
      '.total-label { font-size: 18px; font-weight: 800; }' +
      '.total-val { font-size: 24px; font-weight: 900; color: #344E41; }' +
      '.payment-row { display: flex; justify-content: space-between; padding: 6px 0; }' +
      '.advance { color: #16A34A; font-weight: 700; }' +
      '.due { color: #DC2626; font-weight: 800; font-size: 18px; }' +
      '.meas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }' +
      '.meas-item { background: #F8F9F5; padding: 10px; border-radius: 12px; text-align: center; border: 1px solid #EDF1E4; }' +
      '.meas-val { font-weight: 800; font-size: 14px; display: block; color: #344E41; }' +
      '.meas-lab { font-size: 9px; color: #6B705C; text-transform: uppercase; margin-top: 2px; font-weight: 700; }' +
      '.design-img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px; margin-top: 10px; }' +
      '</style></head><body>' +
      '<div class="container">' +
      lHtml +
      '<h1>' + shopName + '</h1><div class="sub">' + t('receipt_sub') + '</div>' +
      '<div class="bill-meta">' + t('bill_date') + ': ' + billDate + ' | ' + t('bill_time') + ': ' + billTime + '</div>' +
      '<div class="section"><div class="st">' + t('client_info') + '</div>' +
      '<div class="row"><span class="l">' + t('full_name_label').replace(' *', '') + '</span><span class="v">' + billData.clientName + '</span></div>' +
      '<div class="row"><span class="l">' + t('phone_placeholder') + '</span><span class="v">' + billData.phone + '</span></div>' +
      '</div>' +
      '<div class="section"><div class="st">' + t('order_info') + '</div>' +
      '<div class="row"><span class="l">' + t('category') + '</span><span class="v">' + billData.item + '</span></div>' +
      '<div class="row"><span class="l">' + t('handover_date') + '</span><span class="v">' + deliveryDate + '</span></div>' +
      '</div>' + mHtml +
      (dB64 ? '<div class="section"><div class="st">Sample Image</div><img src="' + dB64 + '" class="design-img" width="100%" /></div>' : '') +
      '<div class="total-row"><span class="total-label">' + t('grand_total') + '</span><span class="total-val">₹' + price + '</span></div>' +
      (advance > 0 ? '<div class="payment-row"><span class="l">' + t('advance_payment') + '</span><span class="advance">₹' + advance + '</span></div>' : '') +
      (advance > 0 ? '<div class="payment-row"><span class="l" style="font-weight:800">' + t('due_amount') + '</span><span class="due">₹' + dueAmount + '</span></div>' : '') +
      '</div></body></html>';
  };

  const handlePrint = async () => {
    setIsPreparingPDF(true);
    try { 
      const html = await generateHtml();
      const { uri } = await Print.printToFileAsync({ html }); 
      await Print.printAsync({ uri }); 
    } catch (e) { 
      Alert.alert('Error', 'Could not print'); 
    } finally {
      setIsPreparingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    setIsPreparingPDF(true);
    try { 
      const html = await generateHtml();
      const { uri } = await Print.printToFileAsync({ html }); 
      await Sharing.shareAsync(uri); 
    } catch (e) { 
      Alert.alert('Error', 'Could not share'); 
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const customerRes = await createCustomer({ 
        name: billData.clientName, 
        phone: billData.phone,
        gender: billData.gender || 'male'
      });

      const category = billData.gender === 'male' ? 'mens' : (billData.gender === 'female' ? 'womens' : 'kids');
      const designRes = await createCustomDesign({ 
        name: billData.item, 
        category 
      });

      const formattedMeasurements = Object.entries(billData.measurements || {})
        .filter(([_, v]) => v !== '')
        .map(([k, v]: any) => ({ name: k, value: v.toString() }));

      const orderRes = await createOrder({
        customer: customerRes._id,
        design: designRes._id,
        measurements: formattedMeasurements,
        price: totalPrice,
        advancePayment: advance,
        deliveryDate: deliveryDate || null,
        notes: '',
        image: designImageUri || '',
      });

      const newOrder = { 
        ...billData, 
        price: totalPrice,
        advancePayment: advance,
        deliveryDate: deliveryDate || null,
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
      console.log('--- ORDER FINALIZE ERROR ---');
      if (e.response) {
        console.log('Status Code:', e.response.status);
      }
      const data = e.response?.data;
      if (data?.code === 'NO_SUBSCRIPTION' || data?.code === 'CLIENT_LIMIT_REACHED') {
        const isLimit = data.code === 'CLIENT_LIMIT_REACHED';
        const title = isLimit ? 'Plan Limit Reached' : 'Subscription Required';
        const message = isLimit 
          ? "You have reached the client limit for your current plan. Please upgrade to continue saving new orders."
          : "An active subscription is required to save clients and designs. Choose a plan to continue managing your business.";

        Alert.alert(title, message, [
          { text: 'Later', style: 'cancel' },
          { text: 'View Plans', onPress: () => navigation.navigate('Subscription'), style: 'default' }
        ]);
      } else {
        Alert.alert('Save Error', 'Something went wrong while saving the order. Please check your connection and try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const msg = `*${shopName}*%0A${t('bill_date')}: ${billDate}%0A%0A${t('client_name_placeholder')}: ` + billData.clientName + `%0A${t('category')}: ` + billData.item + `%0A${t('grand_total')}: ₹` + price + (advance > 0 ? `%0A${t('advance_payment')}: ₹${advance}%0A${t('due_amount')}: ₹${dueAmount}` : '') + `%0A${t('handover_date')}: ` + deliveryDate;
    Linking.openURL('whatsapp://send?text=' + msg).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(`${shopName} – Bill – ` + billData.clientName);
    const body = encodeURIComponent(`${t('client_name_placeholder')}: ` + billData.clientName + `\n${t('category')}: ` + billData.item + `\n${t('grand_total')}: ₹` + price + (advance > 0 ? `\n${t('advance_payment')}: ₹${advance}\n${t('due_amount')}: ₹${dueAmount}` : '') + `\n${t('handover_date')}: ` + deliveryDate);
    const gmailUrl = 'googlegmail:///co?subject=' + subject + '&body=' + body;
    Linking.openURL(gmailUrl).catch(() => {
      Linking.openURL('https://mail.google.com/mail/?view=cm&su=' + subject + '&body=' + body);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={Colors.gradientPrimary as [string, string]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('bill_preview_title')}</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.billCard}>
          {/* Company Logo (on-screen) */}
          {logoBase64 ? (
            <Image
              source={{ uri: logoBase64 }}
              style={styles.companyLogoPreview}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.shopTitle}>{shopName}</Text>
          <Text style={styles.shopSub}>{t('receipt_sub')}</Text>

          {/* Image Status Monitor (for user debug) */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            {tailorProfile?.logo && <View style={{ backgroundColor: logoBase64 ? '#E8F5E9' : '#FFEBEE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: logoBase64 ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>Logo: {logoBase64 ? 'Ready' : '...'}</Text>
            </View>}
            {billData.designImage && <View style={{ backgroundColor: designImageBase64 ? '#E8F5E9' : '#FFEBEE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: designImageBase64 ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>Image: {designImageBase64 ? 'Ready' : '...'}</Text>
            </View>}
          </View>

          {/* Bill Date & Time */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
              <Text style={styles.dateTimeText}>{billDate}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textLight} />
              <Text style={styles.dateTimeText}>{billTime}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client_info')}</Text>
            <View style={styles.row}><Text style={styles.label}>{t('full_name_label').replace(' *', '')}</Text><Text style={styles.value}>{billData.clientName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t('phone_placeholder')}</Text><Text style={styles.value}>{billData.phone}</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('order_info')}</Text>
            <View style={styles.row}><Text style={styles.label}>{t('category')}</Text><Text style={styles.value}>{billData.item}</Text></View>
            <View style={[styles.row, { alignItems: 'center' }]}>
              <Text style={styles.label}>{t('handover_date')}</Text>
              <TextInput 
                style={styles.inlineInput} 
                value={deliveryDate} 
                onChangeText={setDeliveryDate} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={Colors.textLight} 
              />
            </View>
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

          {/* Design Reference Image */}
          {designImageUri && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sample Image</Text>
              <Image
                source={{ uri: designImageUri }}
                style={styles.designImagePreview}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Total Amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('grand_total')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.totalValue}>₹</Text>
              <TextInput
                style={[styles.totalValue, { padding: 0, margin: 0, minWidth: 60, textAlign: 'right' }]}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.primary}
              />
            </View>
          </View>

          {/* Advance Payment */}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{t('advance_payment')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.advanceText}>₹</Text>
              <TextInput
                style={[styles.advanceText, { padding: 0, margin: 0, minWidth: 50, textAlign: 'right' }]}
                value={advancePayment}
                onChangeText={setAdvancePayment}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#16A34A"
              />
            </View>
          </View>

          {/* Due Amount */}
          {advance > 0 && (
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { fontWeight: '800' }]}>{t('due_amount')}</Text>
              <Text style={styles.dueText}>₹{dueAmount}</Text>
            </View>
          )}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.actionBtn} disabled={isSaving}>
            <LinearGradient colors={['#344E41', '#1B2621']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionText}>{t('finalize_save')}</Text>
                </>
              )}
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
            <TouchableOpacity 
              style={[styles.shareBtn, { backgroundColor: '#6B705C' }]} 
              onPress={handleSharePDF}
              disabled={isPreparingPDF || !isImagesReady}
            >
              {isPreparingPDF || !isImagesReady ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>{t('share_pdf')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.shareBtn, { backgroundColor: '#344E41' }]} 
              onPress={handlePrint}
              disabled={isPreparingPDF || !isImagesReady}
            >
              {isPreparingPDF || !isImagesReady ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>{t('print')}</Text>
                </>
              )}
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
  shopSub: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  dateTimeRow: { 
    flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)'
  },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTimeText: { fontSize: 12, color: Colors.textLight, fontWeight: '700' },
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, 
    paddingTop: 16, borderTopWidth: 2, borderTopColor: Colors.primary, borderStyle: 'dotted' 
  },
  totalLabel: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  paymentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  advanceText: { fontSize: 16, fontWeight: '700', color: '#16A34A' },
  dueText: { fontSize: 18, fontWeight: '900', color: '#DC2626' },
  footerActions: { gap: 16 },
  actionBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  actionText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  shareRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8, elevation: 2 },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  inlineInput: {
    backgroundColor: Colors.surfaceAlt, 
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 14, color: Colors.textDark, fontWeight: '700',
    minWidth: 120, textAlign: 'right'
  },
  designImagePreview: {
    width: '100%', height: 180, borderRadius: 12, marginTop: 8,
  },
  companyLogoPreview: {
    width: 80, height: 80, alignSelf: 'center', marginBottom: 8, borderRadius: 8,
  },
});
