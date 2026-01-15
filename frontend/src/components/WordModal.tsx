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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
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

  const handleSpeak = async () => {
    setIsSpeaking(true);
    try {
      await Speech.speak(word, {
        language: language.toLowerCase().substring(0, 2),
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
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
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="volume-high" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Translating...</Text>
                </View>
              ) : (
                <Text style={styles.translation}>{translation || 'Translation unavailable'}</Text>
              )}

              <View style={styles.contextContainer}>
                <Text style={styles.contextLabel}>Context:</Text>
                <Text style={styles.contextSentence}>{contextSentence}</Text>
              </View>

              <View style={styles.actions}>
                {isAlreadySaved ? (
                  <>
                    <View style={styles.savedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={styles.savedText}>Already saved</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  word: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  speakButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.full,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  translation: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  contextContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  contextLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  contextSentence: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
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
  },
  savedText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
