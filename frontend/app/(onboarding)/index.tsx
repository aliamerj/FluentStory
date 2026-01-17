import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Dropdown } from '../../src/components/Dropdown';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../src/constants/theme';
import { LANGUAGES, PROFICIENCY_LEVELS } from '../../src/constants/languages';

const STEPS = [
  { id: 'native', title: 'Native Language' },
  { id: 'target', title: 'Learn Language' },
  { id: 'level', title: 'Your Level' },
  { id: 'tutorial', title: 'How It Works' },
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

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
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
            <View style={styles.stepIcon}>
              <Ionicons name="globe-outline" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.stepTitle}>NATIVE LANGUAGE</Text>
            <Text style={styles.stepDescription}>
              What language do you speak?
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
            <View style={styles.stepIcon}>
              <Ionicons name="school-outline" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.stepTitle}>LEARN LANGUAGE</Text>
            <Text style={styles.stepDescription}>
              What language do you want to learn?
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
            <View style={styles.stepIcon}>
              <Ionicons name="trending-up-outline" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.stepTitle}>YOUR LEVEL</Text>
            <Text style={styles.stepDescription}>
              What's your current proficiency?
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
                    {level.label.toUpperCase()}
                  </Text>
                  <Text style={styles.levelDescription}>{level.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>HOW IT WORKS</Text>
            <View style={styles.tutorialContainer}>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialNumber}>
                  <Text style={styles.tutorialNumberText}>1</Text>
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>GENERATE STORIES</Text>
                  <Text style={styles.tutorialDescription}>
                    AI creates personalized content in your target language
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialNumber}>
                  <Text style={styles.tutorialNumberText}>2</Text>
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>READ & LISTEN</Text>
                  <Text style={styles.tutorialDescription}>
                    Tap any word to see translations and hear pronunciation
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialNumber}>
                  <Text style={styles.tutorialNumberText}>3</Text>
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>SAVE WORDS</Text>
                  <Text style={styles.tutorialDescription}>
                    Build your personal dictionary with new vocabulary
                  </Text>
                </View>
              </View>
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialNumber}>
                  <Text style={styles.tutorialNumberText}>4</Text>
                </View>
                <View style={styles.tutorialText}>
                  <Text style={styles.tutorialTitle}>REVIEW & MASTER</Text>
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
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
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
          title={currentStep === STEPS.length - 1 ? "LET'S START!" : 'CONTINUE'}
          onPress={handleNext}
          fullWidth
          size="lg"
          variant="accent"
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
    width: 12,
    height: 12,
    backgroundColor: COLORS.borderLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.black,
    width: 32,
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
  stepIcon: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 2,
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
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
  },
  levelOptionSelected: {
    backgroundColor: COLORS.black,
  },
  levelLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  levelLabelSelected: {
    color: COLORS.white,
  },
  levelDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tutorialContainer: {
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  tutorialStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  tutorialNumber: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialNumberText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.white,
  },
  tutorialText: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  tutorialDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
