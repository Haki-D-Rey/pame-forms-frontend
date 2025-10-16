// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack initialRouteName="login">
            <Stack.Screen name="login" options={{ headerShown: false, title: 'Login' }} />
            <Stack.Screen name="register" options={{ headerShown: false, title: 'Register' }} />
        </Stack>
    );
}
