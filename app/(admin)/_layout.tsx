// app/(admin)/_layout.tsx
import AdminShell from '@/components/admin/AdminSell'; // tu shell
import { useAuth } from '@/providers/auth';
import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="large" />
          <Text style={{ color: '#6b7280' }}>Inicializando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    // 🔒 Si no hay sesión, no pintes nada del admin
    return <Redirect href="/(auth)/auth/login" />;
  }

  return (
    <AdminShell>
      <Slot />
    </AdminShell>
  );
}
