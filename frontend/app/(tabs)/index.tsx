import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { statsApi, storyApi, reviewApi } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';

interface Stats {
  total_words: number;
  mastered_words: number;
  learning_words: number;
  due_reviews: number;
  total_stories: number;
  current_streak: number;
  reviews_this_week: number;
  accuracy_rate: number;
  stories_this_month: number;
  is_premium: boolean;
}

interface Story {
  id: string;
  title: string;
  language: string;
  topic: string;
  created_at: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [dueReviews, setDueReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [statsRes, storiesRes, reviewsRes] = await Promise.all([
        statsApi.get(user.id),
        storyApi.getAll(user.id, 5),
        reviewApi.getDue(user.id),
      ]);
      
      setStats(statsRes.data);
      setRecentStories(storiesRes.data);
      setDueReviews(reviewsRes.data.count);
    } catch (error) {
      console.error('Failed to load home data:', error);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Learner'}!</Text>
            <Text style={styles.subGreeting}>
              Learning {user?.target_language || 'Spanish'}
            </Text>
          </View>
          {stats?.current_streak && stats.current_streak > 0 ? (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={20} color={COLORS.warning} />
              <Text style={styles.streakText}>{stats.current_streak}</Text>
            </View>
          ) : null}
        </View>

        {/* Hero CTA */}
        <TouchableOpacity
          style={styles.heroCta}
          onPress={() => router.push('/generate')}
          activeOpacity={0.8}
        >
          <View style={styles.heroContent}>
            <Ionicons name="sparkles" size={32} color={COLORS.white} />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Generate New Story</Text>
              <Text style={styles.heroSubtitle}>AI-powered content just for you</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.total_words || 0}</Text>
            <Text style={styles.statLabel}>Words Learned</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.mastered_words || 0}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statWithIcon}>
              <Ionicons name="flame" size={20} color={COLORS.warning} />
              <Text style={styles.statNumber}>{stats?.current_streak || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card style={[styles.statCard, dueReviews > 0 && styles.statCardHighlight]}>
            <Text style={[styles.statNumber, dueReviews > 0 && styles.statNumberHighlight]}>
              {dueReviews}
            </Text>
            <Text style={styles.statLabel}>Reviews Due</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {dueReviews > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => router.push('/review')}
            >
              <Ionicons name="refresh" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonTextWhite}>Review Now</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dueReviews}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/dictionary')}
          >
            <Ionicons name="book" size={24} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Dictionary</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Stories */}
        {recentStories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Stories</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
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
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Empty State */}
        {recentStories.length === 0 && (
          <Card style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No stories yet</Text>
            <Text style={styles.emptyText}>
              Generate your first story to start learning!
            </Text>
            <Button
              title="Generate Story"
              onPress={() => router.push('/generate')}
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        )}

        {/* Premium Banner */}
        {!stats?.is_premium && (
          <TouchableOpacity style={styles.premiumBanner}>
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={24} color={COLORS.warning} />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlimited stories & words
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  streakText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.warning,
  },
  heroCta: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroText: {
    gap: SPACING.xs,
  },
  heroTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + 'CC',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  statCardHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statNumberHighlight: {
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButtonTextWhite: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  badge: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  storyCard: {
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
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  premiumText: {
    gap: 2,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  premiumSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
