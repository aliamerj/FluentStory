import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAuthStore } from '../src/store/authStore';
import { reviewApi } from '../src/services/api';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants/theme';

interface Word {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
  mastery_level: number;
}

type ReviewType = 'blank' | 'multiple_choice' | 'translation';

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [reviewType, setReviewType] = useState<ReviewType>('blank');
  const [options, setOptions] = useState<string[]>([]);
  const [results, setResults] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const loadReviews = async () => {
    if (!user) return;

    try {
      const response = await reviewApi.getDue(user.id);
      const dueWords = response.data.words;
      setWords(dueWords);
      if (dueWords.length > 0) {
        setupQuestion(dueWords, 0);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupQuestion = (wordList: Word[], index: number) => {
    const word = wordList[index];
    if (!word) return;

    // Randomly select review type
    const types: ReviewType[] = ['blank', 'multiple_choice', 'translation'];
    const type = types[Math.floor(Math.random() * types.length)];
    setReviewType(type);

    if (type === 'multiple_choice') {
      // Generate options
      const correctAnswer = word.translation;
      const wrongAnswers = wordList
        .filter((w) => w.id !== word.id)
        .map((w) => w.translation)
        .slice(0, 3);
      
      // If not enough wrong answers, add some dummy ones
      while (wrongAnswers.length < 3) {
        wrongAnswers.push('---');
      }

      const allOptions = [correctAnswer, ...wrongAnswers]
        .sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    }

    setShowAnswer(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    loadReviews();
  }, [user]);

  const currentWord = words[currentIndex];

  const handleSpeak = async () => {
    if (!currentWord) return;
    try {
      await Speech.speak(currentWord.word, {
        language: user?.target_language?.toLowerCase().substring(0, 2) || 'es',
        rate: 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const handleAnswer = async (answer: string, correct: boolean) => {
    if (!currentWord || !user) return;

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setShowAnswer(true);

    // Submit review result
    try {
      await reviewApi.submit(user.id, currentWord.id, correct);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }

    setResults({
      correct: results.correct + (correct ? 1 : 0),
      total: results.total + 1,
    });
  };

  const handleKnew = () => handleAnswer('knew', true);
  const handleDidntKnow = () => handleAnswer('didnt_know', false);

  const handleSelectOption = (option: string) => {
    const correct = option === currentWord.translation;
    handleAnswer(option, correct);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setupQuestion(words, nextIndex);
    } else {
      // Review complete - stay on summary
    }
  };

  const handleFinish = () => {
    router.back();
  };

  // Get sentence with word blanked out
  const getBlankSentence = () => {
    if (!currentWord) return '';
    return currentWord.context_sentence.replace(
      new RegExp(`\\b${currentWord.word}\\b`, 'gi'),
      '_____'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            No words are due for review right now.
          </Text>
          <Button
            title="Back to Home"
            onPress={() => router.back()}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Review Complete Summary
  if (showAnswer && currentIndex === words.length - 1 && results.total === words.length) {
    const percentage = Math.round((results.correct / results.total) * 100);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name={percentage >= 70 ? 'trophy' : 'refresh'}
              size={60}
              color={percentage >= 70 ? COLORS.warning : COLORS.primary}
            />
          </View>
          <Text style={styles.summaryTitle}>Review Complete!</Text>
          <Text style={styles.summaryScore}>
            {results.correct}/{results.total} correct
          </Text>
          <Text style={styles.summaryPercentage}>{percentage}%</Text>
          
          {percentage >= 70 ? (
            <Text style={styles.summaryMessage}>Great job! Keep it up!</Text>
          ) : (
            <Text style={styles.summaryMessage}>
              Keep practicing! You'll get better.
            </Text>
          )}

          <Button
            title="Done"
            onPress={handleFinish}
            fullWidth
            size="lg"
            style={{ marginTop: SPACING.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / words.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1}/{words.length}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        {reviewType === 'blank' && (
          <>
            <Text style={styles.questionLabel}>Fill in the blank:</Text>
            <Card style={styles.sentenceCard}>
              <Text style={styles.sentenceText}>{getBlankSentence()}</Text>
            </Card>
            <TouchableOpacity onPress={handleSpeak} style={styles.speakHint}>
              <Ionicons name="volume-high" size={20} color={COLORS.primary} />
              <Text style={styles.speakHintText}>Tap to hear the word</Text>
            </TouchableOpacity>
          </>
        )}

        {reviewType === 'multiple_choice' && (
          <>
            <Text style={styles.questionLabel}>What does this mean?</Text>
            <View style={styles.wordDisplay}>
              <Text style={styles.wordText}>{currentWord.word}</Text>
              <TouchableOpacity onPress={handleSpeak}>
                <Ionicons name="volume-high" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {reviewType === 'translation' && (
          <>
            <Text style={styles.questionLabel}>Recall the translation:</Text>
            <View style={styles.wordDisplay}>
              <Text style={styles.wordText}>{currentWord.word}</Text>
              <TouchableOpacity onPress={handleSpeak}>
                <Ionicons name="volume-high" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Card style={styles.sentenceCard}>
              <Text style={styles.contextLabel}>Context:</Text>
              <Text style={styles.contextText}>{currentWord.context_sentence}</Text>
            </Card>
          </>
        )}
      </View>

      {/* Answer Section */}
      <View style={styles.answerContainer}>
        {showAnswer ? (
          <View style={styles.resultContainer}>
            <View
              style={[
                styles.resultBadge,
                isCorrect ? styles.resultCorrect : styles.resultIncorrect,
              ]}
            >
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={isCorrect ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.resultText,
                  isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect,
                ]}
              >
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            <Card style={styles.answerCard}>
              <Text style={styles.answerWord}>{currentWord.word}</Text>
              <Text style={styles.answerTranslation}>{currentWord.translation}</Text>
              <Text style={styles.answerContext}>"{currentWord.context_sentence}"</Text>
            </Card>
            <Button
              title={currentIndex < words.length - 1 ? 'Next' : 'See Results'}
              onPress={handleNext}
              fullWidth
              size="lg"
            />
          </View>
        ) : (
          <>
            {reviewType === 'multiple_choice' ? (
              <View style={styles.optionsGrid}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionButton}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.selfReviewButtons}>
                <Button
                  title="I didn't know"
                  onPress={handleDidntKnow}
                  variant="outline"
                  style={styles.reviewButton}
                />
                <Button
                  title="I knew it!"
                  onPress={handleKnew}
                  style={styles.reviewButton}
                />
              </View>
            )}
          </>
        )}
      </View>
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
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  questionContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  questionLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  sentenceCard: {
    padding: SPACING.lg,
  },
  sentenceText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  wordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  wordText: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  speakHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  speakHintText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  contextLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  contextText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  answerContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  optionsGrid: {
    gap: SPACING.sm,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  selfReviewButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  reviewButton: {
    flex: 1,
  },
  resultContainer: {
    gap: SPACING.md,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  resultCorrect: {
    backgroundColor: COLORS.success + '20',
  },
  resultIncorrect: {
    backgroundColor: COLORS.error + '20',
  },
  resultText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  resultTextCorrect: {
    color: COLORS.success,
  },
  resultTextIncorrect: {
    color: COLORS.error,
  },
  answerCard: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  answerWord: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  answerTranslation: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  answerContext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  summaryIcon: {
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryScore: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  summaryPercentage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  summaryMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});
