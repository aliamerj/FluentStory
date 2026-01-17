import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAuthStore } from '../../src/store/authStore';
import { reviewApi, storyApi } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import { format, parseISO } from 'date-fns';

interface ReviewWord {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  
  const [dueWords, setDueWords] = useState<ReviewWord[]>([]);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [reviewRes, storiesRes] = await Promise.all([
        reviewApi.getDue(user.id),
        storyApi.getAll(user.id, 5),
      ]);
      setDueWords(reviewRes.data);
      setRecentStories(storiesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await Speech.speak(text, {
        language: 'es-ES',
        rate: 0.75,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    const currentWord = dueWords[currentIndex];
    try {
      await reviewApi.submit(currentWord.id, correct);
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        setDueWords([]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const currentWord = dueWords[currentIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>REVIEW</Text>
        {dueWords.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {currentIndex + 1} / {dueWords.length}
          </Text>
        )}
      </View>

      {dueWords.length > 0 && currentWord ? (
        <View style={styles.content}>
          {/* Review Card */}
          <View style={[styles.reviewCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.wordContainer, { backgroundColor: colors.accent }]}>
              <Text style={styles.wordText}>{currentWord.word.toUpperCase()}</Text>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => handleSpeak(currentWord.word)}
                disabled={isSpeaking}
              >
                {isSpeaking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="volume-high" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {showAnswer && (
              <View style={styles.answerContainer}>
                <Text style={[styles.translation, { color: colors.textPrimary }]}>{currentWord.translation}</Text>
                {currentWord.context_sentence && (
                  <Text style={[styles.context, { color: colors.textMuted }]}>
                    "{currentWord.context_sentence}"
                  </Text>
                )}
              </View>
            )}

            {!showAnswer ? (
              <TouchableOpacity
                style={[styles.showButton, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => setShowAnswer(true)}
              >
                <Text style={[styles.showButtonText, { color: colors.accent }]}>SHOW ANSWER</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.answerButton, styles.wrongButton]}
                  onPress={() => handleAnswer(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                  <Text style={styles.answerButtonText}>WRONG</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.answerButton, styles.correctButton]}
                  onPress={() => handleAnswer(true)}
                >
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={styles.answerButtonText}>CORRECT</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressBar, { width: `${((currentIndex + 1) / dueWords.length) * 100}%`, backgroundColor: colors.accent }]} />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {/* No Reviews */}
          <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>ALL CAUGHT UP!</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No words due for review right now</Text>
          </View>

          {/* Recent Stories */}
          {recentStories.length > 0 && (
            <View style={styles.storiesSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>RECENT STORIES</Text>
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '900', letterSpacing: 2 },
  subtitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', letterSpacing: 1 },
  content: { flex: 1, padding: SPACING.lg },
  reviewCard: { borderRadius: 24, borderWidth: 3, overflow: 'hidden', ...SHADOWS.large },
  wordContainer: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  wordText: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textAlign: 'center' },
  speakButton: { padding: SPACING.md },
  answerContainer: { padding: SPACING.xl, gap: SPACING.md },
  translation: { fontSize: FONT_SIZES.xxl, fontWeight: '700', textAlign: 'center' },
  context: { fontSize: FONT_SIZES.md, fontWeight: '600', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  showButton: { margin: SPACING.xl, padding: SPACING.lg, borderRadius: 12, borderWidth: 3, alignItems: 'center' },
  showButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '900', letterSpacing: 1.5 },
  buttonContainer: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.xl },
  answerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, borderRadius: 12, borderWidth: 3, borderColor: '#000', gap: SPACING.sm },
  wrongButton: { backgroundColor: '#F44336' },
  correctButton: { backgroundColor: '#4CAF50' },
  answerButtonText: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  progressBarContainer: { height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#000', overflow: 'hidden', marginTop: SPACING.xl },
  progressBar: { height: '100%' },
  emptyCard: { padding: SPACING.xxl, borderRadius: 24, borderWidth: 3, alignItems: 'center', ...SHADOWS.large },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.lg, fontWeight: '600', textAlign: 'center' },
  storiesSection: { marginTop: SPACING.xxl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '900', letterSpacing: 1.5, marginBottom: SPACING.md },
  storyCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 12, borderWidth: 3, marginBottom: SPACING.sm, ...SHADOWS.small },
  storyIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  storyInfo: { flex: 1 },
  storyTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: SPACING.xs / 2 },
  storyDate: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
});