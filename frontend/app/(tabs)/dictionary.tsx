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
import { Card } from '../../src/components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';
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

export default function DictionaryScreen() {
  const { user } = useAuthStore();
  
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'learning' | 'mastered'>('all');

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
    // Filter words by search query
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
    // Group words by date
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
        title: format(parseISO(date), 'EEEE, MMMM d, yyyy'),
        data: grouped[date],
      }));

    setSections(sectionData);
  }, [filteredWords]);

  const handleSpeak = async (word: string) => {
    try {
      await Speech.speak(word, {
        language: user?.target_language?.toLowerCase().substring(0, 2) || 'es',
        rate: 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
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
          <Text style={styles.wordText}>{item.word}</Text>
          <TouchableOpacity onPress={() => handleSpeak(item.word)} style={styles.speakButton}>
            <Ionicons name="volume-high" size={18} color={COLORS.primary} />
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
            {item.mastery_level >= 8 ? 'Mastered' : `${item.mastery_level}/8 reviews`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} words</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dictionary</Text>
        <Text style={styles.subtitle}>{words.length} words saved</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
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
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {words.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No words yet</Text>
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
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No words match your search</Text>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sectionCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  wordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  speakButton: {
    padding: SPACING.xs,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  translationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
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
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
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
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
});
