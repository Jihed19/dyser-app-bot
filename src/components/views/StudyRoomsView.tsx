import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Layers,
  BookOpen,
  Sparkles,
  Play,
  Flame,
  Heart,
  Zap,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Award,
  ChevronRight,
  Filter,
  Volume2,
  RotateCcw,
  Sliders,
  Type,
  X,
} from 'lucide-react';
import { ExamSimulation, ExpositionStudy, ExpositionPoint, ActiveTab } from '../../types';
import {
  getSavedExams,
  saveExam,
  deleteExam,
  getSavedExpositions,
  saveExposition,
  deleteExposition,
} from '../../services/studyRoomsStorage';
import { ExamSimulatorView } from './ExamSimulatorView';
import { ExpositionStudyView } from './ExpositionStudyView';
import { sounds } from '../../services/soundEffects';
import { nasserAI } from '../../services/nasserEngines';

interface StudyRoomsViewProps {
  onNavigateTo?: (tab: ActiveTab) => void;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

export const StudyRoomsView: React.FC<StudyRoomsViewProps> = ({
  onNavigateTo,
  onShowToast,
}) => {
  // Pestaña principal de Salas de Estudio: 'examenes' | 'exposiciones'
  const [activeMainTab, setActiveMainTab] = useState<'examenes' | 'exposiciones'>(() => {
    const requested = sessionStorage.getItem('dyser_study_initial_tab');
    if (requested === 'exposiciones') return 'exposiciones';
    return 'examenes';
  });

  // Estado de Exámenes
  const [examsList, setExamsList] = useState<ExamSimulation[]>(() => getSavedExams());
  const [activeExam, setActiveExam] = useState<ExamSimulation | null>(null);
  const [examSearch, setExamSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('todos');
  const [isCreatingExamModalOpen, setIsCreatingExamModalOpen] = useState(false);
  const [newExamTopic, setNewExamTopic] = useState('');
  const [isGeneratingNewExam, setIsGeneratingNewExam] = useState(false);

  // Estado de Exposiciones
  const [exposList, setExposList] = useState<ExpositionStudy[]>(() => getSavedExpositions());
  const [selectedExpo, setSelectedExpo] = useState<ExpositionStudy | null>(null);
  const [studyingPoint, setStudyingPoint] = useState<{ expo: ExpositionStudy; point: ExpositionPoint } | null>(null);
  const [editingFullExpo, setEditingFullExpo] = useState<ExpositionStudy | null>(null);
  const [expoSearch, setExpoSearch] = useState('');
  const [isCreatingExpoModalOpen, setIsCreatingExpoModalOpen] = useState(false);
  const [newExpoTopic, setNewExpoTopic] = useState('');
  const [newExpoPointsCount, setNewExpoPointsCount] = useState<number>(3);
  const [isGeneratingNewExpo, setIsGeneratingNewExpo] = useState(false);

  // Ajustes de lectura limpia para modo sin distracciones
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('large');

  // Sincronización con eventos y almacenamiento de exámenes y exposiciones
  useEffect(() => {
    const handleExamsChanged = () => {
      setExamsList(getSavedExams());
    };
    const handleExposChanged = () => {
      setExposList(getSavedExpositions());
    };

    window.addEventListener('dyser-exams-changed', handleExamsChanged);
    window.addEventListener('dyser-expositions-changed', handleExposChanged);

    return () => {
      window.removeEventListener('dyser-exams-changed', handleExamsChanged);
      window.removeEventListener('dyser-expositions-changed', handleExposChanged);
    };
  }, []);

  // Revisar si viene de una investigación en Tareas
  useEffect(() => {
    const pendingExamTopic = sessionStorage.getItem('dyser_active_exam_topic');
    if (pendingExamTopic) {
      // Buscar si ya existe en la lista
      const match = examsList.find(
        e => e.title.toLowerCase().includes(pendingExamTopic.toLowerCase()) ||
             e.subject.toLowerCase().includes(pendingExamTopic.toLowerCase())
      );
      if (match) {
        setActiveExam(match);
      }
    }

    const pendingExpoTopic = sessionStorage.getItem('dyser_active_expo_topic');
    if (pendingExpoTopic) {
      const match = exposList.find(
        e => e.topic.toLowerCase().includes(pendingExpoTopic.toLowerCase()) ||
             (e.subject && e.subject.toLowerCase().includes(pendingExpoTopic.toLowerCase()))
      );
      if (match) {
        setSelectedExpo(match);
        setActiveMainTab('exposiciones');
      }
    }
  }, []);

  // Materias únicas para filtros
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    examsList.forEach(e => {
      if (e.subject) subjects.add(e.subject);
    });
    return Array.from(subjects);
  }, [examsList]);

