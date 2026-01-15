import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { Button } from './Button';
import { ttsApi } from '../services/api';

interface WordModalProps {
  visible: boolean;
  onClose: () => void;
  word: string;
  translation: string | null;
  contextSentence: string;
  language: string;
  isAlreadySaved: boolean;
  onSave: () => Promise<void>;
  onRemove?: () => Promise<void>;
  isLoading?: boolean;
}

export const WordModal: React.FC<WordModalProps> = ({
  visible,
  onClose,
  word,
  translation,
  contextSentence,
  language,
  isAlreadySaved,
  onSave,
  onRemove,
  isLoading = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      // Use AI TTS for natural speech
      const response = await ttsApi.generate(word, 'nova', 0.9);
      const audioBase64 = response.data.audio_base64;
      
      // Play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      setIsSaving(true);
      try {
        await onRemove();
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Text style={styles.word}>{word}</Text>
                <TouchableOpacity onPress={handleSpeak} style={styles.speakButton}>
                  {isSpeaking ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons name="volume-high" size={24} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.black} />
                  <Text style={styles.loadingText}>TRANSLATING...</Text>
                </View>
              ) : (
                <Text style={styles.translation}>{translation || 'Translation unavailable'}</Text>
              )}

              <View style={styles.contextContainer}>
                <Text style={styles.contextLabel}>CONTEXT</Text>
                <Text style={styles.contextSentence}>{contextSentence}</Text>
              </View>

              <View style={styles.actions}>
                {isAlreadySaved ? (
                  <>
                    <View style={styles.savedBadge}>
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                      <Text style={styles.savedText}>SAVED</Text>
                    </View>
                    {onRemove && (
                      <Button
                        title="Remove"
                        onPress={handleRemove}
                        variant="outline"
                        size="sm"
                        loading={isSaving}
                      />
                    )}
                  </>
                ) : (
                  <Button
                    title="Save Word"
                    onPress={handleSave}
                    fullWidth
                    loading={isSaving}
                    variant="accent"
                    icon={<Ionicons name="bookmark" size={18} color={COLORS.white} />}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 4,
    borderTopColor: COLORS.black,
  },
  handle: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.black,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  word: {
    fontSize: FONT_SIZES.title,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  speakButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
  translation: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.accent,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  contextContainer: {
    backgroundColor: COLORS.backgroundAlt,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.borderMuted,
    marginBottom: SPACING.lg,
  },
  contextLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  contextSentence: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  savedText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
