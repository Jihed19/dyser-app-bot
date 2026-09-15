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
import {
  subscribeToChatSessions,
  saveChatSessionToFirestore,
  deleteChatSessionFromFirestore,
  defaultInitialSession,
} from '../../services/firebase';

interface NasserChatViewProps {
  studentName?: string;
  onNavigateTo?: (tab: ActiveTab) => void;
  onAddTask?: (task: Omit<AcademicTask, 'id'>) => void;
  onShowToast?: (toast: { title: string; message: string; type: 'success' | 'info' | 'warning' }) => void;
  investigatingTask?: { title: string; subject: string; id?: string } | null;
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

// Sanitizador para eliminar fórmulas crudas en LaTeX, bloques de código innecesarios y convertirlos a lenguaje natural
const sanitizeAcademicText = (raw: string): string => {
  if (!raw) return '';

  let text = raw;

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

  // Las 4 herramientas académicas esenciales de Nasser IA solicitadas
  const studioTools = [
    {
      id: 'summary',
      title: 'Crear PDFs y Resúmenes con IA',
      description: 'Genera síntesis formales y exporta a PDF',
      icon: FileText,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'hover:border-blue-400 dark:hover:border-blue-700/80',
      actionPrompt: 'Genera un resumen ejecutivo de alto impacto y un mazo de flashcards para el tema: ',
      tab: 'summary' as ActiveTab,
    },
    {
      id: 'studio',
      title: 'Láminas Mentales en Studio',
      description: 'Diseño interactivo de diapositivas',
      icon: Layers,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
      borderColor: 'hover:border-purple-400 dark:hover:border-purple-700/80',
      actionPrompt: 'Crea una presentación académica y lámina mental para: ',
      tab: 'multimedia' as ActiveTab,
    },
    {
      id: 'solver',
      title: 'Solucionador STEM',
      description: 'Demostraciones paso a paso',
      icon: Calculator,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'hover:border-emerald-400 dark:hover:border-emerald-700/80',
      actionPrompt: 'Resuelve detalladamente paso a paso con rigor pedagógico el siguiente problema: ',
      tab: 'problem-solver' as ActiveTab,
    },
    {
      id: 'recorder',
      title: 'Grabador de Clases en Vivo',
      description: 'Cátedra a texto íntegro sin recortes',
      icon: Mic,
      color: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/15',
      borderColor: 'hover:border-rose-400 dark:hover:border-rose-700/80',
      actionPrompt: 'Inicia la captura y estructuración de clase en vivo para generar apuntes ordenados de: ',
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

  // Enviar mensaje en el chat con soporte de audio multimodal
  const handleSend = async (
    textToSend?: string,
    audioPayload?: { audioBase64: string; mimeType: string }
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

    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const corePreResponse = nasserAI.responderConsultaEstudiante(text.trim());

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    let updatedTitle = activeSession.title;
    if (activeSession.title === 'Nueva Conversación' || activeSession.title.startsWith('Conversación')) {
      const cleanSnippet = text.trim().slice(0, 32);
      updatedTitle = cleanSnippet + (text.length > 32 ? '...' : '');
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
      const historyPayload = updatedMessagesWithUser.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const liveReply = await sendLiveNasserQuery(
        text.trim(),
        historyPayload,
        selectedSubject !== 'General' ? selectedSubject : undefined,
        audioPayload
      );

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'nasser',
        text: liveReply || corePreResponse,
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
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'nasser',
        text: corePreResponse,
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

  const handleToolClick = (tool: typeof studioTools[number]) => {
    if (onNavigateTo) {
      onNavigateTo(tool.tab);
    } else {
      setInput(tool.actionPrompt);
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
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Nasser AI
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>

                      {/* Texto renderizado con desglose académico, negritas y viñetas */}
                      <AcademicTextRenderer content={msg.text} />

                      {/* Barra de Acciones Locales dyser (Examen, Resumen, Exposición, Tarea) */}
                      <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#fe6b00]" />
                          Acciones Locales:
                        </span>

                        <button
                          onClick={() => handleActionGenerarExamen(activeSession.title, msg.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-purple-200/70 dark:border-purple-800/60 active:scale-95 shadow-2xs"
                          title="Generar examen adaptativo local con esta investigación"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Generar Examen</span>
                        </button>

                        <button
                          onClick={() => handleActionGenerarResumen(activeSession.title, msg.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-blue-200/70 dark:border-blue-800/60 active:scale-95 shadow-2xs"
                          title="Sintetizar en resumen ejecutivo y flashcards"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Resumen & Flashcards</span>
                        </button>

                        <button
                          onClick={() => handleActionGenerarExposicion(activeSession.title, msg.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-[#fe6b00] text-[11px] font-bold transition flex items-center gap-1.5 border border-orange-200/70 dark:border-orange-800/60 active:scale-95 shadow-2xs"
                          title="Estructurar diapositivas y puntos de exposición"
                        >
                          <Palette className="w-3.5 h-3.5 text-[#fe6b00]" />
                          <span>Puntos de Exposición</span>
                        </button>

                        <button
                          onClick={() => handleActionGuardarComoTarea(activeSession.title, msg.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-emerald-200/70 dark:border-emerald-800/60 active:scale-95 shadow-2xs"
                          title="Guardar investigación como tarea académica"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Guardar como Tarea</span>
                        </button>

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => copyMessageText(msg.text, idx)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
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
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 transition"
                            title="Eliminar esta respuesta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

              {/* RUTAS CLARAS DE FINALIZACIÓN DE INVESTIGACIÓN (EMBUDO ACADÉMICO) */}
              {messages.length >= 2 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-50/90 via-purple-50/60 to-orange-50/80 dark:from-blue-950/40 dark:via-purple-950/30 dark:to-orange-950/40 border border-blue-200/80 dark:border-blue-800/80 shadow-xs space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fe6b00] animate-pulse" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#00236f] dark:text-indigo-300">
                        Embudo de Estudio • Selecciona tu Ruta de Aprendizaje
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-2xs">
                      Continuación Automática
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Aprovecha el conocimiento investigado sobre <strong className="text-gray-900 dark:text-white">{activeInvestigation?.title || activeSession.title}</strong> para consolidar tu aprendizaje:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Ruta 1: Practicar Examen */}
                    <button
                      id="btn-funnel-ruta-1-examen"
                      onClick={() => handleGoToExamPractice(activeInvestigation?.title || activeSession.title, messages.map(m => m.text).join('\n'))}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#111728] border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 hover:shadow-md transition text-left group flex items-start gap-3 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1">
                          <span>Ruta 1: Practicar Examen</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          Cuestionario interactivo estilo Duolingo con corrección en vivo ("Así no es mi examen").
                        </p>
                      </div>
                    </button>

                    {/* Ruta 2: Estudiar Exposición */}
                    <button
                      id="btn-funnel-ruta-2-exposicion"
                      onClick={() => handleGoToExpositionStudy(activeInvestigation?.title || activeSession.title, messages.map(m => m.text).join('\n'))}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#111728] border-2 border-orange-200 dark:border-orange-800 hover:border-[#fe6b00] hover:shadow-md transition text-left group flex items-start gap-3 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-gray-900 dark:text-white group-hover:text-[#fe6b00] flex items-center gap-1">
                          <span>Ruta 2: Estudiar Exposición</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          Estructura por puntos, oratoria y lámina mental automática en Nasser AI Studio.
                        </p>
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

            <div className="relative flex items-center rounded-3xl bg-white dark:bg-[#12192c] border border-gray-300/80 dark:border-gray-700/80 shadow-lg focus-within:ring-2 focus-within:ring-[#00236f] dark:focus-within:ring-indigo-500 transition-all p-1.5">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  isLiveClassRecording
                    ? 'Grabando clase en vivo... Al terminar se enviará automáticamente a Nasser AI'
                    : isInvestigationSession && activeInvestigation
                    ? `Pregunta lo que quieras saber sobre ${activeInvestigation.title}...`
                    : selectedSubject === 'General'
                    ? 'Escribe tu consulta o inicia una grabación de clase en vivo...'
                    : `Investigar sobre ${selectedSubject}...`
                }
                className="w-full py-3 pl-4 pr-24 text-xs sm:text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-2xl bg-[#00236f] hover:bg-[#1e3a8a] disabled:opacity-30 text-white shadow-sm transition active:scale-95 flex items-center justify-center shrink-0"
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
