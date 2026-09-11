export type ActiveTab = 
  | 'onboarding'
  | 'dashboard'
  | 'tasks'
  | 'nasser-ia'
  | 'summary'
  | 'multimedia'
  | 'blackboard'
  | 'class-recorder'
  | 'problem-solver'
  | 'study-rooms'
  | 'community'
  | 'exam-simulator'
  | 'chameleon-sanctuary'
  | 'streak'
  | 'chameleon-road';

export interface CommunityComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorProgram?: string;
  authorRole?: string;
  content: string;
  timestamp?: string;
  createdAt?: number;
  likes?: number;
  likesCount?: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorProgram?: string;
  authorSemester?: string;
  title: string;
  content: string;
  subject: string;
  category?: 'preguntas' | 'apuntes' | 'examenes' | 'debates';
  tag?: 'duda' | 'apunte' | 'consejo' | 'examen' | 'general';
  timestamp?: string;
  createdAt?: number;
  likes?: number;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: CommunityComment[];
  attachmentName?: string;
  hasAttachment?: boolean;
  isPinned?: boolean;
}

export interface StudentProfile {
  name: string;
  avatar: string;
  program: string;
  semester: string;
  gpa: number;
  attendanceRate: number;
  streakDays: number;
  completedTasksCount: number;
  gamification?: GamificationState;
}

export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface AcademicTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  dueTimestamp: number;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes: number;
  description: string;
  isOverdue?: boolean;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface SummaryResult {
  executiveSummary: string;
  keyPoints: string[];
  keyFormulasOrConcepts: string[];
  flashcards: Flashcard[];
  examWarning: string;
}

export interface BlackboardResult {
  boardTitle: string;
  rawTranscription: string;
  latexFormulas: string[];
  diagramDescription?: string;
  structuredNotes: string;
}

export interface ClassRecordingResult {
  sessionTitle: string;
  durationFormatted: string;
  transcript: string;
  professorAlerts: string[];
  structuredLectureNotes: string[];
  examQuestionsGenerated: string[];
}

export interface ProblemSolverStep {
  stepNumber: number;
  title: string;
  explanation: string;
  intermediateFormula?: string;
}

