import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAuthStore } from '../../src/store/authStore';
import { wordApi } from '../../src/services/api';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
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

interface Section {
  title: string;
  data: Word[];
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

export default function DictionaryScreen() {
  const { user } = useAuthStore();
  
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'learning' | 'mastered'>('all');
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const loadWords = async () => {
    if (!user) return;
    
    try {
      const response = await wordApi.getAll(user.id, filterType);
      setWords(response.data);
      setFilteredWords(response.data);
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
  }, [user, filterType]);

  useEffect(() => {
    loadWords();
  }, [user, filterType]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = words.filter(
        (word) =>
          word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          word.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWords(filtered);
    } else {
      setFilteredWords(words);
    }
  }, [searchQuery, words]);

  useEffect(() => {
    const grouped: { [key: string]: Word[] } = {};
    filteredWords.forEach((word) => {
      const dateKey = word.date_saved;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(word);
    });

    const sectionData: Section[] = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({
        title: format(parseISO(date), 'EEEE, MMMM d, yyyy').toUpperCase(),
        data: grouped[date],
      }));

    setSections(sectionData);
  }, [filteredWords]);

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

  const renderWordItem = ({ item }: { item: Word }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordMain}>
          <Text style={styles.wordText}>{item.word.toUpperCase()}</Text>
          <TouchableOpacity 
            onPress={() => handleSpeak(item)} 
            style={styles.speakButton}
            disabled={speakingWordId === item.id}
          >
            {speakingWordId === item.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="volume-high" size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleDeleteWord(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.translationText}>{item.translation}</Text>
      
      {item.context_sentence && (
        <Text style={styles.contextText} numberOfLines={2}>
          "{item.context_sentence}"
        </Text>
      )}
      
      <View style={styles.wordFooter}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getMasteryProgress(item.mastery_level)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.mastery_level >= 8 ? 'MASTERED' : `${item.mastery_level}/8`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>LOADING WORDS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>DICTIONARY</Text>
        <Text style={styles.subtitle}>{words.length} WORDS SAVED</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.black} />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH WORDS..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color={COLORS.black} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'learning', 'mastered'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.filterTabActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterTabText, filterType === type && styles.filterTabTextActive]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {words.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>NO WORDS YET</Text>
          <Text style={styles.emptyText}>
            Start reading stories and save words to build your vocabulary!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderWordItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.black}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>NO WORDS MATCH YOUR SEARCH</Text>
            </View>
          }
        />
      )}
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.black,
    fontWeight: '600',
    letterSpacing: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  filterTabActive: {
    backgroundColor: COLORS.black,
  },
  filterTabText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.black,
    fontWeight: '700',
    letterSpacing: 1,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
  },
  wordCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  wordText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  speakButton: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  translationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  contextText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  wordFooter: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
});
