import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, CheckCircle, XCircle, Sparkles, Droplet, ArrowRight, ShieldCheck } from 'lucide-react';
import { PredatorQuizQuestion, ChameleonUrgencyStatus } from '../../types';
import { PREDATOR_EMERGENCY_QUESTIONS } from '../../data/chameleonData';
import { sounds } from '../../services/soundEffects';

interface PredatorEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (success: boolean, penalty: number) => void;
}

export const PredatorEmergencyModal: React.FC<PredatorEmergencyModalProps> = ({
  isOpen,
  onClose,
  onResolve,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(7180); // ~2 horas

  useEffect(() => {
    if (!isOpen) return;
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectCount(0);
    setIsCompleted(false);
    setSecondsLeft(7180);
  }, [isOpen]);

  // Temporizador de 2 horas
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCompleted]);

  if (!isOpen) return null;

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = PREDATOR_EMERGENCY_QUESTIONS[currentQIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
    sounds.playPop();
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      sounds.playSuccess();
      setCorrectCount((prev) => prev + 1);
    } else {
      sounds.playDefeat();
    }
  };

  const handleNext = () => {
    if (currentQIndex < PREDATOR_EMERGENCY_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      const passed = correctCount + (selectedOption === currentQ.correctIndex ? 1 : 0) >= 2;
      handleFinish(passed);
    }
  };

  const handleFinish = (passed: boolean) => {
    setIsCompleted(true);
    if (passed) {
      sounds.playArenaAscend();
      setTimeout(() => {
        onResolve(true, 0);
      }, 1800);
    } else {
      sounds.playDefeat();
      setTimeout(() => {
        onResolve(false, 75);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden"
      >
        {/* Fondo con resplandor carmesí */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header con Alerta y Temporizador */}
        <div className="flex items-center justify-between border-b border-rose-500/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-rose-200">
                ¡Acecho de Depredador del Bosque!
              </h3>
              <p className="text-xs text-rose-300/80">
                Defiende a tu camaleón completando el Quiz Relámpago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-rose-500/50 text-rose-400 text-xs font-mono font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>
        </div>

        {/* Estado Final de Victoria o Derrota */}
        {isCompleted ? (
          <div className="py-8 text-center space-y-3">
            {correctCount >= 2 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-extrabold text-emerald-300">
                  ¡Depredador Repelido con Éxito!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Tu rapidez mental ha protegido a tu camaleón. Su piel recupera su hidratación esmeralda óptima al 100%.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
                  <XCircle className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-extrabold text-rose-400">
                  Defensa Fallida: -75 Gotas de Rocío
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  El ave rapaz se llevó parte del rocío recolectado. ¡Estudia con constancia para evitar futuros ataques!
                </p>
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Indicador de Preguntas */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-rose-400">
                Pregunta {currentQIndex + 1} de {PREDATOR_EMERGENCY_QUESTIONS.length}
              </span>
              <span>{currentQ.subject}</span>
            </div>

            {/* Texto de la Pregunta */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-4">
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Opciones */}
            <div className="space-y-2 mb-5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'opacity-40 border-slate-800 text-slate-500';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-rose-900/60 border-rose-500 text-rose-100 font-bold';
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

            {/* Pista si falló */}
            {isAnswerSubmitted && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-4 text-xs text-slate-300">
                <span className="font-bold text-amber-400">Pista: </span>
                {currentQ.hint}
              </div>
            )}

            {/* Botón de Confirmación / Siguiente */}
            <div className="flex justify-end gap-2">
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Confirmar Respuesta
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{currentQIndex < PREDATOR_EMERGENCY_QUESTIONS.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Defensa'}</span>
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
