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
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';
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

  const storiesRemaining = user?.is_premium ? 'UNLIMITED' : `${5 - (user?.stories_generated_this_month || 0)} LEFT`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GENERATE STORY</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stories Remaining */}
          <View style={styles.quotaBanner}>
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.quotaText}>{storiesRemaining}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Language Selection */}
          <Dropdown
            label="Target Language"
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
          <Text style={styles.label}>CONTENT TYPE</Text>
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
                  color={contentType === type.id ? COLORS.white : COLORS.black}
                />
                <Text
                  style={[
                    styles.contentTypeLabel,
                    contentType === type.id && styles.contentTypeLabelSelected,
                  ]}
                >
                  {type.label.toUpperCase()}
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
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

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
            title={isGenerating ? 'GENERATING...' : 'GENERATE STORY'}
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
            fullWidth
            size="lg"
            variant="accent"
            style={styles.generateButton}
            icon={!isGenerating && <Ionicons name="sparkles" size={20} color={COLORS.white} />}
          />

          {/* Generation Info */}
          {isGenerating && (
            <View style={styles.generatingInfo}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.black} />
              </View>
              <Text style={styles.generatingText}>AI IS CREATING YOUR STORY...</Text>
              <Text style={styles.generatingSubtext}>This may take 15-30 seconds</Text>
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
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  quotaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 2,
  },
  errorBox: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 2,
    borderColor: COLORS.error,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contentTypeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    alignItems: 'center',
  },
  contentTypeCardSelected: {
    backgroundColor: COLORS.black,
  },
  contentTypeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.black,
    marginTop: SPACING.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  contentTypeLabelSelected: {
    color: COLORS.white,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  orLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.black,
  },
  orText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.black,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: SPACING.md,
  },
  generateButton: {
    marginTop: SPACING.lg,
  },
  generatingInfo: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  loadingBox: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  generatingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    fontWeight: '900',
    letterSpacing: 1,
  },
  generatingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
