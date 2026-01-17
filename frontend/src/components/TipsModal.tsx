import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';

interface TipsModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
}

// Tips content in multiple languages
const tipsContent: { [key: string]: { title: string; tips: Array<{ icon: string; text: string }> } } = {
  Spanish: {
    title: 'CÓMO USAR FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: 'Genera historias con IA en tu idioma objetivo usando el botón "Generar Historia"' },
      { icon: 'hand-left', text: 'Toca cualquier palabra en una historia para ver su traducción y contexto' },
      { icon: 'bookmark', text: 'Guarda palabras en tu diccionario personal para revisarlas más tarde' },
      { icon: 'refresh', text: 'Revisa palabras guardadas usando el sistema de repetición espaciada' },
      { icon: 'grid', text: 'Organiza palabras por día de la semana en la pestaña Grupos' },
      { icon: 'flame', text: 'Mantén tu racha diaria para seguir tu progreso de aprendizaje' },
    ],
  },
  English: {
    title: 'HOW TO USE FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: 'Generate AI-powered stories in your target language using the "Generate Story" button' },
      { icon: 'hand-left', text: 'Tap any word in a story to see its translation and context' },
      { icon: 'bookmark', text: 'Save words to your personal dictionary for later review' },
      { icon: 'refresh', text: 'Review saved words using the spaced repetition system' },
      { icon: 'grid', text: 'Organize words by day of the week in the Groups tab' },
      { icon: 'flame', text: 'Maintain your daily streak to track your learning progress' },
    ],
  },
  French: {
    title: 'COMMENT UTILISER FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: 'Générez des histoires avec IA dans votre langue cible en utilisant le bouton "Générer une histoire"' },
      { icon: 'hand-left', text: 'Appuyez sur n\'importe quel mot dans une histoire pour voir sa traduction et son contexte' },
      { icon: 'bookmark', text: 'Enregistrez des mots dans votre dictionnaire personnel pour les réviser plus tard' },
      { icon: 'refresh', text: 'Révisez les mots enregistrés en utilisant le système de répétition espacée' },
      { icon: 'grid', text: 'Organisez les mots par jour de la semaine dans l\'onglet Groupes' },
      { icon: 'flame', text: 'Maintenez votre série quotidienne pour suivre vos progrès d\'apprentissage' },
    ],
  },
  German: {
    title: 'WIE MAN FLUENTSTORY BENUTZT',
    tips: [
      { icon: 'sparkles', text: 'Generieren Sie KI-gestützte Geschichten in Ihrer Zielsprache mit der Schaltfläche "Geschichte generieren"' },
      { icon: 'hand-left', text: 'Tippen Sie auf ein beliebiges Wort in einer Geschichte, um seine Übersetzung und den Kontext zu sehen' },
      { icon: 'bookmark', text: 'Speichern Sie Wörter in Ihrem persönlichen Wörterbuch zur späteren Überprüfung' },
      { icon: 'refresh', text: 'Überprüfen Sie gespeicherte Wörter mit dem System der gestaffelten Wiederholung' },
      { icon: 'grid', text: 'Organisieren Sie Wörter nach Wochentag im Gruppen-Tab' },
      { icon: 'flame', text: 'Halten Sie Ihre tägliche Serie aufrecht, um Ihren Lernfortschritt zu verfolgen' },
    ],
  },
  Italian: {
    title: 'COME USARE FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: 'Genera storie con IA nella tua lingua target usando il pulsante "Genera Storia"' },
      { icon: 'hand-left', text: 'Tocca qualsiasi parola in una storia per vedere la sua traduzione e contesto' },
      { icon: 'bookmark', text: 'Salva le parole nel tuo dizionario personale per rivederle più tardi' },
      { icon: 'refresh', text: 'Rivedi le parole salvate usando il sistema di ripetizione spaziata' },
      { icon: 'grid', text: 'Organizza le parole per giorno della settimana nella scheda Gruppi' },
      { icon: 'flame', text: 'Mantieni la tua serie giornaliera per tracciare i tuoi progressi di apprendimento' },
    ],
  },
  Portuguese: {
    title: 'COMO USAR FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: 'Gere histórias com IA no seu idioma alvo usando o botão "Gerar História"' },
      { icon: 'hand-left', text: 'Toque em qualquer palavra em uma história para ver sua tradução e contexto' },
      { icon: 'bookmark', text: 'Salve palavras no seu dicionário pessoal para revisão posterior' },
      { icon: 'refresh', text: 'Revise palavras salvas usando o sistema de repetição espaçada' },
      { icon: 'grid', text: 'Organize palavras por dia da semana na aba Grupos' },
      { icon: 'flame', text: 'Mantenha sua sequência diária para acompanhar seu progresso de aprendizado' },
    ],
  },
  Chinese: {
    title: '如何使用 FLUENTSTORY',
    tips: [
      { icon: 'sparkles', text: '使用"生成故事"按钮在目标语言中生成AI驱动的故事' },
      { icon: 'hand-left', text: '点击故事中的任何单词以查看其翻译和上下文' },
      { icon: 'bookmark', text: '将单词保存到您的个人词典以供稍后复习' },
      { icon: 'refresh', text: '使用间隔重复系统复习保存的单词' },
      { icon: 'grid', text: '在组选项卡中按星期几组织单词' },
      { icon: 'flame', text: '保持每日连续记录以跟踪您的学习进度' },
    ],
  },
  Japanese: {
    title: 'FLUENTSTORY の使い方',
    tips: [
      { icon: 'sparkles', text: '「ストーリーを生成」ボタンを使用して、目標言語でAI駆動のストーリーを生成します' },
      { icon: 'hand-left', text: 'ストーリー内の任意の単語をタップして、その翻訳とコンテキストを確認します' },
      { icon: 'bookmark', text: '後で復習するために個人辞書に単語を保存します' },
      { icon: 'refresh', text: '間隔反復システムを使用して保存された単語を復習します' },
      { icon: 'grid', text: 'グループタブで曜日ごとに単語を整理します' },
      { icon: 'flame', text: '学習の進捗を追跡するために毎日の連続記録を維持します' },
    ],
  },
  Korean: {
    title: 'FLUENTSTORY 사용 방법',
    tips: [
      { icon: 'sparkles', text: '"스토리 생성" 버튼을 사용하여 목표 언어로 AI 기반 스토리를 생성하세요' },
      { icon: 'hand-left', text: '스토리의 모든 단어를 탭하여 번역과 맥락을 확인하세요' },
      { icon: 'bookmark', text: '나중에 복습하기 위해 개인 사전에 단어를 저장하세요' },
      { icon: 'refresh', text: '간격 반복 시스템을 사용하여 저장된 단어를 복습하세요' },
      { icon: 'grid', text: '그룹 탭에서 요일별로 단어를 정리하세요' },
      { icon: 'flame', text: '학습 진행 상황을 추적하기 위해 일일 연속 기록을 유지하세요' },
    ],
  },
};

export const TipsModal: React.FC<TipsModalProps> = ({ visible, onClose, language }) => {
  const content = tipsContent[language] || tipsContent['English'];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.title}>{content.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {content.tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipIconContainer}>
                  <Ionicons name={tip.icon as any} size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.startButton} onPress={onClose}>
              <Text style={styles.startButtonText}>
                {language === 'Spanish' ? 'EMPEZAR' :
                 language === 'French' ? 'COMMENCER' :
                 language === 'German' ? 'BEGINNEN' :
                 language === 'Italian' ? 'INIZIARE' :
                 language === 'Portuguese' ? 'COMEÇAR' :
                 language === 'Chinese' ? '开始' :
                 language === 'Japanese' ? '始める' :
                 language === 'Korean' ? '시작' :
                 'GET STARTED'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.black,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 500,
    ...SHADOWS.large,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    position: 'relative',
  },
  iconContainer: {
    backgroundColor: COLORS.accent,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.black,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.black,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.black,
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.black,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  startButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
});
