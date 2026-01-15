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
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';

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
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>LOADING...</Text>
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
            tintColor={COLORS.black}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>HELLO,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0]?.toUpperCase() || 'LEARNER'}</Text>
          </View>
          {stats?.current_streak && stats.current_streak > 0 ? (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={24} color={COLORS.accent} />
              <Text style={styles.streakText}>{stats.current_streak}</Text>
            </View>
          ) : null}
        </View>

        {/* Hero CTA */}
        <TouchableOpacity
          style={styles.heroCta}
          onPress={() => router.push('/generate')}
          activeOpacity={0.9}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="sparkles" size={32} color={COLORS.white} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>GENERATE STORY</Text>
              <Text style={styles.heroSubtitle}>AI-POWERED CONTENT</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBlack]}>
            <Text style={styles.statNumberWhite}>{stats?.total_words || 0}</Text>
            <Text style={styles.statLabelWhite}>WORDS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.mastered_words || 0}</Text>
            <Text style={styles.statLabel}>MASTERED</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statWithIcon}>
              <Ionicons name="flame" size={20} color={COLORS.accent} />
              <Text style={styles.statNumber}>{stats?.current_streak || 0}</Text>
            </View>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
          <View style={[styles.statCard, dueReviews > 0 && styles.statCardAccent]}>
            <Text style={[styles.statNumber, dueReviews > 0 && styles.statNumberWhite]}>
              {dueReviews}
            </Text>
            <Text style={[styles.statLabel, dueReviews > 0 && styles.statLabelWhite]}>REVIEWS</Text>
          </View>
        </View>

        {/* Quick Actions */}
        {dueReviews > 0 && (
          <TouchableOpacity
            style={styles.reviewBanner}
            onPress={() => router.push('/review')}
          >
            <View style={styles.reviewBannerContent}>
              <Ionicons name="flash" size={24} color={COLORS.black} />
              <View>
                <Text style={styles.reviewBannerTitle}>{dueReviews} WORDS READY</Text>
                <Text style={styles.reviewBannerSubtitle}>TAP TO START REVIEW</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.black} />
          </TouchableOpacity>
        )}

        {/* Recent Stories */}
        {recentStories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENT STORIES</Text>
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
                    {story.language.toUpperCase()} / {story.topic.toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Empty State */}
        {recentStories.length === 0 && (
          <Card style={styles.emptyState} variant="elevated">
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>NO STORIES YET</Text>
            <Text style={styles.emptyText}>
              Generate your first story to start learning!
            </Text>
            <Button
              title="Generate Story"
              onPress={() => router.push('/generate')}
              variant="accent"
              style={{ marginTop: SPACING.md }}
            />
          </Card>
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 2,
  },
  userName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  streakText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.accent,
  },
  heroCta: {
    backgroundColor: COLORS.black,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    gap: 2,
  },
  heroTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    letterSpacing: 1,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  statCardBlack: {
    backgroundColor: COLORS.black,
  },
  statCardAccent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.black,
  },
  statNumberWhite: {
    color: COLORS.white,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  statLabelWhite: {
    color: COLORS.white,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warning,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  reviewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  reviewBannerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  reviewBannerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  storyCard: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
