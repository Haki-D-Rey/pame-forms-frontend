// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack initialRouteName="auth/login">
            <Stack.Screen name="auth/login" options={{ headerShown: false, title: 'Login' }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false, title: 'Register' }} />
        </Stack>
    );
}
