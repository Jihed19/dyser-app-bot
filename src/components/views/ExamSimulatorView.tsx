import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Award,
  RotateCw,
  Heart,
  Flame,
  Zap,
  Sliders,
  X,
  MessageSquare,
  Eye,
  Send,
  Bot,
  HelpCircle,
  Columns,
} from 'lucide-react';
import { ExamSimulation, ExamQuestion, QuestionType, ActiveTab } from '../../types';
import { sampleExamSimulation } from '../../data/mockData';
import { nasserAI } from '../../services/nasserEngines';
import { sounds } from '../../services/soundEffects';
import { trackGoalAction } from '../../services/academicGoals';
import { saveExam } from '../../services/studyRoomsStorage';

export interface ExamSimulatorViewProps {
  initialExam?: ExamSimulation;
  onNavigateTo?: (tab: ActiveTab) => void;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
  onBackToList?: () => void;
}

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  initialExam,
  onNavigateTo,
  onShowToast,
  onBackToList,
}) => {
  const [exam, setExam] = useState<ExamSimulation>(() => initialExam || sampleExamSimulation);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  useEffect(() => {
    if (initialExam) {
      setExam(initialExam);
      restartDuolingoPractice(initialExam.questions);
    }
  }, [initialExam]);
  
  // Duolingo Practice State
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(3);
  const [xpEarned, setXpEarned] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState<Record<string, { selected: number; correct: boolean }>>({});
  
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dual Panel: "Así no es mi examen" (Rediseñado con navegación por pestañas)
  const [isDualModalOpen, setIsDualModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'chat' | 'preview' | 'split'>('chat');
  const [dualPrompt, setDualPrompt] = useState('');
  const [isAdjustingExam, setIsAdjustingExam] = useState(false);
  const [dualMessages, setDualMessages] = useState<Array<{ sender: 'user' | 'nasser'; text: string }>>([]);
  const [previewQuestions, setPreviewQuestions] = useState<ExamQuestion[]>([]);
  const [lastResearchTopic, setLastResearchTopic] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('dyser_active_exam_topic') || sessionStorage.getItem('dyser_last_research_topic');
    } catch (_) {
      return null;
    }
  });
  const dualChatBottomRef = useRef<HTMLDivElement>(null);

  // Sincronización continua de examen con el último tema investigado en Nasser IA (Punto 5)
  useEffect(() => {
    try {
      const activeExamTopic = sessionStorage.getItem('dyser_active_exam_topic');
      const lastTopic = sessionStorage.getItem('dyser_last_research_topic');
      const storedContext = sessionStorage.getItem('dyser_exam_research_context');

      const targetTopic = activeExamTopic || lastTopic;
      if (targetTopic) {
        if (activeExamTopic) {
          sessionStorage.removeItem('dyser_active_exam_topic');
        }
        sessionStorage.removeItem('dyser_exam_research_context');
        setLastResearchTopic(targetTopic);
        handleGenerateExamFromTopic(targetTopic, storedContext || '');
      }
    } catch (e) {
      console.warn('Error al cargar examen desde investigación', e);
    }
  }, []);

  const handleGenerateExamFromTopic = async (topic: string, context: string = '') => {
    setIsGenerating(true);
    sounds.playChirp();

    try {
      const res = await fetch('/api/ai/exam-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          researchContext: context,
          numQuestions: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          const formattedQuestions: ExamQuestion[] = data.questions.map((q: any, idx: number) => ({
            id: `q-${idx + 1}`,
            type: q.type || 'multiple_choice',
            questionText: q.question || q.questionText || `Pregunta sobre ${topic}`,
            options: q.options || ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
            correctOptionIndex: q.correctOptionIndex ?? 0,
            explanation: q.explanation || 'Respuesta verificada por Nasser AI.',
          }));

          const newExam: ExamSimulation = {
            id: `exam-inv-${Date.now()}`,
            title: data.examTitle || `Práctica Duolingo: ${topic}`,
            subject: topic,
            timeLimitMinutes: 15,
            passingGrade: 70,
            questions: formattedQuestions,
          };

          setExam(newExam);
          saveExam(newExam);
          restartDuolingoPractice(formattedQuestions);
          setResearchNotice(`Práctica generada desde tu investigación: "${topic}"`);
          sounds.playSuccess();
          return;
        }
      }
    } catch (err) {
      console.warn('Fallback local para examen Duolingo:', err);
    }

    // Fallback cognitivo local
    const simulacro = nasserAI.generarSimulacroExamenElite(topic, 4);
    if (simulacro && simulacro.preguntas) {
      const formatted: ExamQuestion[] = simulacro.preguntas.map((p, idx) => {
        const letterIndex = p.respuestaCorrecta === 'A' ? 0 : p.respuestaCorrecta === 'B' ? 1 : p.respuestaCorrecta === 'C' ? 2 : 3;
        return {
          id: `q-${idx + 1}`,
          type: 'multiple_choice',
          questionText: p.pregunta,
          options: p.opciones,
          correctOptionIndex: letterIndex,
          explanation: p.explicacionCritica,
        };
      });

      const newExam: ExamSimulation = {
        id: `exam-inv-${Date.now()}`,
        title: `Práctica Duolingo: ${topic}`,
        subject: topic,
        timeLimitMinutes: 15,
        passingGrade: 70,
        questions: formatted,
      };

      setExam(newExam);
      saveExam(newExam);
      restartDuolingoPractice(formatted);
      setResearchNotice(`Práctica generada para: "${topic}"`);
      sounds.playSuccess();
    }
    setIsGenerating(false);
  };

  const restartDuolingoPractice = (questionsList?: ExamQuestion[]) => {
    setSelectedOptionIdx(null);
    setIsAnswerChecked(false);
    setIsAnswerCorrect(null);
    setCurrentQuestionIdx(0);
    setHearts(5);
    setIsExamFinished(false);
    setAnsweredHistory({});
    if (questionsList) {
      setPreviewQuestions(questionsList);
    }
  };

  // 1. Selección y comprobación de respuesta estilo Duolingo
  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    sounds.playPop();
    setSelectedOptionIdx(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIdx === null || isAnswerChecked) return;

    const currentQ = exam.questions[currentQuestionIdx];
    const isCorrect = selectedOptionIdx === currentQ.correctOptionIndex;

    setIsAnswerChecked(true);
    setIsAnswerCorrect(isCorrect);
    trackGoalAction('exam-simulator');

    setAnsweredHistory(prev => ({
      ...prev,
      [currentQ.id]: { selected: selectedOptionIdx, correct: isCorrect },
    }));

    if (isCorrect) {
      sounds.playSuccess();
      setStreak(prev => prev + 1);
      setXpEarned(prev => prev + 15);
    } else {
      sounds.playError();
      setHearts(prev => Math.max(0, prev - 1));
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    sounds.playChirp();
    if (currentQuestionIdx < exam.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswerChecked(false);
      setIsAnswerCorrect(null);
    } else {
      // Examen completado
      setIsExamFinished(true);
      sounds.playFanfare();
      const numCorrect = Object.values(answeredHistory).filter((h: { correct: boolean }) => h.correct).length;
      nasserAI.registrarRendimiento(exam.subject, numCorrect, exam.questions.length);
    }
  };

  // 2. INTERFAZ DUAL: "Así no es mi examen"
  const handleOpenDualCorrection = () => {
    sounds.playPop();
    setPreviewQuestions(JSON.parse(JSON.stringify(exam.questions)));
    setDualMessages([
      {
        sender: 'nasser',
        text: `¡Hola! Si este cuestionario no tiene el formato que necesitas para tu examen, dime exactamente qué prefieres:
- ¿Preguntas tipo **Verdadero o Falso**?
- ¿Preguntas de **Completar espacios**?
- ¿Aumentar la dificultad a **nivel avanzado**?
- ¿Enfocarlo en un subtema o fórmulas específicas?`,
      },
    ]);
    setIsDualModalOpen(true);
  };

  const handleSendDualPrompt = async (customInstruction?: string) => {
    const instruction = (customInstruction || dualPrompt).trim();
    if (!instruction || isAdjustingExam) return;

    sounds.playPop();
    const userMsg = { sender: 'user' as const, text: instruction };
    setDualMessages(prev => [...prev, userMsg]);
    setDualPrompt('');
    setIsAdjustingExam(true);

    try {
      const res = await fetch('/api/ai/exam-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: exam.subject,
          currentQuestions: previewQuestions,
          instruction,
        }),
      });

      const data = await res.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const formatted: ExamQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: `q-adj-${idx + 1}`,
          type: q.type || 'multiple_choice',
          questionText: q.questionText || q.question,
          options: q.options || ['Verdadero', 'Falso'],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          explanation: q.explanation || 'Respuesta comprobada.',
        }));

        setPreviewQuestions(formatted);
        setDualMessages(prev => [
          ...prev,
          {
            sender: 'nasser',
            text: data.assistantComment || `He adaptado el cuestionario a tu solicitud ("${instruction}"). Observa la vista previa en tiempo real a la derecha. Cuando estés conforme, pulsa **"Listo"** para iniciar la práctica interactiva.`,
          },
        ]);
        sounds.playSuccess();
      }
    } catch (err) {
      console.warn('Error adjusting exam:', err);
    } finally {
      setIsAdjustingExam(false);
      setTimeout(() => {
        dualChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Botón "Listo": aplica los cambios y arranca inmediatamente la práctica
  const handleApplyDualExamAndStart = () => {
    if (previewQuestions && previewQuestions.length > 0) {
      const updatedExam = {
        ...exam,
        questions: previewQuestions,
      };
      setExam(updatedExam);
      saveExam(updatedExam);
      restartDuolingoPractice(previewQuestions);
      sounds.playSuccess();
      if (onShowToast) {
        onShowToast({
          title: '¡Examen Adaptado! 🎯',
          message: 'Arrancando práctica interactiva con tus preguntas actualizadas.',
          type: 'success',
        });
      }
    }
    setIsDualModalOpen(false);
  };

  const currentQ = exam.questions[currentQuestionIdx] || exam.questions[0];
  const progressPercent = Math.round(((currentQuestionIdx + (isAnswerChecked ? 1 : 0)) / exam.questions.length) * 100);
  const correctCount = Object.values(answeredHistory).filter((h: { correct: boolean }) => h.correct).length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* 1. NOTIFICACIÓN DE INVESTIGACIÓN */}
      {researchNotice && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 animate-pulse" />
            <span className="font-semibold">{researchNotice}</span>
          </div>
          <button
            onClick={() => setResearchNotice(null)}
            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 2. BARRA SUPERIOR ESTILO DUOLINGO: VIDAS, RACHA, XP Y BOTÓN DE CORRECCIÓN */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Métricas Duolingo y Botón Volver */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer"
              title="Volver a Salas de Estudio"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Exámenes</span>
            </button>
          )}

          {/* Corazones / Vidas */}
          <div className="flex items-center gap-1.5" title="Vidas restantes">
            <Heart className={`w-5 h-5 ${hearts > 0 ? 'text-red-500 fill-red-500 animate-bounce' : 'text-gray-300'}`} />
            <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
              {hearts}
            </span>
          </div>

          {/* Racha */}
          <div className="flex items-center gap-1.5 text-orange-500" title="Racha de aciertos">
            <Flame className="w-5 h-5 fill-orange-500" />
            <span className="font-mono font-black text-sm">
              {streak}
            </span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 text-amber-500" title="Puntos de experiencia XP">
            <Zap className="w-5 h-5 fill-amber-400" />
            <span className="font-mono font-black text-sm">
              +{xpEarned} XP
            </span>
          </div>
        </div>

        {/* BOTÓN "ASÍ NO ES MI EXAMEN" */}
        <button
          id="btn-asi-no-es-mi-examen"
          onClick={handleOpenDualCorrection}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
          title="Modificar formato y preguntas del examen en interfaz dual"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Así no es mi examen</span>
        </button>
      </div>

      {/* 3. BARRA DE PROGRESO GLOBAL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
          <span>Pregunta {currentQuestionIdx + 1} de {exam.questions.length}</span>
          <span>{progressPercent}% completado</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden p-0.5 border border-gray-200/50 dark:border-gray-700/50">
          <div
            className="h-full bg-gradient-to-r from-[#00236f] via-purple-600 to-[#fe6b00] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4. CONTENIDO PRINCIPAL: PANTALLA DE RESULTADOS O PREGUNTA ACTIVA */}
      {isExamFinished ? (
        /* PANTALLA DE RESULTADOS ESTILO DUOLINGO */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#fe6b00]">
              ¡Lección Práctica Completada!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {correctCount === exam.questions.length
                ? '¡Puntaje Perfecto! Dominio Total'
                : correctCount >= exam.questions.length / 2
                ? '¡Buen trabajo! Conceptos afianzados'
                : 'Sigue practicando para consolidar'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Acertaste {correctCount} de {exam.questions.length} preguntas • Ganaste +{xpEarned} XP
            </p>
          </div>

          {/* Botones de Acción Final */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onBackToList && (
              <button
                onClick={onBackToList}
                className="px-5 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Salas de Estudio</span>
              </button>
            )}

            <button
              onClick={() => restartDuolingoPractice()}
              className="px-6 py-3 rounded-2xl bg-[#00236f] hover:bg-[#142c6b] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repetir Práctica</span>
            </button>

            {onNavigateTo && (
              <button
                onClick={() => onNavigateTo('exposition-study')}
                className="px-6 py-3 rounded-2xl bg-[#fe6b00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Ir a Estudiar Exposición (Ruta 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* TARJETA INTERACTIVA DE PREGUNTA TIPO DUOLINGO */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6">
          
          {/* Badge de Tipo de Pregunta */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              {currentQ.type === 'true_false'
                ? 'Verdadero o Falso'
                : currentQ.type === 'fill_blank'
                ? 'Completar el enunciado'
                : 'Selección Múltiple'}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              {exam.subject}
            </span>
          </div>

          {/* Enunciado */}
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
            {currentQ.questionText || (currentQ as any).prompt}
          </h2>

          {/* Opciones Interactivas */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOptionIdx === idx;
              let btnClass = 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 hover:border-purple-400 hover:bg-purple-50/40';

              if (isAnswerChecked) {
                if (idx === currentQ.correctOptionIndex) {
                  btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isAnswerCorrect) {
                  btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold';
                } else {
                  btnClass = 'opacity-40 border-gray-200 dark:border-gray-800';
                }
              } else if (isSelected) {
                btnClass = 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 font-bold shadow-xs';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerChecked}
                  className={`w-full p-4 rounded-2xl border-2 text-left text-xs sm:text-sm transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswerChecked && idx === currentQ.correctOptionIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isAnswerChecked && isSelected && !isAnswerCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* BOTÓN COMPROBAR O BANNER INFERIOR DE FEEDBACK */}
          {!isAnswerChecked ? (
            <div className="pt-3">
              <button
                onClick={handleCheckAnswer}
                disabled={selectedOptionIdx === null}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-98 cursor-pointer"
              >
                Comprobar
              </button>
            </div>
          ) : (
            /* BANNER INFERIOR DE RESPUESTA INMEDIATA (ESTILO DUOLINGO) */
            <div
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
                isAnswerCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {isAnswerCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-black">
                      {isAnswerCorrect ? '¡Excelente! Respuesta correcta' : 'Solución correcta:'}
                    </h3>
                    {!isAnswerCorrect && (
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                        {currentQ.options[currentQ.correctOptionIndex]}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0 ${
                    isAnswerCorrect
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  Continuar
                </button>
              </div>

              {currentQ.explanation && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  💡 {currentQ.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE MODIFICACIÓN: "ASÍ NO ES MI EXAMEN" (CON PESTAÑAS)              */}
      {/* ========================================================================= */}
      {isDualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1222] w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Cabecera Modal */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/90 dark:bg-gray-900/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                    Modificar Examen: "Así no es mi examen"
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Ajusta por chat y revisa la vista previa en vivo sin fricción
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-listo-dual-examen"
                  onClick={handleApplyDualExamAndStart}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Listo</span>
                  <span className="hidden sm:inline">(Arrancar Práctica)</span>
                </button>

                <button
                  onClick={() => setIsDualModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barra de Pestañas Superiores (Elimina el scroll vertical conflictivo) */}
            <div className="px-4 sm:px-6 py-2 bg-gray-100/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xs">
                <button
                  type="button"
                  id="tab-exam-modal-chat"
                  onClick={() => setModalTab('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'chat'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ajustar por Chat</span>
                </button>

                <button
                  type="button"
                  id="tab-exam-modal-preview"
                  onClick={() => setModalTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'preview'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa ({previewQuestions.length})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                <button
                  type="button"
                  id="tab-exam-modal-split"
                  onClick={() => setModalTab('split')}
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'split'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white'
                  }`}
                  title="Ver ambos lados simultáneamente"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Vista Dividida</span>
                </button>
              </div>

              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hidden sm:block">
                {modalTab === 'chat' ? 'Escribe o selecciona sugerencias' : 'Preguntas adaptadas en tiempo real'}
              </div>
            </div>

            {/* Contenedor Principal de Paneles según Pestaña */}
            <div className={`flex-1 min-h-0 overflow-hidden ${
              modalTab === 'split' ? 'grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800' : 'flex flex-col'
            }`}>
              
              {/* PANEL DE CHAT DE AJUSTE */}
              <div className={`flex flex-col h-full bg-white dark:bg-[#111728] overflow-hidden ${
                modalTab === 'chat' ? 'flex flex-1' : modalTab === 'split' ? 'flex' : 'hidden'
              }`}>
                {/* Mensajes del Chat con Scroll Suave */}
                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 text-xs custom-scrollbar">
                  {dualMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'nasser' && (
                        <div className="w-7 h-7 rounded-xl bg-[#00236f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-purple-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-xs border border-gray-200/50 dark:border-gray-700/50'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {/* Acceso directo a vista previa si es mensaje de Nasser */}
                        {msg.sender === 'nasser' && previewQuestions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setModalTab('preview')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-300 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-500" />
                              <span>Ver Vista Previa ({previewQuestions.length} preguntas)</span>
                            </button>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1 toque</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAdjustingExam && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 italic pl-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold">Nasser AI regenerando el examen con tus criterios...</span>
                    </div>
                  )}
                  <div ref={dualChatBottomRef} />
                </div>

                {/* Chips de sugerencias rápidas */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                  <span className="text-gray-400 font-bold shrink-0">Sugerencias:</span>
                  {[
                    'Hacer todas de Verdadero o Falso',
                    'Preguntas de Selección Múltiple con 4 opciones',
                    'Añadir preguntas de completar espacios',
                    'Aumentar la dificultad técnica',
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendDualPrompt(chip)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-purple-600 whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Caja de Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-[#111728] shrink-0">
                  <input
                    type="text"
                    value={dualPrompt}
                    onChange={(e) => setDualPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendDualPrompt()}
                    placeholder="Escribe cómo debe ser tu examen (ej: 'más teórico', '3 preguntas de cálculo')..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendDualPrompt()}
                    disabled={isAdjustingExam || !dualPrompt.trim()}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition active:scale-95 cursor-pointer"
                    title="Enviar ajuste"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PANEL DE VISTA PREVIA EN TIEMPO REAL */}
              <div className={`flex flex-col h-full bg-gray-50/60 dark:bg-[#0c1222] overflow-hidden ${
                modalTab === 'preview' ? 'flex flex-1' : modalTab === 'split' ? 'flex' : 'hidden'
              }`}>
                <div className="px-4 py-2.5 bg-gray-100/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Eye className="w-3.5 h-3.5" />
                    Vista Previa ({previewQuestions.length} Preguntas)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sincronizado
                  </span>
                </div>

                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {previewQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {idx + 1}. {q.questionText}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                          {q.type || 'Opción'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl text-[11px] border ${
                              oIdx === q.correctOptionIndex
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold'
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 pb-2 sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent dark:from-[#0c1222] dark:via-[#0c1222]/90">
                    <button
                      type="button"
                      onClick={handleApplyDualExamAndStart}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Listo • Arrancar Práctica Duolingo</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
