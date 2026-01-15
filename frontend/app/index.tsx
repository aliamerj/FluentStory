import React from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../src/constants/theme';

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
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>FS</Text>
        </View>
        <Text style={styles.title}>FLUENTSTORY</Text>
        <Text style={styles.subtitle}>LEARN LANGUAGES THROUGH STORIES</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.black} style={styles.loader} />
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
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: FONT_SIZES.title,
    fontWeight: '900',
    color: COLORS.white,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    letterSpacing: 2,
    fontWeight: '600',
  },
  loader: {
    marginTop: SPACING.xxl,
  },
});
