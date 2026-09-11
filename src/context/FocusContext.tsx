import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sounds } from '../services/soundEffects';

export type FocusSessionType = 'pomodoro' | 'short_break' | 'long_break';

export interface FocusContextType {
  isFocusMode: boolean;
  toggleFocusMode: (enable?: boolean) => void;
  notificationsBlocked: boolean;
  sessionType: FocusSessionType;
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  completedPomodoros: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setSession: (type: FocusSessionType) => void;
  formatTime: (seconds: number) => string;
}

const DEFAULT_DURATIONS: Record<FocusSessionType, number> = {
  pomodoro: 25 * 60,   // 25 minutos
  short_break: 5 * 60, // 5 minutos
  long_break: 15 * 60, // 15 minutos
};

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dyser_focus_mode');
      return saved === 'true';
    }
    return false;
  });

  const [sessionType, setSessionType] = useState<FocusSessionType>('pomodoro');
  const [duration, setDuration] = useState<number>(DEFAULT_DURATIONS.pomodoro);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dyser_completed_pomodoros');
      return saved ? parseInt(saved, 10) || 0 : 0;
    }
    return 0;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar estado de focus mode
  useEffect(() => {
    try {
      localStorage.setItem('dyser_focus_mode', String(isFocusMode));
    } catch {}
  }, [isFocusMode]);

  // Guardar pomodoros completados
  useEffect(() => {
    try {
      localStorage.setItem('dyser_completed_pomodoros', String(completedPomodoros));
    } catch {}
  }, [completedPomodoros]);

  // Manejo del temporizador Pomodoro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Fin de la sesión Pomodoro
            clearInterval(timerRef.current as NodeJS.Timeout);
            sounds.playFocusBell();

            if (sessionType === 'pomodoro') {
              setCompletedPomodoros(c => c + 1);
              // Cambiar automáticamente a descanso corto
              setSessionType('short_break');
              setDuration(DEFAULT_DURATIONS.short_break);
              return DEFAULT_DURATIONS.short_break;
            } else {
              // Volver a Pomodoro
              setSessionType('pomodoro');
              setDuration(DEFAULT_DURATIONS.pomodoro);
              return DEFAULT_DURATIONS.pomodoro;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, sessionType]);

  const toggleFocusMode = (enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !isFocusMode;
    setIsFocusMode(nextState);
    sounds.playFocusBell();

    if (nextState) {
      // Iniciar automáticamente el temporizador si no estaba corriendo
      setIsRunning(true);
    } else {
      // Si se desactiva el modo focus, pausamos el temporizador
      setIsRunning(false);
    }
  };

  const startTimer = () => {
    sounds.playPop();
    setIsRunning(true);
  };

  const pauseTimer = () => {
    sounds.playPop();
    setIsRunning(false);
  };

  const resetTimer = () => {
    sounds.playPop();
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const setSession = (type: FocusSessionType) => {
    sounds.playPop();
    setSessionType(type);
    const newDuration = DEFAULT_DURATIONS[type];
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <FocusContext.Provider
      value={{
        isFocusMode,
        toggleFocusMode,
        notificationsBlocked: isFocusMode,
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
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = (): FocusContextType => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};
