import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator and web use localhost directly
// For physical devices, use your computer's local IP address
const getBaseUrl = () => {
  // Production URL override injected via Expo build
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // Development mode (running via npx expo start)
    if (Platform.OS === 'android') {
      return 'http://192.168.1.31:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  // Production mode (APK / AAB builds)
  return 'https://tailor-app-3ole.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
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

      // Handle 401 Unauthorized - Token might be expired or invalid
      if (error.response.status === 401) {
        console.warn('[AUTH] 401 Unauthorized detected. Clearing auth data.');
        await Promise.all([
          AsyncStorage.removeItem('@auth_token'),
          AsyncStorage.removeItem('@tailor_profile')
        ]);
      }
    } else {
      console.error(`[API Network Error] ${error.config?.url || 'Unknown URL'}`, error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
