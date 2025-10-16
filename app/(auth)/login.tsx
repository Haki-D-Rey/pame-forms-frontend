// app/(auth)/login.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
});
type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const muted = useMemo(() => (Platform.OS === 'ios' ? '#8E8E93' : '#9AA0A6'), []);

  const { handleSubmit, setValue, formState: { errors, isSubmitting, isValid } } =
    useForm<LoginForm>({ resolver: zodResolver(LoginSchema), mode: 'onChange' });

  const onSubmit = async (data: LoginForm) => {
    // TODO: integrar API real
    await signIn({ email: data.email, password: data.password });
    router.replace('/(admin)');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <ThemedText style={[styles.title, { color: textColor }]}>Bienvenido</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textColor }]}>Inicia sesión para continuar</ThemedText>

        <View style={styles.form}>
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor={muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
            style={[styles.input, { backgroundColor: '#00000011', color: textColor }]}
          />
          {errors.email && <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>}

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={muted}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onChangeText={(t) => setValue('password', t, { shouldValidate: true })}
            onSubmitEditing={handleSubmit(onSubmit)}
            style={[styles.input, { backgroundColor: '#00000011', color: textColor }]}
          />
          {errors.password && <ThemedText style={styles.errorText}>{errors.password.message}</ThemedText>}

          <Pressable
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: isValid && !isSubmitting ? tint : '#9CA3AF' }]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
          >
            <ThemedText style={styles.primaryButtonText}>
              {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
            <ThemedText style={[styles.linkText, { color: textColor }]}>¿No tienes cuenta? Regístrate</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 24, opacity: 0.9 },
  form: { width: '100%' },
  input: { height: 48, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8 },
  primaryButton: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  linkRow: { marginTop: 12, alignItems: 'center' },
  linkText: { textDecorationLine: 'underline' },
  errorText: { color: '#ef4444', marginBottom: 8 },
});
