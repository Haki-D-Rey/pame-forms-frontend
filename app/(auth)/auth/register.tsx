// app/(auth)/register.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
});
type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterScreen() {
    const router = useRouter();
    const text = useThemeColor({}, 'text');
    const bg = useThemeColor({}, 'background');
    const tint = useThemeColor({}, 'tint');
    const muted = Platform.OS === 'ios' ? '#8E8E93' : '#9AA0A6';
    const { register } = useAuth();

    const {
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema), mode: 'onChange' });

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // anim micro del botón (igual patrón que login)
    const scale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const onPressIn = () => (scale.value = withTiming(0.98, { duration: 90, easing: Easing.linear }));
    const onPressOut = () => (scale.value = withTiming(1, { duration: 90, easing: Easing.linear }));

    const password = watch('password') || '';
    const strength = useMemo(() => {
        let score = 0;
        if (password.length >= 6) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        if (password.length >= 12) score += 1;
        return score; // 0..5
    }, [password]);

    const onSubmit = async (data: RegisterForm) => {
        await register({ email: data.email, password: data.password, role: 'UserStandard' });
        router.replace('/(auth)/auth/login');
    };

    return (
        <>
            <ThemedView style={[styles.container, { backgroundColor: bg }]}>
                {/* Decorativos: blobs EXACTOS al login */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.blobWrap} pointerEvents="none">
                    <View style={[styles.blob, { backgroundColor: tint + '22', top: -60, right: -40 }]} />
                    <View
                        style={[
                            styles.blob,
                            { backgroundColor: tint + '1A', bottom: -80, left: -50, width: 260, height: 260 },
                        ]}
                    />
                </Animated.View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
                    {/* Header con logo y título (mismo layout que login) */}
                    <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
                        <Animated.Image
                            entering={FadeInDown.delay(80).springify().damping(14)}
                            source={require('@/assets/images/pame-logo-t.png')}
                            style={styles.logo}
                            resizeMode="contain"
                            accessibilityRole="image"
                            accessibilityLabel="Logo de PameForms"
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.header}>
                        <ThemedText style={[styles.brand, { color: text }]}>Crear cuenta</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: text }]}>
                            Regístrate para administrar tus formularios y reportes
                        </ThemedText>
                    </Animated.View>

                    {/* Card “glass” */}
                    <Animated.View
                        entering={FadeInDown.springify().damping(14)}
                        style={[styles.card, { backgroundColor: bg }]}
                    >
                        <View style={{ rowGap: 12 }}>
                            <FloatingInput
                                label="Correo"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
                                error={errors.email?.message}
                                iconRight={<MaterialCommunityIcons name="email-outline" size={18} color="#64748b" />}
                            />

                            <FloatingInput
                                label="Contraseña"
                                secureTextEntry={!showPass}
                                onChangeText={(t) => setValue('password', t, { shouldValidate: true })}
                                error={errors.password?.message}
                                iconRight={
                                    <Pressable onPress={() => setShowPass((v) => !v)} style={styles.iconBtn}>
                                        <MaterialCommunityIcons
                                            name={showPass ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color="#64748b"
                                        />
                                    </Pressable>
                                }
                            />

                            {/* Fuerza de contraseña */}
                            <PasswordStrength strength={strength} tint={tint} />

                            <FloatingInput
                                label="Confirmar contraseña"
                                secureTextEntry={!showConfirm}
                                onChangeText={(t) => setValue('confirm', t, { shouldValidate: true })}
                                error={errors.confirm?.message}
                                iconRight={
                                    <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.iconBtn}>
                                        <MaterialCommunityIcons
                                            name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color="#64748b"
                                        />
                                    </Pressable>
                                }
                            />
                        </View>

                        {/* CTA */}
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
                                    <ThemedText style={styles.primaryButtonText}>Registrarme</ThemedText>
                                )}
                            </Pressable>
                        </Animated.View>

                        {/* Enlace login */}
                        <View style={styles.secondaryRow}>
                            <Pressable onPress={() => router.push('/(auth)/auth/login')} style={styles.link}>
                                <ThemedText style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</ThemedText>
                            </Pressable>
                        </View>

                        <ThemedText style={styles.legal}>
                            Al continuar aceptas nuestros Términos y la Política de Privacidad.
                        </ThemedText>
                    </Animated.View>
                </KeyboardAvoidingView>
            </ThemedView>
        </>
    );
}

/* ───────────────────────── inputs animados (RN simple) ───────────────────────── */
function FloatingInput({
    label,
    error,
    iconRight,
    style,
    ...props
}: {
    label: string;
    error?: string;
    iconRight?: React.ReactNode;
    style?: any;
} & React.ComponentProps<typeof TextInput>) {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState('');
    const borderCol = error ? '#ef4444' : focused ? '#60a5fa' : '#00000022';

    return (
        <View style={[styles.field, style, { borderColor: borderCol }]}>
            <TextInput
                {...props}
                value={value}
                onChangeText={(t) => {
                    setValue(t);
                    props.onChangeText?.(t);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={label}
                placeholderTextColor={'#94a3b8'}
                style={[styles.input, { paddingRight: iconRight ? 44 : 12 }]}
            />
            {iconRight ? <View style={styles.rightAdornment}>{iconRight}</View> : null}
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        </View>
    );
}

/* ────────────────────── fuerza de contraseña ─────────────────────── */
function PasswordStrength({ strength, tint }: { strength: number; tint: string }) {
    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte', 'Excelente'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#16a34a'];
    const pct = (strength / 5) * 100;
    return (
        <View style={{ marginTop: -4 }}>
            <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: `${pct}%`, backgroundColor: colors[strength] || tint }]} />
            </View>
            <ThemedText style={styles.strengthLabel}>{labels[strength] || ' '}</ThemedText>
        </View>
    );
}

/* ───────────────────────── styles ───────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
    kav: { width: '100%', maxWidth: 520, alignSelf: 'center' },

    // Header/branding igual al login
    header: { marginBottom: 18, alignItems: 'center' },
    brand: { fontSize: 26, fontWeight: '800', letterSpacing: 0.4 },
    subtitle: { fontSize: 14, opacity: 0.8, marginTop: 4, textAlign: 'center' },

    // Card “glass”
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
        backdropFilter: 'blur(4px)' as any, // web: opcional (igual que login)
    },

    // Blobs idénticos a login
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

    // Inputs
    field: {
        position: 'relative',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 12,
        color: '#111827',
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

    errorText: { color: '#ef4444', marginTop: 6, fontSize: 13 },

    // Botón + enlaces
    primaryButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    secondaryRow: {
        marginTop: 14,
        alignItems: 'center',
    },
    link: { paddingVertical: 6 },
    linkText: { textDecorationLine: 'underline', fontWeight: '600' },

    legal: { fontSize: 12, opacity: 0.6, marginTop: 16, textAlign: 'center' },

    // Fuerza contraseña
    strengthBarBg: {
        height: 6,
        borderRadius: 999,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    strengthBarFill: { height: '100%' },
    strengthLabel: { marginTop: 6, fontSize: 11, color: '#64748b', fontWeight: '700', textAlign: 'right' },

    // Icono ojo
    iconBtn: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center' },
});
