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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';

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
  
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

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
      'Log Out',
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badges}>
            {user?.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={14} color={COLORS.warning} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{user?.proficiency_level}</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.words_saved_count || 0}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stories.length}</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Card>

        {/* Learning Settings */}
        <Text style={styles.sectionTitle}>Learning Settings</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={22} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Native Language</Text>
                <Text style={styles.settingValue}>{user?.native_language}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="school-outline" size={22} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Learning</Text>
                <Text style={styles.settingValue}>{user?.target_language}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <Ionicons name="trending-up-outline" size={22} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Level</Text>
                <Text style={styles.settingValue}>{user?.proficiency_level}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </Card>

        {/* My Stories */}
        {stories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Stories ({stories.length})</Text>
            {stories.map((story) => (
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
                    {story.language} • {story.topic}
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
          <Card style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <Ionicons name="diamond" size={32} color={COLORS.warning} />
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            </View>
            <Text style={styles.premiumDescription}>
              Get unlimited stories, unlimited word saving, and remove all ads.
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>Unlimited stories</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>Unlimited vocabulary</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.premiumFeatureText}>No ads</Text>
              </View>
            </View>
            <Button
              title="$4.99/month"
              onPress={() => Alert.alert('Premium', 'Premium purchases coming soon!')}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        )}

        {/* Logout */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={{ marginTop: SPACING.lg }}
        />

        <Text style={styles.version}>FluentStory v1.0.0</Text>
      </ScrollView>
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
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  email: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  premiumText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.warning,
  },
  levelBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsCard: {
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
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingText: {
    gap: 2,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  storyMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  premiumCard: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  premiumHeader: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.text,
  },
  version: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
