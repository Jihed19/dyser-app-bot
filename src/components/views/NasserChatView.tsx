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

// Componente para renderizar la respuesta académica estructurada (negritas, listas, viñetas, desgloses)
const AcademicTextRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

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

  // Las herramientas académicas esenciales centralizadas en Nasser IA
  const studioTools = [
    {
      id: 'summary',
      title: 'Crear PDFs y Resúmenes con IA',
      description: 'Genera síntesis formales, flashcards y exporta a PDF',
      icon: FileText,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'hover:border-blue-400 dark:hover:border-blue-700/80',
      actionPrompt: 'Genera un resumen ejecutivo de alto impacto y un mazo de flashcards para el tema: ',
      tab: 'summary' as ActiveTab,
    },
    {
      id: 'exam',
      title: 'Simulador y Práctica de Exámenes',
      description: 'Evaluaciones con cronómetro, corrección y análisis',
      icon: GraduationCap,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
      borderColor: 'hover:border-purple-400 dark:hover:border-purple-700/80',
      actionPrompt: 'Genera una simulación de examen con cronómetro y rúbrica para el tema: ',
      tab: 'exam-simulator' as ActiveTab,
    },
    {
      id: 'multimedia',
      title: 'Practicar Exposiciones & Slides',
      description: 'Prepara guiones de oratoria, diapositivas y fichas',
      icon: Palette,
      color: 'text-[#fe6b00] dark:text-[#fe6b00]',
      bgColor: 'bg-orange-500/10 dark:bg-orange-500/15',
      borderColor: 'hover:border-orange-400 dark:hover:border-orange-700/80',
      actionPrompt: 'Ayúdame a estructurar una exposición universitaria con diapositivas y guion de oratoria para: ',
      tab: 'multimedia' as ActiveTab,
    },
    {
      id: 'solver',
      title: 'Solucionador de Problemas STEM',
      description: 'Demostraciones rigurosas paso a paso',
      icon: Calculator,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'hover:border-emerald-400 dark:hover:border-emerald-700/80',
      actionPrompt: 'Resuelve detalladamente paso a paso con rigor pedagógico el siguiente problema: ',
      tab: 'problem-solver' as ActiveTab,
    },
    {
      id: 'blackboard',
      title: 'Foto a la Pizarra (OCR)',
      description: 'Digitaliza fotos y notas manuscritas a LaTeX',
      icon: Camera,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
      borderColor: 'hover:border-amber-400 dark:hover:border-amber-700/80',
      actionPrompt: 'Transcribe y estructura formalmente los diagramas y notas de una pizarra para el tema: ',
      tab: 'blackboard' as ActiveTab,
    },
    {
      id: 'recorder',
      title: 'Grabador de Clases en Vivo',
      description: 'Cátedras de audio convertidas a apuntes limpios',
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

  // Enviar mensaje en el chat
  const handleSend = async (textToSend?: string) => {
    // Si estaba grabando, detener el micrófono
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
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

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? sessionWithUser : s))
    );
    setInput('');
    setIsLoading(true);
    setFirebaseStatus('saving');

    // Persistir de inmediato en Firebase Firestore
    await saveChatSessionToFirestore(sessionWithUser);

    try {
      const historyPayload = updatedMessagesWithUser.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const liveReply = await sendLiveNasserQuery(
        text.trim(),
        historyPayload,
        selectedSubject !== 'General' ? selectedSubject : undefined
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
    <div className="w-full h-full min-h-[calc(100vh-140px)] flex flex-col md:flex-row relative animate-in fade-in duration-300">
      
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
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 custom-scrollbar flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto px-2 sm:px-4 py-6 my-auto animate-in fade-in duration-300">
              
              {/* Saludo dinámico con frases aleatorias al ingresar a Nasser IA */}
              <div className="text-center mb-6 max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#00236f] dark:text-[#90a8ff] text-xs font-bold mb-2.5 border border-indigo-200/60 dark:border-indigo-800/60">
                  <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                  <span>Nasser IA • Asesor Académico</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {greeting}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                  Elige una herramienta de estudio o escribe cualquier pregunta abajo.
                </p>
              </div>

              {/* Cuadrícula de 6 herramientas académicas centradas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                {studioTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className={`
                        group p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800/80
                        ${tool.borderColor} shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between
                        hover:-translate-y-0.5 active:scale-98 min-h-[115px] sm:min-h-[130px]
                      `}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${tool.bgColor} ${tool.color} flex items-center justify-center shrink-0 mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#00236f] dark:group-hover:text-indigo-400 transition leading-snug">
                          {tool.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 leading-tight line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

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

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BARRA DE ENTRADA DE TEXTO FLOTANTE ABAJO CON MICRÓFONO */}
        {/* ------------------------------------------------------------- */}
        <div className="sticky bottom-0 w-full px-4 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#090d16] dark:via-[#090d16]/95 dark:to-transparent z-20">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-3xl w-full mx-auto space-y-2"
          >
            {/* Píldoras de Disciplina Académica para enfocar la investigación */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 shrink-0 mr-1">
                Disciplina:
              </span>
              {ACADEMIC_DISCIPLINES.map(disc => {
                const isSelected = selectedSubject === disc.id;
                const Icon = disc.icon;
                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(disc.id);
                      if (disc.prompt && !input.trim()) {
                        setInput(disc.prompt);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#00236f] text-white shadow-xs dark:bg-indigo-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{disc.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback de voz cuando está escuchando */}
            {isListening && (
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
                  selectedSubject === 'General'
                    ? 'Escribe tu consulta o tema a investigar a fondo...'
                    : `Investigar sobre ${selectedSubject}...`
                }
                className="w-full py-3 pl-4 pr-24 text-xs sm:text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />

              {/* Botones de acción agrupados a la derecha: Micrófono + Enviar */}
              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Botón de Micrófono Funcional con Web Speech API */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-2.5 rounded-2xl transition active:scale-95 flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-500/50'
                      : 'text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                  title={isListening ? 'Detener reconocimiento de voz' : 'Hablar por micrófono'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
