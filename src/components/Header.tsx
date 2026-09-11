import React, { useEffect, useState } from 'react';
import {
  Menu,
  Bell,
  BellOff,
  Sun,
  Moon,
  Flame,
  Download,
  Share2,
  PlusSquare,
  X,
  Timer,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFocus } from '../context/FocusContext';
import { STUDENT_AVATAR } from '../data/mockData';
import { ActiveTab } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        id="pwa-install-action"
        onClick={handleInstallClick}
        className={
          compact
            ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fe6b00] text-white text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all'
            : 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all'
        }
        title="Instalar dyser en tu dispositivo"
      >
        <Download className="w-4 h-4" />
        <span>Instalar dyser</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#151c2c] border border-gray-100 dark:border-gray-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Cerrar modal de instalación"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#00236f] text-white flex items-center justify-center font-bold text-xl shadow-md">
                d
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Instala dyser como App</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Acceso instantáneo y offline</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <Share2 className="w-5 h-5 text-[#fe6b00] shrink-0 mt-0.5" />
                <p className="text-xs">
                  1. En Safari o Chrome móvil, toca <strong>Compartir</strong> o el menú de 3 puntos.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <PlusSquare className="w-5 h-5 text-[#00236f] dark:text-[#90a8ff] shrink-0 mt-0.5" />
                <p className="text-xs">
                  2. Selecciona <strong>"Agregar al inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#00236f] text-white font-medium text-sm hover:bg-[#1e3a8a] transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface DyserLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  textColor?: string;
  className?: string;
}

export const DyserLogo: React.FC<DyserLogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'horizontal',
  textColor,
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : {
          xs: 24,
          sm: 32,
          md: 40,
          lg: 52,
          xl: 72,
        }[size];

  const icon = (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs select-none"
    >
      {/* Anillo exterior azul marino (#183375) con abertura superior */}
      <path
        d="M 305 92 A 146 146 0 1 1 240 56"
        stroke="#183375"
        strokeWidth="36"
        strokeLinecap="butt"
        fill="none"
        className="dark:stroke-[#2b4c9e]"
      />
      {/* Panza circular concéntrica naranja (#fe6b00) */}
      <circle
        cx="200"
        cy="195"
        r="76"
        stroke="#fe6b00"
        strokeWidth="38"
        fill="none"
      />
      {/* Asta ascendente estilizada en aleta hacia arriba/derecha */}
      <path
        d="M 257 195 L 257 136 C 257 78, 276 40, 295 18 C 297 19, 298 22, 298 28 L 298 195 Z"
        fill="#fe6b00"
      />
    </svg>
  );

  if (variant === 'icon-only' || !showText) {
    return <div className={`inline-flex items-center ${className}`}>{icon}</div>;
  }

  const textClasses =
    typeof size === 'number'
      ? 'text-lg font-black tracking-tight'
      : {
          xs: 'text-sm font-black tracking-tight',
          sm: 'text-base font-black tracking-tight',
          md: 'text-xl font-black tracking-tight',
          lg: 'text-2xl font-black tracking-tight',
          xl: 'text-4xl font-black tracking-tight',
        }[size];

  return (
    <div
      className={`inline-flex items-center select-none ${
        variant === 'vertical' ? 'flex-col gap-1.5 text-center' : 'flex-row gap-2.5'
      } ${className}`}
    >
      {icon}
      <div className="flex flex-col">
        <span
          className={`${textClasses} ${
            textColor
              ? textColor
              : 'text-[#1a357f] dark:text-white group-hover:text-[#fe6b00] transition-colors'
          }`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Dyser
        </span>
      </div>
    </div>
  );
};

interface HeaderProps {
  onOpenDrawer: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unreadCount?: number;
  onOpenStreak?: () => void;
  streakDays?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  activeTab,
  onSelectTab,
  unreadCount = 2,
  onOpenStreak,
  streakDays = 152,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isFocusMode, timeLeft, formatTime } = useFocus();

  return (
    <header
      id="app-main-header"
      className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#f7f9fb]/90 dark:bg-[#090d16]/90 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/80 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Minimalist 3-line hamburger & brand */}
        <div className="flex items-center gap-3">
          <button
            id="drawer-toggle-button"
            onClick={onOpenDrawer}
            aria-label="Abrir panel lateral de navegación"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition active:scale-95"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 group text-left transition-transform active:scale-95"
            aria-label="Ir al inicio de Dyser"
          >
            <DyserLogo size="sm" showText={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-[#1a357f] dark:text-white group-hover:text-[#fe6b00] transition-colors">
                  Dyser
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline leading-none">
                Plataforma Académica
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Shortcuts */}
        <nav className="hidden lg:flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/60 p-1 rounded-xl">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Inicio
          </button>
          <button
            onClick={() => onSelectTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tareas
          </button>
          <button
            onClick={() => onSelectTab('nasser-ia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'nasser-ia'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Nasser IA
          </button>
          <button
            onClick={() => onSelectTab('study-rooms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'study-rooms'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Salas
          </button>
          <button
            onClick={() => onSelectTab('community')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'community'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Comunidad
          </button>
        </nav>

        {/* Right side utilities */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>

          {/* Días de Racha estilo Duolingo */}
          <button
            onClick={onOpenStreak}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50/90 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200/80 dark:border-orange-800/70 transition shadow-2xs group active:scale-95"
            title="Días de racha: Ver calendario y protectores estilo Duolingo"
            aria-label="Abrir calendario de racha"
          >
            <Flame className="w-4 h-4 text-[#fe6b00] fill-[#fe6b00] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-gray-900 dark:text-white">
              {streakDays}
            </span>
          </button>

          {/* Theme switcher */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Alternar tema claro y oscuro"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[#00236f]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Focus Mode Pomodoro Pill */}
          {isFocusMode && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold shadow-2xs hover:scale-105 transition active:scale-95 cursor-pointer"
              title="Modo Focus activo: Toca para abrir el temporizador Pomodoro"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </button>
          )}

          {/* Notifications / Modo Focus Blocking */}
          {isFocusMode ? (
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60"
              title="Modo Focus Activo: Notificaciones y alertas silenciadas"
            >
              <BellOff className="w-4 h-4" />
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('tasks')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition cursor-pointer"
              aria-label="Ver avisos y entregas"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fe6b00] ring-2 ring-[#f7f9fb] dark:ring-[#090d16]" />
              )}
            </button>
          )}

          {/* Student Avatar */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="relative flex items-center"
            title="Perfil de Alejandro Valenzuela"
          >
            <img
              src={STUDENT_AVATAR}
              alt="Alejandro Valenzuela"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00236f]/20 dark:ring-[#90a8ff]/30 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
          </button>
        </div>
      </div>
    </header>
  );
};
