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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { storyApi } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLocalization } from '../src/contexts/LocalizationContext';
import { SPACING, FONT_SIZES, SHADOWS } from '../src/constants/theme';
import { LANGUAGES, PROFICIENCY_LEVELS, TOPICS } from '../src/constants/languages';

export default function GenerateScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [language, setLanguage] = useState(user?.target_language || 'Spanish');
  const [level, setLevel] = useState(user?.proficiency_level || 'Beginner');
  const [topic, setTopic] = useState('Daily Life & Routine');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await storyApi.generate(user.id, {
        language,
        level,
        topic: customTopic || topic,
        content_type: 'Story',
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

  const storiesRemaining = user?.is_premium ? '∞' : `${5 - (user?.stories_generated_this_month || 0)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.generateStory.toUpperCase()}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.quotaBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaLabel}>Stories Remaining</Text>
              <Text style={styles.quotaValue}>{storiesRemaining}</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>LANGUAGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageScroll}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.name}
                  style={[
                    styles.languageCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    language === lang.name && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setLanguage(lang.name)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    { color: colors.textPrimary },
                    language === lang.name && { color: '#FFFFFF' },
                  ]}>{lang.name}</Text>
                  <Text style={[
                    styles.languageNative,
                    { color: colors.textMuted },
                    language === lang.name && { color: 'rgba(255,255,255,0.8)' },
                  ]}>{lang.nativeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.section, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>PROFICIENCY LEVEL</Text>
            <View style={styles.levelContainer}>
              {PROFICIENCY_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.levelButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    level === lvl.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setLevel(lvl.id)}
                >
                  <Text style={[
                    styles.levelText,
                    { color: colors.textPrimary },
                    level === lvl.id && { color: '#FFFFFF' },
                  ]}>{lvl.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>TOPIC</Text>
            <View style={styles.topicsGrid}>
              {TOPICS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.topicCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    topic === t.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => {
                    setTopic(t.id);
                    setCustomTopic('');
                  }}
                >
                  <Ionicons name={t.icon as any} size={24} color={topic === t.id ? '#FFFFFF' : colors.textPrimary} />
                  <Text style={[
                    styles.topicText,
                    { color: colors.textPrimary },
                    topic === t.id && { color: '#FFFFFF' },
                  ]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.orText, { color: colors.textMuted }]}>OR WRITE YOUR OWN</Text>
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Enter custom topic (optional)..."
              placeholderTextColor={colors.textMuted}
              value={customTopic}
              onChangeText={(text) => {
                setCustomTopic(text);
                if (text) setTopic('');
              }}
              multiline
            />
          </View>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: '#F44336', borderColor: colors.border }]}>
              <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: colors.accent, borderColor: colors.border },
              isGenerating && { opacity: 0.6 },
            ]}
            onPress={handleGenerate}
            disabled={isGenerating || (!topic && !customTopic)}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>{t.generateStory.toUpperCase()}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 3 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { padding: SPACING.lg },
  quotaBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: 16, borderWidth: 3, marginBottom: SPACING.lg, ...SHADOWS.medium },
  quotaInfo: { marginLeft: SPACING.md, flex: 1 },
  quotaLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#FFFFFF', opacity: 0.8, letterSpacing: 1 },
  quotaValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  section: { padding: SPACING.lg, borderRadius: 16, borderWidth: 3, marginBottom: SPACING.lg, ...SHADOWS.medium },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '900', letterSpacing: 1.5, marginBottom: SPACING.md },
  languageScroll: { paddingRight: SPACING.lg },
  languageCard: { width: 120, padding: SPACING.md, borderRadius: 12, borderWidth: 2, alignItems: 'center', marginRight: SPACING.sm },
  languageFlag: { fontSize: 40, marginBottom: SPACING.xs },
  languageName: { fontSize: FONT_SIZES.sm, fontWeight: '700', marginBottom: SPACING.xs / 2 },
  languageNative: { fontSize: FONT_SIZES.xs, fontWeight: '600', textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionCard: { width: '31%', padding: SPACING.md, borderRadius: 12, borderWidth: 2, alignItems: 'center', gap: SPACING.xs },
  optionEmoji: { fontSize: 32 },
  optionText: { fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 0.5 },
  levelContainer: { flexDirection: 'row', gap: SPACING.sm },
  levelButton: { flex: 1, padding: SPACING.md, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  levelText: { fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 0.5 },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  topicCard: { width: '48%', padding: SPACING.md, borderRadius: 12, borderWidth: 2, alignItems: 'center', gap: SPACING.xs },
  topicText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
  orText: { fontSize: FONT_SIZES.sm, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.sm, textAlign: 'center' },
  customInput: { padding: SPACING.md, borderRadius: 12, borderWidth: 2, fontSize: FONT_SIZES.md, fontWeight: '600', minHeight: 80, textAlignVertical: 'top' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 12, borderWidth: 3, gap: SPACING.sm, marginBottom: SPACING.lg },
  errorText: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#FFFFFF' },
  footer: { padding: SPACING.lg, borderTopWidth: 3, ...SHADOWS.large },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, borderRadius: 16, borderWidth: 3, gap: SPACING.sm, ...SHADOWS.medium },
  generateButtonText: { fontSize: FONT_SIZES.lg, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
});