import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Camera,
  Calculator,
  Mic,
  MicOff,
  Send,
  RotateCw,
  Plus,
  MessageSquare,
  Trash2,
  Search,
  Cloud,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Copy,
  Check,
  Palette,
  GraduationCap,
  Sparkles,
  BookmarkPlus,
  Dna,
  Atom,
  Binary,
  BookOpen,
  Square,
  Radio,
  Layers,
  ArrowRight,
  X,
  Paperclip,
} from 'lucide-react';
import { ChatMessage, ChatSession, ActiveTab, AcademicTask } from '../../types';
import { STUDENT_AVATAR } from '../../data/mockData';
import { nasserAI } from '../../services/nasserEngines';
import {
  sendLiveNasserQuery,
  transferirInvestigacionAExamen,
  transferirInvestigacionAResumen,
  transferirInvestigacionAExposicion,
  capturarInvestigacionDyser,
} from '../../services/nasserLiveApi';
import {
  saveAudioRecord,
  getAudioRecord,
  blobToBase64,
} from '../../services/audioStorage';
import { sounds } from '../../services/soundEffects';
import { trackGoalAction } from '../../services/academicGoals';
import {
  subscribeToChatSessions,
  saveChatSessionToFirestore,
  deleteChatSessionFromFirestore,
  defaultInitialSession,
} from '../../services/firebase';

export type ChatMode = 'summary' | 'blackboard' | 'calculator' | null;

interface NasserChatViewProps {
  studentName?: string;
  initialChatMode?: ChatMode;
  onNavigateTo?: (tab: ActiveTab) => void;
  onAddTask?: (task: Omit<AcademicTask, 'id'>) => void;
  onShowToast?: (toast: { title: string; message: string; type: 'success' | 'info' | 'warning' }) => void;
  investigatingTask?: { title: string; subject: string; id?: string } | null;
}

export interface DetectedToolRequirement {
  type: 'calculator' | 'summary' | 'blackboard';
  toolName: string;
  reason: string;
}

// Guía inteligente de uso (Requisito 2): Detección automática de intenciones para activar herramientas
export function detectToolRequirement(text: string, hasImage: boolean): DetectedToolRequirement | null {
  const lower = text.toLowerCase().trim();

  // 1. Digitalizar Pizarra:
  const pizarraKeywords = /(?:digitali[zs]ar?|pasar?\s+a\s+limpio|transcribir?|leer?)\s+(?:la\s+)?(?:pizarra|pizarr[oó]n|tablero|board)/i;
  const isBlackboardMention = pizarraKeywords.test(lower) || /\b(?:foto\s+de\s+(?:la\s+)?pizarra|pizarr[oó]n\s+de\s+clase)\b/i.test(lower);
  if (isBlackboardMention || (hasImage && (pizarraKeywords.test(lower) || /\b(?:pizarra|pizarr[oó]n|clase|tablero)\b/i.test(lower)))) {
    return {
      type: 'blackboard',
      toolName: 'Digitalizar Pizarra',
      reason: 'Detecté una solicitud para digitalizar o transcribir una pizarra. Para ordenar, limpiar y estructurar formalmente el contenido exacto escrito en ella sin generar un resumen genérico, debes activar la herramienta Digitalizar Pizarra.',
    };
  }

  // 2. Calculador:
  const mathVerbs = /\b(?:calcula|calc[uú]lame|resolver?|resuelve|halla|determina|despeja|eval[uú]a|derivar?|deriva|integrar?|integra|simplifica|factoriza)\b/i;
  const mathTerms = /\b(?:ecuaci[oó]n|ecuaciones|matriz|matrices|integral|integrales|derivada|derivadas|l[ií]mite|l[ií]mites|trigonometr[ií]a|polinomio|fracci[oó]n|fracciones|teorema\s+de\s+pit[aá]goras)\b/i;
  const mathFormulaPattern = /(?:\d+\s*[\+\-\*\/\^]\s*\d+)|(?:\b\d*x[\^2-9]?\s*[\+\-\=])|(?:\b(?:sen|cos|tan|log|ln|sqrt|raiz)\s*\()/i;
  const hasEquationSign = /[a-zA-Z0-9]\s*=\s*[0-9\+\-\*\/x]/i.test(lower) && /\d/.test(lower);

  const isMathExercise =
    (mathVerbs.test(lower) && (mathTerms.test(lower) || mathFormulaPattern.test(lower) || hasEquationSign)) ||
    (mathTerms.test(lower) && (mathFormulaPattern.test(lower) || hasEquationSign)) ||
    (/^(?:cu[aá]nto\s+es|calcula|resuelve)\s+[\d\(\)\.\+\-\*\/x\^\s\=]+$/i.test(lower));

  if (isMathExercise) {
    return {
      type: 'calculator',
      toolName: 'Calculador',
      reason: 'Detecté un ejercicio matemático o numérico. Para resolver problemas y ecuaciones paso a paso con rigor pedagógico y justificación analítica, debes activar la herramienta Calculador.',
    };
  }

  // 3. Resúmenes y Apuntes:
  const summaryVerbs = /\b(?:resum(?:e|ir|en|eme)|hazme\s+un\s+resumen|sinteti[zs](?:ar?|a)|s[ií]ntesis\s+de|pasa(?:r)?\s+a\s+apuntes|apuntes\s+cornell|extrae\s+lo\s+esencial|crear?\s+un\s+resumen)\b/i;
  const isSummaryRequest = summaryVerbs.test(lower) && (lower.length > 40 || lower.includes('\n') || /del?\s+siguiente\s+texto|de\s+estos\s+apuntes|de\s+esta\s+lectura/i.test(lower));

  if (isSummaryRequest) {
    return {
      type: 'summary',
      toolName: 'Resúmenes y Apuntes',
      reason: 'Detecté una solicitud para resumir y sintetizar texto. Para generar síntesis ejecutivas, notas Cornell y fichas mnemotécnicas a partir de textos o apuntes, debes activar la herramienta Resúmenes y Apuntes.',
    };
  }

  return null;
}

const NASSER_GREETINGS = [
  (name: string) => `¡Hola, ${name}! ¿Qué vamos a hacer hoy?`,
  (name: string) => `¡Hola, ${name}! ¿En qué materia nos enfocamos hoy?`,
  (name: string) => `¡Hola, ${name}! ¿Preparamos tu próximo examen?`,
  (name: string) => `¡Hola, ${name}! ¿Qué concepto repasamos hoy?`,
  (name: string) => `¡Hola, ${name}! ¿Organizamos tus exposiciones o resúmenes?`,
  (name: string) => `¡Hola, ${name}! Listo para resolver cualquier duda académica.`,
  (name: string) => `¡Hola, ${name}! ¿Qué tema desafiante conquistamos hoy?`,
  (name: string) => `¡Hola, ${name}! ¿Practicamos para tu presentación oral?`,
];

const ACADEMIC_DISCIPLINES = [
  { id: 'General', name: 'General', icon: Sparkles },
  { id: 'Biología', name: 'Biología', icon: Dna, prompt: 'Investiga con rigor biológico y desglosa: ' },
  { id: 'Física', name: 'Física', icon: Atom, prompt: 'Analiza con leyes físicas y fórmulas: ' },
  { id: 'Cálculo', name: 'Cálculo', icon: Calculator, prompt: 'Demuestra y resuelve con rigor matemático: ' },
  { id: 'Algoritmos', name: 'Algoritmos', icon: Binary, prompt: 'Estructura el análisis computacional de: ' },
  { id: 'Humanidades', name: 'Humanidades', icon: BookOpen, prompt: 'Desarrolla un análisis crítico y fundamentado de: ' },
];

// Elimina cualquier saludo, presentación personal o preámbulo corporativo introductorio
// para asegurar respuestas que van directo al grano desde la primera línea.
export const stripPreambleAndGreetings = (raw: string): string => {
  if (!raw) return '';
  let res = raw.trim();

  const patrones = [
    /^(?:¡?hola(?:,?\s*estudiante|,?\s*amig[oa]| a tod[oa]s)?!?|saludos(?: cordiales)?[\.\!\:]?|buenos días[\.\!\:]?|buenas tardes[\.\!\:]?|buenas noches[\.\!\:]?|bienvenid[oa]s?(?:\s+a\s+(?:dyser|nasser\s*ai))?[\.\!\:]?)\s*/i,
    /^(?:soy|mi nombre es)\s+nasser\s+ai[,\.\s\-]*(?:tu|su)?\s*(?:asistente|tutor|motor)?[^\n\.]*[\.\n]+/i,
    /^(?:como\s+asistente\s+de\s+investigación[^\n\.]*[\.\n]+)/i,
    /^(?:(?:hoy\s+)?(?:abordaremos|analizaremos|explicaremos|veremos|revisaremos|estudiaremos)\s+(?:el\s+concepto\s+de|el\s+tema\s+de|a\s+fondo|la\s+temática)?[^\n\.]*[\.\n]+)/i,
    /^(?:a\s+continuación,?\s*(?:presento|se\s+presenta|analizaremos|revisaremos|te\s+explico)[^\n\.]*[\.\n]+)/i,
    /^(?:con\s+gusto\s+(?:te\s+ayudo|respondo|te\s+explico)[^\n\.]*[\.\n]+)/i,
  ];

  let modificado = true;
  let iteraciones = 0;
  while (modificado && iteraciones < 6) {
    modificado = false;
    iteraciones++;
    for (const pat of patrones) {
      if (pat.test(res)) {
        res = res.replace(pat, '').trim();
        modificado = true;
      }
    }
  }

  return res;
};

// Sanitizador para eliminar fórmulas crudas en LaTeX, bloques de código innecesarios y convertirlos a lenguaje natural
const sanitizeAcademicText = (raw: string): string => {
  if (!raw) return '';

  let text = stripPreambleAndGreetings(raw);

  // 1. Eliminar entornos completos de LaTeX (\begin{...} ... \end{...})
  text = text.replace(/\\begin\{[a-zA-Z*]+\}([\s\S]*?)\\end\{[a-zA-Z*]+\}/g, '$1');

  // 2. Convertir delimitadores de bloque y matemáticos $$ ... $$ y $ ... $
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  text = text.replace(/\$([^\$\n]+)\$/g, '$1');

  // 3. Traducir comandos LaTeX comunes a lenguaje natural / símbolos limpios
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  text = text.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1√($2)');
  text = text.replace(/\\times/g, ' × ');
  text = text.replace(/\\cdot/g, ' · ');
  text = text.replace(/\\pm/g, ' ± ');
  text = text.replace(/\\approx/g, ' ≈ ');
  text = text.replace(/\\neq/g, ' ≠ ');
  text = text.replace(/\\leq/g, ' ≤ ');
  text = text.replace(/\\geq/g, ' ≥ ');
  text = text.replace(/\\infty/g, ' ∞ ');
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\gamma/g, 'γ');
  text = text.replace(/\\Delta/g, 'Δ');
  text = text.replace(/\\delta/g, 'δ');
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\theta/g, 'θ');
  text = text.replace(/\\lambda/g, 'λ');
  text = text.replace(/\\mu/g, 'μ');
  text = text.replace(/\\sigma/g, 'σ');
  text = text.replace(/\\omega/g, 'ω');
  text = text.replace(/\\Omega/g, 'Ω');
  text = text.replace(/\\partial/g, '∂');
  text = text.replace(/\\int/g, '∫');
  text = text.replace(/\\sum/g, '∑');
  text = text.replace(/\\in/g, ' ∈ ');
  text = text.replace(/\\notin/g, ' ∉ ');
  text = text.replace(/\\subset/g, ' ⊂ ');
  text = text.replace(/\\forall/g, 'para todo ');
  text = text.replace(/\\exists/g, 'existe ');
  text = text.replace(/\\to|\\rightarrow/g, ' → ');
  text = text.replace(/\\Rightarrow/g, ' ⇒ ');
  text = text.replace(/\\Leftrightarrow/g, ' ⇔ ');

  // 4. Limpiar comandos de formato \text{...}, \mathbf{...}, \mathit{...}, \mathbb{...}
  text = text.replace(/\\text\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathit\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathbb\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathrm\{([^}]+)\}/g, '$1');

  // 5. Eliminar barras invertidas residuales aisladas
  text = text.replace(/\\([a-zA-Z]+)/g, '$1');

  // 6. Eliminar bloques triples de código crudo innecesarios (```latex, ```code) si envuelven texto académico
  text = text.replace(/```(?:latex|tex|code|text)?\n([\s\S]*?)```/g, '$1');

  return text;
};

