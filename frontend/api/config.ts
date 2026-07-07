import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { emitLogout } from '../src/utils/authEvents';

// Dynamically resolve the dev machine IP from Expo's manifest so the URL
// stays correct even when your router assigns a new IP.
const getDevHost = (): string => {
  // expo-constants exposes the Metro server host in multiple ways depending
  // on the SDK version.
  const manifest = Constants.expoConfig || (Constants as any).manifest2 || (Constants as any).manifest;
  const debuggerHost: string | undefined =
    manifest?.hostUri ||
    manifest?.debuggerHost ||
    (Constants as any).manifest2?.launchAsset?.url;

  if (debuggerHost) {
    // hostUri looks like "192.168.x.x:8081" — we only need the IP part
    return debuggerHost.split(':')[0];
  }
  // Fallback: last-known good IP
  return '192.168.1.6';
};

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      const host = getDevHost();
      return `http://${host}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // Production mode (APK / AAB builds)
  return 'https://tailor-app-3ole.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// Attach token to every request if available
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@auth_token');
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log(`[API Request] No token found for ${config.url}`);
  }
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error(`[API Response Error] ${error.response.status} ${error.config.url}`, error.response.data);

      // Handle 401 Unauthorized - Token is expired or invalid.
      // Clear stored credentials and signal the navigator to go to Login.
      if (error.response.status === 401) {
        console.warn('[AUTH] 401 Unauthorized — clearing auth data and signalling logout.');
        await Promise.all([
          AsyncStorage.removeItem('@auth_token'),
          AsyncStorage.removeItem('@tailor_profile'),
        ]);
        emitLogout(); // ← RootNavigator listens for this and sets isLoggedIn(false)
      }
    } else {
      console.error(`[API Network Error] ${error.config?.url || 'Unknown URL'}`, error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
