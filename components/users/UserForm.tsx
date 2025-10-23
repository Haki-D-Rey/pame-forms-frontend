// components/users/UserForm.tsx
import { api } from '@/lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export type UserPayload = {
  email: string;
  password?: string;   // opcional en edición
  status: boolean;
};

type Props = {
  mode: 'create' | 'edit';
  userId?: number;
  initial?: UserPayload;
  onSuccess?: () => void;
};

export default function UserForm({ mode, userId, initial, onSuccess }: Props) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState<string>('');
  const [status, setStatus] = useState<boolean>(initial?.status ?? true);
  const [saving, setSaving] = useState(false);

  // Si estamos en edición y no nos pasaron initial, cargamos
  useEffect(() => {
    let isMounted = true;
    const fetchOne = async () => {
      if (mode === 'edit' && userId && !initial) {
        try {
          const res = await api.get(`/api/v1/admin/user/${userId}`);
          if (!isMounted) return;
          const u = res.data?.data ?? res.data;
          setEmail(u.email ?? '');
          setStatus(!!u.status);
        } catch (e: any) {
          Alert.alert('Error', e?.response?.data?.message || 'No se pudo cargar el usuario');
        }
      }
    };
    fetchOne();
    return () => { isMounted = false; };
  }, [mode, userId, initial]);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Validación', 'El email es obligatorio');
      return;
    }
    if (mode === 'create' && (!password || password.length < 6)) {
      Alert.alert('Validación', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        await api.post('/api/v1/admin/user/', { email, password, status, role: 'UserStandard' });
      } else {
        const body: UserPayload = { email, status };
        if (password) body.password = password; // sólo si quiere cambiarla
        await api.put(`/api/v1/admin/user/${userId}`, body);
      }
      onSuccess?.();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Email */}
      <View style={styles.row}>
        <MaterialCommunityIcons name="email-outline" size={18} color="#6b7280" />
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      {/* Password (opcional en edición) */}
      <View style={styles.row}>
        <MaterialCommunityIcons name="lock-outline" size={18} color="#6b7280" />
        <TextInput
          placeholder={mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>

      {/* Estado */}
      <View style={styles.row}>
        <MaterialCommunityIcons name="account-check-outline" size={18} color="#6b7280" />
        <View style={[styles.pickerWrap, Platform.OS === 'android' && { paddingVertical: 0 }]}>
          <Picker
            selectedValue={status ? 'true' : 'false'}
            onValueChange={(v) => setStatus(v === 'true')}
            mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
          >
            <Picker.Item label="Activo" value="true" />
            <Picker.Item label="Inactivo" value="false" />
          </Picker>
        </View>
      </View>

      {/* Guardar */}
      <Pressable
        onPress={onSubmit}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveBtn,
          saving && { opacity: 0.6 },
          pressed && { opacity: 0.9 },
        ]}
      >
        <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
        <Text style={styles.saveText}>{saving ? 'Guardando…' : (mode === 'create' ? 'Crear' : 'Guardar')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 12,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    color: '#111827',
  },
  pickerWrap: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  saveBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
