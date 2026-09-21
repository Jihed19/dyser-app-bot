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
  | 'exposition-study'
  | 'streak';

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
  id?: string;
  email?: string;
  name: string;
  avatar: string;
  program: string;
  semester: string;
  gpa: number;
  attendanceRate: number;
  streakDays: number;
  completedTasksCount: number;
  gamification?: GamificationState;
  dyserNumber?: string; // Código Disser oficial (ej. "1 60 10")
  dyserCode?: string;   // Código Disser oficial (ej. "1 60 10")
  disserCode?: string;  // Código Disser oficial (ej. "1 60 10")
  onboardingCompleted?: boolean;
  studyLevel?: 'primaria' | 'secundaria' | 'universidad';
  goalReason?: string;
  dailyStudyMinutes?: number;
  motivationalQuote?: string;
  authProvider?: 'google' | 'password' | 'guest';
}

export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';
export type ActivityType = 'tarea' | 'examen' | 'exposicion';

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
  activityType?: ActivityType;
  completedAt?: number;
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

export interface LiveClassRecordingItem {
  id: string;
  title: string;
  subject: string;
  timestamp: number;
  durationSeconds: number;
  durationFormatted: string;
  rawTranscript: string;
  status: 'guardada_local' | 'procesada_en_nasser';
  audioWaveform?: number[];
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

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false';

export interface ExamQuestion {
  id: string;
  type?: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: string;
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

export interface ExpositionPoint {
  id: string;
  number: number;
  title: string;
  keyIdea: string;
  speechScript: string;
  example: string;
  warningNote?: string;
}

export interface ExpositionStudy {
  id: string;
  topic: string;
  subject?: string;
  numPoints: number;
  summaryIdea?: string;
  points: ExpositionPoint[];
  conclusionScript?: string;
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
  mode?: 'summary' | 'blackboard' | 'calculator' | 'guide';
  guidanceAction?: {
    targetMode: 'summary' | 'blackboard' | 'calculator';
    label: string;
    pendingQuery: string;
  };
  attachment?: {
    name: string;
    type: 'image' | 'file';
    dataUrl?: string;
  };
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
// SISTEMA DE GAMIFICACIÓN ACADÉMICA Y PROGRESO DE ÉLITE DYSER
// -------------------------------------------------------------

export interface AcademicBadge {
  id: string;
  name: string;
  description: string;
  category: 'constancy' | 'mastery' | 'focus' | 'exam';
  unlockedAt?: number;
  iconName: string;
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

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  dyserGems: number;
  studyCoins: number;
  hoursInactive: number;
  lastStudyTimestamp: number;
  chests: RewardChest[];
  dailyQuests: DailyQuest[];
  badges?: AcademicBadge[];
}
