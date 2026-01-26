import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAuthStore } from '../../src/store/authStore';
import { storyApi, wordApi, ttsApi } from '../../src/services/api';
import { WordModal } from '../../src/components/WordModal';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLocalization } from '../../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Voice options for different languages
const getVoiceForLanguage = (language: string): string => {
  const voiceMap: { [key: string]: string } = {
    'English': 'coral',
    'Spanish': 'nova',
    'French': 'shimmer',
    'German': 'echo',
    'Italian': 'nova',
    'Portuguese': 'coral',
    'Russian': 'onyx',
    'Chinese': 'nova',
    'Japanese': 'shimmer',
    'Korean': 'nova',
    'Arabic': 'onyx',
  };
  return voiceMap[language] || 'coral';
};

export default function StoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLocalization();

  // Story state
  const [story, setStory] = useState<Story | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Animation for the progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Word modal state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState('');
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Setup audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadStory = async () => {
    if (!id) return;

    try {
      // Always try to load the story
      const storyRes = await storyApi.getOne(id as string);
      setStory(storyRes.data);
      
      // Only load saved words if user is logged in
      if (user) {
        try {
          const wordsRes = await wordApi.getAll(user.id);
          const savedSet = new Set(wordsRes.data.map((w: SavedWord) => w.word.toLowerCase()));
          setSavedWords(savedSet);
        } catch (e) {
          console.log('Could not load saved words');
        }
      }
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStory();
  }, [id]);

  // Generate and load audio
  const generateAudio = async () => {
    if (!story || isGeneratingAudio || audioLoaded) return;

    setIsGeneratingAudio(true);
    try {
      const voice = getVoiceForLanguage(story.language);
      const response = await ttsApi.generate(story.content, voice, 1.0);
      
      if (response.data.audio_base64) {
        // Save to temporary file
        const audioUri = FileSystem.cacheDirectory + `story_${story.id}.mp3`;
        await FileSystem.writeAsStringAsync(audioUri, response.data.audio_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Load the sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setAudioLoaded(true);
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // Update progress animation
      if (status.durationMillis > 0) {
        const progress = status.positionMillis / status.durationMillis;
        progressAnim.setValue(progress);
      }
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        progressAnim.setValue(0);
      }
    }
  }, []);

  const handlePlayPause = async () => {
    if (!audioLoaded) {
      await generateAudio();
      return;
    }

    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleSeek = async (percentage: number) => {
    if (!sound || !duration) return;
    const newPosition = percentage * duration;
    await sound.setPositionAsync(newPosition);
  };

  const handleSkipBack = async () => {
    if (!sound) return;
    const newPosition = Math.max(0, position - 10000); // Skip back 10 seconds
    await sound.setPositionAsync(newPosition);
  };

  const handleSkipForward = async () => {
    if (!sound) return;
    const newPosition = Math.min(duration, position + 10000); // Skip forward 10 seconds
    await sound.setPositionAsync(newPosition);
  };

  const handleSpeedChange = async () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    setPlaybackSpeed(newSpeed);
    
    if (sound) {
      await sound.setRateAsync(newSpeed, true);
    }
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWordPress = async (word: string, sentence: string) => {
    const cleanWord = word.replace(/[^\p{L}\p{M}'-]/gu, '');
    if (!cleanWord) return;

    // Pause audio when tapping a word
    if (sound && isPlaying) {
      await sound.pauseAsync();
    }

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
            { color: colors.textPrimary },
            isSaved && [styles.savedWord, { backgroundColor: `${colors.accent}25`, borderBottomColor: colors.accent }],
          ]}
        >
          {word.replace(/[^\p{L}\p{M}'-]/gu, '')}
          <Text style={[styles.punctuation, { color: colors.textPrimary }]}>{punctuation} </Text>
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading.toUpperCase()}...</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>STORY NOT FOUND</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.accent }]}>{t.back.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>READING</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {story.title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Language & Level Badge */}
      <View style={[styles.badgeContainer, { backgroundColor: colors.white }]}>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={styles.badgeText}>{story.language.toUpperCase()}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isDarkMode ? colors.borderLight : '#E8E8E8' }]}>
          <Text style={[styles.badgeText, { color: colors.textPrimary }]}>{story.level.toUpperCase()}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isDarkMode ? colors.borderLight : '#E8E8E8' }]}>
          <Text style={[styles.badgeText, { color: colors.textPrimary }]}>{story.topic.toUpperCase()}</Text>
        </View>
      </View>

      {/* Tip Banner */}
      <View style={[styles.tipBanner, { backgroundColor: isDarkMode ? colors.white : '#FFF8F0', borderColor: colors.accent }]}>
        <Ionicons name="hand-left-outline" size={18} color={colors.accent} />
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          Tap any word to translate & save it
        </Text>
      </View>

      {/* Story Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.storyContent, { backgroundColor: colors.white }]}>
          {renderContent()}
        </View>
        {/* Add padding for audio player */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Audio Player - Spotify Style */}
      <View style={[styles.audioPlayer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#282828' }]}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity 
            style={styles.progressBarTouch}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const percentage = locationX / (SCREEN_WIDTH - 32);
              handleSeek(percentage);
            }}
          >
            <View style={[styles.progressBar, { backgroundColor: '#4A4A4A' }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.accent,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.progressDot,
                  { 
                    backgroundColor: '#FFFFFF',
                    left: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Now Playing Info */}
        <View style={styles.nowPlayingInfo}>
          <View style={[styles.albumArt, { backgroundColor: colors.accent }]}>
            <Ionicons name="book" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{story.title}</Text>
            <Text style={styles.trackArtist}>{story.language} Story • {story.level}</Text>
          </View>
          <TouchableOpacity onPress={handleSpeedChange} style={styles.speedBadge}>
            <Text style={styles.speedBadgeText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleSkipBack}>
            <Ionicons name="play-back" size={24} color="#FFFFFF" />
            <Text style={styles.skipText}>10</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.playPauseButton, { backgroundColor: colors.accent }]} 
            onPress={handlePlayPause}
            disabled={isGeneratingAudio}
          >
            {isGeneratingAudio ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={32} 
                color="#FFFFFF" 
                style={!isPlaying ? { marginLeft: 4 } : undefined}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleSkipForward}>
            <Ionicons name="play-forward" size={24} color="#FFFFFF" />
            <Text style={styles.skipText}>10</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Status */}
        {isGeneratingAudio && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.statusText}>Generating audio with AI...</Text>
          </View>
        )}
        {!audioLoaded && !isGeneratingAudio && (
          <Text style={styles.statusText}>Tap play to generate audio</Text>
        )}
      </View>

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginTop: SPACING.md,
    letterSpacing: 1,
  },
  backLink: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
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
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  storyContent: {
    padding: SPACING.xl,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  word: {
    fontSize: 18,
    lineHeight: 32,
  },
  savedWord: {
    borderBottomWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  punctuation: {},
  
  // Audio Player Styles - Spotify-like
  audioPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.lg,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBarTouch: {
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  nowPlayingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: FONT_SIZES.sm,
    color: '#AAAAAA',
  },
  speedBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  speedBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipText: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: '#888888',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
