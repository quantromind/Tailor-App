import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography } from '../../../src/constants/colors';
import { createRazorpayOrder, verifyPayment, activateSubscription } from '../../../api';

const PLANS = [
  { id: '50 Clients', name: '50 Clients Plan', price: 49, durationMonths: 1, desc: 'Manage up to 50 clients per month' },
  { id: '100 Clients', name: '100 Clients Plan', price: 89, durationMonths: 1, desc: 'Manage up to 100 clients per month' },
  { id: '150 Clients', name: '150 Clients Plan', price: 139, durationMonths: 1, desc: 'Manage up to 150 clients per month' },
  { id: '200 Clients', name: '200 Clients Plan', price: 179, durationMonths: 1, desc: 'Manage up to 200 clients per month' },
  { id: 'Unlimited', name: 'Unlimited Plan', price: 299, durationMonths: 1, desc: 'Manage unlimited clients per month' },
];

export default function SubscriptionScreen({ navigation }: any) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Get profile for prefill data
      const profileData = await AsyncStorage.getItem('@tailor_profile');
      const profile = profileData ? JSON.parse(profileData) : {};
      
      // 1. Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(selectedPlan.price);

      // 2. Open Razorpay Checkout
      const options = {
        description: `Subscription for ${selectedPlan.name}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: razorpayOrder.currency,
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        name: 'eTailoring Premium',
        order_id: razorpayOrder.orderId,
        prefill: {
          contact: profile.phone || '',
          name: profile.name || '',
        },
        theme: { color: Colors.primary },
      };

      const paymentResponse = await RazorpayCheckout.open(options);

      // 3. Verify payment on backend
      const verification = await verifyPayment({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (verification.success) {
        // 4. Activate subscription
        await activateSubscription({
          plan: selectedPlan.id,
          durationMonths: selectedPlan.durationMonths,
          paymentId: paymentResponse.razorpay_payment_id
        });

        Alert.alert(
          '🎉 Welcome to Premium!',
          `Your ${selectedPlan.name} has been activated successfully.`,
          [{ text: 'Great', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Payment Verification Failed', 'Please contact support if amount was deducted.');
      }
    } catch (error: any) {
      console.error('[Subscription Error]', error);
      if (error?.code === 'PAYMENT_CANCELLED' || error?.description?.includes('cancelled')) {
        Alert.alert('Payment Cancelled', 'You cancelled the subscription process.');
      } else {
        Alert.alert('Error', error?.description || error?.message || 'Failed to process subscription.');
      }
    } finally {
      setIsProcessing(false);
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
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Ionicons name="diamond" size={64} color={Colors.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSub}>Get access to premium designs, advanced measurement tools, and unlimited clients.</Text>
        </View>

        <Text style={styles.sectionTitle}>Select a Plan</Text>
        
        {PLANS.map((plan) => (
          <TouchableOpacity 
            key={plan.id}
            activeOpacity={0.9}
            onPress={() => setSelectedPlan(plan)}
            style={[styles.planCard, selectedPlan.id === plan.id && styles.planCardSelected]}
          >
            {selectedPlan.id === plan.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
            )}
            
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
            </View>
            <Text style={styles.planDesc}>{plan.desc}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[styles.subscribeBtn, isProcessing && { opacity: 0.7 }]} 
          activeOpacity={0.8}
          onPress={handleSubscribe}
          disabled={isProcessing}
        >
          <LinearGradient 
            colors={['#FFB703', '#FB8500']} 
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Subscribe to {selectedPlan.name} for ₹{selectedPlan.price}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: Typography.fashionBold, color: Colors.textDark },
  content: { padding: 24, paddingBottom: 60 },
  heroSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  heroTitle: { fontSize: 24, fontFamily: Typography.fashionBold, color: Colors.textDark, marginBottom: 8 },
  heroSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  planCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(163, 177, 138, 0.05)' },
  checkmark: { position: 'absolute', top: 16, right: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  planPrice: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  planDesc: { fontSize: 13, color: Colors.textLight, marginTop: 4, paddingRight: 30 },
  subscribeBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  btnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
