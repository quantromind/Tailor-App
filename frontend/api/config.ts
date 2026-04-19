import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator and web use localhost directly
// For physical devices, use your computer's local IP address
const getBaseUrl = () => {
  // Production URL (Render)
  const productionUrl = 'https://tailor-app-y0lq.onrender.com/api';

  // Production URL override injected via Expo build
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Use production URL if it's a real build or if specified
  if (__DEV__ === false) {
    return productionUrl;
  }

  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special alias to your host loopback interface (127.0.0.1 on your development machine)
    // for Android Emulators. 
    // For physical devices, use your computer's local IP address (currently 192.168.1.12)
    return 'http://192.168.1.12:5000/api';
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();
export const SERVER_URL = BASE_URL.replace('/api', '');

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach token to every request if available
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@auth_token');
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
        // Note: The app state (isLoggedIn) in RootNavigator will need a way to react to this,
        // but for now, clearing the token ensures the next app restart or manual action 
        // will require login.
      }
    } else {
      console.error(`[API Network Error] ${error.config?.url || 'Unknown URL'}`, error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
