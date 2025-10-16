// app/_layout.tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import BannerOffline from '@/components/BannerOffline';
import ApiProvider from '@/providers/api-provider';
import { AuthProvider, useAuth } from '@/providers/auth';

function useAuthGuard() {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isSignedIn && !inAuth) router.replace('/(auth)/login');
    else if (isSignedIn && inAuth) router.replace('/(admin)');
  }, [segments, isSignedIn, isLoading]);
}

function RootStack() {
  useAuthGuard();
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ApiProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BannerOffline />
          <RootStack />
          <StatusBar style="auto" />
        </ThemeProvider>
      </ApiProvider>
    </AuthProvider>
  );
}
