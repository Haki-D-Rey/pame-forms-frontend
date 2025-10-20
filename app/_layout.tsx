// app/_layout.tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import BannerOffline from '@/components/BannerOffline';
import { GlobalAlertProvider } from '@/components/globalAlertComponent';
import ApiProvider from '@/providers/api-provider';
import { AuthProvider, useAuth } from '@/providers/auth';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function useAuthGuard() {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log(segments, isSignedIn, isLoading);
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isSignedIn && !inAuth) router.replace('/(auth)/auth/login');
    else if (isSignedIn && inAuth) router.replace('/(admin)/dashboard/home');
  }, [segments, isSignedIn, isLoading]);
}


function RootStack() {
  useAuthGuard();
  return (
    <SafeAreaProvider>
      <GlobalAlertProvider logoDefault={require('@/assets/images/pame-logo-t.png')}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <BannerOffline />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaView>
      </GlobalAlertProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ApiProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootStack />
          <StatusBar style="auto" />
        </ThemeProvider>
      </ApiProvider>
    </AuthProvider>
  );
}