// Componente para renderizar la respuesta académica estructurada (negritas, listas, viñetas, desgloses)
const AcademicTextRenderer: React.FC<{ content: string }> = ({ content }) => {
  const sanitized = sanitizeAcademicText(content);
  const lines = sanitized.split('\n');

  const formatInline = (text: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-gray-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[12px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Subtítulos H3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-black text-[#00236f] dark:text-[#90a8ff] mt-3.5 mb-1.5 tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fe6b00]" />
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // Títulos principales H2
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-4 mb-2 tracking-tight border-b border-gray-100 dark:border-gray-800 pb-1">
              {formatInline(trimmed.replace(/^#+\s+/, ''))}
            </h3>
          );
        }

        // Bloques de cita / contexto
        if (trimmed.startsWith('> ')) {
          return (
            <div key={idx} className="p-2.5 my-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-[#00236f] dark:border-indigo-400 text-xs text-gray-700 dark:text-gray-300">
              {formatInline(trimmed.replace(/^>\s+/, ''))}
            </div>
          );
        }

        // Separadores
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-3 border-gray-200 dark:border-gray-800" />;
        }

        // Viñetas estilo lista
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00236f] dark:bg-indigo-400 shrink-0 mt-2" />
              <div className="flex-1 min-w-0">{formatInline(bulletContent)}</div>
            </div>
          );
        }

        // Listas numeradas
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-[#00236f] dark:text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/50 dark:border-indigo-800/60">
                {numMatch[1]}
              </span>
              <div className="flex-1 min-w-0">{formatInline(numMatch[2])}</div>
            </div>
          );
        }

        // Párrafo estándar
        return (
          <p key={idx} className="my-1">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const NasserChatView: React.FC<NasserChatViewProps> = ({
  studentName = 'Alejandro Valenzuela',
  initialChatMode,
  onNavigateTo,
  onAddTask,
  onShowToast,
  investigatingTask,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([defaultInitialSession]);
  const [activeSessionId, setActiveSessionId] = useState<string>(defaultInitialSession.id);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'saving' | 'synced'>('connected');
  const [selectedSubject, setSelectedSubject] = useState<string>('General');

  // Modo de herramienta integrado en el chat (Estilo Gemini)
  const [activeChatMode, setActiveChatMode] = useState<ChatMode>(initialChatMode || null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    dataUrl: string;
    mimeType: string;
  } | null>(null);

  const plusMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar initialChatMode si cambia de prop externamente
  useEffect(() => {
    if (initialChatMode !== undefined) {
      setActiveChatMode(initialChatMode);
    }
  }, [initialChatMode]);

  // Cerrar menú flotante "+" al hacer clic afuera
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, [isPlusMenuOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage({
          name: file.name,
          dataUrl: reader.result as string,
          mimeType: file.type || 'image/jpeg',
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  // Saludo dinámico que cambia cada vez que el estudiante ingresa a Nasser IA
  const [greeting] = useState<string>(() => {
    const firstName = studentName.split(' ')[0] || 'Alejandro';
    const randomGreetingFn = NASSER_GREETINGS[Math.floor(Math.random() * NASSER_GREETINGS.length)];
    return randomGreetingFn(firstName);
  });

  // Estado para reconocimiento de voz por Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flujo 1: Grabación de clases en vivo directa en el chat con regla estricta de Cero Resúmenes
  const [isLiveClassRecording, setIsLiveClassRecording] = useState(false);
  const [liveClassSeconds, setLiveClassSeconds] = useState(0);
  const liveClassTimerRef = useRef<any>(null);
  const liveClassTranscriptRef = useRef<string>('');
  const liveClassMediaStreamRef = useRef<MediaStream | null>(null);
  const liveClassMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveClassAudioChunksRef = useRef<Blob[]>([]);

  const [activeInvestigation, setActiveInvestigation] = useState<{
    title: string;
    subject: string;
    id?: string;
    description?: string;
    dueDate?: string;
  } | null>(null);

  // Formateador de pregunta enfocada en el tema para investigación limpia
  const formatTopicQuestion = (title: string) => {
    let t = (title || '').trim();
    t = t.replace(/^(?:tarea|actividad|investigación|investigar|estudio)\s*[:\-]\s*/i, '').trim();
    if (/^(el|la|los|las|un|una|unos|unas)\s+/i.test(t)) {
      return `¿Qué quieres saber sobre ${t.charAt(0).toLowerCase() + t.slice(1)}?`;
    }
    return `¿Qué quieres saber sobre ${t}?`;
  };

  // Detección e inicialización automática de tarea para investigar: PANTALLA LIMPIA
  useEffect(() => {
    const pending = investigatingTask || (() => {
      try {
        const stored = sessionStorage.getItem('dyser_investigate_task');
        if (stored) {
          sessionStorage.removeItem('dyser_investigate_task');
          return JSON.parse(stored);
        }
      } catch (_) {}
      return null;
    })();

    if (pending && pending.title) {
      setActiveInvestigation(pending);
      setSelectedSubject(pending.subject || 'General');

      // Sincronización de tema investigado para exámenes y exposiciones
      sessionStorage.setItem('dyser_last_research_topic', pending.title);
      sessionStorage.setItem('dyser_active_exam_topic', pending.title);
      sessionStorage.setItem('dyser_active_expo_topic', pending.title);

      const newSessionId = `session-inv-${Date.now()}`;

      // REGLA CRÍTICA: CERO bloques largos autogenerados por su cuenta.
      // La conversación inicia totalmente limpia esperando la consulta del estudiante.
      const newResearchSession: ChatSession = {
        id: newSessionId,
        title: `Investigación: ${pending.title}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        topic: pending.title,
      };

      setSessions(prev => [newResearchSession, ...prev]);
      setActiveSessionId(newSessionId);
      saveChatSessionToFirestore(newResearchSession);

      if (onShowToast) {
        onShowToast({
          title: '🔬 Investigación de Tarea',
          message: `Escribe tu consulta sobre "${pending.title}".`,
          type: 'info',
        });
      }
    }
  }, [investigatingTask]);

  const handleGoToExamPractice = (topicText?: string, contextText?: string) => {
    const finalTopic = topicText || activeInvestigation?.title || activeSession.title || 'Tema de Estudio';
    sessionStorage.setItem('dyser_active_exam_topic', finalTopic);
    sessionStorage.setItem('dyser_last_research_topic', finalTopic);
    if (contextText) {
      sessionStorage.setItem('dyser_exam_research_context', contextText);
    }
    sounds.playChirp();
    if (onNavigateTo) {
      onNavigateTo('exam-simulator');
    } else {
      window.dispatchEvent(new CustomEvent('dyser-navigate', { detail: 'exam-simulator' }));
    }
    if (onShowToast) {
      onShowToast({
        title: '🎯 Ruta 1: Examen Interactivo',
        message: 'Iniciando práctica tipo Duolingo con corrección en tiempo real.',
        type: 'info',
      });
    }
  };

  const handleGoToExpositionStudy = (topicText?: string, contextText?: string) => {
    const finalTopic = topicText || activeInvestigation?.title || activeSession.title || 'Tema de Estudio';
    sessionStorage.setItem('dyser_active_expo_topic', finalTopic);
    if (contextText) {
      sessionStorage.setItem('dyser_expo_research_context', contextText);
    }
    sounds.playChirp();
    if (onNavigateTo) {
      onNavigateTo('exposition-study');
    } else {
      window.dispatchEvent(new CustomEvent('dyser-navigate', { detail: 'exposition-study' }));
    }
    if (onShowToast) {
      onShowToast({
        title: '🎙️ Ruta 2: Estudio de Exposición',
        message: 'Estructurando oratoria por puntos y lámina mental para Nasser AI Studio.',
        type: 'info',
      });
    }
  };

  // Cronómetro de clase en vivo
  useEffect(() => {
    if (isLiveClassRecording) {
      liveClassTimerRef.current = setInterval(() => {
        setLiveClassSeconds(s => s + 1);
      }, 1000);
    } else {
      if (liveClassTimerRef.current) clearInterval(liveClassTimerRef.current);
    }
    return () => {
      if (liveClassTimerRef.current) clearInterval(liveClassTimerRef.current);
    };
  }, [isLiveClassRecording]);

  const formatLiveClassTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Flujo 2 Ingesta: Procesar automáticamente grabaciones enviadas desde la Biblioteca local
  useEffect(() => {
    const processPendingRecording = async () => {
      try {
        const pendingRaw = sessionStorage.getItem('dyser_pending_class_recording');
        if (pendingRaw) {
          sessionStorage.removeItem('dyser_pending_class_recording');
          const pending = JSON.parse(pendingRaw);
          if (pending && (pending.rawTranscript || pending.title)) {
            let audioPayload: { audioBase64: string; mimeType: string } | undefined;
            if (pending.id) {
              const blob = await getAudioRecord(pending.id);
              if (blob && blob.size > 0) {
                try {
                  const b64 = await blobToBase64(blob);
                  audioPayload = { audioBase64: b64, mimeType: blob.type || 'audio/webm' };
                } catch (b64Err) {
                  console.warn('Error al convertir audio a base64:', b64Err);
                }
              }
            }

            const autoPrompt = `[GRABACIÓN DE CLASE EN VIVO - REGLA DE PROCESAMIENTO OBLIGATORIA: PROHIBIDO RESUMIR]

Materia: "${pending.subject || 'Clase Universitaria'}"
Tema: "${pending.title || 'Grabación de clase en vivo'}"
Transcripción íntegra capturada:
"${pending.rawTranscript}"

Instrucción estricta de procesamiento: Bajo ninguna circunstancia debes resumir el contenido de la grabación de clases en vivo. Tienes la prohibición absoluta de recortar, condensar o sintetizar. Debes respetar de forma íntegra cada palabra transcrita, limitándote exclusivamente a transcribir y ordenar de forma pulcra, extensa y detallada toda la información escuchada punto por punto, estructurada limpiamente con negritas, viñetas y desgloses lógicos rigurosos, manteniendo todo el contexto original sin recortes y citando textualmente las advertencias del docente.`;

            setTimeout(() => {
              handleSend(autoPrompt, audioPayload);
            }, 350);
          }
        }
      } catch (e) {
        console.error('Error procesando grabación transferida desde biblioteca:', e);
      }
    };
    processPendingRecording();
  }, []);

  // 1. Suscripción en tiempo real a Firebase Firestore para multisesión
  useEffect(() => {
    const unsubscribe = subscribeToChatSessions((loadedSessions) => {
      if (loadedSessions && loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setActiveSessionId(prev => {
          const exists = loadedSessions.some(s => s.id === prev);
          return exists ? prev : loadedSessions[0].id;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Limpieza de reconocimiento de voz al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const activeSession: ChatSession =
    sessions.find(s => s.id === activeSessionId) || sessions[0] || defaultInitialSession;

  const isInvestigationSession = Boolean(
    activeInvestigation && (
      activeSession.id.startsWith('session-inv') ||
      activeSession.title.startsWith('Investigación:')
    )
  );

  // Filtrar estrictamente cualquier mensaje de bienvenida legado para garantizar pantalla limpia
  const messages = (activeSession.messages || []).filter(
    m =>
      m &&
      m.text &&
      !m.text.includes('Soy Nasser IA') &&
      !m.text.includes('Hola, Alejandro') &&
      m.id !== 'init-1'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isLoading]);

  // Las herramientas de estudio y creación de Nasser AI integradas directamente en el chat
  const studioTools = [
    {
      id: 'summary',
      title: 'Resúmenes y Apuntes',
      description: 'Síntesis ejecutiva, notas Cornell y flashcards',
      icon: FileText,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'hover:border-blue-400 dark:hover:border-blue-700/80',
      mode: 'summary' as ChatMode,
    },
    {
      id: 'blackboard',
      title: 'Digitalizar Pizarra',
      description: 'Ordenar y estructurar fotos de pizarrón',
      icon: Camera,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'hover:border-emerald-400 dark:hover:border-emerald-700/80',
      mode: 'blackboard' as ChatMode,
    },
    {
      id: 'solver',
      title: 'Calculador',
      description: 'Resolución analítica y paso a paso',
      icon: Calculator,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
      borderColor: 'hover:border-purple-400 dark:hover:border-purple-700/80',
      mode: 'calculator' as ChatMode,
    },
    {
      id: 'recorder',
      title: 'Grabación de clases en vivo',
      description: 'Cátedra a texto íntegro sin recortes',
      icon: Mic,
      color: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/15',
      borderColor: 'hover:border-rose-400 dark:hover:border-rose-700/80',
      tab: 'class-recorder' as ActiveTab,
    },
  ];

  // Crear una nueva conversación completamente limpia (sin mensajes)
  const handleCreateNewSession = async () => {
    setActiveInvestigation(null);
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nueva Conversación',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [], // Totalmente limpia sin mensaje de bienvenida
      topic: 'General',
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setFirebaseStatus('saving');

    await saveChatSessionToFirestore(newSession);
    setFirebaseStatus('synced');
    setTimeout(() => setFirebaseStatus('connected'), 1800);

    if (window.innerWidth < 768) {
      setIsHistoryOpen(false);
    }
  };

  // Eliminar sesión de chat
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      const resetSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'Nueva Conversación',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      await saveChatSessionToFirestore(resetSession);
      return;
    }

    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);

    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }

    await deleteChatSessionFromFirestore(sessionId);
  };

  // Limpiar todos los mensajes de la conversación activa
  const handleClearActiveChat = async () => {
    if (!activeSession) return;
    const clearedSession: ChatSession = {
      ...activeSession,
      title: 'Nueva Conversación',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => prev.map(s => (s.id === activeSession.id ? clearedSession : s)));
    await saveChatSessionToFirestore(clearedSession);
  };

  // Eliminar un mensaje específico del chat
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeSession) return;
    const updatedMsgs = (activeSession.messages || []).filter(m => m.id !== msgId);
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: updatedMsgs,
      updatedAt: Date.now(),
    };
    setSessions(prev => prev.map(s => (s.id === activeSession.id ? updatedSession : s)));
    await saveChatSessionToFirestore(updatedSession);
  };

  // Activar / Desactivar micrófono con Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'El reconocimiento de voz no está soportado nativamente en este navegador. Te sugerimos usar Chrome, Edge o Safari.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setSpeechFeedback(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback('Escuchando... habla ahora');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition] Error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechFeedback('Permiso de micrófono no concedido');
        } else {
          setSpeechFeedback(null);
        }
        setTimeout(() => setSpeechFeedback(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechFeedback(null);
      };

      recognition.start();
    } catch (err) {
      console.error('[Speech Recognition] Fallo al iniciar:', err);
      setIsListening(false);
      setSpeechFeedback(null);
    }
  };

  // Flujo 1: Grabación de clases en vivo directa en el chat
  // Regla: Cuando el usuario detiene la grabación, procesa, transcribe y envía automáticamente a Nasser AI sin confirmaciones
  // con la regla estricta de CERO RESÚMENES (entrega íntegra y ordenada punto por punto).
  const handleToggleLiveClassRecording = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isLiveClassRecording) {
      // Detener grabación y recolectar audio real
      sounds.playPop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      // Detener MediaRecorder y recolectar blob
      let audioPayload: { audioBase64: string; mimeType: string } | undefined;
      if (liveClassMediaRecorderRef.current && liveClassMediaRecorderRef.current.state !== 'inactive') {
        try {
          await new Promise<void>((resolve) => {
            if (!liveClassMediaRecorderRef.current) return resolve();
            liveClassMediaRecorderRef.current.onstop = () => resolve();
            liveClassMediaRecorderRef.current.stop();
          });

          if (liveClassAudioChunksRef.current.length > 0) {
            const mimeType = liveClassMediaRecorderRef.current.mimeType || 'audio/webm';
            const audioBlob = new Blob(liveClassAudioChunksRef.current, { type: mimeType });
            try {
              const b64 = await blobToBase64(audioBlob);
              audioPayload = { audioBase64: b64, mimeType };
              // Guardar también en IndexedDB local para respaldo del estudiante
              saveAudioRecord(`rec-chat-${Date.now()}`, audioBlob).catch(() => {});
            } catch (convErr) {
              console.warn('Error convirtiendo audio de chat a base64:', convErr);
            }
          }
        } catch (mErr) {
          console.warn('Error deteniendo mediaRecorder en chat:', mErr);
        }
      }

      if (liveClassMediaStreamRef.current) {
        liveClassMediaStreamRef.current.getTracks().forEach((t) => t.stop());
        liveClassMediaStreamRef.current = null;
      }

      setIsLiveClassRecording(false);
      setIsListening(false);
      setSpeechFeedback(null);

      // Transcripción capturada palabra por palabra
      const transcriptCaptured =
        liveClassTranscriptRef.current.trim() ||
        input.trim() ||
        `Audio capturado en vivo durante la cátedra de ${selectedSubject}. Registro completo de la clase para transcripción y ordenamiento riguroso.`;

      const prompt = `[GRABACIÓN DE CLASE EN VIVO - REGLA DE PROCESAMIENTO OBLIGATORIA: PROHIBIDO RESUMIR]

Materia / Cátedra: ${selectedSubject}
Tiempo de clase grabado: ${formatLiveClassTime(liveClassSeconds)}
Transcripción íntegra capturada en el aula:
"${transcriptCaptured}"

Instrucción estricta para Nasser AI:
Bajo NINGUNA circunstancia debes resumir el contenido de esta grabación de clase en vivo. Tienes prohibición absoluta de recortar, condensar o sintetizar. Debes respetar de forma íntegra cada palabra transcrita, limitándote exclusivamente a transcribir y ordenar de forma pulcra, extensa y detallada toda la información escuchada punto por punto, estructurada limpiamente con negritas, viñetas y desgloses lógicos rigurosos, manteniendo todo el contexto original sin recortes y citando textualmente las advertencias del docente.`;

      setInput('');
      liveClassTranscriptRef.current = '';
      setLiveClassSeconds(0);

      // Envío automático e inmediato a Nasser AI sin confirmaciones
      handleSend(prompt, audioPayload);
      return;
    }

    // Iniciar grabación de clase en vivo con micrófono real
    sounds.playChirp();
    setIsLiveClassRecording(true);
    setLiveClassSeconds(0);
    liveClassTranscriptRef.current = '';
    liveClassAudioChunksRef.current = [];

    // Solicitar stream de audio real del micrófono
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        liveClassMediaStreamRef.current = stream;

        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        liveClassMediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            liveClassAudioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(1000);
      }
    } catch (micErr) {
      console.warn('[Live Class Recording] Micrófono nativo no accesible:', micErr);
    }

    if (!SpeechRecognition) {
      setSpeechFeedback('Grabando clase en vivo en el aula...');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback('Grabando clase en vivo en el aula...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          liveClassTranscriptRef.current = (liveClassTranscriptRef.current + ' ' + transcript).trim();
          setSpeechFeedback(`Grabando: "${transcript.slice(-35)}..."`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Live Class Recording] Recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechFeedback('Permiso de micrófono requerido');
        }
      };

      recognition.onend = () => {
        // En grabación de clase en vivo, reiniciar si no fue detenida por el usuario
        if (isLiveClassRecording) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[Live Class Recording] Fallo inicio reconocimiento:', err);
    }
  };

  // Enviar mensaje en el chat con soporte de herramientas integradas y validación inteligente
  const handleSend = async (
    textToSend?: string,
    audioPayload?: { audioBase64: string; mimeType: string },
    overrideMode?: ChatMode
  ) => {
    // Si estaba grabando, detener el micrófono
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
    if (isLiveClassRecording) {
      setIsLiveClassRecording(false);
      if (liveClassTimerRef.current) clearInterval(liveClassTimerRef.current);
      if (liveClassMediaStreamRef.current) {
        liveClassMediaStreamRef.current.getTracks().forEach((t) => t.stop());
        liveClassMediaStreamRef.current = null;
      }
    }

    const text = (textToSend !== undefined ? textToSend : input).trim();
    if ((!text && !attachedImage && !audioPayload) || isLoading) return;

    const effectiveMode = overrideMode !== undefined ? overrideMode : activeChatMode;

    // -------------------------------------------------------------------------
    // GUÍA INTELIGENTE DE USO (Requisito 2):
    // Si el usuario envía un texto o ejercicio que requiera Calculador, Resúmenes o
    // Digitalizar Pizarra sin haber activado previamente su botón, Nasser AI NO lo
    // procesa por su cuenta, sino que responde guiándolo con un botón de activación.
    // -------------------------------------------------------------------------
    if (!effectiveMode && text) {
      const requirement = detectToolRequirement(text, !!attachedImage);
      if (requirement) {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text,
          timestamp: Date.now(),
          attachment: attachedImage ? { name: attachedImage.name, type: 'image', dataUrl: attachedImage.dataUrl } : undefined,
        };

        const guideMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'nasser',
          mode: 'guide',
          text: `${requirement.reason}\n\nPara continuar, activa la herramienta correspondiente desde el botón **(+)** de la barra de chat o presiona la acción rápida directa a continuación:`,
          guidanceAction: {
            targetMode: requirement.type,
            label: `Activar ${requirement.toolName} y Procesar`,
            pendingQuery: text,
          },
          timestamp: Date.now() + 2,
        };

        const updatedMessages = [...messages, userMsg, guideMsg];
        const sessionWithGuide: ChatSession = {
          ...activeSession,
          updatedAt: Date.now(),
          messages: updatedMessages,
        };

        setSessions(prev => prev.map(s => (s.id === activeSession.id ? sessionWithGuide : s)));
        setInput('');
        await saveChatSessionToFirestore(sessionWithGuide);
        return;
      }
    }

    trackGoalAction('nasser-ia');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text || (attachedImage ? `[Foto adjunta: ${attachedImage.name}]` : ''),
      timestamp: Date.now(),
      mode: effectiveMode || undefined,
      attachment: attachedImage ? { name: attachedImage.name, type: 'image', dataUrl: attachedImage.dataUrl } : undefined,
    };

    let updatedTitle = activeSession.title;
    if (activeSession.title === 'Nueva Conversación' || activeSession.title.startsWith('Conversación')) {
      const cleanSnippet = (text || attachedImage?.name || 'Consulta').trim().slice(0, 32);
      updatedTitle = cleanSnippet + ((text || '').length > 32 ? '...' : '');
    }

    const updatedMessagesWithUser = [...messages, userMsg];
    const sessionWithUser: ChatSession = {
      ...activeSession,
      title: updatedTitle,
      updatedAt: Date.now(),
      messages: updatedMessagesWithUser,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? sessionWithUser : s))
    );
    setInput('');
    setIsLoading(true);
    setFirebaseStatus('saving');

    // Persistir de inmediato en Firebase Firestore
    await saveChatSessionToFirestore(sessionWithUser);

    try {
      let cleanReply = '';

      // Procesamiento especializado en la misma pantalla según el modo activo
      if (effectiveMode === 'calculator') {
        trackGoalAction('problem-solver');
        const res = await fetch('/api/ai/problem-solver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem: text,
            subject: selectedSubject !== 'General' ? selectedSubject : 'Matemáticas y Ciencias Exactas',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let md = ``;
          if (data.problemTitle) md += `### ${data.problemTitle}\n\n`;
          if (data.theoreticalBasis) md += `**Marco Teórico y Fundamentos:**\n${data.theoreticalBasis}\n\n`;
          if (data.steps && data.steps.length > 0) {
            md += `**Procedimiento Analítico Paso a Paso:**\n`;
            data.steps.forEach((st: any) => {
              md += `\n${st.stepNumber || '•'}. **${st.title || 'Paso'}**\n${st.explanation || ''}\n`;
              if (st.mathExpression) md += `> ${st.mathExpression}\n`;
            });
            md += `\n`;
          }
          if (data.finalAnswer) md += `**Resultado Final:**\n${data.finalAnswer}\n\n`;
          if (data.verificationTip) md += `**Comprobación Rápida:**\n${data.verificationTip}\n\n`;
          if (data.commonPitfall || data.commonPitfalls?.[0]) {
            md += `**Precaución / Error a Evitar:**\n${data.commonPitfall || data.commonPitfalls[0]}\n`;
          }
          cleanReply = stripPreambleAndGreetings(md);
        } else {
          cleanReply = stripPreambleAndGreetings(
            nasserAI.responderConsultaEstudiante(`Resolución analítica paso a paso del ejercicio en ${selectedSubject}: ${text}`)
          );
        }
      } else if (effectiveMode === 'summary') {
        trackGoalAction('summary');
        const res = await fetch('/api/ai/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const data = await res.json();
          let md = ``;
          if (data.executiveSummary) md += `### Síntesis Ejecutiva\n${data.executiveSummary}\n\n`;
          if (data.keyPoints && data.keyPoints.length > 0) {
            md += `### Puntos Clave (Método Cornell)\n`;
            data.keyPoints.forEach((kp: string) => {
              md += `- ${kp}\n`;
            });
            md += `\n`;
          }
          if (data.keyFormulasOrConcepts && data.keyFormulasOrConcepts.length > 0) {
            md += `### Conceptos Clave y Postulados\n`;
            data.keyFormulasOrConcepts.forEach((c: string) => {
              md += `- **${c}**\n`;
            });
            md += `\n`;
          }
          if (data.examWarning) md += `### Advertencia para Examen\n⚠️ ${data.examWarning}\n\n`;
          if (data.flashcards && data.flashcards.length > 0) {
            md += `### Fichas Mnemotécnicas (Flashcards)\n`;
            data.flashcards.forEach((fc: any, i: number) => {
              md += `**Ficha ${i + 1}:**\n- Pregunta: ${fc.front}\n- Respuesta: ${fc.back}\n\n`;
            });
          }
          cleanReply = stripPreambleAndGreetings(md);
        } else {
          const offlineRes = nasserAI.generarResumenAvanzado(text);
          if (offlineRes.resumenEstructurado) {
            const s = offlineRes.resumenEstructurado;
            let md = `### Síntesis Ejecutiva\n${s.ideaCentral}\n\n### Puntos Esenciales\n`;
            s.puntosEsenciales.forEach((p: string) => { md += `- ${p}\n`; });
            if (s.trampaExamen) md += `\n### Advertencia para Examen\n⚠️ ${s.trampaExamen}\n`;
            cleanReply = stripPreambleAndGreetings(md);
          } else {
            cleanReply = stripPreambleAndGreetings(nasserAI.responderConsultaEstudiante(text));
          }
        }
      } else if (effectiveMode === 'blackboard') {
        trackGoalAction('blackboard');
        // REGLA CRÍTICA ESTRICTA (Requisito 3): CERO RESÚMENES GENÉRICOS.
        // Transcribir, ordenar, limpiar y estructurar formalmente el contenido exacto escrito en la pizarra.
        const res = await fetch('/api/ai/blackboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: attachedImage ? attachedImage.dataUrl : undefined,
            description: text,
            subject: selectedSubject !== 'General' ? selectedSubject : 'Ciencias e Ingeniería',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let md = ``;
          if (data.boardTitle) md += `### ${data.boardTitle}\n\n`;
          if (data.rawTranscription) {
            md += `#### Transcripción Exacta y Ordenada del Pizarrón:\n${data.rawTranscription}\n\n`;
          }
          if (data.latexFormulas && data.latexFormulas.length > 0) {
            md += `#### Ecuaciones y Fórmulas Transcritas de la Pizarra:\n`;
            data.latexFormulas.forEach((f: string) => {
              md += `- ${f}\n`;
            });
            md += `\n`;
          }
          if (data.diagramDescription) {
            md += `#### Diagramas y Esquemas del Pizarrón:\n${data.diagramDescription}\n\n`;
          }
          if (data.structuredNotes) {
            md += `#### Contenido de la Pizarra Estructurado:\n${data.structuredNotes}\n`;
          }
          cleanReply = stripPreambleAndGreetings(md);
        } else {
          cleanReply = stripPreambleAndGreetings(
            `### Pizarra Digitalizada: ${selectedSubject}\n\n` +
            `#### Transcripción Exacta y Ordenada:\n${text || 'Anotaciones de la pizarra digitalizadas y estructuradas fielmente punto por punto.'}\n\n` +
            `#### Apuntes Estructurados:\n- **Contenido del pizarrón:** Registrado sin alteraciones ni recortes.`
          );
        }
        setAttachedImage(null);
      } else {
        // Consulta general de investigación académica
        const historyPayload = updatedMessagesWithUser.map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));

        const liveReply = await sendLiveNasserQuery(
          text,
          historyPayload,
          selectedSubject !== 'General' ? selectedSubject : undefined,
          audioPayload
        );

        const rawReply = liveReply || nasserAI.responderConsultaEstudiante(text);
        cleanReply = stripPreambleAndGreetings(rawReply);
        if (attachedImage) setAttachedImage(null);
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'nasser',
        text: cleanReply,
        mode: effectiveMode || undefined,
        timestamp: Date.now(),
      };

      const finalSession: ChatSession = {
        ...sessionWithUser,
        updatedAt: Date.now(),
        messages: [...updatedMessagesWithUser, aiMsg],
      };

      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? finalSession : s))
      );

      await saveChatSessionToFirestore(finalSession);
      setFirebaseStatus('synced');
      setTimeout(() => setFirebaseStatus('connected'), 2000);
    } catch (e) {
      console.error('[Nasser AI Chat] Error en transmisión:', e);
      const fallbackReply = stripPreambleAndGreetings(nasserAI.responderConsultaEstudiante(text));
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'nasser',
        text: fallbackReply,
        timestamp: Date.now(),
      };

      const finalFallbackSession: ChatSession = {
        ...sessionWithUser,
        updatedAt: Date.now(),
        messages: [...updatedMessagesWithUser, fallbackMsg],
      };

      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? finalFallbackSession : s))
      );
      await saveChatSessionToFirestore(finalFallbackSession);
      setFirebaseStatus('synced');
      setTimeout(() => setFirebaseStatus('connected'), 1800);
    } finally {
      setIsLoading(false);
    }
  };

  // Ejecución inmediata desde el botón de la guía inteligente
  const handleExecuteGuidance = (action: { targetMode: 'summary' | 'blackboard' | 'calculator'; pendingQuery: string }) => {
    setActiveChatMode(action.targetMode);
    handleSend(action.pendingQuery, undefined, action.targetMode);
  };

  // Selección de modo desde las tarjetas de bienvenida
  const handleToolClick = (tool: typeof studioTools[number]) => {
    if ('mode' in tool && tool.mode) {
      setActiveChatMode(tool.mode);
      if (tool.mode === 'blackboard') {
        fileInputRef.current?.click();
      }
    } else if ('tab' in tool && tool.tab && onNavigateTo) {
      onNavigateTo(tool.tab);
    }
  };

  const copyMessageText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Acciones locales dyser a partir de la investigación de Nasser AI
  const handleActionGenerarExamen = (topic: string, text: string) => {
    const cleanTopic = topic && topic !== 'Nueva Conversación' ? topic : (selectedSubject !== 'General' ? selectedSubject : 'Investigación Académica');
    transferirInvestigacionAExamen(cleanTopic, text);
    sounds.playChirp();
    if (onNavigateTo) {
      onNavigateTo('exam-simulator');
    }
  };

  const handleActionGenerarResumen = (topic: string, text: string) => {
    const cleanTopic = topic && topic !== 'Nueva Conversación' ? topic : (selectedSubject !== 'General' ? selectedSubject : 'Investigación Académica');
    transferirInvestigacionAResumen(cleanTopic, text);
    sounds.playChirp();
    if (onNavigateTo) {
      onNavigateTo('summary');
    }
  };

  const handleActionGenerarExposicion = (topic: string, text: string) => {
    const cleanTopic = topic && topic !== 'Nueva Conversación' ? topic : (selectedSubject !== 'General' ? selectedSubject : 'Investigación Académica');
    transferirInvestigacionAExposicion(cleanTopic, text);
    sounds.playChirp();
    if (onNavigateTo) {
      onNavigateTo('multimedia');
    }
  };

  const handleActionGuardarComoTarea = (topic: string, text: string) => {
    const cleanTopic = topic && topic !== 'Nueva Conversación' ? topic : (selectedSubject !== 'General' ? selectedSubject : 'Investigación Académica');
    const taskTitle = `Repasar: ${cleanTopic.slice(0, 36)}`;

    if (onAddTask) {
      onAddTask({
        title: taskTitle,
        subject: selectedSubject !== 'General' ? selectedSubject : 'Investigación',
        deadline: 'Próxima sesión',
        status: 'pendiente',
        priority: 'media',
        isOverdue: false,
        aiRecommendation: 'Repasar los puntos clave y conceptos investigados con Nasser AI.',
      });
    }

    if (onShowToast) {
      onShowToast({
        title: 'Investigación guardada',
        message: `Se ha creado la tarea "${taskTitle}" en tu planificador.`,
        type: 'success',
      });
    }

    sounds.playSuccess();
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.topic && s.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full h-[calc(100dvh-9.5rem)] sm:h-[calc(100vh-8.5rem)] max-h-[920px] flex flex-col md:flex-row relative animate-in fade-in duration-300 overflow-hidden bg-white dark:bg-[#070b14] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
      
      {/* ------------------------------------------------------------- */}
      {/* PANEL LATERAL DE HISTORIAL MULTISESIÓN (FIREBASE FIRESTORE) */}
      {/* ------------------------------------------------------------- */}
      {isHistoryOpen && (
        <aside
          className="fixed md:relative inset-y-0 left-0 z-40 w-80 max-w-[85vw] flex flex-col bg-white dark:bg-[#0e1424] border-r border-gray-200/80 dark:border-gray-800 shadow-xl md:shadow-none p-4 shrink-0 transition-all duration-200"
        >
          {/* Header del Historial */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#00236f] dark:text-[#90a8ff] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  Historial de Chats
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Firebase Firestore
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Cerrar panel de historial"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Botón "+ Nueva Conversación" */}
          <button
            onClick={handleCreateNewSession}
            className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Conversación</span>
          </button>

          {/* Buscador de Chats */}
          <div className="mt-2.5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar en tus chats..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-xl bg-gray-50 dark:bg-[#070b14] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
            />
          </div>

          {/* Lista de Sesiones */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 px-2 text-gray-400 text-xs">
                No se encontraron conversaciones.
              </div>
            ) : (
              filteredSessions.map(session => {
                const isActive = session.id === activeSessionId;
                const msgCount = session.messages ? session.messages.length : 0;
                const lastMsg = session.messages && session.messages[session.messages.length - 1];

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (window.innerWidth < 768) {
                        setIsHistoryOpen(false);
                      }
                    }}
                    className={`
                      group relative p-2.5 rounded-2xl cursor-pointer transition flex items-start gap-2.5 text-left border
                      ${
                        isActive
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:border-gray-200/60 dark:hover:border-gray-800'
                      }
                    `}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-[#00236f] text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isActive
                            ? 'text-[#00236f] dark:text-[#90a8ff]'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {session.title}
                      </h4>

                      <p className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : 'Nueva conversación sin mensajes'}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9.5px] font-mono text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(session.updatedAt || session.createdAt)}
                        </span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 font-semibold">
                          {msgCount} {msgCount === 1 ? 'msg' : 'msgs'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={e => handleDeleteSession(session.id, e)}
                      className="absolute right-2 top-2 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-80 sm:opacity-0 group-hover:opacity-100 transition"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PANTALLA PRINCIPAL: LIENZO LIMPIO (ESTILO GOOGLE AI STUDIO) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        
        {/* Barra superior estilo Google AI Studio */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 transition flex items-center gap-2 text-xs font-semibold shadow-2xs"
              title="Abrir historial de conversaciones"
            >
              {isHistoryOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-indigo-400" />}
              <span className="px-1.5 py-0.2 rounded-full bg-[#00236f] text-white text-[10px] font-bold">
                {sessions.length}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-[#00236f] dark:text-[#90a8ff]">
              <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
              <span className="truncate max-w-[280px]">{greeting}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón para borrar los mensajes del chat actual */}
            {messages.length > 0 && (
              <button
                onClick={handleClearActiveChat}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                title="Borrar todos los mensajes de esta conversación"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Borrar chat</span>
              </button>
            )}

            {/* Botón "+ Nueva Conversación" */}
            <button
              onClick={handleCreateNewSession}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Iniciar nuevo chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Chat</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ÁREA CENTRAL: */}
        {/* SIN MENSAJES -> SALUDO DINÁMICO + HERRAMIENTAS DE ESTUDIO */}
        {/* CON MENSAJES -> HILO FLUIDO DE INVESTIGACIÓN CON NASSER AI */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 custom-scrollbar flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center max-w-2xl w-full mx-auto px-2 py-3 sm:py-6 my-auto animate-in fade-in duration-300">
              {isInvestigationSession && activeInvestigation ? (
                /* ESTADO LIMPIO AL PRESIONAR 'INVESTIGAR': Sin bloques largos, sin los 4 botones estorbosos, pregunta enfocada en el tema */
                <div className="text-center max-w-lg w-full px-4 py-8">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-[#fe6b00] text-xs font-bold mb-4 border border-orange-200/60 dark:border-orange-800/60 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                    <span>Investigación • {activeInvestigation.subject || 'Cátedra'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                    {formatTopicQuestion(activeInvestigation.title)}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
                    Escribe tu consulta o enfoque específico en la barra inferior para comenzar sin saturar la pantalla.
                  </p>
                </div>
              ) : (
                /* Saludo dinámico estándar y accesos rápidos */
                <>
                  <div className="text-center mb-3 sm:mb-5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#00236f] dark:text-[#90a8ff] text-xs font-bold mb-2 border border-indigo-200/60 dark:border-indigo-800/60">
                      <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                      <span>Nasser IA • Asesor Académico</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                      {greeting}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Escribe tu consulta abajo o toca un acceso rápido directo:
                    </p>
                  </div>

                  {/* Accesos Clave Compactos Estilo Gemini (Cero Scroll Requerido) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-xl">
                    {studioTools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className={`group p-2.5 sm:p-3 rounded-2xl bg-gray-50/80 dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 ${tool.borderColor} hover:bg-white dark:hover:bg-[#151e33] hover:shadow-xs transition-all duration-150 text-left flex items-center gap-2.5 active:scale-98 cursor-pointer`}
                        >
                          <div className={`w-8 h-8 rounded-xl ${tool.bgColor} ${tool.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#00236f] dark:group-hover:text-indigo-400 transition truncate">
                              {tool.title}
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {tool.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            // CONVERSACIÓN FLUIDA: RESPUESTAS DE LA IA RENDERIZADAS COMO TEXTO (ESTILO GEMINI)
            <div className="max-w-3xl w-full mx-auto py-5 space-y-6">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';

                if (isUser) {
                  // Mensaje del estudiante: alineado a la derecha en burbuja limpia
                  return (
                    <div
                      key={msg.id || `msg-${idx}`}
                      className="flex items-start justify-end gap-2.5 group animate-in fade-in duration-150"
                    >
                      {/* Acciones del mensaje de usuario (copiar / borrar) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition self-center mr-1">
                        <button
                          onClick={() => copyMessageText(msg.text, idx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          title="Copiar texto"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Eliminar mensaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl bg-[#00236f] text-white text-xs sm:text-sm leading-relaxed shadow-xs rounded-tr-sm">
                        {msg.mode && (
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                            Modo: {msg.mode === 'calculator' ? 'Calculador' : msg.mode === 'summary' ? 'Resúmenes y Apuntes' : 'Digitalizar Pizarra'}
                          </div>
                        )}
                        {msg.attachment?.dataUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-xs">
                            <img
                              src={msg.attachment.dataUrl}
                              alt={msg.attachment.name}
                              className="w-full h-auto max-h-48 object-cover"
                            />
                            <div className="p-1 text-[10px] bg-black/40 truncate text-white/90">
                              {msg.attachment.name}
                            </div>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>

                      <img
                        src={STUDENT_AVATAR}
                        alt="Tú"
                        className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-[#00236f]/30 mt-0.5 shadow-2xs"
                      />
                    </div>
                  );
                }

                // Respuesta de Nasser AI: Formato de TEXTO PURO estructurado con rigor científico
                return (
                  <div
                    key={msg.id || `msg-${idx}`}
                    className="flex items-start gap-3.5 text-left group animate-in fade-in duration-200"
                  >
                    {/* Icono de Nasser AI */}
                    <div className="w-7 h-7 rounded-lg bg-[#00236f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>

                    {/* Contenido como texto editorial estructurado */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Nasser AI
                        </span>
                        {msg.mode === 'calculator' && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                            Calculador
                          </span>
                        )}
                        {msg.mode === 'summary' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            Resúmenes y Apuntes
                          </span>
                        )}
                        {msg.mode === 'blackboard' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            Digitalizar Pizarra
                          </span>
                        )}
                        {msg.mode === 'guide' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            Guía Inteligente
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>

                      {/* Texto renderizado con desglose académico, negritas y viñetas */}
                      <AcademicTextRenderer content={msg.text} />

                      {/* Botón interactivo de Guía Inteligente (Requisito 2) */}
                      {msg.guidanceAction && (
                        <div className="mt-3 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            {msg.guidanceAction.targetMode === 'calculator' && <Calculator className="w-4 h-4 text-purple-600 shrink-0" />}
                            {msg.guidanceAction.targetMode === 'summary' && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                            {msg.guidanceAction.targetMode === 'blackboard' && <Camera className="w-4 h-4 text-emerald-600 shrink-0" />}
                            <span>Acceso guiado a la herramienta:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => msg.guidanceAction && handleExecuteGuidance(msg.guidanceAction)}
                            className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>{msg.guidanceAction.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Controles del mensaje: Copiar y Eliminar */}
                      <div className="mt-2.5 pt-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyMessageText(msg.text, idx)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
                          title="Copiar texto"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                          title="Eliminar esta respuesta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3.5 text-left animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-lg bg-[#00236f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white block mb-1">
                      Nasser AI
                    </span>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-[#fe6b00]" />
                      <span>Investigando y estructurando con rigor académico...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMBUDO DE ESTUDIO COMPACTO Y HORIZONTAL (EN PARALELO) */}
              {messages.length >= 2 && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <div className="flex flex-row items-stretch gap-2 sm:gap-3 w-full">
                    {/* Opción 1: Practicar Examen (Morado) */}
                    <button
                      id="btn-funnel-practicar-examen"
                      onClick={() => handleGoToExamPractice(activeInvestigation?.title || activeSession.title, messages.map(m => m.text).join('\n'))}
                      className="w-[49%] flex-1 min-w-0 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100/90 dark:hover:bg-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer active:scale-[0.98] shadow-2xs group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                        <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8.5px] sm:text-[9.5px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block leading-none">
                          Ruta 1
                        </span>
                        <h4 className="text-[11px] sm:text-xs md:text-sm font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5 whitespace-normal">
                          Practicar Examen
                        </h4>
                      </div>
                    </button>

                    {/* Opción 2: Estudiar Exposición (Naranja) */}
                    <button
                      id="btn-funnel-estudiar-exposicion"
                      onClick={() => handleGoToExpositionStudy(activeInvestigation?.title || activeSession.title, messages.map(m => m.text).join('\n'))}
                      className="w-[49%] flex-1 min-w-0 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/80 hover:bg-orange-100/90 dark:hover:bg-orange-900/40 hover:border-[#fe6b00]/60 dark:hover:border-orange-600 transition flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer active:scale-[0.98] shadow-2xs group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#fe6b00] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#fe6b00] uppercase tracking-wider block leading-none">
                          Ruta 2
                        </span>
                        <h4 className="text-[11px] sm:text-xs md:text-sm font-black text-gray-900 dark:text-white tracking-tight leading-tight mt-0.5 whitespace-normal">
                          Estudiar Exposición
                        </h4>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BARRA DE ENTRADA DE TEXTO FIJA ABAJO ESTILO GEMINI */}
        {/* ------------------------------------------------------------- */}
        <div className="shrink-0 w-full px-3 sm:px-6 py-2.5 sm:py-3 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800/80 z-20">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-3xl w-full mx-auto space-y-2"
          >
            {/* Banner de Modo Activo Integrado */}
            {activeChatMode && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#131b2e] border border-gray-200/90 dark:border-gray-800 text-xs shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  {activeChatMode === 'summary' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-white truncate">Modo: Resúmenes y Apuntes</span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">• Síntesis formal y flashcards</span>
                    </>
                  )}
                  {activeChatMode === 'blackboard' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <Camera className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-white truncate">Modo: Digitalizar Pizarra</span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">• Transcripción y ordenación formal exacta</span>
                    </>
                  )}
                  {activeChatMode === 'calculator' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                      <Calculator className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-white truncate">Modo: Calculador</span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">• Demostración paso a paso</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveChatMode(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
                  title="Desactivar modo y volver a investigación libre"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Chip de imagen o archivo adjunto */}
            {attachedImage && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 text-xs shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={attachedImage.dataUrl}
                    alt="Adjunto"
                    className="w-7 h-7 rounded-lg object-cover border border-amber-300 dark:border-amber-700 shrink-0"
                  />
                  <span className="font-semibold text-amber-900 dark:text-amber-200 truncate">
                    {attachedImage.name}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 shrink-0">
                    (Foto lista para enviar)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-lg text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer shrink-0"
                  title="Eliminar adjunto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Banner interactivo de Grabación de clases en vivo en curso */}
            {isLiveClassRecording && (
              <div className="flex items-center justify-between gap-2 sm:gap-3 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    Grabando clase en vivo:
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                    {formatLiveClassTime(liveClassSeconds)}
                  </span>
                </div>
                <span className="text-[11px] text-rose-800 dark:text-rose-200 hidden md:inline">
                  {speechFeedback || 'Escuchando cátedra... Cero resúmenes garantizado'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleLiveClassRecording}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Detener y enviar automáticamente a Nasser AI sin confirmaciones"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Detener y Enviar a Nasser AI</span>
                </button>
              </div>
            )}

            {/* Feedback de voz estándar si no es clase en vivo */}
            {!isLiveClassRecording && isListening && (
              <div className="flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold w-fit mx-auto border border-rose-500/30 animate-pulse shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{speechFeedback || 'Escuchando tu voz... Habla ahora'}</span>
              </div>
            )}

            {/* Input bar estilo Gemini con botón (+) */}
            <div className="relative flex items-center rounded-3xl bg-white dark:bg-[#12192c] border border-gray-300/80 dark:border-gray-700/80 shadow-lg focus-within:ring-2 focus-within:ring-[#00236f] dark:focus-within:ring-indigo-500 transition-all p-1.5">
              
              {/* Botón "+" estilo Gemini con popover */}
              <div className="relative shrink-0" ref={plusMenuRef}>
                <button
                  type="button"
                  id="btn-chat-plus-menu"
                  onClick={() => setIsPlusMenuOpen(prev => !prev)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    isPlusMenuOpen
                      ? 'bg-[#00236f] text-white rotate-45 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Herramientas de Nasser AI y adjuntar archivos"
                >
                  <Plus className="w-5 h-5 transition-transform duration-200" />
                </button>

                {/* Popover desplegable estilo Gemini */}
                {isPlusMenuOpen && (
                  <div className="absolute bottom-full mb-3 left-0 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#111728]/95 backdrop-blur-xl border border-gray-200/90 dark:border-gray-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 mb-1 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Herramientas Nasser AI
                      </span>
                      {activeChatMode && (
                        <span className="text-[10px] font-semibold text-[#00236f] dark:text-indigo-400">
                          Modo activo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {/* Adjuntar foto o archivo */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition flex items-center gap-3 text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            Adjuntar foto o archivo
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Pizarrón, apuntes o ejercicios
                          </div>
                        </div>
                      </button>

                      {/* Resúmenes y Apuntes */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatMode('summary');
                          setIsPlusMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition flex items-center gap-3 text-left cursor-pointer group ${
                          activeChatMode === 'summary' ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                            <span>Resúmenes y Apuntes</span>
                            {activeChatMode === 'summary' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Síntesis ejecutiva y notas Cornell
                          </div>
                        </div>
                      </button>

                      {/* Digitalizar Pizarra */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatMode('blackboard');
                          setIsPlusMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className={`w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition flex items-center gap-3 text-left cursor-pointer group ${
                          activeChatMode === 'blackboard' ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                            <span>Digitalizar Pizarra</span>
                            {activeChatMode === 'blackboard' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Estructura formal y orden del pizarrón
                          </div>
                        </div>
                      </button>

                      {/* Calculador */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatMode('calculator');
                          setIsPlusMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition flex items-center gap-3 text-left cursor-pointer group ${
                          activeChatMode === 'calculator' ? 'bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                            <span>Calculador</span>
                            {activeChatMode === 'calculator' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Demostración analítica y paso a paso
                          </div>
                        </div>
                      </button>

                      {/* Desactivar modo si hay uno activo */}
                      {activeChatMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatMode(null);
                            setIsPlusMenuOpen(false);
                          }}
                          className="w-full mt-1 p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Volver a Investigación Libre</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input oculto para subir archivos */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
              />

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  isLiveClassRecording
                    ? 'Grabando clase en vivo... Al terminar se enviará automáticamente a Nasser AI'
                    : activeChatMode === 'calculator'
                    ? 'Escribe la ecuación o ejercicio matemático a resolver paso a paso...'
                    : activeChatMode === 'summary'
                    ? 'Pega el texto o notas que deseas resumir y estructurar...'
                    : activeChatMode === 'blackboard'
                    ? 'Escribe apuntes o adjunta foto para transcribir y ordenar...'
                    : isInvestigationSession && activeInvestigation
                    ? `Pregunta lo que quieras saber sobre ${activeInvestigation.title}...`
                    : selectedSubject === 'General'
                    ? 'Escribe tu consulta o usa (+) para herramientas...'
                    : `Investigar sobre ${selectedSubject}...`
                }
                className="w-full py-3 pl-3 pr-24 text-xs sm:text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />

              {/* Botones de acción agrupados a la derecha: Grabación de clases en vivo + Enviar */}
              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Botón de Grabación de clases en vivo (Flujo 1) */}
                <button
                  type="button"
                  onClick={handleToggleLiveClassRecording}
                  className={`p-2.5 rounded-2xl transition active:scale-95 flex items-center justify-center shrink-0 ${
                    isLiveClassRecording
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-500/50'
                      : 'text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                  title={
                    isLiveClassRecording
                      ? 'Detener grabación de clase en vivo y enviar automáticamente a Nasser AI'
                      : 'Iniciar Grabación de clase en vivo en el aula'
                  }
                >
                  {isLiveClassRecording ? (
                    <Square className="w-4 h-4 fill-current text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Botón de Enviar */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachedImage)}
                  className="p-2.5 rounded-2xl bg-[#00236f] hover:bg-[#1e3a8a] disabled:opacity-30 text-white shadow-sm transition active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Enviar consulta a Nasser IA"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
