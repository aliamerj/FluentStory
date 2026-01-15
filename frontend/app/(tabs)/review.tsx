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
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';

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
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>LOADING REVIEWS...</Text>
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
        <View style={styles.header}>
          <Text style={styles.title}>REVIEW</Text>
          <Text style={styles.subtitle}>PRACTICE YOUR VOCABULARY</Text>
        </View>

        {dueWords.length > 0 ? (
          <>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.flashIcon}>
                  <Ionicons name="flash" size={32} color={COLORS.white} />
                </View>
                <Text style={styles.reviewCount}>{dueWords.length}</Text>
              </View>
              <Text style={styles.reviewTitle}>WORDS READY</Text>
              <Text style={styles.reviewSubtitle}>FOR REVIEW</Text>
              <Button
                title="START REVIEW"
                onPress={() => router.push('/review')}
                fullWidth
                size="lg"
                variant="accent"
                style={{ marginTop: SPACING.lg }}
              />
            </View>

            <Text style={styles.sectionTitle}>WORDS TO REVIEW</Text>
            {dueWords.slice(0, 5).map((word) => (
              <View key={word.id} style={styles.wordPreview}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{word.word.toUpperCase()}</Text>
                  <Text style={styles.wordTranslation}>{word.translation}</Text>
                </View>
                <View style={styles.masteryBadge}>
                  <Text style={styles.masteryText}>{word.mastery_level}/8</Text>
                </View>
              </View>
            ))}
            {dueWords.length > 5 && (
              <Text style={styles.moreWords}>+{dueWords.length - 5} MORE WORDS</Text>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.emptyTitle}>ALL CAUGHT UP!</Text>
            <Text style={styles.emptyText}>
              No words due for review right now. Keep reading stories to add more words!
            </Text>
            <Button
              title="GENERATE STORY"
              onPress={() => router.push('/generate')}
              variant="outline"
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        )}

        {/* How Review Works */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>HOW SPACED REPETITION WORKS</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>1</Text>
            </View>
            <Text style={styles.infoText}>
              Words are reviewed at increasing intervals: 1, 3, 7, 14, 30, 90, 150, 365 days
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>2</Text>
            </View>
            <Text style={styles.infoText}>
              Correct answers advance the word. Wrong answers reset to level 1.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>3</Text>
            </View>
            <Text style={styles.infoText}>
              After 8 successful reviews, the word is MASTERED!
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  reviewCard: {
    backgroundColor: COLORS.black,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flashIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: FONT_SIZES.hero,
    fontWeight: '900',
    color: COLORS.white,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  reviewSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  wordPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  wordTranslation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  masteryBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  masteryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  moreWords: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkIcon: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.black,
    marginTop: SPACING.md,
    letterSpacing: 2,
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
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.lg,
    letterSpacing: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  infoNumber: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.white,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
