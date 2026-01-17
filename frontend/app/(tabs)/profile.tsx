import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { statsApi, storyApi } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { FeedbackModal } from '../../src/components/FeedbackModal';
import { useTheme } from '../../src/contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';

interface Story {
  id: string;
  title: string;
  language: string;
  topic: string;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser, refreshUser } = useAuthStore();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const storiesRes = await storyApi.getAll(user.id, 20);
      setStories(storiesRes.data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'LOG OUT',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await storyApi.delete(storyId);
      setStories(stories.filter((s) => s.id !== storyId));
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.black}
          />
        }
      >
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: COLORS.white }]}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.email, { color: colors.textPrimary }]}>{user?.email?.toUpperCase()}</Text>
          <View style={styles.badges}>
            {user?.is_premium && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Ionicons name="diamond" size={14} color={COLORS.white} />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
            <View style={[styles.levelBadge, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <Text style={[styles.levelText, { color: colors.black }]}>{user?.proficiency_level?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={[styles.statsCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user?.words_saved_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>WORDS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stories.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>STORIES</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{user?.current_streak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>STREAK</Text>
            </View>
          </View>
        </View>

        {/* Learning Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>LEARNING SETTINGS</Text>
        <Card style={[styles.settingsCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Ionicons name="globe-outline" size={20} color={COLORS.white} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.textMuted }]}>NATIVE LANGUAGE</Text>
                <Text style={[styles.settingValue, { color: colors.textPrimary }]}>{user?.native_language}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Ionicons name="school-outline" size={20} color={COLORS.white} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.textMuted }]}>LEARNING</Text>
                <Text style={[styles.settingValue, { color: colors.textPrimary }]}>{user?.target_language}</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Ionicons name="trending-up-outline" size={20} color={COLORS.white} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.textMuted }]}>LEVEL</Text>
                <Text style={[styles.settingValue, { color: colors.textPrimary }]}>{user?.proficiency_level}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* App Settings */}
        <Text style={styles.sectionTitle}>APP SETTINGS</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={COLORS.white} />
              </View>
              <Text style={styles.settingLabel}>DARK MODE</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.borderLight, true: COLORS.accent }}
              thumbColor={COLORS.white}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.settingLabel}>NOTIFICATIONS</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.borderLight, true: COLORS.accent }}
              thumbColor={COLORS.white}
            />
          </View>
        </Card>

        {/* My Stories */}
        {stories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MY STORIES ({stories.length})</Text>
            {stories.slice(0, 5).map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View style={styles.storyInfo}>
                  <Text style={styles.storyTitle} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={styles.storyMeta}>
                    {story.language.toUpperCase()} / {story.topic.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteStory(story.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Premium Banner */}
        {!user?.is_premium && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <Ionicons name="diamond" size={32} color={COLORS.accent} />
              <Text style={styles.premiumTitle}>UPGRADE TO PREMIUM</Text>
            </View>
            <Text style={styles.premiumDescription}>
              Get unlimited stories, unlimited vocabulary, and remove all ads.
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>UNLIMITED STORIES</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>UNLIMITED VOCABULARY</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>NO ADS</Text>
              </View>
            </View>
            <Button
              title="$4.99/MONTH"
              onPress={() => Alert.alert('PREMIUM', 'Premium purchases coming soon!')}
              fullWidth
              variant="accent"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}

        {/* Send Feedback Button */}
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setFeedbackModalVisible(true)}
        >
          <Ionicons name="chatbox-ellipses" size={20} color={COLORS.accent} />
          <Text style={styles.feedbackButtonText}>SEND FEEDBACK</Text>
        </TouchableOpacity>

        {/* Logout */}
        <Button
          title="LOG OUT"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={{ marginTop: SPACING.md }}
        />

        <Text style={styles.version}>FLUENTSTORY V1.0.0</Text>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmitSuccess={() => {
          Alert.alert('Success', 'Thank you for your feedback!');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.white,
  },
  email: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  premiumText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  levelBadge: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.black,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    letterSpacing: 2,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderLight,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    gap: 2,
  },
  settingLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  settingValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    fontWeight: '600',
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.black,
  },
  storyMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 1,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  premiumCard: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.accent,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  premiumHeader: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
  },
  premiumDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  premiumFeatures: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  premiumFeatureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.black,
    fontWeight: '600',
    letterSpacing: 1,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.accent,
    padding: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  feedbackButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  version: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
