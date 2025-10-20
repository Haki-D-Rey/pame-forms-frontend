// app/(auth)/forgot-password.tsx
import { useGlobalAlert } from '@/components/globalAlertComponent';
import Loader from '@/components/Loader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { z } from 'zod';

const Schema = z.object({ email: z.string().email('Correo inválido') });
type Form = z.infer<typeof Schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();

  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const muted = Platform.OS === 'ios' ? '#8E8E93' : '#9AA0A6';

  const { handleSubmit, setValue, formState: { errors, isValid, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(Schema), mode: 'onChange' });

  const emailRef = useRef<TextInput>(null);
  const [focus, setFocus] = useState(false);
  const [postForgot, setPostForgot] = useState(false);
  const { show } = useGlobalAlert();

  const onSubmit = async ({ email }: Form) => {
    try {
      setPostForgot(true);
      await requestPasswordReset(email.trim());
      show({
        type: 'success',
        title: 'Correo Enviado Correctamente',
        message: 'El Codigo de Seguridad Fue Enviado Correctamente al destinatario ' + email,
        duration: 2500,
        logo: require('@/assets/images/pame-logo-t.png'),
      });

      await new Promise((r) => setTimeout(r, 2000));
      setPostForgot(false);
      router.push({ pathname: '/(auth)/auth/verfy-code', params: { email } });
    }
    catch {
      show({
        type: 'error',
        title: 'El envio de correo Fallo',
        message: 'El Codigo de Seguridad no fue Enviado Correctamente al destinatario ' + email,
        duration: 2000,
        logo: require('@/assets/images/pame-logo-t.png'),
      })
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      {/* blobs como login */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.blobWrap} pointerEvents="none">
        <View style={[styles.blob, { backgroundColor: tint + '22', top: -60, right: -40 }]} />
        <View style={[styles.blob, { backgroundColor: tint + '1A', bottom: -80, left: -50, width: 260, height: 260 }]} />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        {/* Header con logo y título */}
        <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
          <Animated.Image entering={FadeInDown.delay(80).springify().damping(14)}
            source={require('@/assets/images/pame-logo-t.png')}
            style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
          <ThemedText style={[styles.brand, { color: text }]}>Recuperar acceso</ThemedText>
          <ThemedText style={[styles.subtitle, { color: text }]}>
            Ingresa tu correo y te enviaremos un código de verificación
          </ThemedText>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInDown.springify().damping(14)} style={[styles.card, { backgroundColor: bg }]}>
          <View style={[styles.fieldWrap, focus && { borderColor: tint }]}>
            <TextInput
              ref={emailRef}
              placeholder="Correo electrónico"
              placeholderTextColor={muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              style={[styles.input, { color: text }]}
            />
          </View>
          {errors.email && <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>}

          <Pressable disabled={!isValid || isSubmitting} onPress={handleSubmit(onSubmit)}
            style={[styles.primaryButton, { backgroundColor: isValid ? tint : '#9CA3AF' }]}>
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> :
              <ThemedText style={styles.primaryButtonText}>Enviar código</ThemedText>}
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/auth/login')} style={{ alignSelf: 'center', marginTop: 12 }}>
            <ThemedText style={styles.linkText}>Volver a iniciar sesión</ThemedText>
          </Pressable>
        </Animated.View>



      </KeyboardAvoidingView>
      {/* Loader overlay con animación de aparición/desaparición */}
      {(isSubmitting || postForgot) && (
        <Animated.View
          // Aparece suave cuando comienza submit o postLogin
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(220)}
          style={StyleSheet.absoluteFill}   // asegura que cubra toda la pantalla
          pointerEvents="box-none"
        >
          <Loader
            visible
            variant="overlay"
            message={isSubmitting ? 'Enviando Correo…' : 'Preparando tu panel…'}
            backdropOpacity={0.45}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  kav: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { marginBottom: 18, alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: 0.4 },
  subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4, textAlign: 'center' },
  card: {
    borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#ffffff22', backdropFilter: 'blur(4px)' as any,
  },
  fieldWrap: { position: 'relative', borderWidth: 1, borderColor: '#00000022', borderRadius: 12, marginBottom: 8, backgroundColor: '#F8FAFC' },
  input: { height: 52, borderRadius: 12, paddingHorizontal: 12 },
  primaryButton: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { textDecorationLine: 'underline', fontWeight: '600' },
  errorText: { color: '#ef4444', marginTop: 6, fontSize: 13 },
  blobWrap: { position: 'absolute', inset: 0 },
  logo: { width: 110, height: 110, marginBottom: 10 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 9999, transform: [{ rotate: '20deg' }], filter: 'blur(40px)' as any },
});
