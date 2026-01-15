import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAuthStore } from '../../src/store/authStore';
import { storyApi, wordApi } from '../../src/services/api';
import { WordModal } from '../../src/components/WordModal';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';

interface Story {
  id: string;
  title: string;
  content: string;
  language: string;
  level: string;
  topic: string;
}

interface SavedWord {
  id: string;
  word: string;
}

export default function StoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();

  const [story, setStory] = useState<Story | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Word modal state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState('');
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const loadStory = async () => {
    if (!id || !user) return;

    try {
      const [storyRes, wordsRes] = await Promise.all([
        storyApi.getOne(id as string),
        wordApi.getAll(user.id),
      ]);

      setStory(storyRes.data);
      
      const savedSet = new Set(wordsRes.data.map((w: SavedWord) => w.word.toLowerCase()));
      setSavedWords(savedSet);
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStory();
    
    return () => {
      Speech.stop();
    };
  }, [id, user]);

  const handlePlayPause = async () => {
    if (!story) return;

    if (isPlaying) {
      await Speech.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await Speech.speak(story.content, {
        language: story.language.toLowerCase().substring(0, 2),
        rate: playbackSpeed,
        onDone: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  };

  const handleSpeedChange = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setPlaybackSpeed(speedOptions[nextIndex]);
  };

  const handleWordPress = async (word: string, sentence: string) => {
    const cleanWord = word.replace(/[^\p{L}\p{M}'-]/gu, '');
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setSelectedSentence(sentence);
    setTranslation(null);
    setModalVisible(true);

    // Get translation
    setIsTranslating(true);
    try {
      const response = await wordApi.translate(
        cleanWord,
        story?.language || 'Spanish',
        user?.native_language || 'English'
      );
      setTranslation(response.data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslation('Translation unavailable');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveWord = async () => {
    if (!selectedWord || !user || !story) return;

    try {
      await wordApi.save(user.id, {
        word: selectedWord,
        context_sentence: selectedSentence,
        source_story_id: story.id,
        source_language: story.language,
        native_language: user.native_language,
      });

      setSavedWords(new Set([...savedWords, selectedWord.toLowerCase()]));
      setModalVisible(false);
    } catch (error: any) {
      console.error('Failed to save word:', error);
    }
  };

  const handleRemoveWord = async () => {
    // For simplicity, just close the modal
    // In a full implementation, you'd find the word ID and delete it
    setModalVisible(false);
  };

  const handleShare = async () => {
    if (!story) return;
    
    try {
      await Share.share({
        message: `Check out this story I'm reading on FluentStory:\n\n${story.title}\n\n${story.content.substring(0, 200)}...`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderWord = (word: string, index: number, sentence: string) => {
    const cleanWord = word.replace(/[^\p{L}\p{M}'-]/gu, '').toLowerCase();
    const isSaved = savedWords.has(cleanWord);
    const punctuation = word.replace(/[\p{L}\p{M}'-]/gu, '');

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleWordPress(word, sentence)}
        activeOpacity={0.6}
      >
        <Text
          style={[
            styles.word,
            isSaved && styles.savedWord,
          ]}
        >
          {word.replace(/[^\p{L}\p{M}'-]/gu, '')}
          <Text style={styles.punctuation}>{punctuation} </Text>
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (!story) return null;

    // Split content into sentences, then words
    const sentences = story.content.split(/(?<=[.!?])\s+/);
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/);
      return (
        <View key={sentenceIndex} style={styles.sentenceContainer}>
          {words.map((word, wordIndex) => renderWord(word, wordIndex, sentence))}
        </View>
      );
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.headerMeta}>
            {story.language} • {story.level}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Audio Controls */}
      <View style={styles.audioControls}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <Text style={styles.audioText}>
            {isPlaying ? 'Playing...' : 'Tap to listen'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSpeedChange} style={styles.speedButton}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Story Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.helpText}>
          Tap any word to see translation
        </Text>
        <View style={styles.storyContent}>
          {renderContent()}
        </View>
      </ScrollView>

      {/* Word Modal */}
      <WordModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        word={selectedWord || ''}
        translation={translation}
        contextSentence={selectedSentence}
        language={story.language}
        isAlreadySaved={savedWords.has((selectedWord || '').toLowerCase())}
        onSave={handleSaveWord}
        onRemove={handleRemoveWord}
        isLoading={isTranslating}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  backLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  speedButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  speedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  storyContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  word: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 32,
    color: COLORS.text,
  },
  savedWord: {
    backgroundColor: COLORS.savedWord,
    borderRadius: 4,
    overflow: 'hidden',
  },
  punctuation: {
    color: COLORS.text,
  },
});