  // Exámenes filtrados
  const filteredExams = useMemo(() => {
    return examsList.filter(exam => {
      const matchesSearch =
        exam.title.toLowerCase().includes(examSearch.toLowerCase()) ||
        exam.subject.toLowerCase().includes(examSearch.toLowerCase());
      const matchesSubject =
        selectedSubjectFilter === 'todos' || exam.subject === selectedSubjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [examsList, examSearch, selectedSubjectFilter]);

  // Exposiciones filtradas
  const filteredExpos = useMemo(() => {
    return exposList.filter(expo => {
      const matchesSearch =
        expo.topic.toLowerCase().includes(expoSearch.toLowerCase()) ||
        (expo.subject && expo.subject.toLowerCase().includes(expoSearch.toLowerCase())) ||
        (expo.summaryIdea && expo.summaryIdea.toLowerCase().includes(expoSearch.toLowerCase()));
      return matchesSearch;
    });
  }, [exposList, expoSearch]);

  // Manejar apertura directa de examen
  const handleOpenExam = (exam: ExamSimulation) => {
    sounds.playPop();
    setActiveExam(exam);
    sessionStorage.setItem('dyser_active_exam_topic', exam.title);
  };

  // Manejar eliminación de examen
  const handleDeleteExam = (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Deseas eliminar este simulacro de examen?')) {
      deleteExam(examId);
      setExamsList(getSavedExams());
      if (activeExam?.id === examId) {
        setActiveExam(null);
      }
      sounds.playPop();
      if (onShowToast) {
        onShowToast({
          title: 'Examen eliminado',
          message: 'El simulacro se ha quitado de tus Salas de Estudio.',
          type: 'info',
        });
      }
    }
  };

  // Crear nuevo examen interactivo rápido
  const handleCreateNewExam = async () => {
    const topic = newExamTopic.trim();
    if (!topic) return;

    setIsGeneratingNewExam(true);
    sounds.playPop();

    try {
      const res = await fetch('/api/ai/exam-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const formattedQuestions = data.questions.map((q: any, idx: number) => ({
          id: `q-quick-${idx + 1}`,
          type: q.type || 'multiple_choice',
          questionText: q.questionText || q.question,
          options: q.options || ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          explanation: q.explanation || 'Respuesta verificada por Nasser AI.',
        }));

        const newSim: ExamSimulation = {
          id: `exam-custom-${Date.now()}`,
          title: data.examTitle || `Simulacro: ${topic}`,
          subject: topic,
          timeLimitMinutes: 15,
          passingGrade: 70,
          questions: formattedQuestions,
        };

        saveExam(newSim);
        setExamsList(getSavedExams());
        setActiveExam(newSim);
        setIsCreatingExamModalOpen(false);
        setNewExamTopic('');
        sounds.playSuccess();
        if (onShowToast) {
          onShowToast({
            title: '¡Simulacro Creado! 🎯',
            message: `Generado con éxito para ${topic}. Abriendo práctica...`,
            type: 'success',
          });
        }
        return;
      }
    } catch (err) {
      console.warn('Fallback local para creación de examen:', err);
    }

