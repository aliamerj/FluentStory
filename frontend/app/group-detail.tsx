import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useAuthStore } from '../src/store/authStore';
import { wordApi } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLocalization } from '../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';
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

const getLanguageCode = (language: string): string => {
  const langMap: { [key: string]: string } = {
    'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR',
    'German': 'de-DE', 'Italian': 'it-IT', 'Portuguese': 'pt-BR',
    'Chinese': 'zh-CN', 'Japanese': 'ja-JP', 'Korean': 'ko-KR',
  };
  return langMap[language] || 'es-ES';
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useLocalization();
  
  const dayName = params.dayName as string;
  const color = params.color as string;
  const icon = params.icon as string;
  
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  useEffect(() => {
    loadWordsForDay();
  }, []);

  const loadWordsForDay = async () => {
    if (!user) return;
    
    try {
      const response = await wordApi.getAll(user.id, 'all');
      const allWords = response.data;
      
      // Filter words for this specific day
      const dayWords = allWords.filter((word: Word) => {
        const wordDate = parseISO(word.date_saved);
        const dayOfWeek = format(wordDate, 'EEEE');
        return dayOfWeek === dayName;
      });
      
      setWords(dayWords.sort((a, b) => parseISO(b.date_saved).getTime() - parseISO(a.date_saved).getTime()));
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (word: Word) => {
    if (speakingWordId === word.id) return;
    
    setSpeakingWordId(word.id);
    try {
      const langCode = getLanguageCode(user?.target_language || 'Spanish');
      await Speech.speak(word.word, {
        language: langCode,
        rate: 0.75,
        pitch: 1.0,
        onDone: () => setSpeakingWordId(null),
        onError: () => setSpeakingWordId(null),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingWordId(null);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!user) return;
    
    try {
      await wordApi.delete(wordId, user.id);
      setWords(words.filter((w) => w.id !== wordId));
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const handleStudy = () => {
    router.push({
      pathname: '/study-mode',
      params: {
        words: JSON.stringify(words),
        dayName: dayName,
        color: color,
      },
    });
  };

  const getMasteryProgress = (level: number) => {
    return Math.min((level / 8) * 100, 100);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name={icon as any} size={40} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{dayName.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>
            {words.length} {words.length === 1 ? 'WORD' : 'WORDS'}
          </Text>
        </View>
      </View>

      {/* Study Button */}
      {words.length > 0 && (
        <TouchableOpacity
          style={[styles.studyButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
          onPress={handleStudy}
        >
          <Ionicons name="school" size={24} color="#FFFFFF" />
          <Text style={styles.studyButtonText}>{t.study}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {words.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No words found for this day</Text>
            <TouchableOpacity
              style={[styles.backToGroupsButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backToGroupsText}>BACK TO GROUPS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          words.map((word) => (
            <View key={word.id} style={[styles.wordCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <View style={styles.wordHeader}>
                <View style={styles.wordMain}>
                  <Text style={[styles.wordText, { color: colors.textPrimary }]}>{word.word.toUpperCase()}</Text>
                  <TouchableOpacity 
                    onPress={() => handleSpeak(word)} 
                    style={[styles.speakButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
                    disabled={speakingWordId === word.id}
                  >
                    {speakingWordId === word.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="volume-high" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteWord(word.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.translationText, { color: colors.textSecondary }]}>{word.translation}</Text>
              
              {word.context_sentence && (
                <Text style={[styles.contextText, { color: colors.textMuted }]} numberOfLines={2}>
                  "{word.context_sentence}"
                </Text>
              )}
              
              <View style={styles.wordFooter}>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[styles.progressFill, { width: `${getMasteryProgress(word.mastery_level)}%`, backgroundColor: color }]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                    {word.mastery_level >= 8 ? 'MASTERED' : `${word.mastery_level}/8`}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.xl, borderBottomWidth: 3, borderBottomColor: '#000', alignItems: 'center' },
  backButton: { position: 'absolute', left: SPACING.lg, top: SPACING.xl, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerContent: { alignItems: 'center', marginTop: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginTop: SPACING.md, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1, marginTop: SPACING.xs, opacity: 0.9 },
  studyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: SPACING.lg, padding: SPACING.lg, borderRadius: 16, borderWidth: 3, gap: SPACING.sm, ...SHADOWS.large },
  studyButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
  scrollContent: { padding: SPACING.lg },
  wordCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 3, marginBottom: SPACING.md, ...SHADOWS.medium },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  wordMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  wordText: { fontSize: FONT_SIZES.xl, fontWeight: '900', letterSpacing: 1, flex: 1 },
  speakButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  deleteButton: { padding: SPACING.sm },
  translationText: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING.sm },
  contextText: { fontSize: FONT_SIZES.sm, fontWeight: '600', fontStyle: 'italic', lineHeight: 20, marginBottom: SPACING.md },
  wordFooter: { marginTop: SPACING.sm },
  progressContainer: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { flex: 1, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#000', overflow: 'hidden', marginRight: SPACING.sm },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 0.5, minWidth: 60, textAlign: 'right' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: SPACING.xl },
  emptyText: { fontSize: FONT_SIZES.lg, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.xl },
  backToGroupsButton: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 12, borderWidth: 3 },
  backToGroupsText: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
});