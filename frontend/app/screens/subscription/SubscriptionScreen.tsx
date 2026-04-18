import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography } from '../../../src/constants/colors';
import { getPlans, getActiveSubscription, createOrder, verifyPayment } from '../../../api/subscription';
import { openRazorpayCheckout } from '../../../src/utils/razorpay';

const { width } = Dimensions.get('window');

interface Plan {
  id: string;
  name: string;
  price: number;
  clientLimit: number;
  duration: number;
  features: string[];
}

interface ActiveSub {
  hasSubscription: boolean;
  plan: string | null;
  planName: string;
  price: number;
  clientLimit: number;
  clientsUsed: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: string;
}

const PLAN_THEMES: Record<string, {
  gradient: [string, string];
  icon: string;
  badge: string;
  badgeText: string;
  shadow: string;
  iconBg: string;
}> = {
  silver: {
    gradient: ['#C0C0C0', '#8E8E8E'],
    icon: 'shield-outline',
    badge: '#A0A0A0',
    badgeText: '#FFFFFF',
    shadow: '#8E8E8E',
    iconBg: 'rgba(192, 192, 192, 0.2)',
  },
  gold: {
    gradient: ['#FFD700', '#DAA520'],
    icon: 'star-outline',
    badge: '#DAA520',
    badgeText: '#FFFFFF',
    shadow: '#DAA520',
    iconBg: 'rgba(255, 215, 0, 0.2)',
  },
  platinum: {
    gradient: ['#2C2C54', '#474787'],
    icon: 'diamond-outline',
    badge: '#474787',
    badgeText: '#FFFFFF',
    shadow: '#2C2C54',
    iconBg: 'rgba(71, 71, 135, 0.2)',
  },
};

