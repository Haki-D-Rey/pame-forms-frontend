// app/(admin)/index.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth';
import { Pressable } from 'react-native';

export default function AdminHome() {
  const { signOut } = useAuth();
  return (
    <ThemedView style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <ThemedText style={{ fontSize: 22, marginBottom: 12 }}>Panel Admin</ThemedText>
      <Pressable onPress={signOut} style={{ padding: 12, backgroundColor: '#e11d48', borderRadius: 8 }}>
        <ThemedText style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Cerrar sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}
