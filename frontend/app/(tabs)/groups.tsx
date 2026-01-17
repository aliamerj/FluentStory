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
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLocalization } from '../../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import { format, parseISO } from 'date-fns';

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
  wordCount: number;
  words: Word[];
  icon: string;
  color: string;
}

const dayConfig: Record<string, { icon: string; color: string }> = {
  Sunday: { icon: 'sunny', color: '#FFA500' },
  Monday: { icon: 'calendar', color: '#FF4500' },
  Tuesday: { icon: 'star', color: '#4ECDC4' },
  Wednesday: { icon: 'flash', color: '#95E1D3' },
  Thursday: { icon: 'heart', color: '#F38181' },
  Friday: { icon: 'trophy', color: '#AA96DA' },
  Saturday: { icon: 'gift', color: '#FCBAD3' },
};

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useLocalization();
  
  const [words, setWords] = useState<Word[]>([]);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWords = async () => {
    if (!user) return;
    
    try {
      const response = await wordApi.getAll(user.id, 'all');
      console.log('Loaded words:', response.data.length);
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
    if (words.length === 0) {
      setDayGroups([]);
      return;
    }

    const grouped: { [key: string]: Word[] } = {};
    
    words.forEach((word) => {
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
      .map(day => {
        const dayWords = grouped[day];
        const mostRecentDate = dayWords
          .map(w => parseISO(w.date_saved))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        return {
          dayName: day,
          date: format(mostRecentDate, 'MMM d, yyyy'),
          fullDate: mostRecentDate,
          wordCount: dayWords.length,
          words: dayWords.sort((a, b) => 
            parseISO(b.date_saved).getTime() - parseISO(a.date_saved).getTime()
          ),
          icon: dayConfig[day].icon,
          color: dayConfig[day].color,
        };
      });

    console.log('Day groups created:', groups.length);
    setDayGroups(groups);
  }, [words]);

  const handleGroupPress = (group: DayGroup) => {
    router.push({
      pathname: '/group-detail',
      params: { 
        dayName: group.dayName,
        color: group.color,
        icon: group.icon,
        wordCount: group.wordCount.toString(),
      },
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>LOADING GROUPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.wordGroups}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>BY DAY</Text>
      </View>

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
        {dayGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>NO WORD GROUPS YET</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Start saving words to see them organized by day of the week!
            </Text>
          </View>
        ) : (
          dayGroups.map((group) => (
            <TouchableOpacity
              key={group.dayName}
              style={[styles.groupCard, { backgroundColor: colors.white, borderColor: colors.border, borderLeftColor: group.color }]}
              onPress={() => handleGroupPress(group)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: group.color, borderColor: colors.border }]}>
                <Ionicons name={group.icon as any} size={32} color="#FFFFFF" />
              </View>
              
              <View style={styles.groupInfo}>
                <Text style={[styles.dayName, { color: colors.textPrimary }]}>{group.dayName.toUpperCase()}</Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{group.date}</Text>
                <Text style={[styles.wordCount, { color: colors.textMuted }]}>
                  {group.wordCount} {group.wordCount === 1 ? 'word' : 'words'}
                </Text>
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZES.md, fontWeight: '700', letterSpacing: 1 },
  header: { padding: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 3 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 1 },
  scrollContent: { padding: SPACING.lg },
  groupCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: 16, borderWidth: 3, borderLeftWidth: 8, marginBottom: SPACING.md, ...SHADOWS.medium },
  iconContainer: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, ...SHADOWS.small },
  groupInfo: { flex: 1, marginLeft: SPACING.lg },
  dayName: { fontSize: FONT_SIZES.lg, fontWeight: '900', letterSpacing: 1.5, marginBottom: SPACING.xs },
  dateText: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.xs },
  wordCount: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  arrowContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.lg, marginBottom: SPACING.md, textAlign: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
});