    // Fallback cognitivo local
    const simulacro = nasserAI.generarSimulacroExamenElite(topic, 4);
    if (simulacro && simulacro.preguntas) {
      const formatted = simulacro.preguntas.map((p, idx) => {
        const letterIndex =
          p.respuestaCorrecta === 'A' ? 0 : p.respuestaCorrecta === 'B' ? 1 : p.respuestaCorrecta === 'C' ? 2 : 3;
        return {
          id: `q-local-${idx + 1}`,
          type: 'multiple_choice' as const,
          questionText: p.pregunta,
          options: p.opciones,
          correctOptionIndex: letterIndex,
          explanation: p.explicacionCritica,
        };
      });

      const newSim: ExamSimulation = {
        id: `exam-custom-${Date.now()}`,
        title: `Simulacro: ${topic}`,
        subject: topic,
        timeLimitMinutes: 15,
        passingGrade: 70,
        questions: formatted,
      };

      saveExam(newSim);
      setExamsList(getSavedExams());
      setActiveExam(newSim);
      setIsCreatingExamModalOpen(false);
      setNewExamTopic('');
      sounds.playSuccess();
      if (onShowToast) {
        onShowToast({
          title: '¡Simulacro Creado! 🎯',
          message: `Generado con éxito para ${topic}. Abriendo práctica...`,
          type: 'success',
        });
      }
    }

