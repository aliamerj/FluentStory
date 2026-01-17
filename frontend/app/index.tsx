import React from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useTheme } from '../src/contexts/ThemeContext';
import { FONT_SIZES, SPACING, SHADOWS } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user, loadUser } = useAuthStore();
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Ionicons name="book" size={64} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>FLUENTSTORY</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>LEARN LANGUAGES THROUGH STORIES</Text>
      </View>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.large,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: SPACING.xxl * 2,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
});