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
import * as Speech from 'expo-speech';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants/theme';
import { Button } from './Button';

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
  const { colors, isDarkMode } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const langCode = getLanguageCode(language);
      await Speech.speak(word, {
        language: langCode,
        rate: 0.75, // Slower for better clarity
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
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
            <View style={[styles.content, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              
              <View style={styles.header}>
                <Text style={[styles.word, { color: colors.textPrimary }]}>{word}</Text>
                <TouchableOpacity onPress={handleSpeak} style={[styles.speakButton, { backgroundColor: colors.accent }]}>
                  {isSpeaking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="volume-high" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>TRANSLATING...</Text>
                </View>
              ) : (
                <Text style={[styles.translation, { color: colors.accent }]}>{translation || 'Translation unavailable'}</Text>
              )}

              <View style={[styles.contextContainer, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>CONTEXT</Text>
                <Text style={[styles.contextSentence, { color: colors.textSecondary }]}>{contextSentence}</Text>
              </View>

              <View style={styles.actions}>
                {isAlreadySaved ? (
                  <>
                    <View style={[styles.savedBadge, { backgroundColor: colors.success }]}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
                    icon={<Ionicons name="bookmark" size={18} color="#FFFFFF" />}
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 4,
  },
  handle: {
    width: 60,
    height: 4,
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
    textTransform: 'uppercase',
  },
  speakButton: {
    width: 50,
    height: 50,
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
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
  translation: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  contextContainer: {
    padding: SPACING.md,
    borderWidth: 2,
    marginBottom: SPACING.lg,
  },
  contextLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  contextSentence: {
    fontSize: FONT_SIZES.md,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  savedText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