export interface ProblemSolverResult {
  problemTitle: string;
  underlyingPrinciples: string[];
  steps: ProblemSolverStep[];
  finalAnswer: string;
  sanityCheck: string;
  pitfallsToAvoid: string[];
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ExamSimulation {
  id: string;
  title: string;
  subject: string;
  timeLimitMinutes: number;
  passingGrade: number;
  questions: ExamQuestion[];
}

export interface SlideItem {
  slideNumber: number;
  layout: 'title' | 'split' | 'bullet_grid' | 'quote';
  heading: string;
  subheading?: string;
  bullets?: string[];
  highlightMetric?: string;
  visualDescription?: string;
  notes?: string;
}

export interface SlideDeck {
  id: string;
  deckTitle: string;
  author: string;
  templateType: string;
  themePalette: {
    primary: string;
    accent: string;
    background: string;
  };
  slides: SlideItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nasser';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  topic?: string;
  isFavorite?: boolean;
}

export interface StudyRoomMember {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  topic: string;
  activeMembersCount: number;
  pomodoroMinutes: number;
  mode: 'deep_work' | 'collaborative';
  members: StudyRoomMember[];
}

export interface VoiceCoachAnalysis {
  speechTitle: string;
  wordsPerMinute: number;
  pacingAssessment: string;
  fillerWordsDetected: { word: string; count: number; suggestion: string }[];
  persuasionScore: number;
  clarityScore: number;
  actionableFeedback: string[];
}

// -------------------------------------------------------------
// SISTEMA DE JUGABILIDAD Y CAMALEÓN (ANTI-MONOTONÍA & RETENCIÓN)
// -------------------------------------------------------------

export type ChameleonSkinId =
  | 'classic_emerald'
  | 'phoenix_fire'
  | 'quantum_cyber'
  | 'royal_scholar'
  | 'cosmic_amethyst'
  | 'shadow_ninja';

export type ChameleonMood =
  | 'happy'
  | 'studying'
  | 'fire_streak'
  | 'proud'
  | 'alert'
  | 'celebrating'
  | 'sleeping';

export interface ChameleonSkin {
  id: ChameleonSkinId;
  name: string;
  description: string;
  rarity: 'comun' | 'especial' | 'epico' | 'legendario';
  requiredLevel: number;
  requiredStreak?: number;
  costGems: number;
  filterStyle: string;
  auraGradient: string;
  glowColor: string;
  badge: string;
}

export interface RewardChest {
  id: string;
  type: 'diario' | 'academico' | 'legendario';
  name: string;
  description: string;
  status: 'listo' | 'bloqueado' | 'abierto';
  unlockProgress: number;
  unlockTarget: number;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  possibleSkin?: ChameleonSkinId;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinsReward: number;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
}

// -------------------------------------------------------------
// SISTEMA DE JUGABILIDAD Y CAMALEÓN (EL CAMINO DEL CAMALEÓN 3D)
// -------------------------------------------------------------

export type ArenaId = 'arena-1' | 'arena-2' | 'arena-3' | 'arena-4' | 'arena-5';

export interface ArenaInfo {
  id: ArenaId;
  number: number;
  name: string; // 'El Nido', 'Sotobosque', 'El Dosel', 'Prisma', 'La Cúpula Solar'
  subtitle: string;
  minDew: number;
  maxDew: number;
  theme: {
    bgColor: string;
    ambientColor: string;
    lightColor: string;
    fogColor: string;
    terrainType: 'earth_roots' | 'undergrowth' | 'canopy' | 'prism' | 'solar_dome';
    particlesType: 'fireflies' | 'leaves' | 'spores' | 'prisms' | 'sunrays';
    gradient: string;
    accentColor: string;
  };
  description: string;
  iconName: string;
}

export type ArenaNodeType = 'lesson' | 'quiz' | 'boss_exam' | 'dew_cache' | 'sanctuary_chest';

export interface ArenaNode {
  id: string;
  arenaId: ArenaId;
  index: number;
  title: string;
  subject: string;
  type: ArenaNodeType;
  dewReward: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  summaryNote?: string;
}

export type ChameleonUrgencyStatus = 
  | 'optimal'          // 0-24h: Piel radiante, 100% de ganancia de gotas
  | 'dehydrated'       // 24h: Piel café/opaca, 50% de ganancia de gotas
  | 'predator_attack'  // 48h: Alerta con temporizador de 2h para Quiz Relámpago (-50 a -100 Gotas)
  | 'pale';            // 72h+: Piel gris pálido / enferma en Home y tablas sociales

export interface PredatorQuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface PredatorAttackEvent {
  isActive: boolean;
  expiresAt: number; // timestamp
  penaltyDew: number; // 50 to 100
  questions: PredatorQuizQuestion[];
}

export interface ArenaExamQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ArenaExam {
  arenaId: ArenaId;
  arenaNumber: number;
  currentArenaName: string;
  targetArenaName: string;
  requiredDew: number;
  maxMistakesAllowed: number; // 2
  questions: ArenaExamQuestion[];
}

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  dyserGems: number;
  studyCoins: number;
  dewDrops: number; // Gotas de Rocío (métrica central de progreso y salud)
  currentArenaId: ArenaId;
  unlockedArenas: ArenaId[];
  urgencyStatus: ChameleonUrgencyStatus;
  hoursInactive: number;
  lastStudyTimestamp: number;
  predatorEvent?: PredatorAttackEvent;
  activeSubjectColor: string; // Color de piel reactivo según asignatura
  activeSkin: ChameleonSkinId;
  unlockedSkins: ChameleonSkinId[];
  chameleonMood: ChameleonMood;
  interactionCount: number;
  chests: RewardChest[];
  dailyQuests: DailyQuest[];
  lastPetTimestamp: number;
  customModelUrl?: string; // Soporte para importar modelo 3D GLB/GLTF
}
