import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../src/constants/colors';
import { getOrdersByCustomer, updateCustomer, updateOrder } from '../../../api';

export default function ClientDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { client, customerId, targetOrderId } = route.params;
  const clientId = customerId || client?._id || client?.id;
  const initialName = client?.name || client?.clientName || '';
  const initialPhone = client?.phone || '';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(initialName);
  const [editedPhone, setEditedPhone] = useState(initialPhone);
  const [editedGender, setEditedGender] = useState<'male' | 'female' | 'kids'>(client?.gender || 'male');
  
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'pending' | 'completed'>('date');

  // Order editing state
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [editOrderPrice, setEditOrderPrice] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  useEffect(() => {
    loadClientOrders();
  }, [clientId]);

  const loadClientOrders = async () => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const orders = await getOrdersByCustomer(clientId);
      setClientOrders(orders);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedOrders = [...clientOrders].sort((a: any, b: any) => {
    if (sortBy === 'pending') return a.status === 'pending' ? -1 : 1;
    if (sortBy === 'completed') return a.status === 'completed' ? -1 : 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const getDesignName = (order: any) => order.design?.name || order.item || 'Unknown';
  const getPrice = (order: any) => {
    if (order.price) return order.price.toString();
    const priceMatch = order.notes?.match(/Price:\s?[₹$€]?\s?(\d+)/i);
    return priceMatch ? priceMatch[1] : '0';
  };
  const getDeliveryDate = (order: any) => {
    if (order.deliveryDate) {
      const d = new Date(order.deliveryDate);
      return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    }
    const dateMatch = order.notes?.match(/Delivery Date:\s?([^,]+)/i);
    return dateMatch ? dateMatch[1].trim() : '';
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (!/^\d{10}$/.test(editedPhone)) { Alert.alert('Error', 'Please enter a valid 10-digit phone number'); return; }

    setIsSaving(true);
    try {
      await updateCustomer(clientId, { name: editedName, phone: editedPhone, gender: editedGender });
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditOrderModal = (order: any) => {
    setEditingOrder(order);
    setEditOrderStatus(order.status || 'pending');
    setEditOrderPrice(getPrice(order));
    setEditOrderDate(getDeliveryDate(order));
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    setIsUpdatingOrder(true);
    try {
      const data: any = { status: editOrderStatus };
      
      if (editOrderPrice !== '') data.price = Number(editOrderPrice);
      if (editOrderDate !== '') data.deliveryDate = editOrderDate;

      const updated = await updateOrder(editingOrder._id, data);
      
      setClientOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      setEditingOrder(null);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update order');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleShareWhatsApp = (order: any) => {
    const designName = getDesignName(order);
    const price = getPrice(order);
    const msg = `*${t('receipt_header')} DETAIL*%0A%0A${t('full_name_label').replace(' *', '')}: ${editedName}%0A${t('category')}: ${designName}%0A${t('grand_total')}: ₹${price}%0AStatus: ${order.status}`;
    Linking.openURL(`whatsapp://send?text=${msg}`).catch(() => Alert.alert('Error', t('save_error')));
  };

  const handleSharePDF = async (order: any) => {
    const designName = getDesignName(order);
    const price = getPrice(order);
    const measHtml = order.measurements?.map((m: any) => 
      `<div class="meas-item"><span class="meas-val">${m.value}"</span><span class="meas-lab">${m.name}</span></div>`
    ).join('') || '';

    const html = `<html><head><style>
      body { font-family: Helvetica; padding: 40px; background: #F8F9F5; color: #344E41; }
      .container { max-width: 600px; margin: auto; border: 1px solid #EDF1E4; border-radius: 20px; padding: 30px; background: #FFF; }
      h1 { text-align: center; font-weight: 800; } .sub { text-align: center; color: #6B705C; margin-bottom: 30px; }
      .section { border-bottom: 1px solid #EDF1E4; padding: 15px 0; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; }
      .l { color: #6B705C; } .v { font-weight: 700; }
      .meas-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 10px; }
      .meas-item { background: #F8F9F5; padding: 10px; border-radius: 12px; text-align: center; border: 1px solid #EDF1E4; }
      .meas-val { font-weight: 800; display: block; } .meas-lab { font-size: 9px; color: #6B705C; text-transform: uppercase; }
      .total-row { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 2px dashed #A3B18A; }
    </style></head><body><div class="container">
      <h1>${t('receipt_header')}</h1><div class="sub">${t('receipt_sub')}</div>
      <div class="section"><div class="row"><span class="l">Name</span><span class="v">${editedName}</span></div></div>
      <div class="section"><div class="row"><span class="l">Design</span><span class="v">${designName}</span></div></div>
      ${measHtml ? `<div class="section"><div class="meas-grid">${measHtml}</div></div>` : ''}
      <div class="total-row"><span>Total</span><span style="font-size:22px;font-weight:900">₹${price}</span></div>
    </div></body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert('Error', t('save_error')); }
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
          <Text style={styles.headerTitle}>{t('client_portfolio_title')}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>

        <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} enableOnAndroid={true} keyboardOpeningTime={0}>
          {/* Client info */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('client_personal_data')}</Text>
              <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {isEditing ? 'Save' : 'Edit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{editedName?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <>
                    <TextInput 
                      style={[styles.input, { marginBottom: 8 }]} 
                      value={editedName} 
                      onChangeText={setEditedName} 
                      placeholder="Client full name" 
                    />
                    <TextInput 
                      style={styles.input} 
                      value={editedPhone} 
                      onChangeText={setEditedPhone} 
                      placeholder="10-digit phone number" 
                      keyboardType="phone-pad" 
                      maxLength={10} 
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.name}>{editedName}</Text>
                    <Text style={styles.phone}>{editedPhone || t('no_phone')}</Text>
                    <Text style={[styles.phone, { color: Colors.primary, marginTop: 2 }]}>{(editedGender || '').toUpperCase()}</Text>
                  </>
                )}
              </View>
            </View>

            {isEditing && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionLabel, { fontSize: 11, marginBottom: 10 }]}>{t('gender')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['male', 'female', 'kids'] as const).map(g => (
                    <TouchableOpacity 
                      key={g} 
                      onPress={() => setEditedGender(g)}
                      style={[
                        { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceAlt },
                        editedGender === g && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                      ]}
                    >
                      <Text style={[
                        { fontSize: 12, fontWeight: '700', color: Colors.textLight },
                        editedGender === g && { color: '#FFF' }
                      ]}>{t(`gender_${g}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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
                    {type === 'date' ? 'DATE' : type === 'pending' ? 'PENDING' : 'COMPLETED'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Orders List */}
          <Text style={[styles.sectionLabel, { marginLeft: 20 }]}>{t('customer_orders')} ({clientOrders.length})</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : sortedOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : (
            sortedOrders.map((order: any) => {
              const designName = getDesignName(order);
              const price = getPrice(order);
              const deliveryDate = getDeliveryDate(order);
              const isPending = order.status === 'pending' || order.status === 'in-progress';

              return (
                <View key={order._id} style={[styles.card, targetOrderId === order._id && styles.highlightedCard]}>
                  <View style={styles.orderHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.orderItemName}>{designName}</Text>
                      {targetOrderId === order._id && (
                        <View style={styles.highlightBadge}>
                          <Text style={styles.highlightBadgeText}>{t('requested')}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => openEditOrderModal(order)}>
                      <Ionicons name="pencil" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={[styles.value, { color: Colors.primary, fontWeight: '800' }]}>₹{price}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Status</Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: isPending ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)' }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: isPending ? '#DC2626' : '#16A34A' }
                      ]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  {deliveryDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>{t('handover_date')}</Text>
                      <Text style={styles.value}>{deliveryDate}</Text>
                    </View>
                  )}

                  {/* Measurements */}
                  {order.measurements && order.measurements.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('precision_measurements')}</Text>
                      <View style={styles.measureGrid}>
                        {order.measurements.map((m: any, idx: number) => (
                          <View key={idx} style={styles.measureItem}>
                            <Text style={styles.measureValue}>{m.value}"</Text>
                            <Text style={styles.measureLabel}>{m.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Share for this specific order */}
                  <View style={[styles.shareRow, { marginTop: 16 }]}>
                    <TouchableOpacity style={[styles.shareBtnMini, { backgroundColor: '#25D366' }]} onPress={() => handleShareWhatsApp(order)}>
                      <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shareBtnMini, { backgroundColor: '#6B705C' }]} onPress={() => handleSharePDF(order)}>
                      <Ionicons name="document-text-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </KeyboardAwareScrollView>
      </View>

      {/* Edit Order Modal */}
      <Modal visible={!!editingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Edit Order</Text>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Status</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['pending', 'in-progress', 'completed', 'delivered', 'cancelled'].map(st => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusOptionBtn,
                    editOrderStatus === st && styles.statusOptionBtnActive
                  ]}
                  onPress={() => setEditOrderStatus(st)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    editOrderStatus === st && styles.statusOptionTextActive
                  ]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Amount / Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={editOrderPrice}
              onChangeText={setEditOrderPrice}
              keyboardType="numeric"
              placeholder="e.g. 1500"
            />

            <Text style={styles.inputLabel}>Handover Date</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 24 }]}
              value={editOrderDate}
              onChangeText={setEditOrderDate}
              placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleUpdateOrder}
              disabled={isUpdatingOrder}
            >
              {isUpdatingOrder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
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
  highlightedCard: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: 'rgba(163, 177, 138, 0.05)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderItemName: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  highlightBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  highlightBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  sortCard: { marginHorizontal: 20, marginBottom: 20 },
  sortLabel: { fontSize: 11, fontWeight: '800', color: Colors.textLight, marginBottom: 10, letterSpacing: 1 },
  sortRow: { flexDirection: 'row', gap: 10 },
  sortBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortBtnText: { fontSize: 10, fontWeight: '800', color: Colors.textLight },
  sortBtnTextActive: { color: '#fff' },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareBtnMini: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  measureItem: {
    width: '30%', backgroundColor: 'rgba(163, 177, 138, 0.05)', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border
  },
  measureLabel: { fontSize: 10, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: '700' },
  measureValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 16 },
  emptyText: { color: Colors.textLight, fontSize: 16, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.textDark, fontWeight: '600',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 40
  },
  modalTitle: { fontSize: 20, fontFamily: Typography.fashionBold, color: Colors.textDark },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  modalInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.textDark, fontWeight: '600'
  },
  statusOptionBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface
  },
  statusOptionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusOptionText: { fontSize: 11, fontWeight: '800', color: Colors.textLight },
  statusOptionTextActive: { color: '#FFF' },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 16, alignItems: 'center'
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
