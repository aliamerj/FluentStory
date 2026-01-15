import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.onboarding_completed) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="book" size={80} color={COLORS.primary} />
        <Text style={styles.title}>FluentStory</Text>
        <Text style={styles.subtitle}>Learn languages through stories</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  loader: {
    marginTop: SPACING.xxl,
  },
});
