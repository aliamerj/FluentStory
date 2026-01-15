import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { reviewApi } from '../../src/services/api';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';

interface Word {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
  mastery_level: number;
}

export default function ReviewTabScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDueReviews = async () => {
    if (!user) return;
    
    try {
      const response = await reviewApi.getDue(user.id);
      setDueWords(response.data.words);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDueReviews();
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadDueReviews();
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
        <View style={styles.header}>
          <Text style={styles.title}>Review</Text>
          <Text style={styles.subtitle}>Practice your vocabulary</Text>
        </View>

        {dueWords.length > 0 ? (
          <>
            <Card style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Ionicons name="flash" size={40} color={COLORS.primary} />
                <Text style={styles.reviewCount}>{dueWords.length}</Text>
              </View>
              <Text style={styles.reviewTitle}>Words Ready for Review</Text>
              <Text style={styles.reviewSubtitle}>
                Keep your streak going by reviewing these words!
              </Text>
              <Button
                title="Start Review"
                onPress={() => router.push('/review')}
                fullWidth
                size="lg"
                style={{ marginTop: SPACING.lg }}
              />
            </Card>

            <Text style={styles.sectionTitle}>Words to Review</Text>
            {dueWords.slice(0, 5).map((word) => (
              <View key={word.id} style={styles.wordPreview}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <Text style={styles.wordTranslation}>{word.translation}</Text>
                </View>
                <View style={styles.masteryBadge}>
                  <Text style={styles.masteryText}>{word.mastery_level}/8</Text>
                </View>
              </View>
            ))}
            {dueWords.length > 5 && (
              <Text style={styles.moreWords}>+{dueWords.length - 5} more words</Text>
            )}
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No words due for review right now. Keep reading stories to add more words to your dictionary!
            </Text>
            <Button
              title="Generate Story"
              onPress={() => router.push('/generate')}
              variant="outline"
              style={{ marginTop: SPACING.lg }}
            />
          </Card>
        )}

        {/* How Review Works */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Spaced Repetition Works</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.infoText}>
              Words are reviewed at increasing intervals: 1, 3, 7, 14, 30, 90, 150, and 365 days
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="checkmark-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.infoText}>
              Correct answers advance the word to the next level
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="refresh-outline" size={20} color={COLORS.error} />
            </View>
            <Text style={styles.infoText}>
              Incorrect answers reset the word back to level 1
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="trophy-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.infoText}>
              After 8 successful reviews, the word is mastered!
            </Text>
          </View>
        </Card>
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  reviewCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewCount: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  reviewSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  wordPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  wordTranslation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  masteryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  masteryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  moreWords: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
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
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  infoCard: {
    marginTop: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
