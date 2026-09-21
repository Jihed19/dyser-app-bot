import React, { useEffect, useState, useRef } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Target,
  Download,
  Share2,
  PlusSquare,
  X,
  LogOut,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { STUDENT_AVATAR } from '../data/mockData';
import { ActiveTab, StudentProfile } from '../types';

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
  student?: StudentProfile;
  onLogout?: () => void;
  isSubinterface?: boolean;
  onExitSubinterface?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  activeTab,
  onSelectTab,
  unreadCount = 2,
  onOpenStreak,
  student,
  onLogout,
  isSubinterface = false,
  onExitSubinterface,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header
      id="app-main-header"
      className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#f7f9fb]/90 dark:bg-[#090d16]/90 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/80 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Exit button when in subinterface or minimalist 3-line hamburger & brand */}
        <div className="flex items-center gap-2.5">
          {isSubinterface && onExitSubinterface ? (
            <button
              id="subinterface-exit-button"
              onClick={onExitSubinterface}
              aria-label="Volver y salir de la herramienta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200/80 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold text-xs border border-gray-300/70 dark:border-gray-700 transition active:scale-95 cursor-pointer shadow-xs"
              title="Regresar a la pantalla anterior"
            >
              <ArrowLeft className="w-4 h-4 text-[#fe6b00]" />
              <span>Volver</span>
            </button>
          ) : (
            <button
              id="drawer-toggle-button"
              onClick={onOpenDrawer}
              aria-label="Abrir panel lateral de navegación"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition active:scale-95"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 group text-left transition-transform active:scale-95"
            aria-label="Ir al inicio de Dyser"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <DyserLogo size="sm" showText={false} />
              {/* Indicador de estado de conexión online/offline */}
              <span
                id="header-network-status-dot"
                title={isOnline ? 'Estado: En línea (Conectado)' : 'Estado: Sin conexión (Offline)'}
                aria-label={isOnline ? 'Estado de red: En línea' : 'Estado de red: Sin conexión'}
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#f7f9fb] dark:ring-[#090d16] transition-colors duration-300 ${
                  isOnline
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                    : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                }`}
              >
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                )}
              </span>
            </div>
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

          {/* Acceso a Metas del Día */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/70 transition shadow-2xs group active:scale-95 cursor-pointer"
            title="Ver metas académicas de hoy"
            aria-label="Ver metas de hoy"
          >
            <Target className="w-4 h-4 text-[#00236f] dark:text-[#90a8ff] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-gray-900 dark:text-white">
              Metas
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

          {/* Notifications */}
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

          {/* Student Profile Menu Container (Ubicación exclusiva de Cerrar Sesión) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              id="header-user-profile-btn"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`relative flex items-center p-0.5 rounded-full transition-all cursor-pointer ${
                isProfileMenuOpen
                  ? 'ring-2 ring-[#fe6b00] ring-offset-2 ring-offset-[#f7f9fb] dark:ring-offset-[#090d16]'
                  : 'hover:ring-2 hover:ring-[#00236f]/30 dark:hover:ring-[#90a8ff]/40'
              }`}
              title={`Perfil de ${student?.name || 'Estudiante Dyser'}`}
              aria-label="Menú y perfil del usuario"
              aria-expanded={isProfileMenuOpen}
            >
              <img
                src={student?.avatar || STUDENT_AVATAR}
                alt={student?.name || 'Estudiante'}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#090d16]" />
            </button>

            {/* Vista / Menú flotante del Perfil del Usuario */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  id="header-user-profile-menu"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2.5 w-76 sm:w-80 rounded-2xl bg-white/98 dark:bg-[#111728]/98 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-2xl z-50 overflow-hidden text-left"
                >
                  {/* Encabezado del Perfil */}
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
                    <div className="relative shrink-0">
                      <img
                        src={student?.avatar || STUDENT_AVATAR}
                        alt={student?.name || 'Estudiante'}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#00236f]/20 dark:ring-blue-500/30"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111728] flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                          {student?.name || 'Estudiante Dyser'}
                        </h4>
                        {student?.authProvider === 'google' && (
                          <span
                            className="shrink-0 p-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                            title="Cuenta vinculada con Google"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {student?.email || 'estudiante@dyser.edu'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#fe6b00]/10 border border-[#fe6b00]/20 text-[10px] font-black text-[#fe6b00]">
                          Código Disser: {student?.dyserNumber || student?.disserCode || '1 60 10'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ficha de Nivel Académico y Métricas */}
                  <div className="py-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#00236f] dark:text-[#90a8ff]" />
                        <span className="truncate max-w-[160px] font-medium">{student?.program || 'Educación Superior'}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {student?.semester || '2026'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-gray-400 font-medium">Rendimiento Académico</div>
                          <div className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                            Promedio: {student?.gpa ?? 9.4} / 10
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Regular
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acceso a Dashboard */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onSelectTab('dashboard');
                    }}
                    className="w-full mt-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#00236f] dark:text-[#90a8ff]" />
                      <span>Ir a mi Panel de Estudio</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  <div className="my-2 border-t border-gray-100 dark:border-gray-800/80" />

                  {/* Ubicación Exclusiva del Botón Cerrar Sesión */}
                  {onLogout && (
                    <button
                      id="header-profile-logout-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 font-bold text-xs transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-xs">Cerrar sesión</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                            Finalizar sesión de forma segura
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
