import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLocalization } from '../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Word {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
  date_saved: string;
  mastery_level: number;
  next_review_date: string;
}

export default function StudyModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { t } = useLocalization();
  
  const wordsData = params.words ? JSON.parse(params.words as string) : [];
  const dayName = params.dayName as string;
  const color = (params.color as string) || colors.accent;
  
  const [wordQueue, setWordQueue] = useState<Word[]>(wordsData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => showAnswer,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe RIGHT - Know it
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe LEFT - Don't know
          swipeLeft();
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      nextCard();
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      // Add word back to end of queue
      const currentWord = wordQueue[currentIndex];
      setWordQueue([...wordQueue, currentWord]);
      nextCard();
    });
  };

  const nextCard = () => {
    position.setValue({ x: 0, y: 0 });
    setShowAnswer(false);
    
    if (currentIndex >= wordQueue.length - 1) {
      setStudyComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentWord = wordQueue[currentIndex];

  if (studyComplete || wordQueue.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.completeContainer}>
          <View style={[styles.completeIcon, { backgroundColor: color }]}>
            <Ionicons name=\"checkmark-circle\" size={80} color=\"#FFFFFF\" />
          </View>
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>{t.studyComplete}</Text>
          <Text style={[styles.completeText, { color: colors.textMuted }]}>
            Great job! You've studied all words from {dayName}
          </Text>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: color, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name=\"close\" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {currentIndex + 1} / {wordQueue.length}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <View style={[styles.instructionIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name=\"arrow-forward\" size={20} color=\"#FFFFFF\" />
          </View>
          <Text style={[styles.instructionText, { color: colors.textMuted }]}>{t.iKnowIt}</Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={[styles.instructionIcon, { backgroundColor: '#F44336' }]}>
            <Ionicons name=\"arrow-back\" size={20} color=\"#FFFFFF\" />
          </View>
          <Text style={[styles.instructionText, { color: colors.textMuted }]}>{t.iDontKnowIt}</Text>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <Animated.View
          {...(showAnswer ? panResponder.panHandlers : {})}
          style={[
            styles.card,
            {
              backgroundColor: colors.white,
              borderColor: colors.border,
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotate },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => !showAnswer && setShowAnswer(true)}
            activeOpacity={0.9}
          >
            <View style={[styles.cardHeader, { backgroundColor: color }]}>
              <Text style={styles.wordText}>{currentWord.word.toUpperCase()}</Text>
            </View>

            <View style={styles.cardBody}>
              {currentWord.context_sentence && (
                <View style={styles.contextContainer}>
                  <Ionicons name=\"quote\" size={20} color={colors.textMuted} />
                  <Text style={[styles.contextText, { color: colors.textSecondary }]}>
                    {currentWord.context_sentence}
                  </Text>
                </View>
              )}

              {!showAnswer ? (
                <View style={styles.tapHint}>
                  <Ionicons name=\"hand-left\" size={32} color={colors.textMuted} />
                  <Text style={[styles.tapHintText, { color: colors.textMuted }]}>
                    Tap to reveal meaning
                  </Text>
                </View>
              ) : (
                <View style={styles.answerContainer}>
                  <Text style={[styles.answerLabel, { color: colors.textMuted }]}>MEANING:</Text>
                  <Text style={[styles.answerText, { color: colors.textPrimary }]}>
                    {currentWord.translation}
                  </Text>
                  
                  <View style={styles.swipeHint}>
                    <Ionicons name=\"swap-horizontal\" size={24} color={colors.textMuted} />
                    <Text style={[styles.swipeHintText, { color: colors.textMuted }]}>
                      Swipe left or right
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Swipe Overlays */}
        <Animated.View
          style={[
            styles.swipeOverlay,
            styles.swipeOverlayLeft,
            { opacity: position.x.interpolate({ inputRange: [-SCREEN_WIDTH, 0], outputRange: [1, 0] }) },
          ]}
        >
          <Text style={styles.swipeOverlayText}>REVIEW AGAIN</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.swipeOverlay,
            styles.swipeOverlayRight,
            { opacity: position.x.interpolate({ inputRange: [0, SCREEN_WIDTH], outputRange: [0, 1] }) },
          ]}
        >
          <Text style={styles.swipeOverlayText}>GOT IT!</Text>
        </Animated.View>
      </View>

      {/* Action Buttons (when answer is shown) */}
      {showAnswer && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F44336', borderColor: colors.border }]}
            onPress={swipeLeft}
          >
            <Ionicons name=\"close\" size={32} color=\"#FFFFFF\" />
            <Text style={styles.actionButtonText}>{t.iDontKnowIt}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50', borderColor: colors.border }]}
            onPress={swipeRight}
          >
            <Ionicons name=\"checkmark\" size={32} color=\"#FFFFFF\" />
            <Text style={styles.actionButtonText}>{t.iKnowIt}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  closeButton: { padding: SPACING.xs },
  progress: { fontSize: FONT_SIZES.lg, fontWeight: '700', letterSpacing: 1 },
  instructions: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  instructionItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  instructionIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  instructionText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
  card: { width: '100%', borderRadius: 24, borderWidth: 3, overflow: 'hidden', ...SHADOWS.large },
  cardContent: { width: '100%' },
  cardHeader: { padding: SPACING.xxl, alignItems: 'center' },
  wordText: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textAlign: 'center' },
  cardBody: { padding: SPACING.xxl },
  contextContainer: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  contextText: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '600', lineHeight: 24, fontStyle: 'italic' },
  tapHint: { alignItems: 'center', paddingVertical: SPACING.xxl },
  tapHintText: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: SPACING.md, letterSpacing: 1 },
  answerContainer: { alignItems: 'center' },
  answerLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: SPACING.sm },
  answerText: { fontSize: FONT_SIZES.xxl, fontWeight: '900', textAlign: 'center', marginBottom: SPACING.xl },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
  swipeHintText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  swipeOverlay: { position: 'absolute', top: '35%', width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' },
  swipeOverlayLeft: { left: -SCREEN_WIDTH },
  swipeOverlayRight: { right: -SCREEN_WIDTH },
  swipeOverlayText: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  actionButtons: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  actionButton: { flex: 1, flexDirection: 'column', alignItems: 'center', padding: SPACING.lg, borderRadius: 16, borderWidth: 3, gap: SPACING.sm, ...SHADOWS.medium },
  actionButtonText: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  completeIcon: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xxl, ...SHADOWS.large },
  completeTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.md },
  completeText: { fontSize: FONT_SIZES.lg, fontWeight: '600', textAlign: 'center', lineHeight: 28, marginBottom: SPACING.xxl },
  doneButton: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg, borderRadius: 16, borderWidth: 3, ...SHADOWS.medium },
  doneButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
});
