import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ExamSimulation } from '../../types';
import { sampleExamSimulation } from '../../data/mockData';
import { nasserAI } from '../../services/nasserEngines';
import { sounds } from '../../services/soundEffects';

export const ExamSimulatorView: React.FC = () => {
  const [exam, setExam] = useState<ExamSimulation>(sampleExamSimulation);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(exam.timeLimitMinutes * 60);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [scoreReport, setScoreReport] = useState<{
    correctCount: number;
    grade: number;
    passed: boolean;
  } | null>(null);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  // Carga automática si el estudiante generó un examen desde la investigación de Nasser AI
  useEffect(() => {
    try {
      const storedTopic = sessionStorage.getItem('dyser_active_exam_topic');
      const storedContext = sessionStorage.getItem('dyser_exam_research_context');
      if (storedTopic) {
        sessionStorage.removeItem('dyser_active_exam_topic');
        sessionStorage.removeItem('dyser_exam_research_context');

        const simulacro = nasserAI.generarSimulacroExamenElite(storedTopic, 3);
        if (simulacro && simulacro.preguntas && simulacro.preguntas.length > 0) {
          const newExam: ExamSimulation = {
            id: `exam-research-${Date.now()}`,
            title: `Examen: ${storedTopic}`,
            subject: 'Investigación Nasser AI',
            timeLimitMinutes: 12,
            passingGrade: 70,
            questions: simulacro.preguntas.map((p, idx) => {
              const letterIndex = p.respuestaCorrecta === 'A' ? 0 : p.respuestaCorrecta === 'B' ? 1 : p.respuestaCorrecta === 'C' ? 2 : 3;
              return {
                id: `q-${idx + 1}`,
                questionText: p.pregunta,
                options: p.opciones,
                correctOptionIndex: letterIndex,
                explanation: p.explicacionCritica,
              };
            }),
          };
          setExam(newExam);
          setTimeRemaining(12 * 60);
          setSelectedAnswers({});
          setCurrentQuestionIdx(0);
          setIsExamFinished(false);
          setScoreReport(null);
          setResearchNotice(`Evaluación generada automáticamente desde tu investigación sobre "${storedTopic}"`);
        }
      }
    } catch (e) {
      console.warn('Error al cargar examen desde investigación de Nasser AI', e);
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (!isExamFinished && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    } else if (timeRemaining === 0 && !isExamFinished) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [timeRemaining, isExamFinished]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isExamFinished) return;
    sounds.playPop();
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitExam = () => {
    setIsExamFinished(true);
    let correct = 0;
    exam.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correct += 1;
      }
    });
    const grade = Math.round((correct / exam.questions.length) * 10 * 10) / 10;
    setScoreReport({
      correctCount: correct,
      grade,
      passed: grade >= 7.0,
    });

    sounds.playSuccess();
    nasserAI.registrarRendimiento(exam.subject || 'Examen dyser', correct, exam.questions.length);
  };

  const handleRestart = () => {
    sounds.playChirp();
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setTimeRemaining(exam.timeLimitMinutes * 60);
    setIsExamFinished(false);
    setScoreReport(null);
  };

  const currentQ = exam.questions[currentQuestionIdx];
  const progressPercent = Math.round(((currentQuestionIdx + 1) / exam.questions.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Cabecera */}
      {researchNotice && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-semibold">{researchNotice}</span>
          </div>
          <button
            onClick={() => setResearchNotice(null)}
            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Simulación Académica
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {exam.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {exam.subject} • {exam.questions.length} preguntas de opción múltiple
          </p>
        </div>

        {/* Temporizador */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs self-start sm:self-auto">
          <Clock className={`w-4 h-4 ${timeRemaining < 180 ? 'text-red-500 animate-pulse' : 'text-purple-600'}`} />
          <span className="font-mono text-sm font-black text-gray-900 dark:text-white">
            {formatTimer(timeRemaining)}
          </span>
        </div>
      </div>

      {/* RESULTADOS SI EL EXAMEN HA TERMINADO */}
      {isExamFinished && scoreReport ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Calificación Obtenida
            </span>
            <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              {scoreReport.grade} <span className="text-xl text-gray-400 font-semibold">/ 10</span>
            </div>
            <p className={`text-sm font-bold mt-2 ${scoreReport.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {scoreReport.passed
                ? '¡Aprobado! Has superado con éxito el simulador.'
                : 'Necesitas reforzar algunos conceptos antes de la prueba real.'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Acertaste {scoreReport.correctCount} de {exam.questions.length} preguntas.
            </p>
          </div>

          {/* Revisión detallada de preguntas */}
          <div className="text-left space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Revisión de Respuestas
            </h3>
            <div className="space-y-3">
              {exam.questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctOptionIndex;
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border ${
                      isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {idx + 1}. {q.prompt}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-semibold">Respuesta correcta:</span> {q.options[q.correctOptionIndex]}
                        </p>
                        {q.explanation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-2xl bg-[#00236f] hover:bg-[#142c6b] text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Intentar Nuevamente</span>
            </button>
          </div>
        </div>
      ) : (
        /* TARJETA DE PREGUNTA ACTIVA */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6">
          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
              <span>
                Pregunta {currentQuestionIdx + 1} de {exam.questions.length}
              </span>
              <span>{progressPercent}% completado</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Enunciado */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
              {currentQ.prompt}
            </h2>
          </div>

          {/* Opciones de Respuesta */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'bg-white dark:bg-gray-800/40 border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navegación y Finalizar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {currentQuestionIdx < exam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2.5 rounded-2xl bg-[#00236f] hover:bg-[#142c6b] text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                Entregar y Calificar
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
