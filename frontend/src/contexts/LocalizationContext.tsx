import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'ru';

interface Translations {
  // Common
  home: string;
  words: string;
  review: string;
  profile: string;
  search: string;
  all: string;
  loading: string;
  
  // Home Screen
  welcomeBack: string;
  wordsLearned: string;
  dayStreak: string;
  reviewsDone: string;
  quickActions: string;
  generateStory: string;
  createAIPoweredStories: string;
  reviewWords: string;
  wordsDue: string;
  wordGroups: string;
  seeAll: string;
  recentStories: string;
  
  // Words Screen
  myWords: string;
  searchWords: string;
  learning: string;
  mastered: string;
  noWordsYet: string;
  saveWordsFromStories: string;
  
  // Review Screen
  allCaughtUp: string;
  noReviewsDue: string;
  showAnswer: string;
  wrong: string;
  correct: string;
  
  // Profile Screen
  learningProgress: string;
  learningFrom: string;
  learningSettings: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: string;
  appSettings: string;
  darkMode: string;
  appLanguage: string;
  notifications: string;
  sendFeedback: string;
  logout: string;
  
  // Other
  generateStoryButton: string;
  back: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
}

const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    words: 'Words',
    review: 'Review',
    profile: 'Profile',
    search: 'Search',
    all: 'All',
    loading: 'Loading',
    welcomeBack: 'WELCOME BACK,',
    wordsLearned: 'Words Learned',
    dayStreak: 'Day Streak',
    reviewsDone: 'Reviews Done',
    quickActions: 'QUICK ACTIONS',
    generateStory: 'Generate Story',
    createAIPoweredStories: 'Create AI-powered stories',
    reviewWords: 'Review Words',
    wordsDue: 'words due',
    wordGroups: 'WORD GROUPS',
    seeAll: 'See All →',
    recentStories: 'RECENT STORIES',
    myWords: 'MY WORDS',
    searchWords: 'Search words...',
    learning: 'Learning',
    mastered: 'Mastered',
    noWordsYet: 'NO WORDS YET',
    saveWordsFromStories: 'Save words from stories to build your vocabulary!',
    allCaughtUp: 'ALL CAUGHT UP!',
    noReviewsDue: 'No words due for review right now',
    showAnswer: 'SHOW ANSWER',
    wrong: 'WRONG',
    correct: 'CORRECT',
    learningProgress: 'LEARNING PROGRESS',
    learningFrom: 'from',
    learningSettings: 'LEARNING SETTINGS',
    nativeLanguage: 'NATIVE LANGUAGE',
    targetLanguage: 'LEARNING',
    level: 'LEVEL',
    appSettings: 'APP SETTINGS',
    darkMode: 'DARK MODE',
    appLanguage: 'APP LANGUAGE',
    notifications: 'NOTIFICATIONS',
    sendFeedback: 'SEND FEEDBACK',
    logout: 'LOG OUT',
    generateStoryButton: 'GENERATE STORY',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
  },
  es: {
    home: 'Inicio',
    words: 'Palabras',
    review: 'Revisar',
    profile: 'Perfil',
    search: 'Buscar',
    all: 'Todo',
    loading: 'Cargando',
    welcomeBack: 'BIENVENIDO DE NUEVO,',
    wordsLearned: 'Palabras Aprendidas',
    dayStreak: 'Racha de Días',
    reviewsDone: 'Repasos Hechos',
    quickActions: 'ACCIONES RÁPIDAS',
    generateStory: 'Generar Historia',
    createAIPoweredStories: 'Crear historias con IA',
    reviewWords: 'Repasar Palabras',
    wordsDue: 'palabras pendientes',
    wordGroups: 'GRUPOS DE PALABRAS',
    seeAll: 'Ver Todo →',
    recentStories: 'HISTORIAS RECIENTES',
    myWords: 'MIS PALABRAS',
    searchWords: 'Buscar palabras...',
    learning: 'Aprendiendo',
    mastered: 'Dominadas',
    noWordsYet: 'AÚN NO HAY PALABRAS',
    saveWordsFromStories: '¡Guarda palabras de las historias para construir tu vocabulario!',
    allCaughtUp: '¡TODO AL DÍA!',
    noReviewsDue: 'No hay palabras para repasar ahora',
    showAnswer: 'MOSTRAR RESPUESTA',
    wrong: 'INCORRECTO',
    correct: 'CORRECTO',
    learningProgress: 'PROGRESO DE APRENDIZAJE',
    learningFrom: 'desde',
    learningSettings: 'CONFIGURACIÓN DE APRENDIZAJE',
    nativeLanguage: 'IDIOMA NATIVO',
    targetLanguage: 'APRENDIENDO',
    level: 'NIVEL',
    appSettings: 'CONFIGURACIÓN DE LA APP',
    darkMode: 'MODO OSCURO',
    appLanguage: 'IDIOMA DE LA APP',
    notifications: 'NOTIFICACIONES',
    sendFeedback: 'ENVIAR COMENTARIOS',
    logout: 'CERRAR SESIÓN',
    generateStoryButton: 'GENERAR HISTORIA',
    back: 'Atrás',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
  },
  fr: {
    home: 'Accueil',
    words: 'Mots',
    review: 'Réviser',
    profile: 'Profil',
    search: 'Rechercher',
    all: 'Tout',
    loading: 'Chargement',
    welcomeBack: 'BON RETOUR,',
    wordsLearned: 'Mots Appris',
    dayStreak: 'Série de Jours',
    reviewsDone: 'Révisions Faites',
    quickActions: 'ACTIONS RAPIDES',
    generateStory: 'Générer Histoire',
    createAIPoweredStories: 'Créer des histoires avec IA',
    reviewWords: 'Réviser Mots',
    wordsDue: 'mots à réviser',
    wordGroups: 'GROUPES DE MOTS',
    seeAll: 'Voir Tout →',
    recentStories: 'HISTOIRES RÉCENTES',
    myWords: 'MES MOTS',
    searchWords: 'Rechercher mots...',
    learning: 'Apprentissage',
    mastered: 'Maîtrisés',
    noWordsYet: 'PAS ENCORE DE MOTS',
    saveWordsFromStories: 'Enregistrez des mots des histoires pour construire votre vocabulaire!',
    allCaughtUp: 'TOUT À JOUR!',
    noReviewsDue: 'Pas de mots à réviser maintenant',
    showAnswer: 'MONTRER RÉPONSE',
    wrong: 'FAUX',
    correct: 'CORRECT',
    learningProgress: 'PROGRÈS D\'APPRENTISSAGE',
    learningFrom: 'depuis',
    learningSettings: 'PARAMÈTRES D\'APPRENTISSAGE',
    nativeLanguage: 'LANGUE NATIVE',
    targetLanguage: 'APPRENTISSAGE',
    level: 'NIVEAU',
    appSettings: 'PARAMÈTRES DE L\'APP',
    darkMode: 'MODE SOMBRE',
    appLanguage: 'LANGUE DE L\'APP',
    notifications: 'NOTIFICATIONS',
    sendFeedback: 'ENVOYER COMMENTAIRES',
    logout: 'DÉCONNEXION',
    generateStoryButton: 'GÉNÉRER HISTOIRE',
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
  },
  de: {
    home: 'Startseite',
    words: 'Wörter',
    review: 'Überprüfen',
    profile: 'Profil',
    search: 'Suchen',
    all: 'Alle',
    loading: 'Laden',
    welcomeBack: 'WILLKOMMEN ZURÜCK,',
    wordsLearned: 'Gelernte Wörter',
    dayStreak: 'Tage-Serie',
    reviewsDone: 'Wiederholungen',
    quickActions: 'SCHNELLAKTIONEN',
    generateStory: 'Geschichte Generieren',
    createAIPoweredStories: 'KI-Geschichten erstellen',
    reviewWords: 'Wörter Wiederholen',
    wordsDue: 'Wörter fällig',
    wordGroups: 'WORTGRUPPEN',
    seeAll: 'Alle Anzeigen →',
    recentStories: 'NEUESTE GESCHICHTEN',
    myWords: 'MEINE WÖRTER',
    searchWords: 'Wörter suchen...',
    learning: 'Lernen',
    mastered: 'Gemeistert',
    noWordsYet: 'NOCH KEINE WÖRTER',
    saveWordsFromStories: 'Speichere Wörter aus Geschichten, um deinen Wortschatz aufzubauen!',
    allCaughtUp: 'ALLES ERLEDIGT!',
    noReviewsDue: 'Keine Wörter zur Wiederholung',
    showAnswer: 'ANTWORT ZEIGEN',
    wrong: 'FALSCH',
    correct: 'RICHTIG',
    learningProgress: 'LERNFORTSCHRITT',
    learningFrom: 'von',
    learningSettings: 'LERNEINSTELLUNGEN',
    nativeLanguage: 'MUTTERSPRACHE',
    targetLanguage: 'LERNEN',
    level: 'STUFE',
    appSettings: 'APP-EINSTELLUNGEN',
    darkMode: 'DUNKLER MODUS',
    appLanguage: 'APP-SPRACHE',
    notifications: 'BENACHRICHTIGUNGEN',
    sendFeedback: 'FEEDBACK SENDEN',
    logout: 'ABMELDEN',
    generateStoryButton: 'GESCHICHTE GENERIEREN',
    back: 'Zurück',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
  },
  it: {
    home: 'Home',
    words: 'Parole',
    review: 'Rivedere',
    profile: 'Profilo',
    search: 'Cerca',
    all: 'Tutto',
    loading: 'Caricamento',
    welcomeBack: 'BEN TORNATO,',
    wordsLearned: 'Parole Imparate',
    dayStreak: 'Serie Giorni',
    reviewsDone: 'Revisioni Fatte',
    quickActions: 'AZIONI RAPIDE',
    generateStory: 'Genera Storia',
    createAIPoweredStories: 'Crea storie con IA',
    reviewWords: 'Rivedi Parole',
    wordsDue: 'parole da rivedere',
    wordGroups: 'GRUPPI DI PAROLE',
    seeAll: 'Vedi Tutto →',
    recentStories: 'STORIE RECENTI',
    myWords: 'LE MIE PAROLE',
    searchWords: 'Cerca parole...',
    learning: 'Apprendimento',
    mastered: 'Padroneggiato',
    noWordsYet: 'NESSUNA PAROLA ANCORA',
    saveWordsFromStories: 'Salva parole dalle storie per costruire il tuo vocabolario!',
    allCaughtUp: 'TUTTO FATTO!',
    noReviewsDue: 'Nessuna parola da rivedere ora',
    showAnswer: 'MOSTRA RISPOSTA',
    wrong: 'SBAGLIATO',
    correct: 'CORRETTO',
    learningProgress: 'PROGRESSO APPRENDIMENTO',
    learningFrom: 'da',
    learningSettings: 'IMPOSTAZIONI APPRENDIMENTO',
    nativeLanguage: 'LINGUA NATIVA',
    targetLanguage: 'APPRENDIMENTO',
    level: 'LIVELLO',
    appSettings: 'IMPOSTAZIONI APP',
    darkMode: 'MODALITÀ SCURA',
    appLanguage: 'LINGUA APP',
    notifications: 'NOTIFICHE',
    sendFeedback: 'INVIA FEEDBACK',
    logout: 'DISCONNETTI',
    generateStoryButton: 'GENERA STORIA',
    back: 'Indietro',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    edit: 'Modifica',
  },
  pt: {
    home: 'Início',
    words: 'Palavras',
    review: 'Revisar',
    profile: 'Perfil',
    search: 'Pesquisar',
    all: 'Todos',
    loading: 'Carregando',
    welcomeBack: 'BEM-VINDO DE VOLTA,',
    wordsLearned: 'Palavras Aprendidas',
    dayStreak: 'Sequência de Dias',
    reviewsDone: 'Revisões Feitas',
    quickActions: 'AÇÕES RÁPIDAS',
    generateStory: 'Gerar História',
    createAIPoweredStories: 'Criar histórias com IA',
    reviewWords: 'Revisar Palavras',
    wordsDue: 'palavras pendentes',
    wordGroups: 'GRUPOS DE PALAVRAS',
    seeAll: 'Ver Tudo →',
    recentStories: 'HISTÓRIAS RECENTES',
    myWords: 'MINHAS PALAVRAS',
    searchWords: 'Pesquisar palavras...',
    learning: 'Aprendendo',
    mastered: 'Dominadas',
    noWordsYet: 'AINDA NÃO HÁ PALAVRAS',
    saveWordsFromStories: 'Salve palavras das histórias para construir seu vocabulário!',
    allCaughtUp: 'TUDO EM DIA!',
    noReviewsDue: 'Nenhuma palavra para revisar agora',
    showAnswer: 'MOSTRAR RESPOSTA',
    wrong: 'ERRADO',
    correct: 'CORRETO',
    learningProgress: 'PROGRESSO DE APRENDIZAGEM',
    learningFrom: 'de',
    learningSettings: 'CONFIGURAÇÕES DE APRENDIZAGEM',
    nativeLanguage: 'IDIOMA NATIVO',
    targetLanguage: 'APRENDENDO',
    level: 'NÍVEL',
    appSettings: 'CONFIGURAÇÕES DO APP',
    darkMode: 'MODO ESCURO',
    appLanguage: 'IDIOMA DO APP',
    notifications: 'NOTIFICAÇÕES',
    sendFeedback: 'ENVIAR FEEDBACK',
    logout: 'SAIR',
    generateStoryButton: 'GERAR HISTÓRIA',
    back: 'Voltar',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
  },
  ar: {
    home: 'الرئيسية',
    words: 'الكلمات',
    review: 'مراجعة',
    profile: 'الملف الشخصي',
    search: 'بحث',
    all: 'الكل',
    loading: 'جاري التحميل',
    welcomeBack: 'مرحبًا بعودتك،',
    wordsLearned: 'الكلمات المتعلمة',
    dayStreak: 'سلسلة الأيام',
    reviewsDone: 'المراجعات المنجزة',
    quickActions: 'الإجراءات السريعة',
    generateStory: 'إنشاء قصة',
    createAIPoweredStories: 'إنشاء قصص بالذكاء الاصطناعي',
    reviewWords: 'مراجعة الكلمات',
    wordsDue: 'كلمات مستحقة',
    wordGroups: 'مجموعات الكلمات',
    seeAll: 'عرض الكل ←',
    recentStories: 'القصص الأخيرة',
    myWords: 'كلماتي',
    searchWords: 'البحث عن كلمات...',
    learning: 'التعلم',
    mastered: 'متقن',
    noWordsYet: 'لا توجد كلمات بعد',
    saveWordsFromStories: 'احفظ كلمات من القصص لبناء مفرداتك!',
    allCaughtUp: 'كل شيء محدث!',
    noReviewsDue: 'لا توجد كلمات للمراجعة الآن',
    showAnswer: 'إظهار الإجابة',
    wrong: 'خطأ',
    correct: 'صحيح',
    learningProgress: 'تقدم التعلم',
    learningFrom: 'من',
    learningSettings: 'إعدادات التعلم',
    nativeLanguage: 'اللغة الأم',
    targetLanguage: 'التعلم',
    level: 'المستوى',
    appSettings: 'إعدادات التطبيق',
    darkMode: 'الوضع الداكن',
    appLanguage: 'لغة التطبيق',
    notifications: 'الإشعارات',
    sendFeedback: 'إرسال ملاحظات',
    logout: 'تسجيل الخروج',
    generateStoryButton: 'إنشاء قصة',
    back: 'رجوع',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
  },
  zh: {
    home: '主页',
    words: '单词',
    review: '复习',
    profile: '个人资料',
    search: '搜索',
    all: '全部',
    loading: '加载中',
    welcomeBack: '欢迎回来，',
    wordsLearned: '学习的单词',
    dayStreak: '连续天数',
    reviewsDone: '完成的复习',
    quickActions: '快速操作',
    generateStory: '生成故事',
    createAIPoweredStories: '创建AI故事',
    reviewWords: '复习单词',
    wordsDue: '待复习单词',
    wordGroups: '单词组',
    seeAll: '查看全部 →',
    recentStories: '最近的故事',
    myWords: '我的单词',
    searchWords: '搜索单词...',
    learning: '学习中',
    mastered: '已掌握',
    noWordsYet: '还没有单词',
    saveWordsFromStories: '从故事中保存单词来建立你的词汇量！',
    allCaughtUp: '全部完成！',
    noReviewsDue: '现在没有需要复习的单词',
    showAnswer: '显示答案',
    wrong: '错误',
    correct: '正确',
    learningProgress: '学习进度',
    learningFrom: '从',
    learningSettings: '学习设置',
    nativeLanguage: '母语',
    targetLanguage: '学习中',
    level: '级别',
    appSettings: '应用设置',
    darkMode: '深色模式',
    appLanguage: '应用语言',
    notifications: '通知',
    sendFeedback: '发送反馈',
    logout: '登出',
    generateStoryButton: '生成故事',
    back: '返回',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
  },
  ja: {
    home: 'ホーム',
    words: '単語',
    review: '復習',
    profile: 'プロフィール',
    search: '検索',
    all: 'すべて',
    loading: '読み込み中',
    welcomeBack: 'おかえりなさい、',
    wordsLearned: '学習した単語',
    dayStreak: '連続日数',
    reviewsDone: '完了した復習',
    quickActions: 'クイックアクション',
    generateStory: 'ストーリーを生成',
    createAIPoweredStories: 'AIストーリーを作成',
    reviewWords: '単語を復習',
    wordsDue: '復習が必要な単語',
    wordGroups: '単語グループ',
    seeAll: 'すべて見る →',
    recentStories: '最近のストーリー',
    myWords: 'マイ単語',
    searchWords: '単語を検索...',
    learning: '学習中',
    mastered: 'マスター済み',
    noWordsYet: 'まだ単語がありません',
    saveWordsFromStories: 'ストーリーから単語を保存して語彙を増やしましょう！',
    allCaughtUp: 'すべて完了！',
    noReviewsDue: '今は復習する単語がありません',
    showAnswer: '答えを表示',
    wrong: '不正解',
    correct: '正解',
    learningProgress: '学習の進捗',
    learningFrom: 'から',
    learningSettings: '学習設定',
    nativeLanguage: '母国語',
    targetLanguage: '学習中',
    level: 'レベル',
    appSettings: 'アプリ設定',
    darkMode: 'ダークモード',
    appLanguage: 'アプリの言語',
    notifications: '通知',
    sendFeedback: 'フィードバックを送信',
    logout: 'ログアウト',
    generateStoryButton: 'ストーリーを生成',
    back: '戻る',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
  },
  ko: {
    home: '홈',
    words: '단어',
    review: '복습',
    profile: '프로필',
    search: '검색',
    all: '전체',
    loading: '로딩 중',
    welcomeBack: '다시 오신 것을 환영합니다,',
    wordsLearned: '학습한 단어',
    dayStreak: '연속 일수',
    reviewsDone: '완료한 복습',
    quickActions: '빠른 작업',
    generateStory: '스토리 생성',
    createAIPoweredStories: 'AI 스토리 만들기',
    reviewWords: '단어 복습',
    wordsDue: '복습할 단어',
    wordGroups: '단어 그룹',
    seeAll: '모두 보기 →',
    recentStories: '최근 스토리',
    myWords: '내 단어',
    searchWords: '단어 검색...',
    learning: '학습 중',
    mastered: '마스터함',
    noWordsYet: '아직 단어가 없습니다',
    saveWordsFromStories: '스토리에서 단어를 저장하여 어휘를 늘리세요!',
    allCaughtUp: '모두 완료!',
    noReviewsDue: '지금 복습할 단어가 없습니다',
    showAnswer: '답 보기',
    wrong: '틀림',
    correct: '맞음',
    learningProgress: '학습 진행',
    learningFrom: '에서',
    learningSettings: '학습 설정',
    nativeLanguage: '모국어',
    targetLanguage: '학습 중',
    level: '레벨',
    appSettings: '앱 설정',
    darkMode: '다크 모드',
    appLanguage: '앱 언어',
    notifications: '알림',
    sendFeedback: '피드백 보내기',
    logout: '로그아웃',
    generateStoryButton: '스토리 생성',
    back: '뒤로',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    edit: '편집',
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang && savedLang in translations) {
        setLanguageState(savedLang as Language);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const t = translations[language];

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
