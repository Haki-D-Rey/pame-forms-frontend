// app/(auth)/verify-code.tsx
import { useGlobalAlert } from '@/components/globalAlertComponent';
import Loader from '@/components/Loader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { z } from 'zod';

const Schema = z.object({ code: z.string().min(4).max(8) });
type Form = z.infer<typeof Schema>;

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { verifyResetCode, requestPasswordReset } = useAuth();
  const { show } = useGlobalAlert();

  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const muted = Platform.OS === 'ios' ? '#8E8E93' : '#9AA0A6';

  const { handleSubmit, setValue, formState: { errors, isValid, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(Schema), mode: 'onChange' });

  const [focus, setFocus] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [postVerify, setPostVerify] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const onSubmit = async ({ code }: Form) => {
    try {
      setPostVerify(true);
      const response = await verifyResetCode({ email: String(email), code: code.trim() });
      show({
        type: 'success',
        title: 'Verificacion de Codigo',
        message: `El Codigo de Seguridad ${code} Fue Verificado Correctamente al destinatario ${email}`,
        duration: 2500,
        logo: require('@/assets/images/pame-logo-t.png'),
      });

      await new Promise((r) => setTimeout(r, 2000));
      setPostVerify(false);
      router.push({ pathname: '/(auth)/auth/reset-password', params: { email, resetToken: response.resetToken } });
    } catch {
      show({
        type: 'error',
        title: 'El envio de correo Fallo',
        message: `El Codigo de Seguridad ${code} no es valido`,
        duration: 2000,
        logo: require('@/assets/images/pame-logo-t.png'),
      })
    }

  };

  const resend = async () => {
    if (seconds > 0) return;
    setPostVerify(true);
    try {
      await requestPasswordReset(String(email));
      show({
        type: 'success',
        title: 'Reenvio de Codigo',
        message: `El Codigo de Seguridad se reenvio nuevamente al destinatario ${email}`,
        duration: 2500,
        logo: require('@/assets/images/pame-logo-t.png'),
      });
      await new Promise((r) => setTimeout(r, 2000));
      setPostVerify(false);
      setSeconds(45);
    } catch {
      setPostVerify(false);
      show({
        type: 'error',
        title: 'Reenvio de Codigo',
        message: `El Codigo de Seguridad no se pudo enviar nuevamente`,
        duration: 2000,
        logo: require('@/assets/images/pame-logo-t.png'),
      })
    }

  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.blobWrap} pointerEvents="none">
        <View style={[styles.blob, { backgroundColor: tint + '22', top: -60, right: -40 }]} />
        <View style={[styles.blob, { backgroundColor: tint + '1A', bottom: -80, left: -50, width: 260, height: 260 }]} />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
          <Animated.Image entering={FadeInDown.delay(80).springify().damping(14)}
            source={require('@/assets/images/pame-logo-t.png')}
            style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
          <ThemedText style={[styles.brand, { color: text }]}>Verificar código</ThemedText>
          <ThemedText style={[styles.subtitle, { color: text }]}>
            Enviamos un código a <ThemedText style={{ fontWeight: '800' }}>{String(email)}</ThemedText>
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().damping(14)} style={[styles.card, { backgroundColor: bg }]}>
          <View style={[styles.fieldWrap, focus && { borderColor: tint }]}>
            <TextInput
              ref={inputRef}
              placeholder="Código de verificación"
              placeholderTextColor={muted}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              onChangeText={(t) => setValue('code', t, { shouldValidate: true })}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              style={[styles.input, { color: text, letterSpacing: 4, textAlign: 'center' }]}
            />
          </View>
          {errors.code && <ThemedText style={styles.errorText}>{errors.code.message}</ThemedText>}

          <Pressable disabled={!isValid || isSubmitting} onPress={handleSubmit(onSubmit)}
            style={[styles.primaryButton, { backgroundColor: isValid ? tint : '#9CA3AF' }]}>
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> :
              <ThemedText style={styles.primaryButtonText}>Continuar</ThemedText>}
          </Pressable>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Pressable onPress={resend} disabled={seconds > 0}>
              <ThemedText style={[styles.linkText, { opacity: seconds > 0 ? 0.5 : 1 }]}>
                {seconds > 0 ? `Reenviar en ${seconds}s` : 'Reenviar código'}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Loader overlay con animación de aparición/desaparición */}
      {(isSubmitting || postVerify) && (
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
