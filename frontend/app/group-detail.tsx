import React, { useState } from 'react';
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
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';

interface Word {
  id: string;
  word: string;
  translation: string;
  context_sentence: string;
  date_saved: string;
  mastery_level: number;
  next_review_date: string;
}

// Map language names to speech codes
const getLanguageCode = (language: string): string => {
  const langMap: { [key: string]: string } = {
    'English': 'en-US',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-BR',
    'Chinese': 'zh-CN',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
  };
  return langMap[language] || 'es-ES';
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const dayName = params.dayName as string;
  const color = params.color as string;
  const icon = params.icon as string;
  const wordsData = params.words ? JSON.parse(params.words as string) : [];
  
  const [words, setWords] = useState<Word[]>(wordsData);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

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

  const getMasteryProgress = (level: number) => {
    return Math.min((level / 8) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name={icon as any} size={40} color={COLORS.white} />
          <Text style={styles.headerTitle}>{dayName.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>
            {words.length} {words.length === 1 ? 'WORD' : 'WORDS'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {words.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>All words have been removed</Text>
            <TouchableOpacity
              style={styles.backToGroupsButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToGroupsText}>BACK TO GROUPS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          words.map((word) => (
            <View key={word.id} style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <View style={styles.wordMain}>
                  <Text style={styles.wordText}>{word.word.toUpperCase()}</Text>
                  <TouchableOpacity 
                    onPress={() => handleSpeak(word)} 
                    style={styles.speakButton}
                    disabled={speakingWordId === word.id}
                  >
                    {speakingWordId === word.id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="volume-high" size={18} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteWord(word.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.translationText}>{word.translation}</Text>
              
              {word.context_sentence && (
                <Text style={styles.contextText} numberOfLines={2}>
                  "{word.context_sentence}"
                </Text>
              )}
              
              <View style={styles.wordFooter}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getMasteryProgress(word.mastery_level)}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: SPACING.lg,
    top: SPACING.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginTop: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
    marginTop: SPACING.xs,
    opacity: 0.9,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  wordCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.black,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  wordMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wordText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1.5,
    flex: 1,
  },
  speakButton: {
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.black,
    marginLeft: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  translationText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  contextText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  wordFooter: {
    marginTop: SPACING.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.black,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 0.5,
    minWidth: 60,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  backToGroupsButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.black,
  },
  backToGroupsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
});
