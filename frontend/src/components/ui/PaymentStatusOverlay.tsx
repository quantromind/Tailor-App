import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../constants/colors';
import { Button } from './Button';

export type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'failed';

interface PaymentStatusOverlayProps {
  status: PaymentStatus;
  planName?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

/**
 * Full-screen modal shown over the Subscription screen while a payment is
 * in flight. Covers: order creation, Razorpay checkout in progress /
 * signature verification, a celebratory success state, and a failure state
 * with a Retry action — satisfying the "show loading / processing /
 * success / failure with retry" requirement without adding new nav routes.
 */
export const PaymentStatusOverlay: React.FC<PaymentStatusOverlayProps> = ({
  status,
  planName,
  errorMessage,
  onRetry,
  onClose,
}) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'success' || status === 'failed') {
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
    }
  }, [status]);

  if (status === 'idle') return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {(status === 'creating' || status === 'processing') && (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.title}>
                {status === 'creating' ? 'Setting up your order…' : 'Verifying your payment…'}
              </Text>
              <Text style={styles.subtitle}>
                {status === 'creating'
                  ? 'Creating a secure Razorpay order.'
                  : "Please don't close the app — this only takes a moment."}
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <Animated.View style={[styles.iconCircle, styles.successCircle, { transform: [{ scale }] }]}>
                <Ionicons name="checkmark" size={40} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.title}>Payment Successful</Text>
              <Text style={styles.subtitle}>
                {planName ? `Your ${planName} plan is now active.` : 'Your subscription is now active.'}
              </Text>
              <Button label="Done" onPress={onClose || (() => {})} style={{ marginTop: 22 }} />
            </>
          )}

          {status === 'failed' && (
            <>
              <Animated.View style={[styles.iconCircle, styles.failCircle, { transform: [{ scale }] }]}>
                <Ionicons name="close" size={40} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.title}>Payment Failed</Text>
              <Text style={styles.subtitle}>{errorMessage || 'Something went wrong. You have not been charged.'}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' }}>
                <View style={{ flex: 1 }}>
                  <Button label="Cancel" variant="outline" onPress={onClose || (() => {})} fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Retry" onPress={onRetry || (() => {})} fullWidth />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 38, 33, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 26,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successCircle: { backgroundColor: Colors.success },
  failCircle: { backgroundColor: Colors.error },
  title: { fontSize: 18, fontFamily: Typography.extraBold, color: Colors.textDark, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 13, fontFamily: Typography.regular, color: Colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 8 },
});

export default PaymentStatusOverlay;
