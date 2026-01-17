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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';
import { statsApi, storyApi, reviewApi, wordApi } from '../../src/services/api';
import { TipsModal } from '../../src/components/TipsModal';
import { FeedbackModal } from '../../src/components/FeedbackModal';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLocalization } from '../../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import { format, parseISO } from 'date-fns';

interface Stats {
  words_learned: number;
  current_streak: number;
  total_reviews: number;
}

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface DayGroup {
  dayName: string;
  date: string;
  wordCount: number;
  color: string;
  icon: string;
}

const dayConfig = {
  Sunday: { icon: 'sunny', color: '#FFA500' },
  Monday: { icon: 'calendar', color: '#FF6B6B' },
  Tuesday: { icon: 'star', color: '#4ECDC4' },
  Wednesday: { icon: 'flash', color: '#95E1D3' },
  Thursday: { icon: 'heart', color: '#F38181' },
  Friday: { icon: 'trophy', color: '#AA96DA' },
  Saturday: { icon: 'gift', color: '#FCBAD3' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useLocalization();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [dueReviews, setDueReviews] = useState(0);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
    checkFeedbackTiming();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenTips = await AsyncStorage.getItem('hasSeenTips');
      if (!hasSeenTips) {
        setShowTips(true);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  const checkFeedbackTiming = async () => {
    try {
      const feedbackDismissed = await AsyncStorage.getItem('feedbackDismissed');
      const lastFeedbackShown = await AsyncStorage.getItem('lastFeedbackShown');
      const appUsageTime = await AsyncStorage.getItem('appUsageTime');
      
      if (feedbackDismissed === 'true') return;
      
      const currentTime = Date.now();
      const usageTime = parseInt(appUsageTime || '0');
      
      // Show feedback after 5 minutes of app usage
      if (usageTime > 300000 && !lastFeedbackShown) {
        setTimeout(() => setShowFeedback(true), 3000);
      }
    } catch (error) {
      console.error('Error checking feedback timing:', error);
    }
  };

  useEffect(() => {
    // Track app usage time
    const interval = setInterval(async () => {
      try {
        const currentUsage = await AsyncStorage.getItem('appUsageTime');
        const newUsage = (parseInt(currentUsage || '0') + 10000).toString();
        await AsyncStorage.setItem('appUsageTime', newUsage);
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCloseTips = async () => {
    setShowTips(false);
    try {
      await AsyncStorage.setItem('hasSeenTips', 'true');
    } catch (error) {
      console.error('Error saving tips flag:', error);
    }
  };

  const handleCloseFeedback = async () => {
    setShowFeedback(false);
    try {
      await AsyncStorage.setItem('feedbackDismissed', 'true');
    } catch (error) {
      console.error('Error saving feedback flag:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [statsRes, storiesRes, reviewsRes, wordsRes] = await Promise.all([
        statsApi.get(user.id),
        storyApi.getAll(user.id, 3),
        reviewApi.getDue(user.id),
        wordApi.getAll(user.id, 'all'),
      ]);
      
      setStats(statsRes.data);
      setRecentStories(storiesRes.data);
      setDueReviews(reviewsRes.data.length);
      
      // Group words by day
      const words = wordsRes.data;
      const grouped: { [key: string]: any[] } = {};
      
      words.forEach((word: any) => {
        const wordDate = parseISO(word.date_saved);
        const dayName = format(wordDate, 'EEEE');
        
        if (!grouped[dayName]) {
          grouped[dayName] = [];
        }
        grouped[dayName].push(word);
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const groups: DayGroup[] = days
        .filter(day => grouped[day] && grouped[day].length > 0)
        .slice(0, 3) // Show only top 3 groups
        .map(day => {
          const dayWords = grouped[day];
          const mostRecentDate = dayWords
            .map((w: any) => parseISO(w.date_saved))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          
          return {
            dayName: day,
            date: format(mostRecentDate, 'MMM d'),
            wordCount: dayWords.length,
            color: dayConfig[day as keyof typeof dayConfig].color,
            icon: dayConfig[day as keyof typeof dayConfig].icon,
          };
        });

      setDayGroups(groups);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await refreshUser();
    setRefreshing(false);
  }, [user]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>WELCOME BACK,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.email?.split('@')[0]?.toUpperCase() || 'LEARNER'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent }]}>
              <Ionicons name="book" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.words_learned || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Words Learned</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="flame" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.current_streak || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Day Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC4' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.total_reviews || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Reviews Done</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>QUICK ACTIONS</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, styles.primaryAction, { backgroundColor: colors.accent, borderColor: colors.border }]}
            onPress={() => router.push('/generate')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Generate Story</Text>
                <Text style={styles.actionSubtitle}>Create AI-powered stories</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {dueReviews > 0 && (
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.white, borderColor: colors.border }]}
              onPress={() => router.push('/review')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B' }]}>
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitleSmall, { color: colors.textPrimary }]}>Review Words</Text>
                  <Text style={[styles.actionSubtitleSmall, { color: colors.textMuted }]}>{dueReviews} words due</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Word Groups */}
        {dayGroups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>WORD GROUPS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/dictionary')}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See All →</Text>
              </TouchableOpacity>
            </View>

            {dayGroups.map((group) => (
              <TouchableOpacity
                key={group.dayName}
                style={[styles.groupCard, { backgroundColor: colors.white, borderColor: colors.border, borderLeftColor: group.color }]}
                onPress={() => router.push({
                  pathname: '/group-detail',
                  params: { dayName: group.dayName },
                })}
              >
                <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                  <Ionicons name={group.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupDay, { color: colors.textPrimary }]}>{group.dayName}</Text>
                  <Text style={[styles.groupDate, { color: colors.textMuted }]}>{group.date}</Text>
                </View>
                <View style={[styles.groupBadge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.groupCount, { color: colors.textPrimary }]}>{group.wordCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Stories */}
        {recentStories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>RECENT STORIES</Text>
            </View>

            {recentStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyCard, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View style={[styles.storyIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="book-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.storyInfo}>
                  <Text style={[styles.storyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={[styles.storyDate, { color: colors.textMuted }]}>
                    {format(parseISO(story.created_at), 'MMM d, yyyy')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Tips Modal */}
      <TipsModal
        visible={showTips}
        onClose={handleCloseTips}
        language={user?.target_language || 'English'}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedback}
        onClose={handleCloseFeedback}
        onSubmitSuccess={handleCloseFeedback}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    ...SHADOWS.small,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 3,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  primaryAction: {
    padding: SPACING.xl,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    gap: SPACING.xs / 2,
  },
  actionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  actionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionTitleSmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionSubtitleSmall: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 3,
    borderLeftWidth: 6,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupDay: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
  },
  groupDate: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  groupBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  groupCount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 3,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  storyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
  },
  storyDate: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});
