import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
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

const getLanguageCode = (language: string): string => {
  const langMap: { [key: string]: string } = {
    'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR',
    'German': 'de-DE', 'Italian': 'it-IT', 'Portuguese': 'pt-BR',
    'Chinese': 'zh-CN', 'Japanese': 'ja-JP', 'Korean': 'ko-KR',
  };
  return langMap[language] || 'es-ES';
};

export default function DictionaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useLocalization();
  
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const loadWords = async () => {
    if (!user) return;
    try {
      const response = await wordApi.getAll(user.id, filter);
      setWords(response.data);
      setFilteredWords(response.data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [user, filter]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = words.filter((word) =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWords(filtered);
    } else {
      setFilteredWords(words);
    }
  }, [searchQuery, words]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  }, [user, filter]);

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

  const getMasteryColor = (level: number) => {
    if (level >= 8) return '#4CAF50';
    if (level >= 5) return colors.accent;
    return '#FFA500';
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.myWords}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{filteredWords.length} {t.words.toLowerCase()}</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={t.searchWords}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: filter === 'all' ? '#FFFFFF' : colors.textMuted }]}>{t.all}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'learning' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
          onPress={() => setFilter('learning')}
        >
          <Text style={[styles.filterText, { color: filter === 'learning' ? '#FFFFFF' : colors.textMuted }]}>{t.learning}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'mastered' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
          onPress={() => setFilter('mastered')}
        >
          <Text style={[styles.filterText, { color: filter === 'mastered' ? '#FFFFFF' : colors.textMuted }]}>{t.mastered}</Text>
        </TouchableOpacity>
      </View>

      {/* Words List */}
      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <View style={[styles.wordCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={styles.wordHeader}>
              <View style={styles.wordMain}>
                <Text style={[styles.wordText, { color: colors.textPrimary }]}>{item.word.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => handleSpeak(item)} style={[styles.speakButton, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                  {speakingWordId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="volume-high" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleDeleteWord(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.translationText, { color: colors.textSecondary }]}>{item.translation}</Text>
            
            {item.context_sentence && (
              <Text style={[styles.contextText, { color: colors.textMuted }]} numberOfLines={2}>
                "{item.context_sentence}"
              </Text>
            )}
            
            <View style={styles.wordFooter}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                  <View style={[styles.progressFill, { width: `${Math.min((item.mastery_level / 8) * 100, 100)}%`, backgroundColor: getMasteryColor(item.mastery_level) }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                  {item.mastery_level >= 8 ? 'MASTERED' : `${item.mastery_level}/8`}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {format(parseISO(item.date_saved), 'MMM d')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>NO WORDS YET</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Save words from stories to build your vocabulary!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md, borderRadius: 12, borderWidth: 3, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '600' },
  filterContainer: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  filterTab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: 8, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center' },
  filterText: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1 },
  listContent: { padding: SPACING.lg },
  wordCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 3, marginBottom: SPACING.md, ...SHADOWS.medium },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  wordMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  wordText: { fontSize: FONT_SIZES.xl, fontWeight: '900', letterSpacing: 1, flex: 1 },
  speakButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  translationText: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING.sm },
  contextText: { fontSize: FONT_SIZES.sm, fontWeight: '600', fontStyle: 'italic', lineHeight: 20, marginBottom: SPACING.md },
  wordFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  progressContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#000', overflow: 'hidden', marginRight: SPACING.sm },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 0.5, minWidth: 60 },
  dateText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.lg, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.md, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
});