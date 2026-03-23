import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';

export default function ClientDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { client, targetOrderId } = route.params;
  const initialName = client.name || client.clientName;
  const initialPhone = client.phone || '';

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [editedName, setEditedName] = useState(initialName);
  const [editedPhone, setEditedPhone] = useState(initialPhone);
  const [measurements, setMeasurements] = useState<Record<string, string>>(client.measurements || {});
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'pending' | 'completed'>('date');

  const receiptHtml = `
    <html><head><style>
      body { font-family: 'Helvetica'; padding: 40px; background-color: #F8F9F5; color: #344E41; }
      .container { max-width: 600px; margin: auto; border: 1px solid #EDF1E4; border-radius: 20px; padding: 30px; background-color: #FFFFFF; box-shadow: 0 4px 20px rgba(52, 78, 65, 0.05); }
      h1 { text-align: center; color: #344E41; margin-bottom: 4px; font-weight: 800; letter-spacing: 2px; }
      .sub { text-align: center; color: #6B705C; margin-bottom: 30px; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; font-weight: 700; }
      .section { border-bottom: 1px solid #EDF1E4; padding: 15px 0; }
      .st { font-weight: 800; color: #344E41; margin-bottom: 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; }
      .l { color: #6B705C; font-size: 14px; }
      .v { font-weight: 700; color: #344E41; font-size: 14px; }
      .total-row { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 2px dashed #A3B18A; }
      .total-label { font-size: 20px; font-weight: 800; }
      .total-val { font-size: 26px; font-weight: 900; color: #344E41; }
      .meas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
      .meas-item { background: #F8F9F5; padding: 10px; border-radius: 12px; text-align: center; border: 1px solid #EDF1E4; }
      .meas-val { font-weight: 800; font-size: 14px; display: block; color: #344E41; }
      .meas-lab { font-size: 9px; color: #6B705C; text-transform: uppercase; margin-top: 2px; font-weight: 700; }
    </style></head><body>
      <div class="container">
        <h1>${t('receipt_header')}</h1><div class="sub">${t('receipt_sub')}</div>
        <div class="section"><div class="st">${t('client_info')}</div>
          <div class="row"><span class="l">${t('full_name_label').replace(' *', '')}</span><span class="v">${editedName}</span></div>
          <div class="row"><span class="l">${t('phone_placeholder')}</span><span class="v">${editedPhone || '—'}</span></div>
        </div>
        <div class="section"><div class="st">${t('order_info')}</div>
          <div class="row"><span class="l">${t('category')}</span><span class="v">${client.item}</span></div>
          <div class="row"><span class="l">Status</span><span class="v">${client.status === 'Completed' ? t('filter_completed') : t('filter_pending')}</span></div>
          ${client.deliveryDate ? `<div class="row"><span class="l">${t('handover_date')}</span><span class="v">${client.deliveryDate}</span></div>` : ''}
        </div>
        ${Object.keys(measurements).length > 0 ? `
          <div class="section"><div class="st">${t('precision_measurements')}</div>
            <div class="meas-grid">
              ${Object.entries(measurements).filter(([_, v]) => v !== '').map(([k, v]) => `
                <div class="meas-item"><span class="meas-val">${v}"</span><span class="meas-lab">${k}</span></div>
              `).join('')}
            </div>
          </div>` : ''}
        <div class="total-row"><span class="total-label">${t('grand_total')}</span><span class="total-val">₹${client.price}</span></div>
      </div>
    </body></html>`;

  React.useEffect(() => {
    loadClientOrders();
  }, [editedPhone]);

  const loadClientOrders = async () => {
    const data = await AsyncStorage.getItem('@orders');
    if (data) {
      const orders = JSON.parse(data);
      const filtered = orders.filter((o: any) => o.phone === initialPhone || o.phone === editedPhone);
      setClientOrders(filtered);
    }
  };

  const handleSavePersonalData = async () => {
    try {
      const existing = await AsyncStorage.getItem('@orders');
      if (existing) {
        const orders = JSON.parse(existing);
        const updatedOrders = orders.map((o: any) => {
          if (o.phone === initialPhone) {
            return { ...o, name: editedName, clientName: editedName, phone: editedPhone };
          }
          return o;
        });
        await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
        Alert.alert(t('success'), t('save_success'));
        loadClientOrders();
      }
      setIsEditingPersonal(false);
    } catch (e) {
      Alert.alert(t('error_failed_save'), t('save_error'));
    }
  };

  const sortedOrders = [...clientOrders].sort((a, b) => {
    if (sortBy === 'pending') return a.status === 'Pending' ? -1 : 1;
    if (sortBy === 'completed') return a.status === 'Completed' ? -1 : 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleShareWhatsApp = (order: any) => {
    const msg = `*${t('receipt_header')} DETAIL*%0A%0A${t('full_name_label').replace(' *', '')}: ${editedName}%0A${t('category')}: ${order.item}%0A${t('grand_total')}: ₹${order.price}%0A${t('handover_date')}: ${order.deliveryDate || '—'}%0AStatus: ${order.status === 'Completed' ? t('filter_completed') : t('filter_pending')}`;
    Linking.openURL(`whatsapp://send?text=${msg}`).catch(() => Alert.alert('Error', t('save_error')));
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(`${t('receipt_header')} DETAIL – ${editedName}`);
    const body = encodeURIComponent(`${t('full_name_label').replace(' *', '')}: ${editedName}\n${t('category')}: ${client.item}\n${t('grand_total')}: ₹${client.price}\n${t('handover_date')}: ${client.deliveryDate || '—'}`);
    const gmailUrl = `googlegmail:///co?subject=${subject}&body=${body}`;
    Linking.openURL(gmailUrl).catch(() => {
      Linking.openURL(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`);
    });
  };

  const handlePrint = async () => {
    try { const { uri } = await Print.printToFileAsync({ html: receiptHtml }); await Print.printAsync({ uri }); } catch (e) { Alert.alert('Error', t('save_error')); }
  };

  const handleSharePDF = async () => {
    try { const { uri } = await Print.printToFileAsync({ html: receiptHtml }); await Sharing.shareAsync(uri); } catch (e) { Alert.alert('Error', t('save_error')); }
  };

  const handleSaveMeasurements = async () => {
    try {
      const existing = await AsyncStorage.getItem('@orders');
      if (existing) {
        const orders = JSON.parse(existing);
        const updatedOrders = orders.map((o: any) => {
          if (o.id === client.id) return { ...o, measurements };
          return o;
        });
        await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
        Alert.alert(t('success'), t('save_success'));
      }
      setIsEditing(false);
    } catch (e) {
      Alert.alert(t('error_failed_save'), t('save_error'));
    }
  };

  const measurementEntries = Object.entries(measurements);

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
          <Text style={styles.headerTitle}>{t('client_portfolio_title')}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>

        <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} enableOnAndroid={true} keyboardOpeningTime={0}>
          {/* Client info */}
          <View style={styles.card}>
            <View style={styles.measureHeader}>
              <Text style={styles.sectionLabel}>{t('client_personal_data')}</Text>
              {isEditingPersonal ? (
                <TouchableOpacity onPress={handleSavePersonalData} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingPersonal(true)} style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                  <Text style={styles.editBtnText}>{t('edit')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{editedName?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                {isEditingPersonal ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder={t('client_name_placeholder')}
                    />
                    <TextInput
                      style={styles.editInput}
                      value={editedPhone}
                      onChangeText={setEditedPhone}
                      placeholder={t('phone_placeholder')}
                      keyboardType="phone-pad"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.name}>{editedName}</Text>
                    <Text style={styles.phone}>{editedPhone || t('no_phone')}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Sort Selector */}
          <View style={styles.sortCard}>
            <Text style={styles.sortLabel}>{t('sort_by')}</Text>
            <View style={styles.sortRow}>
              {(['date', 'pending', 'completed'] as const).map((type) => (
                <TouchableOpacity 
                  key={type} 
                  onPress={() => setSortBy(type)}
                  style={[styles.sortBtn, sortBy === type && styles.sortBtnActive]}
                >
                  <Text style={[styles.sortBtnText, sortBy === type && styles.sortBtnTextActive]}>
                    {type === 'date' ? t('tab_history').toUpperCase() : type === 'pending' ? t('filter_pending').toUpperCase() : t('filter_completed').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Orders List */}
          <Text style={[styles.sectionLabel, { marginLeft: 20 }]}>{t('customer_orders')} ({clientOrders.length})</Text>
          {sortedOrders.map((order) => (
            <View key={order.id} style={[styles.card, targetOrderId === order.id && styles.highlightedCard]}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderItemName}>{order.item}</Text>
                {targetOrderId === order.id && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightBadgeText}>{t('requested')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Price</Text>
                <Text style={[styles.value, { color: Colors.primary, fontWeight: '800' }]}>₹{order.price}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: order.status === 'Completed' ? Colors.success + '15' : 'rgba(163, 177, 138, 0.2)' }]}>
                  <Text style={[styles.statusText, { color: order.status === 'Completed' ? Colors.success : Colors.primary }]}>{order.status === 'Completed' ? t('filter_completed') : t('filter_pending')}</Text>
                </View>
              </View>
              {order.deliveryDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t('handover_date')}</Text>
                  <Text style={styles.value}>{order.deliveryDate}</Text>
                </View>
              )}

              {/* Share for this specific order */}
              <View style={[styles.shareRow, { marginTop: 16 }]}>
                <TouchableOpacity style={[styles.shareBtnMini, { backgroundColor: '#25D366' }]} onPress={() => handleShareWhatsApp(order)}>
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtnMini, { backgroundColor: '#6B705C' }]} onPress={() => handleSharePDF()}>
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Measurements */}
          {measurementEntries.length > 0 && (
            <View style={styles.card}>
              <View style={styles.measureHeader}>
                <Text style={styles.sectionLabel}>{t('precision_measurements')}</Text>
                {isEditing ? (
                  <TouchableOpacity onPress={handleSaveMeasurements} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>{t('save')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                    <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                    <Text style={styles.editBtnText}>{t('edit')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.measureGrid}>
                {measurementEntries.map(([key, val]) => (
                  <View key={key} style={styles.measureItem}>
                    <Text style={styles.measureLabel}>{key}</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.measureInput}
                        value={val as string}
                        onChangeText={(text) => setMeasurements(prev => ({ ...prev, [key]: text }))}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={Colors.textLight}
                      />
                    ) : (
                      <Text style={styles.measureValue}>{val as string || '—'}{val ? '"' : ''}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Share actions */}
          {!isEditing && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>{t('share_pdf')}</Text>
              <View style={styles.shareRow}>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => handleShareWhatsApp(client)}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" /><Text style={styles.shareBtnText}>{t('whatsapp')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#EA4335' }]} onPress={handleGmail}>
                  <Ionicons name="mail-outline" size={20} color="#fff" /><Text style={styles.shareBtnText}>{t('gmail')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.shareRow}>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#6B705C' }]} onPress={handleSharePDF}>
                  <Ionicons name="document-text-outline" size={20} color="#fff" /><Text style={styles.shareBtnText}>{t('share_pdf')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#344E41' }]} onPress={handlePrint}>
                  <Ionicons name="print-outline" size={20} color="#fff" /><Text style={styles.shareBtnText}>{t('print')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  headerTitle: { fontSize: 26, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(163, 177, 138, 0.15)',
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)'
  },
  avatarText: { color: Colors.primary, fontSize: 28, fontFamily: Typography.fashionBold },
  name: { fontSize: 24, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  phone: { fontSize: 13, color: Colors.textLight, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.03)'
  },
  label: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  measureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(163, 177, 138, 0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.2)'
  },
  editBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  saveBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  measureItem: {
    width: '30%', backgroundColor: 'rgba(163, 177, 138, 0.05)', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border
  },
  measureLabel: { fontSize: 10, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: '700' },
  measureValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  measureInput: {
    fontSize: 18, fontWeight: '800', color: Colors.primary, textAlign: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.primary, width: '100%', paddingVertical: 2
  },
  shareRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 10, elevation: 2
  },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  highlightedCard: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: 'rgba(163, 177, 138, 0.05)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderItemName: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  highlightBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  highlightBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  editInput: { borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 8, paddingVertical: 4, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  sortCard: { marginHorizontal: 20, marginBottom: 20 },
  sortLabel: { fontSize: 11, fontWeight: '800', color: Colors.textLight, marginBottom: 10, letterSpacing: 1 },
  sortRow: { flexDirection: 'row', gap: 10 },
  sortBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortBtnText: { fontSize: 10, fontWeight: '800', color: Colors.textLight },
  sortBtnTextActive: { color: '#fff' },
  shareBtnMini: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 2 },
});