export default function SubscriptionScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnims] = useState([
    new Animated.Value(50),
    new Animated.Value(50),
    new Animated.Value(50),
  ]);

  // Custom modal state for cross-platform confirmation
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    plan: Plan | null;
    title: string;
    message: string;
  }>({ visible: false, plan: null, title: '', message: '' });

  // Result alert modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      slideAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        getPlans(),
        getActiveSubscription(),
      ]);
      setPlans(plansRes.data);
      setActiveSub(subRes.data);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: Plan) => {
    const isUpgrade = activeSub?.hasSubscription;
    const title = isUpgrade ? 'Upgrade Plan' : 'Subscribe';
    const msg = isUpgrade
      ? `Upgrade to ${plan.name} plan for ₹${plan.price}/month?\nYour current plan will be replaced.`
      : `Subscribe to ${plan.name} plan for ₹${plan.price}/month?`;

    // Use custom modal for cross-platform compatibility (Alert.alert callbacks don't work on web)
    setConfirmModal({
      visible: true,
      plan,
      title,
      message: msg,
    });
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      setAlertModal({ visible: true, title, message });
    } else {
      Alert.alert(title, message);
    }
  };

  const processRazorpayPayment = async (plan: Plan) => {
    setSubscribing(plan.id);
    try {
      console.log('[Subscription] Creating order for plan:', plan.id);

      // Step 1: Create Razorpay order on backend
      const orderRes = await createOrder(plan.id);
      const { orderId, amount, currency, key } = orderRes.data;

      console.log('[Subscription] Order created:', orderId, 'Amount:', amount);

      // Get user profile for prefill
      const profileData = await AsyncStorage.getItem('@tailor_profile');
      const profile = profileData ? JSON.parse(profileData) : {};

      // Step 2: Open Razorpay checkout
      const options = {
        description: `${plan.name} Plan - eTailoring Subscription`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: currency,
        key: key,
        amount: amount,
        name: 'eTailoring',
        order_id: orderId,
        prefill: {
          contact: profile?.phone || '',
          name: profile?.name || '',
        },
        theme: { color: '#344E41' },
      };

      console.log('[Subscription] Opening Razorpay checkout...');
      const paymentData = await openRazorpayCheckout(options);

      console.log('[Subscription] Payment received, verifying...');

      // Step 3: Verify payment on backend
      const verifyRes = await verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        plan: plan.id,
      });

      showAlert('Payment Successful! 🎉', verifyRes.data.message);
      await loadData(); // Refresh data
    } catch (err: any) {
      console.error('Razorpay error:', err);
      console.error('Error response:', err?.response?.status, err?.response?.data);
      if (err?.code === 'PAYMENT_CANCELLED' || err?.description?.includes('cancelled')) {
        showAlert('Cancelled', 'Payment was cancelled.');
      } else {
        const errorMsg = err?.response?.data?.error 
          || err?.response?.data?.message 
          || err?.description 
          || 'Something went wrong. Please try again.';
        showAlert(
          'Payment Failed',
          errorMsg
        );
      }
    } finally {
      setSubscribing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Choose the perfect plan for your business
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Subscription Banner */}
        {activeSub?.hasSubscription && (
          <Animated.View style={[styles.activeBanner, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={
                PLAN_THEMES[activeSub.plan || 'silver']?.gradient || ['#C0C0C0', '#8E8E8E']
              }
              style={styles.activeBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activeBannerHeader}>
                <View style={styles.activePlanBadge}>
                  <Ionicons
                    name={
                      (PLAN_THEMES[activeSub.plan || 'silver']?.icon as any) ||
                      'shield-outline'
                    }
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.activePlanBadgeText}>
                    {activeSub.planName} Plan
                  </Text>
                </View>
                <View style={styles.activeStatusBadge}>
                  <View style={styles.activeStatusDot} />
                  <Text style={styles.activeStatusText}>Active</Text>
                </View>
              </View>

              <View style={styles.activeStatsRow}>
                <View style={styles.activeStat}>
                  <Text style={styles.activeStatValue}>
                    {activeSub.clientsUsed}
                  </Text>
                  <Text style={styles.activeStatLabel}>
                    /{activeSub.clientLimit === -1 ? '∞' : activeSub.clientLimit} Clients
                  </Text>
                </View>
                <View style={styles.activeStatDivider} />
                <View style={styles.activeStat}>
                  <Text style={styles.activeStatValue}>
                    {activeSub.daysRemaining}
                  </Text>
                  <Text style={styles.activeStatLabel}>Days Left</Text>
                </View>
                <View style={styles.activeStatDivider} />
                <View style={styles.activeStat}>
                  <Text style={styles.activeStatValue}>
                    ₹{activeSub.price}
                  </Text>
                  <Text style={styles.activeStatLabel}>/month</Text>
                </View>
              </View>

              {/* Progress bar for client usage */}
              {activeSub.clientLimit !== -1 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(
                            100,
                            (activeSub.clientsUsed / activeSub.clientLimit) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(
                      (activeSub.clientsUsed / activeSub.clientLimit) * 100
                    )}
                    % used
                  </Text>
                </View>
              )}

              <View style={styles.activeDateRow}>
                <Text style={styles.activeDateText}>
                  Valid: {formatDate(activeSub.startDate)} — {formatDate(activeSub.endDate)}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Section Title */}
        <Text style={styles.sectionTitle}>
          {activeSub?.hasSubscription ? 'Upgrade Your Plan' : 'Choose a Plan'}
        </Text>

        {/* Plan Cards */}
        {plans.map((plan, index) => {
          const theme = PLAN_THEMES[plan.id] || PLAN_THEMES.silver;
          const isCurrentPlan = activeSub?.plan === plan.id;
          const isPopular = plan.id === 'gold';

          return (
            <Animated.View
              key={plan.id}
              style={[
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY:
                        slideAnims[index] || new Animated.Value(0),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.planCardActive,
                  {
                    shadowColor: theme.shadow,
                  },
                ]}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <LinearGradient
                      colors={theme.gradient}
                      style={styles.popularBadgeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="trending-up" size={12} color="#fff" />
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.planIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={theme.icon as any}
                      size={28}
                      color="#fff"
                    />
                  </LinearGradient>
                  <View style={styles.planHeaderText}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planClientLimit}>
                      {plan.clientLimit === -1
                        ? 'Unlimited Clients'
                        : `Up to ${plan.clientLimit} Clients`}
                    </Text>
                  </View>
                </View>

                {/* Price Section */}
                <View style={styles.priceSection}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.priceValue}>{plan.price}</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, fIndex) => (
                    <View key={fIndex} style={styles.featureRow}>
                      <View
                        style={[
                          styles.featureCheck,
                          { backgroundColor: theme.iconBg },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={theme.gradient[1]}
                        />
                      </View>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                {isCurrentPlan ? (
                  <View style={styles.currentPlanButton}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.success}
                    />
                    <Text style={styles.currentPlanText}>Current Plan</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.id}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.gradient}
                      style={styles.subscribeButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {subscribing === plan.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.subscribeButtonText}>
                            {activeSub?.hasSubscription
                              ? 'Upgrade Now'
                              : 'Subscribe Now'}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#fff"
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        })}

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Confirmation Modal (works on web + native) ── */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconRow}>
              <LinearGradient
                colors={
                  confirmModal.plan
                    ? PLAN_THEMES[confirmModal.plan.id]?.gradient || ['#C0C0C0', '#8E8E8E']
                    : ['#C0C0C0', '#8E8E8E']
                }
                style={styles.modalIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="card-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
            <Text style={styles.modalMessage}>{confirmModal.message}</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPayBtn}
                onPress={() => {
                  const plan = confirmModal.plan;
                  setConfirmModal((prev) => ({ ...prev, visible: false }));
                  if (plan) {
                    processRazorpayPayment(plan);
                  }
                }}
              >
                <LinearGradient
                  colors={['#344E41', '#588157']}
                  style={styles.modalPayBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <Text style={styles.modalPayText}>Pay Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Alert Modal (result messages on web) ── */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconRow}>
              <View
                style={[
                  styles.modalIconBg,
                  {
                    backgroundColor: alertModal.title.includes('Successful')
                      ? '#4ADE80'
                      : alertModal.title.includes('Cancelled')
                      ? '#FCD34D'
                      : '#F87171',
                  },
                ]}
              >
                <Ionicons
                  name={
                    alertModal.title.includes('Successful')
                      ? 'checkmark-circle'
                      : alertModal.title.includes('Cancelled')
                      ? 'close-circle'
                      : 'alert-circle'
                  }
                  size={32}
                  color="#fff"
                />
              </View>
            </View>
            <Text style={styles.modalTitle}>{alertModal.title}</Text>
            <Text style={styles.modalMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={[styles.modalPayBtn, { flex: 0, minWidth: 120, alignSelf: 'center' }]}
              onPress={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            >
              <LinearGradient
                colors={['#344E41', '#588157']}
                style={styles.modalPayBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalPayText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '600',
  },

  // Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Typography.fashionBold,
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    fontWeight: '500',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Active Subscription Banner
  activeBanner: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  activeBannerGradient: {
    padding: 20,
    borderRadius: 24,
  },
  activeBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  activePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activePlanBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  activeStatusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  activeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeStat: {
    alignItems: 'center',
  },
  activeStatValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  activeStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  activeStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  activeDateRow: {
    alignItems: 'center',
  },
  activeDateText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Section
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.fashionBold,
    color: Colors.textDark,
    marginBottom: 18,
    letterSpacing: -0.3,
  },

  // Plan Cards
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: Colors.success,
  },

  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    zIndex: 1,
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 14,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontFamily: Typography.fashionBold,
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  planClientLimit: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
    marginTop: 2,
  },

  // Price
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.textDark,
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '600',
    marginLeft: 4,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 18,
  },

  // Features
  featuresContainer: {
    marginBottom: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
    flex: 1,
  },

  // Buttons
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(88, 129, 87, 0.1)',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(88, 129, 87, 0.2)',
  },
  currentPlanText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconRow: {
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textLight,
  },
  modalPayBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalPayBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalPayText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
