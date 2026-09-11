import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Heart,
  HeartCrack,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
} from 'lucide-react';
import { ArenaId, ArenaExam, GamificationState } from '../../types';
import { ARENA_EXAMS, ARENAS_DATA } from '../../data/chameleonData';
import { sounds } from '../../services/soundEffects';

interface ArenaExamModalProps {
  isOpen: boolean;
  arenaId: ArenaId;
  onClose: () => void;
  onPassExam: (targetArenaId: ArenaId, dewReward: number) => void;
}

export const ArenaExamModal: React.FC<ArenaExamModalProps> = ({
  isOpen,
  arenaId,
  onClose,
  onPassExam,
}) => {
  const examData: ArenaExam = ARENA_EXAMS[arenaId] || ARENA_EXAMS['arena-1'];
  const questions = examData.questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [examStatus, setExamStatus] = useState<'in_progress' | 'passed' | 'failed'>('in_progress');

  const maxAllowedMistakes = examData.maxMistakesAllowed; // 2
  const remainingLives = Math.max(0, maxAllowedMistakes - mistakesCount + 1);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(0);
    setMistakesCount(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setExamStatus('in_progress');
  }, [isOpen, arenaId]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted || examStatus !== 'in_progress') return;
    setSelectedOption(idx);
    sounds.playPop();
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playDefeat();
      const newMistakes = mistakesCount + 1;
      setMistakesCount(newMistakes);
      if (newMistakes > maxAllowedMistakes) {
        // Superó los 2 errores permitidos (3 errores = reprobado)
        setExamStatus('failed');
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Completó las 10 preguntas con <= 2 errores
      setExamStatus('passed');
      sounds.playArenaAscend();
    }
  };

  // Determinar siguiente arena
  const currentArenaNum = examData.arenaNumber;
  const nextArenaNum = Math.min(5, currentArenaNum + 1);
  const nextArenaId = `arena-${nextArenaNum}` as ArenaId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header con Título y Vidas */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Examen de Ascenso
                </span>
                <span className="text-xs text-gray-400">
                  {examData.currentArenaName} ➔ {examData.targetArenaName}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100 mt-0.5">
                Evaluación de Cierre de Arena
              </h3>
            </div>
          </div>

          {/* Vidas / Errores restantes */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-xs text-slate-400 font-medium mr-1">Vidas:</span>
            {[0, 1, 2].map((heartIdx) => {
              const isLost = heartIdx < mistakesCount;
              return isLost ? (
                <HeartCrack key={heartIdx} className="w-4 h-4 text-rose-500 opacity-60" />
              ) : (
                <Heart key={heartIdx} className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              );
            })}
          </div>
        </div>

        {/* CONTENIDO SEGÚN ESTADO */}
        {examStatus === 'passed' ? (
          <div className="py-8 text-center space-y-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                ¡Ascenso Conquistado!
              </span>
              <h4 className="text-2xl font-black text-white mt-1">
                Bienvenido a {examData.targetArenaName}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2">
                Has demostrado dominio total de los conceptos clave con solo {mistakesCount} error(es).
                ¡Tu camaleón expande su territorio en el dosel del bosque!
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>+150 Gotas de Rocío Ganadas</span>
            </div>

            <div className="pt-3">
              <button
                onClick={() => onPassExam(nextArenaId, 150)}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl hover:shadow-emerald-500/30 transition active:scale-95 cursor-pointer"
              >
                Entrar a {examData.targetArenaName}
              </button>
            </div>
          </div>
        ) : examStatus === 'failed' ? (
          <div className="py-8 text-center space-y-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                Límite de Errores Superado (3/2)
              </span>
              <h4 className="text-2xl font-black text-white mt-1">
                Examen No Superado
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2">
                El Guardián del Nido requiere un conocimiento más consolidado antes de otorgar el ascenso. Repasa los módulos de Sistemas Distribuidos y Algoritmos en Nasser AI.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Repasar Apuntes
              </button>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setMistakesCount(0);
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                  setExamStatus('in_progress');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Reintentar Examen
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Barra de progreso de preguntas */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-emerald-400">
                Pregunta {currentIndex + 1} de {questions.length}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {currentQ.subject}
              </span>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Texto de la pregunta */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-4">
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Opciones */}
            <div className="space-y-2 mb-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'bg-slate-800/70 hover:bg-slate-700/70 border-slate-700 text-slate-200';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'opacity-40 border-slate-800 text-slate-500';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explicación si ya confirmó */}
            {isAnswerSubmitted && (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-4 text-xs text-slate-300">
                <span className="font-bold text-emerald-400">Justificación Técnica: </span>
                {currentQ.explanation}
              </div>
            )}

            {/* Footer de navegación */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Pausar y Salir
              </button>

              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Confirmar Respuesta
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
