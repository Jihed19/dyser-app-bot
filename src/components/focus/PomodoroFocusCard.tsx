import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  BellOff,
  Sparkles,
  CheckCircle2,
  X,
  Coffee,
  Brain,
  Timer,
} from 'lucide-react';
import { useFocus, FocusSessionType } from '../../context/FocusContext';

interface PomodoroFocusCardProps {
  onExitFocus?: () => void;
}

export const PomodoroFocusCard: React.FC<PomodoroFocusCardProps> = ({ onExitFocus }) => {
  const {
    isFocusMode,
    toggleFocusMode,
    sessionType,
    timeLeft,
    duration,
    isRunning,
    completedPomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    setSession,
    formatTime,
  } = useFocus();

  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const sessionLabels: Record<FocusSessionType, { label: string; icon: React.ReactNode }> = {
    pomodoro: { label: 'Foco (25 min)', icon: <Brain className="w-3.5 h-3.5" /> },
    short_break: { label: 'Pausa Corta (5 min)', icon: <Coffee className="w-3.5 h-3.5" /> },
    long_break: { label: 'Pausa Larga (15 min)', icon: <Sparkles className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-[#ecf5ee] to-[#e4efe6] dark:from-[#0d1c16] dark:to-[#081410] border border-emerald-300/80 dark:border-emerald-800/70 p-5 sm:p-6 shadow-sm transition-all duration-300">
      
      {/* Luz ambiente serena */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Info y descripción de modo calmado */}
        <div className="flex-1 text-center md:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Modo Focus Activo
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
              <BellOff className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Notificaciones Silenciadas
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-emerald-100 tracking-tight">
            Temporizador Pomodoro Visual
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
            Las notificaciones e interrupciones están temporalmente bloqueadas. Mantén la concentración en un solo objetivo académico hasta que suene la campana de descanso.
          </p>

          {/* Selector de Sesión */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {(['pomodoro', 'short_break', 'long_break'] as FocusSessionType[]).map(type => {
              const active = sessionType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSession(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                    active
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-emerald-200/60 dark:border-emerald-900/50'
                  }`}
                >
                  {sessionLabels[type].icon}
                  <span>{sessionLabels[type].label}</span>
                </button>
              );
            })}
          </div>

          {/* Indicador de Pomodoros Completados */}
          <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Ciclos completados en esta jornada:{' '}
              <strong className="font-black text-slate-900 dark:text-emerald-200">
                {completedPomodoros}
              </strong>
            </span>
          </div>
        </div>

        {/* Reloj Circular Visual Pomodoro */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
              {/* Círculo de fondo */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-emerald-200/70 dark:stroke-emerald-950 fill-transparent"
                strokeWidth="8"
              />
              {/* Círculo de progreso animado */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-emerald-600 dark:stroke-emerald-400 fill-transparent transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Tiempo y estado en el centro */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-0.5">
                {sessionType === 'pomodoro' ? 'Estudio' : 'Descanso'}
              </span>
            </div>
          </div>

          {/* Controles de Acción (Play / Pause / Reset) */}
          <div className="flex items-center gap-2">
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{timeLeft < duration ? 'Reanudar' : 'Comenzar'}</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                toggleFocusMode(false);
                if (onExitFocus) onExitFocus();
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-200/70 hover:bg-slate-300/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition active:scale-95 cursor-pointer"
              title="Salir del Modo Focus"
            >
              <X className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
