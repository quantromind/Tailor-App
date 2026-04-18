import { Platform } from 'react-native';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  image?: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Cross-platform Razorpay checkout.
 * - Web: Uses Razorpay JS SDK (https://checkout.razorpay.com/v1/checkout.js)
 * - Native: Uses react-native-razorpay (requires dev build, not Expo Go)
 */
export const openRazorpayCheckout = (options: RazorpayOptions): Promise<RazorpayResponse> => {
  if (Platform.OS === 'web') {
    return openRazorpayWeb(options);
  } else {
    return openRazorpayNative(options);
  }
};

// ── Web: Load Razorpay JS SDK and open checkout ──
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

function openRazorpayWeb(options: RazorpayOptions): Promise<RazorpayResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadRazorpayScript();

      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay SDK not available');
      }

      const rzp = new RazorpayConstructor({
        ...options,
        handler: function (response: RazorpayResponse) {
          resolve(response);
        },
        modal: {
          ondismiss: function () {
            reject({ code: 'PAYMENT_CANCELLED', description: 'Payment was cancelled by user' });
          },
        },
      });

      rzp.on('payment.failed', function (response: any) {
        reject({
          code: 'PAYMENT_FAILED',
          description: response?.error?.description || 'Payment failed',
          reason: response?.error?.reason,
        });
      });

      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Native: Use react-native-razorpay (requires dev build) ──
async function openRazorpayNative(options: RazorpayOptions): Promise<RazorpayResponse> {
  try {
    const RazorpayCheckout = require('react-native-razorpay').default;
    const result = await RazorpayCheckout.open(options);
    return result;
  } catch (err: any) {
    // If native module is not available (Expo Go), throw a clear error
    if (err?.message?.includes('Cannot find') || err?.message?.includes('null')) {
      throw {
        code: 'NATIVE_MODULE_UNAVAILABLE',
        description: 'Razorpay native module is not available. Please use a development build (npx expo run:android) instead of Expo Go.',
      };
    }
    throw err;
  }
}
