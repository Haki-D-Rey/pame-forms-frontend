// src/lib/dev-host.ts
import { Platform } from 'react-native';
export function getBaseUrl(port = 4000) {
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://10.0.2.2:${port}`;
    return `http://127.0.0.1:${port}`;
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL!;
}