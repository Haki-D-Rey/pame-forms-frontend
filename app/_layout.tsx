// app/_layout.tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import BannerOffline from '@/components/BannerOffline';
import { GlobalAlertProvider } from '@/components/globalAlertComponent';
import ApiProvider from '@/providers/api-provider';
import { AuthProvider, useAuth } from '@/providers/auth';
import SessionExpiryProvider from '@/providers/SessionExpiryProvider';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function RootStack() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <BannerOffline />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/** Puerta de autenticación: no navega mientras isLoading=true */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // ⬅️ espera a rehidratar
    console.log('segments - ' + segments + ' | isSignedIn = ' + isSignedIn);
    const inAuth = segments[0] === '(auth)';
    if (!isSignedIn && !inAuth) router.replace('/(auth)/auth/login');
    else if (isSignedIn && inAuth) router.replace('/(admin)/dashboard/home');
  }, [segments, isSignedIn, isLoading, router]);

  if (isLoading) {
    // Pantalla de arranque (evita parpadeo a login)
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="large" />
            <Text style={{ color: '#6b7280' }}>Inicializando…</Text>
          </View>
          <StatusBar style="auto" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GlobalAlertProvider logoDefault={require('@/assets/images/pame-logo-t.png')}>
      <AuthProvider>
        <ApiProvider>
          <SessionExpiryProvider
            thresholdSec={30}
            logo={require('@/assets/images/pame-logo-t.png')}
          >
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <SafeAreaProvider>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                  <BannerOffline />
                  {/* Renderiza el árbol actual; los grupos se encargan de redirigir */}
                  <Slot />
                  <StatusBar style="auto" />
                </SafeAreaView>
              </SafeAreaProvider>
            </ThemeProvider>
          </SessionExpiryProvider>
        </ApiProvider>
      </AuthProvider>
    </GlobalAlertProvider>
  );
}
