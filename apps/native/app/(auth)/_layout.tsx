import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ presentation: 'card' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="bind-uid" />
      <Stack.Screen name="bind-uid-roles" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