    setIsGeneratingNewExam(false);
  };

  // Manejar apertura de exposición
  const handleSelectExpo = (expo: ExpositionStudy) => {
    sounds.playPop();
    setSelectedExpo(expo);
    sessionStorage.setItem('dyser_active_expo_topic', expo.topic);
  };

  // Manejar inicio de estudio limpio de un punto
  const handleStudyPoint = (point: ExpositionPoint, expo: ExpositionStudy) => {
    sounds.playChirp();
    setStudyingPoint({ expo, point });
  };

  // Manejar eliminación de exposición
  const handleDeleteExpo = (e: React.MouseEvent, expoId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Deseas eliminar esta exposición guardada?')) {
      deleteExposition(expoId);
      setExposList(getSavedExpositions());
      if (selectedExpo?.id === expoId) {
        setSelectedExpo(null);
      }
      sounds.playPop();
      if (onShowToast) {
        onShowToast({
          title: 'Exposición eliminada',
          message: 'La exposición se ha quitado de tus Salas de Estudio.',
          type: 'info',
        });
      }
    }
  };

  // Crear nueva exposición rápida
  const handleCreateNewExpo = async () => {
    const topic = newExpoTopic.trim();
    if (!topic) return;

    setIsGeneratingNewExpo(true);
    sounds.playPop();

    try {
      const res = await fetch('/api/ai/exposition-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          numPoints: newExpoPointsCount,
        }),
      });

      const data = await res.json();
      if (data && Array.isArray(data.points) && data.points.length > 0) {
        const newExpo: ExpositionStudy = {
          id: `expo-${Date.now()}`,
          topic: data.topic || topic,
          subject: topic,
          numPoints: newExpoPointsCount,
          summaryIdea: data.summaryIdea || `Estructura académica de oratoria para ${topic}.`,
          points: data.points,
          conclusionScript: data.conclusionScript,
        };

        saveExposition(newExpo);
        setExposList(getSavedExpositions());
        setSelectedExpo(newExpo);
        setIsCreatingExpoModalOpen(false);
        setNewExpoTopic('');
        sounds.playSuccess();
        if (onShowToast) {
          onShowToast({
            title: '¡Exposición Estructurada! 🎙️',
            message: `Puntos listos para estudiar sin distracciones.`,
            type: 'success',
          });
        }
        return;
      }
    } catch (err) {
      console.warn('Fallback local para nueva exposición:', err);
    }

    // Fallback local
    const fallbackPoints: ExpositionPoint[] = Array.from({ length: newExpoPointsCount }, (_, i) => {
      const num = i + 1;
      return {
        id: `p-${Date.now()}-${num}`,
        number: num,
        title:
          num === 1
            ? `Fundamentos y Axiomas Rectores de ${topic}`
            : num === 2
            ? `Mecanismos Operativos y Dinámica del Proceso`
            : num === 3
            ? `Demostración Práctica y Casos Verificables`
            : `Implicaciones Críticas y Conclusiones`,
        keyIdea: `Exponer con claridad el principio operativo del punto ${num}.`,
        speechScript: `Estimado profesor y compañeros. Al abordar este ${num}° punto central sobre ${topic}, es crucial entender que el mecanismo opera bajo principios estrictos de conservación y equilibrio. La evidencia experimental demuestra que...`,
        example: `Pensemos en un sistema automatizado: cada componente responde de manera sincronizada para mantener la estabilidad global.`,
        warningNote: `Si el docente consulta por excepciones, aclara los límites del modelo teórico.`,
      };
    });

    const fallbackExpo: ExpositionStudy = {
      id: `expo-${Date.now()}`,
      topic,
      subject: topic,
      numPoints: newExpoPointsCount,
      summaryIdea: `Defensa oral estructurada sobre ${topic}.`,
      points: fallbackPoints,
      conclusionScript: `En conclusión, el estudio de ${topic} fundamenta las bases del razonamiento científico aplicado. Muchas gracias por su atención.`,
    };

    saveExposition(fallbackExpo);
    setExposList(getSavedExpositions());
    setSelectedExpo(fallbackExpo);
    setIsCreatingExpoModalOpen(false);
    setNewExpoTopic('');
    sounds.playSuccess();
    if (onShowToast) {
      onShowToast({
        title: '¡Exposición Estructurada! 🎙️',
        message: `Puntos listos para estudiar sin distracciones.`,
        type: 'success',
      });
    }

    setIsGeneratingNewExpo(false);
  };

  // Si está activo un examen, renderizamos DIRECTAMENTE la interfaz interactiva original de práctica
  if (activeExam) {
    return (
      <div className="w-full">
        <ExamSimulatorView
          initialExam={activeExam}
          onBackToList={() => {
            sounds.playPop();
            setActiveExam(null);
          }}
          onNavigateTo={onNavigateTo}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  // Si está activo el editor completo de exposición
  if (editingFullExpo) {
    return (
      <div className="w-full">
        <ExpositionStudyView
          initialExpo={editingFullExpo}
          onBackToList={() => {
            sounds.playPop();
            setEditingFullExpo(null);
          }}
          onNavigateTo={onNavigateTo}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  // Si está activo el modo "Estudiar punto" (Vista Limpia sin distracciones)
  if (studyingPoint) {
    const { expo, point } = studyingPoint;
    const currentPointIndex = expo.points.findIndex(p => p.id === point.id || p.number === point.number);
    const hasPrevious = currentPointIndex > 0;
    const hasNext = currentPointIndex < expo.points.length - 1;

    const fontClasses =
      fontSizeLevel === 'normal'
        ? 'text-base sm:text-lg leading-relaxed'
        : fontSizeLevel === 'large'
        ? 'text-lg sm:text-xl leading-relaxed'
        : 'text-xl sm:text-2xl leading-loose';

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
        {/* Barra Superior Minimalista de Estudio */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <button
            onClick={() => {
              sounds.playPop();
              setStudyingPoint(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a los puntos</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#fe6b00] border border-orange-200 dark:border-orange-800/80">
              Punto {point.number} de {expo.numPoints}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline truncate max-w-[200px] text-gray-700 dark:text-gray-300">
              {expo.topic}
            </span>
          </div>

          {/* Ajuste de Tipografía para Máximo Confort Visual */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                fontSizeLevel === 'normal'
                  ? 'bg-white dark:bg-gray-700 text-[#00236f] dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Tipografía Estándar"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              className={`px-2.5 py-1 rounded-lg text-sm font-bold transition cursor-pointer ${
                fontSizeLevel === 'large'
                  ? 'bg-white dark:bg-gray-700 text-[#00236f] dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Tipografía Grande (Recomendada para Oratoria)"
            >
              A+
            </button>
            <button
              onClick={() => setFontSizeLevel('xlarge')}
              className={`px-2.5 py-1 rounded-lg text-base font-bold transition cursor-pointer ${
                fontSizeLevel === 'xlarge'
                  ? 'bg-white dark:bg-gray-700 text-[#00236f] dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Tipografía Extra Grande (Modo Teleprompter)"
            >
              A++
            </button>
          </div>
        </div>

        {/* VISTA LIMPIA SIN DISTRACCIONES (EDITORIAL ZEN FOCUS) */}
        <article className="p-6 sm:p-12 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/90 dark:border-gray-800 shadow-sm space-y-8">
          {/* Encabezado del Punto */}
          <header className="space-y-3 border-b border-gray-100 dark:border-gray-800/80 pb-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#fe6b00] flex items-center justify-center font-black text-sm">
                {point.number}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Guion y Fundamento de Exposición
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
              {point.title}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Tema matriz: <span className="font-bold text-[#00236f] dark:text-blue-400">{expo.topic}</span>
            </p>
          </header>

          {/* Idea Clave / Axioma Rector */}
          {point.keyIdea && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Idea Clave a Grabar en la Memoria</span>
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed">
                "{point.keyIdea}"
              </p>
            </div>
          )}

          {/* TEXTO COMPLETO CORRESPONDIENTE PARA ESTUDIO LIMPIO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Texto Redactado para Oratoria y Estudio
              </h2>
              <span className="text-[11px] font-semibold text-gray-400">
                {point.speechScript.split(' ').length} palabras • ~
                {Math.ceil(point.speechScript.split(' ').length / 130)} min al hablar
              </span>
            </div>

            <div className={`text-gray-800 dark:text-gray-100 font-serif font-normal ${fontClasses} whitespace-pre-line tracking-wide bg-gray-50/50 dark:bg-gray-900/40 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800/80 select-text`}>
              {point.speechScript}
            </div>
          </div>

          {/* Ejemplo o Analogía Ilustrativa */}
          {point.example && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Ejemplo o Analogía para la Audiencia</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                {point.example}
              </p>
            </div>
          )}

          {/* Advertencia para Examen / Preguntas del Profesor */}
          {point.warningNote && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Alerta del Docente: Qué responder si te cuestionan</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                {point.warningNote}
              </p>
            </div>
          )}

          {/* Navegación Inmersiva entre Puntos al Pie */}
          <footer className="pt-6 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {hasPrevious ? (
                <button
                  onClick={() => {
                    sounds.playPop();
                    const prevPoint = expo.points[currentPointIndex - 1];
                    setStudyingPoint({ expo, point: prevPoint });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Punto Anterior ({point.number - 1})</span>
                </button>
              ) : (
                <div />
              )}
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                setStudyingPoint(null);
                if (onShowToast) {
                  onShowToast({
                    title: '¡Punto Estudiado! 🎯',
                    message: `Has repasado con éxito el Punto ${point.number}: ${point.title}.`,
                    type: 'success',
                  });
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#142c6b] text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Concluir Estudio del Punto</span>
            </button>

            <div className="flex items-center gap-2">
              {hasNext && (
                <button
                  onClick={() => {
                    sounds.playPop();
                    const nextPoint = expo.points[currentPointIndex + 1];
                    setStudyingPoint({ expo, point: nextPoint });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-xs font-black flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <span>Siguiente Punto ({point.number + 1})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </footer>
        </article>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* 1. ENCABEZADO Y SELECTOR DE PESTAÑAS PRINCIPALES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200/80 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300">
              Salas de Estudio Dyser
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              Entrenamiento & Oratoria
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            {activeMainTab === 'examenes' ? (
              <>
                <GraduationCap className="w-7 h-7 text-[#00236f] dark:text-blue-400" />
                <span>Simulacros de Examen</span>
              </>
            ) : (
              <>
                <Layers className="w-7 h-7 text-[#fe6b00]" />
                <span>Exposiciones Orales</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeMainTab === 'examenes'
              ? 'Practica con retroalimentación en tiempo real estilo Duolingo, 5 vidas y racha de aciertos.'
              : 'Estructura tu oratoria por puntos clave y estúdialos sin distracciones.'}
          </p>
        </div>

        {/* SELECTOR SUPERIOR DE LAS DOS PESTAÑAS PRINCIPALES (Exámenes y Exposiciones) */}
        <div className="flex items-center p-1.5 rounded-2xl bg-gray-200/70 dark:bg-gray-800/80 self-start sm:self-auto shadow-inner">
          <button
            id="tab-selector-examenes"
            onClick={() => {
              sounds.playPop();
              setActiveMainTab('examenes');
              setSelectedExpo(null);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeMainTab === 'examenes'
                ? 'bg-white dark:bg-[#111728] text-[#00236f] dark:text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#00236f] dark:text-blue-400" />
            <span>Exámenes</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-[#00236f] dark:text-blue-300">
              {examsList.length}
            </span>
          </button>

          <button
            id="tab-selector-exposiciones"
            onClick={() => {
              sounds.playPop();
              setActiveMainTab('exposiciones');
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeMainTab === 'exposiciones'
                ? 'bg-white dark:bg-[#111728] text-[#fe6b00] dark:text-orange-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#fe6b00]" />
            <span>Exposiciones</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950 text-[#fe6b00] dark:text-orange-300">
              {exposList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: EXÁMENES (Listar exámenes generados & practicar) */}
      {/* ========================================================= */}
      {activeMainTab === 'examenes' && (
        <div className="space-y-6">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111728] p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={examSearch}
                onChange={e => setExamSearch(e.target.value)}
                placeholder="Buscar por tema o materia..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <select
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
                aria-label="Filtrar exámenes por materia"
                className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas las Materias</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsCreatingExamModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#00236f] hover:bg-[#142c6b] text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Simulacro</span>
              </button>
            </div>
          </div>

          {/* Cuadrícula de Exámenes Guardados */}
          {filteredExams.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                No se encontraron simulacros de examen
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Los exámenes que generes desde tus tareas investigadas o con Nasser IA se guardarán automáticamente aquí.
              </p>
              <button
                onClick={() => setIsCreatingExamModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#00236f] text-white text-xs font-bold shadow-md transition hover:bg-[#142c6b]"
              >
                Crear mi primer examen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map(examItem => {
                const questionCount = examItem.questions?.length || 0;
                return (
                  <div
                    key={examItem.id}
                    onClick={() => handleOpenExam(examItem)}
                    className="group relative p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 hover:border-blue-400/80 dark:hover:border-blue-600 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-[#00236f] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          {examItem.subject || 'Examen Académico'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => handleDeleteExam(e, examItem.id)}
                            title="Eliminar examen"
                            aria-label={`Eliminar simulacro ${examItem.title}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Título del Examen */}
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-[#00236f] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {examItem.title}
                      </h3>

                      {/* Metadatos (Preguntas, Tiempo, Vidas) */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>{questionCount} preguntas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{examItem.timeLimitMinutes || 15} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          <span>5 vidas</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Práctica Rápida */}
                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        Práctica Interactiva
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00236f] text-white text-xs font-bold group-hover:bg-[#fe6b00] transition-colors shadow-xs">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Practicar Examen</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: EXPOSICIONES (Listado & Puntos desglosados) */}
      {/* ========================================================= */}
      {activeMainTab === 'exposiciones' && (
        <div className="space-y-6">
          {selectedExpo ? (
            /* SUB-VISTA: PUNTOS DESGLOSADOS DE LA EXPOSICIÓN SELECCIONADA */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Barra de Retorno y Acciones de la Exposición */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs">
                <div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setSelectedExpo(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a todas las exposiciones</span>
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {selectedExpo.topic}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                    {selectedExpo.summaryIdea || 'Estructura de oratoria para defensa oral académica.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setEditingFullExpo(selectedExpo);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#fe6b00] border border-orange-200 dark:border-orange-800 text-xs font-bold transition hover:bg-orange-100 dark:hover:bg-orange-900/60 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="Abrir oratoria y herramientas completas de Nasser AI"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Editor Completo & Lámina</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE PUNTOS DESGLOSADOS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Puntos Desglosados ({selectedExpo.points.length})
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    Haz clic en "Estudiar punto" para abrir la vista limpia
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {selectedExpo.points.map(pt => (
                    <div
                      key={pt.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700/60 shadow-2xs transition-all duration-150 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {pt.number}
                          </span>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 dark:text-white leading-snug">
                              {pt.title}
                            </h4>
                            {pt.keyIdea && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                <strong className="text-gray-700 dark:text-gray-300">Idea clave:</strong> {pt.keyIdea}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* BOTÓN ESTUDIAR PUNTO */}
                        <button
                          onClick={() => handleStudyPoint(pt, selectedExpo)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe6b00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-black shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 flex items-center gap-1.5 shrink-0 self-start cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Estudiar punto</span>
                        </button>
                      </div>

                      {/* Vista previa sutil del guion */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        "{pt.speechScript}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* LISTA DE TODAS LAS EXPOSICIONES GUARDADAS */
            <div className="space-y-6">
              {/* Barra de Filtros y Búsqueda */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111728] p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={expoSearch}
                    onChange={e => setExpoSearch(e.target.value)}
                    placeholder="Buscar exposiciones guardadas..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]"
                  />
                </div>

                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsCreatingExpoModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#fe6b00] hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Exposición</span>
                </button>
              </div>

              {/* Cuadrícula de Exposiciones */}
              {filteredExpos.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#fe6b00] flex items-center justify-center mx-auto">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                    No hay exposiciones estructuradas
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Las exposiciones estructuradas desde investigaciones en Tareas o con Nasser IA se guardarán automáticamente aquí.
                  </p>
                  <button
                    onClick={() => setIsCreatingExpoModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#fe6b00] text-white text-xs font-bold shadow-md transition hover:bg-orange-600"
                  >
                    Estructurar mi primera exposición
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExpos.map(expoItem => (
                    <div
                      key={expoItem.id}
                      onClick={() => handleSelectExpo(expoItem)}
                      className="group relative p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 hover:border-orange-400/80 dark:hover:border-orange-600 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        {/* Cabecera */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/70 text-[#fe6b00] border border-orange-200/60 dark:border-orange-800/60">
                            {expoItem.subject || 'Exposición Oral'}
                          </span>

                          <button
                            onClick={e => handleDeleteExpo(e, expoItem.id)}
                            title="Eliminar exposición"
                            aria-label={`Eliminar exposición ${expoItem.topic}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Título de la Exposición */}
                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-[#fe6b00] transition-colors line-clamp-2">
                          {expoItem.topic}
                        </h3>

                        {/* Resumen */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                          {expoItem.summaryIdea || 'Defensa académica estructurada con oratoria por puntos.'}
                        </p>

                        {/* Métricas */}
                        <div className="flex items-center gap-3 mt-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                            <Layers className="w-3.5 h-3.5 text-orange-500" />
                            {expoItem.points?.length || expoItem.numPoints || 3} Puntos Clave
                          </span>
                        </div>
                      </div>

                      {/* Botón Ver Puntos Desglosados */}
                      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-400">
                          Listo para ensayar
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#fe6b00] group-hover:translate-x-0.5 transition-transform">
                          <span>Ver puntos</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CREAR NUEVO SIMULACRO DE EXAMEN RÁPIDO */}
      {/* ========================================================= */}
      {isCreatingExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#111728] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#00236f] dark:text-blue-300 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  Nuevo Simulacro de Examen
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingExamModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Introduce el tema académico sobre el cual deseas generar tu batería de preguntas estilo Duolingo con corrección en tiempo real.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Tema de Examen:
              </label>
              <input
                type="text"
                value={newExamTopic}
                onChange={e => setNewExamTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateNewExam()}
                placeholder="Ej: Cálculo Integral, Termodinámica, Revolución Francesa..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreatingExamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewExam}
                disabled={isGeneratingNewExam || !newExamTopic.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#142c6b] disabled:opacity-40 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingNewExam ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando Preguntas...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Crear e Iniciar Práctica</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ESTRUCTURAR NUEVA EXPOSICIÓN RÁPIDA */}
      {/* ========================================================= */}
      {isCreatingExpoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#111728] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#fe6b00] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  Estructurar Exposición Oral
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingExpoModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nasser AI desglosará el tema en puntos estratégicos y redactará el guion exacto de oratoria para estudiar sin distracciones.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Tema de Exposición:
              </label>
              <input
                type="text"
                value={newExpoTopic}
                onChange={e => setNewExpoTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateNewExpo()}
                placeholder="Ej: Genética Molecular, Algoritmos de Ordenamiento..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Cantidad de Puntos a Desarrollar:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map(pts => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setNewExpoPointsCount(pts)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      newExpoPointsCount === pts
                        ? 'bg-[#fe6b00] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {pts} Puntos
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreatingExpoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewExpo}
                disabled={isGeneratingNewExpo || !newExpoTopic.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#fe6b00] hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingNewExpo ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Estructurando Puntos...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Estructurar y Ver Puntos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
