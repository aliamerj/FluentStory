import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Dropdown } from '../../src/components/Dropdown';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';
import { LANGUAGES, PROFICIENCY_LEVELS } from '../../src/constants/languages';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 'native', title: 'Native Language', description: 'What language do you speak?' },
  { id: 'target', title: 'Learn Language', description: 'What language do you want to learn?' },
  { id: 'level', title: 'Your Level', description: 'What is your current proficiency?' },
  { id: 'tutorial', title: 'How It Works', description: 'Learn how to use FluentStory' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState(user?.native_language || 'English');
  const [targetLanguage, setTargetLanguage] = useState(user?.target_language || 'Spanish');
  const [proficiencyLevel, setProficiencyLevel] = useState(user?.proficiency_level || 'Beginner');
  const [isLoading, setIsLoading] = useState(false);

  const languageOptions = LANGUAGES.map(lang => ({
    id: lang.name,
    label: `${lang.name} (${lang.nativeName})`,
  }));

  const levelOptions = PROFICIENCY_LEVELS.map(level => ({
    id: level.id,
    label: level.label,
  }));

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setIsLoading(true);
      try {
        await updateUser({
          native_language: nativeLanguage,
          target_language: targetLanguage,
          proficiency_level: proficiencyLevel,
          onboarding_completed: true,
        });
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Onboarding error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="globe-outline" size={60} color={COLORS.primary} />
            <Text style={styles.stepTitle}>What's your native language?</Text>
            <Text style={styles.stepDescription}>
              We'll use this to show you translations
            </Text>
            <View style={styles.dropdownContainer}>
              <Dropdown
                options={languageOptions}
                selectedValue={nativeLanguage}
                onSelect={setNativeLanguage}
                placeholder="Select your native language"
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="school-outline" size={60} color={COLORS.primary} />
            <Text style={styles.stepTitle}>What language do you want to learn?</Text>
            <Text style={styles.stepDescription}>
              We'll generate stories in this language
            </Text>
            <View style={styles.dropdownContainer}>
              <Dropdown
                options={languageOptions.filter(l => l.id !== nativeLanguage)}
                selectedValue={targetLanguage}
                onSelect={setTargetLanguage}
                placeholder="Select language to learn"
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="trending-up-outline" size={60} color={COLORS.primary} />
            <Text style={styles.stepTitle}>What's your current level?</Text>
            <Text style={styles.stepDescription}>
              We'll customize content difficulty for you
            </Text>
            <View style={styles.levelContainer}>
              {PROFICIENCY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelOption,
                    proficiencyLevel === level.id && styles.levelOptionSelected,
                  ]}
                  onPress={() => setProficiencyLevel(level.id)}
                >
                  <Text style={[
                    styles.levelLabel,
                    proficiencyLevel === level.id && styles.levelLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.levelDescription}>{level.description}</Text>
                  {proficiencyLevel === level.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                      style={styles.levelCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How FluentStory Works</Text>
            <View style={styles.tutorialContainer}>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialIcon}>
                  <Ionicons name="create-outline" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>1. Generate Stories</Text>
                  <Text style={styles.tutorialDescription}>
                    AI creates personalized stories in your target language
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialIcon}>
                  <Ionicons name="book-outline" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>2. Read & Listen</Text>
                  <Text style={styles.tutorialDescription}>
                    Tap any word to see translations and hear pronunciation
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialIcon}>
                  <Ionicons name="bookmark-outline" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>3. Save Words</Text>
                  <Text style={styles.tutorialDescription}>
                    Build your personal dictionary with new vocabulary
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialIcon}>
                  <Ionicons name="refresh-outline" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>4. Review & Master</Text>
                  <Text style={styles.tutorialDescription}>
                    Spaced repetition helps you remember words forever
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.progressContainer}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={currentStep === STEPS.length - 1 ? "Let's Start!" : 'Continue'}
          onPress={handleNext}
          fullWidth
          size="lg"
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  stepDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  dropdownContainer: {
    width: '100%',
  },
  levelContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  levelOption: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  levelOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  levelLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelLabelSelected: {
    color: COLORS.primary,
  },
  levelDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  levelCheck: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -12,
  },
  tutorialContainer: {
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  tutorialStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  tutorialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tutorialText: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  tutorialDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
