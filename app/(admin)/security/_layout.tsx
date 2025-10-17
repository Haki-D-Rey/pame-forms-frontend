import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="users" />
      <Stack.Screen name="roles" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
