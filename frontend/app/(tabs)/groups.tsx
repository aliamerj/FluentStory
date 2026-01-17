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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { wordApi } from '../../src/services/api';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import { format, parseISO, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

interface Word {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
  date_saved: string;
  mastery_level: number;
  next_review_date: string;
}

interface DayGroup {
  dayName: string;
  date: string;
  fullDate: Date;
  words: Word[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Day-specific icons and colors
const dayConfig = {
  Sunday: { icon: 'sunny' as const, color: '#FFA500' },
  Monday: { icon: 'calendar' as const, color: '#FF6B6B' },
  Tuesday: { icon: 'star' as const, color: '#4ECDC4' },
  Wednesday: { icon: 'flash' as const, color: '#95E1D3' },
  Thursday: { icon: 'heart' as const, color: '#F38181' },
  Friday: { icon: 'trophy' as const, color: '#AA96DA' },
  Saturday: { icon: 'gift' as const, color: '#FCBAD3' },
};

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [words, setWords] = useState<Word[]>([]);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWords = async () => {
    if (!user) return;
    
    try {
      const response = await wordApi.getAll(user.id, 'all');
      setWords(response.data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadWords();
  }, [user]);

  useEffect(() => {
    // Group words by day of week
    const grouped: { [key: string]: Word[] } = {};
    
    words.forEach((word) => {
      const wordDate = parseISO(word.date_saved);
      const dayName = format(wordDate, 'EEEE');
      
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(word);
    });

    // Create day groups with icons and colors
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groups: DayGroup[] = days
      .filter(day => grouped[day] && grouped[day].length > 0)
      .map(day => {
        const dayWords = grouped[day];
        // Get the most recent date for this day
        const mostRecentDate = dayWords
          .map(w => parseISO(w.date_saved))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        return {
          dayName: day,
          date: format(mostRecentDate, 'MMM d, yyyy'),
          fullDate: mostRecentDate,
          words: dayWords.sort((a, b) => 
            parseISO(b.date_saved).getTime() - parseISO(a.date_saved).getTime()
          ),
          icon: dayConfig[day as keyof typeof dayConfig].icon,
          color: dayConfig[day as keyof typeof dayConfig].color,
        };
      })
      .sort((a, b) => {
        // Sort by day of week (Monday = 0, Sunday = 6)
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.dayName) - dayOrder.indexOf(b.dayName);
      });

    setDayGroups(groups);
  }, [words]);

  const handleGroupPress = (group: DayGroup) => {
    // Navigate to group detail screen
    router.push({
      pathname: '/group-detail',
      params: { 
        dayName: group.dayName,
        words: JSON.stringify(group.words),
        color: group.color,
        icon: group.icon,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>LOADING GROUPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>WORD GROUPS</Text>
        <Text style={styles.subtitle}>ORGANIZED BY DAY</Text>
      </View>

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
        {dayGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>NO WORD GROUPS YET</Text>
            <Text style={styles.emptyText}>
              Start saving words to see them organized by day of the week!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={COLORS.accent} />
              <Text style={styles.infoText}>
                Words are grouped by the day you saved them. Tap any day to see all words!
              </Text>
            </View>

            {dayGroups.map((group, index) => (
              <TouchableOpacity
                key={group.dayName}
                style={[styles.groupCard, { borderLeftColor: group.color }]}
                onPress={() => handleGroupPress(group)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: group.color }]}>
                  <Ionicons name={group.icon} size={32} color={COLORS.white} />
                </View>
                
                <View style={styles.groupInfo}>
                  <Text style={styles.dayName}>{group.dayName.toUpperCase()}</Text>
                  <Text style={styles.dateText}>{group.date}</Text>
                  <Text style={styles.wordCount}>
                    {group.words.length} {group.words.length === 1 ? 'word' : 'words'}
                  </Text>
                </View>

                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </>
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
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.black,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderLeftWidth: 8,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.black,
    ...SHADOWS.small,
  },
  groupInfo: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  dayName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  wordCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
