// app/(auth)/login.tsx
import { useGlobalAlert } from '@/components/globalAlertComponent';
import Loader from '@/components/Loader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
});
type LoginForm = z.infer<typeof LoginSchema>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  // Tema
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const muted = useMemo(() => (Platform.OS === 'ios' ? '#8E8E93' : '#9AA0A6'), []);

  // Logo por tema (ahora mismo usas el mismo archivo para ambos)
  const scheme = useColorScheme();
  const logoSource =
    scheme === 'dark'
      ? require('@/assets/images/pame-logo-t.png')
      : require('@/assets/images/pame-logo-t.png');

  const [focus, setFocus] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [postLogin, setPostLogin] = useState(false);

  const { show } = useGlobalAlert();

  // Helper: muestra alerta y espera a que termine antes de continuar
  const awaitAlert = async (opts: {
    type: 'success' | 'error';
    title: string;
    message: string;
    duration?: number; // ms visible
    logo?: any;
  }) => {
    const duration = opts.duration ?? 1500;
    show({ ...opts, duration });
    // margen para animaciones de entrada/salida
    await sleep(duration + 350);
  };

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  // Micro-animación botón
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => (scale.value = withTiming(0.98, { duration: 90 }));
  const onPressOut = () => (scale.value = withTiming(1, { duration: 90 }));
  const [showPass, setShowPass] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);


  const clearForm = () => {
    reset({ email: '', password: '' });
    clearErrors();
    setFocus((s) => ({ ...s, email: true, password: false }));
    requestAnimationFrame(() => {
      emailRef.current?.focus();
    });
  };


  const onSubmit = async (data: LoginForm) => {
    try {
      setPostLogin(true);
      await signIn({ email: data.email.trim().toLowerCase(), password: data.password });
      // 3) OCULTA LOADER, MUESTRA ALERTA y ESPERA cierre
      setPostLogin(false);
      await awaitAlert({
        type: 'success',
        title: 'Credenciales Correctas',
        message: 'Bienvenido al Panel Corporativo',
        duration: 1500,
        logo: require('@/assets/images/pame-logo-t.png'),
      });
      await sleep(1000);
      setPostLogin(false);
      router.replace('/(admin)/dashboard/home');
    } catch {
      // Falló login: limpia campos y muestra alerta de error
      setPostLogin(false);
      clearForm();
      await awaitAlert({
        type: 'error',
        title: 'Credenciales Incorrectas',
        message: 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente',
        duration: 2000,
        logo: require('@/assets/images/pame-logo-t.png'),
      });
    }
  };

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Decorativos: blobs suaves */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.blobWrap} pointerEvents="none">
          <View style={[styles.blob, { backgroundColor: tint + '22', top: -60, right: -40 }]} />
          <View
            style={[
              styles.blob,
              { backgroundColor: tint + '1A', bottom: -80, left: -50, width: 260, height: 260 },
            ]}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          {/* Header con logo */}
          <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
            <Animated.Image
              entering={FadeInDown.delay(80).springify().damping(14)}
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Logo de PameForms"
            />
          </Animated.View>

          {/* Títulos */}
          <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
            <ThemedText style={[styles.brand, { color: textColor }]}>
              Gestión de Formularios
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textColor }]}>
              Accede a tu panel corporativo
            </ThemedText>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInDown.springify().damping(14)}
            style={[styles.card, { backgroundColor: bgColor }]}
          >
            {/* Email */}
            <View style={[styles.field, focus.email && { borderColor: tint }]}>
              <Controller
                name="email"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    ref={emailRef}
                    value={value}
                    onChangeText={(t) => onChange(t)}
                    onBlur={() => {
                      onBlur();
                      setFocus((s) => ({ ...s, email: false }));
                    }}
                    onFocus={() => setFocus((s) => ({ ...s, email: true }))}
                    placeholder="Correo electrónico"
                    placeholderTextColor={muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    style={[styles.input, { color: textColor }]}
                    clearButtonMode="while-editing"
                  />
                )}
              />
            </View>
            {errors.email && <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>}

            {/* Password */}
            <View
              style={[styles.fieldWrap /* contenedor relativo */, focus.password && { borderColor: tint }]}
            >
              <Controller
                name="password"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    ref={passwordRef}
                    value={value}
                    onChangeText={(t) => onChange(t)}
                    onBlur={() => {
                      onBlur();
                      setFocus((s) => ({ ...s, password: false }));
                    }}
                    onFocus={() => setFocus((s) => ({ ...s, password: true }))}
                    placeholder="Contraseña"
                    placeholderTextColor={muted}
                    secureTextEntry={!showPass}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    style={[styles.input, { color: textColor, paddingRight: 44 }]}
                  />
                )}
              />

              {/* Botón ojo (derecha) */}
              <Pressable
                onPress={() => setShowPass((v) => !v)}
                style={styles.rightAdornment}
                accessibilityRole="button"
                accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <MaterialCommunityIcons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>
            {errors.password && (
              <ThemedText style={styles.errorText}>{errors.password.message}</ThemedText>
            )}

            {/* Primary CTA */}
            <Animated.View style={btnStyle}>
              <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityRole="button"
                style={[
                  styles.primaryButton,
                  { backgroundColor: isValid && !isSubmitting ? tint : '#9CA3AF' },
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Entrar</ThemedText>
                )}
              </Pressable>
            </Animated.View>

            {/* Secundarias */}
            <View style={styles.secondaryRow}>
              <Link href={{ pathname: '/(auth)/auth/register' }} style={styles.link}>
                <ThemedText style={styles.linkText}>Crear cuenta</ThemedText>
              </Link>
              <Link href={{ pathname: '/(auth)/auth/forgot-password' }} style={styles.link}>
                <ThemedText style={styles.linkText}>¿Olvidaste la contraseña?</ThemedText>
              </Link>
            </View>

            {/* Legal */}
            <ThemedText style={styles.legal}>
              Al continuar aceptas nuestros Términos y la Política de Privacidad.
            </ThemedText>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(150).duration(400)} style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: textColor }]}>
              © {new Date().getFullYear()} Pame S.A
            </ThemedText>
          </Animated.View>
        </KeyboardAvoidingView>
      </ThemedView>

      {/* Loader overlay con animación de aparición/desaparición */}
      {(isSubmitting || postLogin) && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(220)}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          <Loader
            visible
            variant="overlay"
            message={isSubmitting ? 'Autenticando…' : 'Preparando tu panel…'}
            backdropOpacity={0.45}
          />
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  kav: { width: '100%', maxWidth: 520, alignSelf: 'center' },

  header: { marginBottom: 18, alignItems: 'center' },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: 0.4 },
  subtitle: { fontSize: 14, opacity: 0.8, marginTop: 4 },

  card: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ffffff22',
    backdropFilter: 'blur(4px)' as any, // web: opcional
  },

  field: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00000014',
    backgroundColor: '#00000008',
    marginBottom: 8,
  },
  fieldWrap: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#00000022',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  rightAdornment: {
    position: 'absolute',
    right: 8,
    top: 0,
    height: 52,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: '#ef4444', marginBottom: 8, fontSize: 13 },
  submitError: { color: '#dc2626', marginTop: 4, marginBottom: 6, textAlign: 'center' },

  primaryButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  secondaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  link: { paddingVertical: 6 },
  linkText: { textDecorationLine: 'underline', fontWeight: '600' },

  legal: { fontSize: 12, opacity: 0.6, marginTop: 16, textAlign: 'center' },

  footer: { marginTop: 18, alignItems: 'center' },
  footerText: { fontSize: 12, opacity: 0.6 },

  blobWrap: { position: 'absolute', inset: 0 },
  logo: { width: 124, height: 124, marginBottom: 10 },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 9999,
    transform: [{ rotate: '20deg' }],
    filter: 'blur(40px)' as any, // web
  },
});
