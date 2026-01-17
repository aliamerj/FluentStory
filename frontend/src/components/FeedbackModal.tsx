import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';
import { feedbackApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, onSubmitSuccess }) => {
  const { user } = useAuthStore();
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'bug', label: 'Bug Report', icon: 'bug' },
    { id: 'feature', label: 'Feature Request', icon: 'bulb' },
    { id: 'improvement', label: 'Improvement', icon: 'trending-up' },
    { id: 'other', label: 'Other', icon: 'chatbox' },
  ];

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await feedbackApi.submit(user.id, {
        rating: rating || undefined,
        message: message.trim(),
        category: category || undefined,
        user_context: {
          native_language: user.native_language,
          target_language: user.target_language,
          proficiency_level: user.proficiency_level,
        },
      });

      setSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess?.();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setCategory('');
    setMessage('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={styles.modalContent}>
          {submitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.accent} />
              </View>
              <Text style={styles.successTitle}>THANK YOU!</Text>
              <Text style={styles.successText}>
                Your feedback helps us improve FluentStory
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>SEND FEEDBACK</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Rating */}
                <Text style={styles.label}>HOW'S YOUR EXPERIENCE?</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={rating && rating >= star ? 'star' : 'star-outline'}
                        size={40}
                        color={rating && rating >= star ? COLORS.accent : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Category */}
                <Text style={styles.label}>CATEGORY (OPTIONAL)</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        category === cat.id && styles.categoryButtonActive,
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={20}
                        color={category === cat.id ? COLORS.white : COLORS.black}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          category === cat.id && styles.categoryTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Message */}
                <Text style={styles.label}>YOUR FEEDBACK</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tell us what you think..."
                  placeholderTextColor={COLORS.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!message.trim() || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>SUBMIT FEEDBACK</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.black,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.black,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    minHeight: 120,
    marginBottom: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.black,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  successContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  successIcon: {
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
