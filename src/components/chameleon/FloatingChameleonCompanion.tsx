import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Sparkles,
  Heart,
  Crown,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { ActiveTab, GamificationState, StudentProfile } from '../../types';
import { ChameleonAvatar } from './ChameleonAvatar';
import { sounds } from '../../services/soundEffects';

interface FloatingChameleonCompanionProps {
  activeTab: ActiveTab;
  student: StudentProfile;
  gamification: GamificationState;
  onUpdateGamification: (updated: GamificationState) => void;
  onNavigateTo: (tab: ActiveTab) => void;
  onOpenSanctuary: () => void;
  pendingTasksCount: number;
}

export const FloatingChameleonCompanion: React.FC<FloatingChameleonCompanionProps> = ({
  activeTab,
  student,
  gamification,
  onUpdateGamification,
  onNavigateTo,
  onOpenSanctuary,
  pendingTasksCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // Mensajes dinámicos contextuales según la interfaz actual (estilo Duolingo)
  const getContextualAdvice = (tab: ActiveTab): string => {
    switch (tab) {
      case 'tasks':
        return pendingTasksCount > 0
          ? `¡Tienes ${pendingTasksCount} tarea${pendingTasksCount > 1 ? 's' : ''} pendiente! Liquídalas hoy para ganar +150 XP y blindar tu racha 🔥`
          : '¡Todo al día! Eres un genio, relájate o adelanta tus lecturas 🌟';
      case 'nasser-ia':
        return '¡Hola! Estoy aquí con Nasser IA. Pregúntanos lo que sea sobre tus materias 🧠✨';
      case 'exam-simulator':
        return '¡Modo examen activado! Respira hondo, lee cada pregunta y confía en tu preparación ⏱️';
      case 'blackboard':
        return '¡Toma una foto clara a la pizarra! Yo te ayudo a transcribir fórmulas y esquemas 📸';
      case 'class-recorder':
        return '¡Shhh! Estoy atento a la clase para que luego tengas un resumen impecable 🎙️';
      case 'summary':
        return 'Los resúmenes ejecutivos te ahorran horas de estudio antes del examen 📚';
      case 'problem-solver':
        return 'Introduce el problema o ecuación. Lo resolveremos paso a paso sin prisas 📐';
      case 'multimedia':
        return '¡Genera flashcards y presentaciones interactivas para repasar como un pro! 🎨';
      case 'study-rooms':
        return '¡Estudiar con compañeros duplica la retención! Únete a una sala 👥';
      case 'dashboard':
      default:
        return student.streakDays >= 7
          ? `¡Racha de ${student.streakDays} días! Tu camaleón está en llamas 🔥 ¡Sigue así!`
          : '¡Hola Alejandro! ¿Qué misión académica conquistaremos hoy? 🚀';
    }
  };

  // Actualizar el diálogo del camaleón cuando el usuario cambia de interfaz
  useEffect(() => {
    const text = getContextualAdvice(activeTab);
    setSpeechBubbleText(text);
    setShowSpeechBubble(true);

    // Ocultar suavemente el globo flotante tras 8 segundos si no está expandido para no tapar contenido
    const hideTimer = setTimeout(() => {
      if (!isExpanded) {
        setShowSpeechBubble(false);
      }
    }, 8500);

    return () => clearTimeout(hideTimer);
  }, [activeTab, isExpanded, pendingTasksCount]);

  // Acariciar al camaleón (+10 XP y sonido alegre)
  const handlePet = () => {
    sounds.playPop();
    sounds.playChirp();
    onUpdateGamification({
      ...gamification,
      xp: gamification.xp + 10,
    });
  };

  // Si está minimizado, mostrar solo una simpática pestañita flotante
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40"
      >
        <button
          onClick={() => {
            setIsMinimized(false);
            setShowSpeechBubble(true);
            sounds.playPop();
          }}
          className="group relative flex items-center gap-2 p-2 rounded-2xl bg-white/95 dark:bg-[#111728]/95 border-2 border-emerald-500/40 shadow-2xl backdrop-blur-md hover:scale-105 transition-transform"
          title="Abrir a Chami, tu tutor camaleón"
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <ChameleonAvatar
              skinId={gamification.activeSkin}
              mood={student.streakDays >= 7 ? 'fire_streak' : 'happy'}
              size="sm"
              interactive={false}
              showAura={false}
            />
          </div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 pr-1">
            Chami
          </span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      id="floating-chameleon-coach"
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end pointer-events-none"
    >
      {/* 1. Globo de Diálogo Flotante (Habla y responde al estudiante) */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="pointer-events-auto max-w-xs sm:max-w-sm mb-2 p-3.5 rounded-2xl bg-white/95 dark:bg-[#131b2e]/95 border-2 border-[#00236f]/20 dark:border-[#90a8ff]/30 shadow-2xl backdrop-blur-md text-xs"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-[11px] uppercase tracking-wider text-[#00236f] dark:text-[#90a8ff]">
                  Chami • Tu Entrenador
                </span>
              </div>
              <button
                onClick={() => setShowSpeechBubble(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                title="Ocultar mensaje"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="font-semibold text-gray-800 dark:text-gray-200 leading-relaxed text-[12px]">
              {speechBubbleText}
            </p>

            {/* Acciones directas desde el globo */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
              <button
                onClick={handlePet}
                className="flex items-center gap-1 text-rose-500 font-bold hover:underline"
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>Acariciar (+10 XP)</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                {isExpanded ? 'Menos opciones' : 'Más opciones'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Menú Desplegable con Superpoderes de la Mascota */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="pointer-events-auto mb-2 p-3 w-56 rounded-2xl bg-white dark:bg-[#161f36] border-2 border-blue-200 dark:border-blue-900 shadow-2xl flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800">
              <span>Menú del Camaleón</span>
              <span className="text-amber-500 font-black">Niv. {gamification.level}</span>
            </div>

            <button
              onClick={() => {
                onNavigateTo('nasser-ia');
                setIsExpanded(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition text-left"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Preguntar a Nasser IA</span>
            </button>

            <button
              onClick={() => {
                onOpenSanctuary();
                setIsExpanded(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition text-left"
            >
              <Crown className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>Santuario de Skins ({gamification.studyCoins} 🪙)</span>
            </button>

            <button
              onClick={() => {
                handlePet();
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition text-left"
            >
              <Heart className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span>Dar Mimo (+10 XP)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. El Camaleón Vivo Flotante (Con Pestañeo, Respuestas e Interacción) */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        {/* Botón Minimizar */}
        <button
          onClick={() => setIsMinimized(true)}
          className="w-7 h-7 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center shadow-md text-xs font-bold transition hover:scale-110"
          title="Minimizar mascota"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Mascota Camaleón Interactivo Vivo */}
        <div
          onClick={() => {
            setShowSpeechBubble(prev => !prev);
            handlePet();
          }}
          className="relative flex items-center justify-center p-1 rounded-3xl bg-white/90 dark:bg-[#111728]/90 border-2 border-emerald-400/50 dark:border-emerald-500/40 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="Toca a Chami para hablar con él y ganar XP"
        >
          <ChameleonAvatar
            skinId={gamification.activeSkin}
            mood={student.streakDays >= 7 ? 'fire_streak' : 'happy'}
            size="md"
            interactive={true}
            onPet={handlePet}
            showAura={true}
          />

          {/* Insignia de Racha */}
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#fe6b00] text-white font-black text-[10px] flex items-center gap-0.5 shadow-md border border-white">
            <span>🔥</span>
            <span>{student.streakDays}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
