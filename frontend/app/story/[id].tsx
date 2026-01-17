import React, { useEffect, useState } from 'react';
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
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';

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

// Map language names to speech codes
const getLanguageCode = (language: string): string => {
  const langMap: { [key: string]: string } = {
    'English': 'en-US',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-BR',
    'Russian': 'ru-RU',
    'Chinese': 'zh-CN',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
    'Arabic': 'ar-SA',
    'Hindi': 'hi-IN',
    'Dutch': 'nl-NL',
    'Polish': 'pl-PL',
    'Swedish': 'sv-SE',
    'Turkish': 'tr-TR',
  };
  return langMap[language] || language.toLowerCase().substring(0, 2);
};

export default function StoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { colors } = useTheme();

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

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];

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
      const langCode = getLanguageCode(story.language);
      await Speech.speak(story.content, {
        language: langCode,
        rate: playbackSpeed * 0.85, // Slightly slower for learning
        pitch: 1.0,
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
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>LOADING STORY...</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>STORY NOT FOUND</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.headerMeta}>
            {story.language.toUpperCase()} / {story.level.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Audio Controls */}
      <View style={styles.audioControls}>
        <TouchableOpacity 
          onPress={handlePlayPause} 
          style={styles.playButton}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle}>
            {isPlaying ? 'NOW PLAYING' : 'TEXT-TO-SPEECH'}
          </Text>
          <Text style={styles.audioSubtitle}>TAP TO LISTEN</Text>
        </View>
        <TouchableOpacity onPress={handleSpeedChange} style={styles.speedButton}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Instruction */}
      <View style={styles.instructionBar}>
        <Ionicons name="finger-print" size={16} color={COLORS.accent} />
        <Text style={styles.instructionText}>TAP ANY WORD TO TRANSLATE</Text>
      </View>

      {/* Story Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 2,
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
    fontWeight: '900',
    color: COLORS.black,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  backLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    marginTop: SPACING.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    backgroundColor: COLORS.white,
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
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  headerMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 1,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  playButton: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  audioSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontWeight: '600',
    letterSpacing: 1,
  },
  speedButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  speedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundAlt,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderLight,
  },
  instructionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  storyContent: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.sm,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  word: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 32,
    color: COLORS.black,
  },
  savedWord: {
    backgroundColor: COLORS.saved,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  punctuation: {
    color: COLORS.black,
  },
});
