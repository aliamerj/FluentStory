import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { storyApi } from '../src/services/api';
import { Button } from '../src/components/Button';
import { Dropdown } from '../src/components/Dropdown';
import { Input } from '../src/components/Input';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants/theme';
import { LANGUAGES, PROFICIENCY_LEVELS, CONTENT_TYPES, TOPICS } from '../src/constants/languages';

export default function GenerateScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();

  const [language, setLanguage] = useState(user?.target_language || 'Spanish');
  const [level, setLevel] = useState(user?.proficiency_level || 'Beginner');
  const [contentType, setContentType] = useState('Story');
  const [topic, setTopic] = useState('Daily Life & Routine');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const languageOptions = LANGUAGES.map((lang) => ({
    id: lang.name,
    label: `${lang.name} (${lang.nativeName})`,
  }));

  const levelOptions = PROFICIENCY_LEVELS.map((lvl) => ({
    id: lvl.id,
    label: lvl.label,
  }));

  const contentTypeOptions = CONTENT_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
    icon: type.icon,
  }));

  const topicOptions = TOPICS.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
  }));

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await storyApi.generate(user.id, {
        language,
        level,
        topic: customTopic || topic,
        content_type: contentType,
        custom_topic: customTopic || undefined,
      });

      await refreshUser();
      router.replace(`/story/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const storiesRemaining = user?.is_premium ? 'Unlimited' : `${5 - (user?.stories_generated_this_month || 0)} left this month`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Story</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stories Remaining */}
          <View style={styles.quotaBanner}>
            <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            <Text style={styles.quotaText}>{storiesRemaining}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Language Selection */}
          <Dropdown
            label="Language"
            options={languageOptions}
            selectedValue={language}
            onSelect={setLanguage}
            placeholder="Select language"
          />

          {/* Proficiency Level */}
          <Dropdown
            label="Proficiency Level"
            options={levelOptions}
            selectedValue={level}
            onSelect={setLevel}
            placeholder="Select your level"
          />

          {/* Content Type */}
          <Text style={styles.label}>Content Type</Text>
          <View style={styles.contentTypeGrid}>
            {CONTENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.contentTypeCard,
                  contentType === type.id && styles.contentTypeCardSelected,
                ]}
                onPress={() => setContentType(type.id)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={contentType === type.id ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.contentTypeLabel,
                    contentType === type.id && styles.contentTypeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Topic Selection */}
          <Dropdown
            label="Topic"
            options={topicOptions}
            selectedValue={topic}
            onSelect={(value) => {
              setTopic(value);
              setCustomTopic('');
            }}
            placeholder="Select a topic"
          />

          {/* Custom Topic */}
          <Text style={styles.orText}>OR</Text>
          <Input
            label="Custom Topic"
            placeholder="Write your own topic..."
            value={customTopic}
            onChangeText={setCustomTopic}
            multiline
            numberOfLines={2}
          />

          {/* Generate Button */}
          <Button
            title={isGenerating ? 'Generating...' : 'Generate Story'}
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
            fullWidth
            size="lg"
            style={styles.generateButton}
            icon={!isGenerating && <Ionicons name="sparkles" size={20} color={COLORS.white} />}
          />

          {/* Generation Info */}
          {isGenerating && (
            <View style={styles.generatingInfo}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.generatingText}>
                Creating your personalized story...
              </Text>
              <Text style={styles.generatingSubtext}>
                This may take 15-30 seconds
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  quotaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  error: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.error + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contentTypeCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  contentTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  contentTypeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  contentTypeLabelSelected: {
    color: COLORS.primary,
  },
  orText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  generateButton: {
    marginTop: SPACING.lg,
  },
  generatingInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  generatingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  generatingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
