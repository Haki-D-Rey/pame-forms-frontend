// app/(auth)/register.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] });

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterScreen() {
    const router = useRouter();
    const text = useThemeColor({}, 'text');
    const bg = useThemeColor({}, 'background');

    const { handleSubmit, setValue, formState: { errors, isSubmitting, isValid } } =
        useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema), mode: 'onChange' });

    const onSubmit = async (data: RegisterForm) => {
        // TODO: registrar en backend
        router.replace('/(auth)/login');
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
                <ThemedText style={[styles.title, { color: text }]}>Crear cuenta</ThemedText>
                <View>
                    <TextInput placeholder="Correo" onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
                        style={styles.input} autoCapitalize="none" keyboardType="email-address" />
                    {errors.email && <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>}

                    <TextInput placeholder="Contraseña" secureTextEntry
                        onChangeText={(t) => setValue('password', t, { shouldValidate: true })} style={styles.input} />
                    {errors.password && <ThemedText style={styles.errorText}>{errors.password.message}</ThemedText>}

                    <TextInput placeholder="Confirmar contraseña" secureTextEntry
                        onChangeText={(t) => setValue('confirm', t, { shouldValidate: true })} style={styles.input} />
                    {errors.confirm && <ThemedText style={styles.errorText}>{errors.confirm.message}</ThemedText>}

                    <Pressable disabled={!isValid || isSubmitting} onPress={handleSubmit(onSubmit)} style={styles.button}>
                        <ThemedText style={{ color: '#fff', fontWeight: '700' }}>
                            {isSubmitting ? 'Creando…' : 'Registrarme'}
                        </ThemedText>
                    </Pressable>

                    <Pressable onPress={() => router.push('/(auth)/login')} style={styles.linkRow}>
                        <ThemedText style={[styles.linkText, { color: text }]}>¿Ya tienes cuenta? Inicia sesión</ThemedText>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: 'center' },
    inner: { maxWidth: 440, alignSelf: 'center', width: '100%' },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
    input: { height: 48, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8, backgroundColor: '#00000011' },
    errorText: { color: '#ef4444', marginBottom: 8 },
    linkRow: { marginTop: 12, alignItems: 'center' },
    linkText: { textDecorationLine: 'underline' },
    button: { height: 48, backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
