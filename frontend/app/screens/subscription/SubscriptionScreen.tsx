import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activateSubscription,
  createRazorpayOrder,
  getPlans,
  getSubscriptionStatus,
  Plan,
  reportPaymentFailure,
  SubscriptionStatus,
  verifyPayment,
} from '../../../api';
import { AnimatedPressable } from '../../../src/components/ui/AnimatedPressable';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { PaymentStatus, PaymentStatusOverlay } from '../../../src/components/ui/PaymentStatusOverlay';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ListSkeleton } from '../../../src/components/ui/Skeleton';
import { Colors, Typography } from '../../../src/constants/colors';

const formatLimit = (limit: number) => (limit >= 1000000 ? 'Unlimited' : `${limit}`);

export default function SubscriptionScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string>('');
  // Kept so Retry can re-run the exact same purchase without re-selecting.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(false);
    try {
      const [planList, status] = await Promise.all([getPlans(), getSubscriptionStatus()]);
      setPlans(planList);
      setCurrentStatus(status);
      // Default-select the most popular plan (or the first) if nothing chosen yet.
      setSelectedPlan((prev) => prev || planList.find((p) => p.popular) || planList[0] || null);
    } catch (e) {
      console.error('[Subscription] Failed to load plans', e);
      setPlansError(true);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleContactSales = () => {
    Linking.openURL('mailto:sales@etailoring.app?subject=Unlimited%20Plan%20Enquiry').catch(() =>
      Alert.alert('Contact Sales', 'Please email sales@etailoring.app for a custom quote.')
    );
  };

  const runPurchase = async (plan: Plan) => {
    setPaymentError('');
    setPaymentStatus('creating');
    let orderId: string | undefined;

    try {
      // Get profile for prefill data (nicer Razorpay checkout UX)
      const profileData = await AsyncStorage.getItem('@tailor_profile');
      const profile = profileData ? JSON.parse(profileData) : {};

      // 1. Create a Razorpay order — amount is computed server-side from the plan id
      const razorpayOrder = await createRazorpayOrder(plan.id);
      orderId = razorpayOrder.orderId;
      setPendingOrderId(razorpayOrder.orderId);

      // 2. Open Razorpay Checkout (native module — requires a dev-client/EAS build, not Expo Go)
      const options = {
        description: `Subscription — ${plan.name} Plan`,
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

      let paymentResponse;
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        console.warn('[Subscription] Razorpay native module is not available (running in Expo Go). Falling back to mock checkout.');
        // Simulate network delay for payment gateway
        await new Promise(resolve => setTimeout(resolve, 2000));
        paymentResponse = {
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpay_order_id: razorpayOrder.orderId,
          razorpay_signature: 'mock_signature_bypass',
        };
      } else {
        paymentResponse = await RazorpayCheckout.open(options);
      }

      setPaymentStatus('processing');

      // 3. Verify the payment signature on the backend — never trust the client
      const verification = await verifyPayment({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (!verification.success) {
        setPaymentError('We could not verify this payment. If any amount was deducted, it will be refunded automatically.');
        setPaymentStatus('failed');
        return;
      }

      // 4. Activate the subscription — backend derives plan/amount from the verified payment
      await activateSubscription(razorpayOrder.orderId);

      setPaymentStatus('success');
      loadData(); // refresh current plan status in the background
    } catch (error: any) {
      console.error('[Subscription Payment Error]', error);

      // Log the failed/cancelled attempt for the audit trail.
      if (orderId) {
        reportPaymentFailure({
          razorpay_order_id: orderId,
          reason: error?.description || error?.message || 'Cancelled or failed on client',
        }).catch(() => {});
      }

      if (error?.code === 'PAYMENT_CANCELLED' || error?.description?.toLowerCase?.().includes('cancelled')) {
        setPaymentError('You cancelled the payment. No amount was charged.');
      } else {
        setPaymentError(error?.description || error?.message || 'Something went wrong while processing your payment.');
      }
      setPaymentStatus('failed');
    }
  };

  const handleBuyNow = () => {
    if (!selectedPlan) return;
    if (selectedPlan.contactSales) {
      handleContactSales();
      return;
    }
    runPurchase(selectedPlan);
  };

  const handleRetry = () => {
    if (selectedPlan) runPurchase(selectedPlan);
  };

  const closeOverlay = () => {
    setPaymentStatus('idle');
    setPendingOrderId(null);
    if (paymentStatus === 'success') {
      navigation.goBack();
    }
  };

  const pricing = selectedPlan?.pricing;
  const isCurrentPlan = (plan: Plan) => currentStatus?.isActive && currentStatus?.planId === plan.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Upgrade to Premium" subtitle="Choose the plan that fits your business" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="diamond" size={34} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSub}>Manage more clients, unlock custom designs, and get priority support.</Text>
        </View>

        {currentStatus?.isActive && (
          <View style={styles.currentPlanBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.currentPlanText}>
              You're on the <Text style={{ fontFamily: Typography.bold }}>{currentStatus.plan}</Text> plan
            </Text>
          </View>
        )}

        {currentStatus?.isActive && currentStatus.planId && (
          <>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            {plans
              .filter((p) => p.id === currentStatus.planId)
              .map((plan) => (
                <View key={`current-${plan.id}`} style={[styles.planCard, styles.planCardCurrent]}>
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Active</Text>
                  </View>
                  <View style={styles.planHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planLimit}>Up to {formatLimit(plan.customerLimit)} clients</Text>
                    </View>
                  </View>
                  <Text style={styles.planDesc}>{plan.tagline}</Text>
                  <View style={styles.featuresList}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark" size={14} color={Colors.success} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: currentStatus?.isActive ? 16 : 0 }]}>
          {currentStatus?.isActive ? 'Upgrade Options' : 'Select a Plan'}
        </Text>

        {plansLoading ? (
          <ListSkeleton rows={4} />
        ) : plansError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load plans"
            subtitle="Check your connection and try again."
            actionLabel="Retry"
            onAction={loadData}
          />
        ) : (
          plans
            .filter((plan) => !isCurrentPlan(plan)) // Exclude current plan from upgrades
            .map((plan) => {
            const active = selectedPlan?.id === plan.id;
            return (
              <AnimatedPressable
                key={plan.id}
                scaleTo={0.98}
                onPress={() => setSelectedPlan(plan)}
                style={[styles.planCard, active && styles.planCardSelected]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={11} color="#FFFFFF" />
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planLimit}>Up to {formatLimit(plan.customerLimit)} clients</Text>
                  </View>
                  {active && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    </View>
                  )}
                </View>

                <Text style={styles.planDesc}>{plan.tagline}</Text>

                {plan.contactSales ? (
                  <Text style={styles.contactSalesPrice}>Contact Sales</Text>
                ) : plan.pricing ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>₹{plan.pricing.subtotal}</Text>
                    <Text style={styles.planPriceSuffix}>/month + GST</Text>
                  </View>
                ) : null}

                <View style={styles.featuresList}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark" size={14} color={Colors.success} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </AnimatedPressable>
            );
          })
        )}

        {selectedPlan && !selectedPlan.contactSales && pricing && !isCurrentPlan(selectedPlan) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedPlan.name} Plan</Text>
              <Text style={styles.summaryValue}>₹{pricing.subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({Math.round(pricing.gstRate * 100)}%)</Text>
              <Text style={styles.summaryValue}>₹{pricing.gst}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total Payable</Text>
              <Text style={styles.summaryTotalValue}>₹{pricing.total}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {selectedPlan && !isCurrentPlan(selectedPlan) && (
        <View style={styles.footerContainer}>
          <AnimatedPressable style={styles.subscribeBtn} onPress={handleBuyNow} scaleTo={0.97}>
            <View style={styles.subscribeInner}>
              <Ionicons name={selectedPlan.contactSales ? 'call-outline' : 'flash'} size={18} color="#FFF" />
              <Text style={styles.subscribeText}>
                {selectedPlan.contactSales
                  ? 'Contact Sales'
                  : `Upgrade Now — ₹${selectedPlan.pricing?.total ?? ''}`}
              </Text>
            </View>
          </AnimatedPressable>
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textLight} />
            <Text style={styles.secureText}>Payments secured by Razorpay · signatures verified server-side</Text>
          </View>
        </View>
      )}

      <PaymentStatusOverlay
        status={paymentStatus}
        planName={selectedPlan?.name}
        errorMessage={paymentError}
        onRetry={handleRetry}
        onClose={closeOverlay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 24 },
  footerContainer: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 78, 65, 0.05)',
  },
  heroSection: { alignItems: 'center', marginBottom: 24, marginTop: 6 },
  heroIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  heroTitle: { fontSize: 22, fontFamily: Typography.extraBold, color: Colors.textDark, marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 13, color: Colors.textLight, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12, fontFamily: Typography.regular },
  currentPlanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, padding: 12, borderRadius: 14, marginBottom: 24,
  },
  currentPlanText: { fontSize: 12, color: '#2F5B3B', fontFamily: Typography.semiBold, flex: 1 },
  sectionTitle: { fontSize: 13, fontFamily: Typography.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  planCard: {
    backgroundColor: Colors.surface, borderRadius: 22, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(143, 163, 119, 0.06)' },
  planCardCurrent: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  popularBadge: {
    position: 'absolute', top: -10, left: 18, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  popularBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  currentBadge: {
    position: 'absolute', top: -10, right: 18, backgroundColor: Colors.success,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  currentBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, marginTop: 4 },
  planName: { fontSize: 18, fontFamily: Typography.extraBold, color: Colors.textDark },
  planLimit: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontFamily: Typography.semiBold },
  checkmark: { marginLeft: 8 },
  planDesc: { fontSize: 13, color: Colors.textLight, marginTop: 6, lineHeight: 18, fontFamily: Typography.regular },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14 },
  planPrice: { fontSize: 26, fontFamily: Typography.black, color: Colors.primary },
  planPriceSuffix: { fontSize: 12, color: Colors.textLight, fontFamily: Typography.semiBold },
  contactSalesPrice: { fontSize: 18, fontFamily: Typography.extraBold, color: Colors.gold, marginTop: 14 },
  featuresList: { marginTop: 16, gap: 9 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: Colors.textDark, fontFamily: Typography.medium, flex: 1 },
  summaryCard: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 20, padding: 20, marginTop: 8, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryTitle: { fontSize: 13, fontFamily: Typography.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: Colors.textLight, fontFamily: Typography.medium },
  summaryValue: { fontSize: 13, color: Colors.textDark, fontFamily: Typography.semiBold },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  summaryTotalLabel: { fontSize: 15, color: Colors.textDark, fontFamily: Typography.bold, marginTop: 6 },
  summaryTotalValue: { fontSize: 18, color: Colors.primary, fontFamily: Typography.extraBold, marginTop: 6 },
  subscribeBtn: { borderRadius: 16, overflow: 'hidden' },
  subscribeInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, backgroundColor: Colors.gold, borderRadius: 16,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  subscribeText: { color: '#FFF', fontSize: 15, fontFamily: Typography.bold, letterSpacing: 0.5 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  secureText: { fontSize: 11, color: Colors.textLight, fontFamily: Typography.medium, textAlign: 'center' },
});
