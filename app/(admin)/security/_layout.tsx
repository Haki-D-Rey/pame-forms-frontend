// app/(admin)/security/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityLayout() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="users/index" />
        <Stack.Screen name="roles" />
        <Stack.Screen name="permissions" />
      </Stack>

      {/* Overlay de depuración: marco verde alrededor del área del layout */}
      <View pointerEvents="none" style={styles.debugBorder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  debugBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: '#16a34a',     // verde
    borderWidth: 2,              // grosor 2
    borderStyle: 'solid',
    zIndex: 9999,                // asegúralo por encima en Android/iOS
    elevation: 9999,
  },
});
