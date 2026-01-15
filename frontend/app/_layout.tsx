import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="generate" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
