/**
 * authEvents.ts
 * Lightweight event bus for auth state changes.
 * The API interceptor emits AUTH_LOGOUT when a 401 is received;
 * RootNavigator listens and transitions to the login screen immediately.
 */
import { DeviceEventEmitter } from 'react-native';

export const AUTH_LOGOUT_EVENT = 'AUTH_LOGOUT';

export const emitLogout = () => {
  DeviceEventEmitter.emit(AUTH_LOGOUT_EVENT);
};

export const addLogoutListener = (callback: () => void) => {
  return DeviceEventEmitter.addListener(AUTH_LOGOUT_EVENT, callback);
};
