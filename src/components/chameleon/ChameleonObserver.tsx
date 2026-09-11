import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, Zap, Volume2, VolumeX, Eye } from 'lucide-react';
import { ActiveTab, GamificationState } from '../../types';
import { sounds } from '../../services/soundEffects';

export type ObserverState = 'idle' | 'blinking' | 'saludo' | 'scrolling' | 'interacting';
export type ChameleonPose = 'wave' | 'laugh' | 'love' | 'kiss' | 'tongue' | 'celebrate';

interface ChameleonObserverProps {
  activeTab: ActiveTab;
  gamification?: GamificationState;
  onUpdateGamification?: (state: GamificationState) => void;
  onOpenSanctuary?: () => void;
  className?: string;
  containerSelector?: string;
}

interface Particle {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const ChameleonObserver: React.FC<ChameleonObserverProps> = ({
  activeTab,
  gamification,
  onUpdateGamification,
  onOpenSanctuary,
  className = '',
  containerSelector,
}) => {
  const [observerState, setObserverState] = useState<ObserverState>('idle');
  const [pose, setPose] = useState<ChameleonPose>('wave');
  const [isBlinking, setIsBlinking] = useState(false);
  const [scrollTilt, setScrollTilt] = useState(0);
  const [scrollYOffset, setScrollYOffset] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [greetingBadge, setGreetingBadge] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  const previousTabRef = useRef<ActiveTab>(activeTab);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollYRef = useRef(0);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mapeo de poses a archivos PNG de alta resolución 100% transparentes sin fondo blanco
  const poseImages: Record<ChameleonPose, string> = {
    wave: '/chameleon_wave.png',
    laugh: '/chameleon_laugh.png',
    love: '/chameleon_love.png',
    kiss: '/chameleon_kiss.png',
    tongue: '/chameleon_tongue.png',
    celebrate: '/chameleon_celebration.png',
  };

  // 1. REACCIÓN AL CAMBIO DE PESTAÑAS (Saludo activo con onda Duolingo)
  useEffect(() => {
    // Si es la primera carga o cambia de pestaña
    const isTabChange = previousTabRef.current !== activeTab;
    previousTabRef.current = activeTab;

    if (isTabChange) {
      setObserverState('saludo');
      setPose('wave');

      // Reproducir sonido amistoso no invasivo
      sounds.playChirp();

      // Frases de saludo dinámicas muy breves y divertidas
      const greetings: Record<string, string> = {
        dashboard: '¡Hola! 🚀',
        tasks: '¡A por todas! 📝',
        calendar: '¡Buen ritmo! 📅',
        chat: '¡Hablemos! 💬',
        'nasser-ia': '¡Modo sabio! 🧠',
        summary: '¡Enfoque! 📚',
        multimedia: '¡Creatividad! 🎨',
        blackboard: '¡A dibujar! ✏️',
        'class-recorder': '¡Grabando! 🎙️',
        'problem-solver': '¡Soluciones! 💡',
        'study-rooms': '¡Compañeros! 👥',
        'exam-simulator': '¡Tú puedes! 🏆',
        'chameleon-sanctuary': '¡Mi hogar! 🌴',
      };

      const greetingText = greetings[activeTab] || '¡Hola! 👋';
      setGreetingBadge(greetingText);

      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = setTimeout(() => {
        setGreetingBadge(null);
        setObserverState('idle');
      }, 1600);
    }
  }, [activeTab]);

  // 2. PARPADEO NATURAL (Blinking State)
  useEffect(() => {
    const triggerBlink = () => {
      // Solo pestañea si está en idle
      if (observerState === 'idle') {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
        }, 160) ;
      }

      // Siguiente parpadeo en intervalo aleatorio natural (3.2 a 6.5 segundos)
      const nextInterval = 3200 + Math.random() * 3300;
      blinkTimeoutRef.current = setTimeout(triggerBlink, nextInterval);
    };

    blinkTimeoutRef.current = setTimeout(triggerBlink, 3500);

    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [observerState]);

  // 3. REACCIÓN AL SCROLL (Scroll Observer dinámico e independiente)
  useEffect(() => {
    const handleScroll = (currentY: number) => {
      const deltaY = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      if (Math.abs(deltaY) > 2) {
        setObserverState('scrolling');

        if (deltaY > 0) {
          // Scroll hacia abajo: el camaleón se inclina hacia adelante curioso
          setScrollTilt(Math.min(10, Math.max(3, deltaY * 0.4)));
          setScrollYOffset(4);
        } else {
          // Scroll hacia arriba: el camaleón mira hacia arriba con energía
          setScrollTilt(Math.max(-10, Math.min(-3, deltaY * 0.4)));
          setScrollYOffset(-4);
        }

        // Debounce para volver a idle al detener el scroll
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          setScrollTilt(0);
          setScrollYOffset(0);
          setObserverState('idle');
        }, 250);
      }
    };

    const onWindowScroll = () => {
      handleScroll(window.scrollY || window.pageYOffset || document.documentElement.scrollTop);
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });

    // También escuchar contenedor específico si existe (ej. vista previa móvil)
    let containerEl: Element | null = null;
    if (containerSelector) {
      containerEl = document.querySelector(containerSelector);
      if (containerEl) {
        const onContainerScroll = () => {
          if (containerEl) handleScroll(containerEl.scrollTop);
        };
        containerEl.addEventListener('scroll', onContainerScroll, { passive: true });
      }
    }

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      if (containerEl) {
        containerEl.removeEventListener('scroll', () => {});
      }
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [containerSelector]);

  // 4. INTERACCIÓN Y CARICIAS (Toca al camaleón libre)
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();

    setObserverState('interacting');

    // Cambia a una pose divertida al azar
    const funPoses: ChameleonPose[] = ['laugh', 'love', 'kiss', 'tongue'];
    const randomPose = funPoses[Math.floor(Math.random() * funPoses.length)];
    setPose(randomPose);

    // Sumar XP y gemas si hay gamification
    if (gamification && onUpdateGamification) {
      onUpdateGamification({
        ...gamification,
        xp: gamification.xp + 10,
        studyCoins: gamification.studyCoins + 2,
      });
    }

    // Partículas flotantes
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 15;
    const clickY = e.clientY - rect.top - 20;

    const emotes = [
      { text: '+10 XP', color: '#10b981' },
      { text: '💖', color: '#ec4899' },
      { text: '⭐', color: '#f59e0b' },
      { text: '✨', color: '#3b82f6' },
      { text: '🦎', color: '#22c55e' },
      { text: '🥰', color: '#f43f5e' },
    ];
    const emote = emotes[Math.floor(Math.random() * emotes.length)];

    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      text: emote.text,
      x: clickX,
      y: clickY,
      color: emote.color,
    };

    setParticles(prev => [...prev.slice(-6), newParticle]);

    // Regresar suavemente a wave o idle
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1100);

    setTimeout(() => {
      setPose('wave');
      setObserverState('idle');
    }, 1800);
  };

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <aside
      aria-label="Compañero Camaleón dyser"
      className={`fixed bottom-20 right-3 sm:right-6 lg:bottom-6 lg:right-6 z-40 select-none pointer-events-none ${className}`}
    >
      <div className="relative flex flex-col items-center">
        {/* Partículas flotantes animadas al interactuar */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: p.y, x: p.x, scale: 0.8 }}
              animate={{ opacity: 0, y: p.y - 65, x: p.x + (Math.random() * 24 - 12), scale: 1.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute pointer-events-none font-black text-sm drop-shadow-md z-50 whitespace-nowrap"
              style={{ color: p.color }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Pequeño saludo espontáneo estilo Duolingo sin bloquear la pantalla */}
        <AnimatePresence>
          {greetingBadge && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.85 }}
              transition={{ type: 'spring', damping: 15, stiffness: 350 }}
              className="mb-1 pointer-events-none"
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-emerald-400/40 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 whitespace-nowrap">
                <span className="animate-pulse">✨</span>
                {greetingBadge}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camaleón: Entidad Independiente y Libre */}
        <div
          className="relative pointer-events-auto cursor-pointer group focus:outline-none"
          onClick={handleInteraction}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          tabIndex={0}
          role="button"
          aria-label="Acariciar al camaleón dyser"
        >
          {/* Sombra orgánica en el suelo para realismo tridimensional */}
          <motion.div
            animate={{
              scale: observerState === 'scrolling' ? 1.15 : [0.92, 1.06, 0.92],
              opacity: [0.35, 0.5, 0.35],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/20 dark:bg-black/50 rounded-full blur-[3px] pointer-events-none"
          />

          {/* Cuerpo y animación con framer-motion */}
          <motion.div
            animate={
              observerState === 'saludo'
                ? {
                    y: [0, -14, -6, -10, 0],
                    rotate: [0, -12, 10, -8, 6, 0],
                    scale: [1, 1.14, 1.08, 1],
                  }
                : observerState === 'scrolling'
                ? {
                    y: scrollYOffset,
                    rotate: scrollTilt,
                    scale: 1.04,
                  }
                : observerState === 'interacting'
                ? {
                    scale: [1, 1.2, 0.96, 1.1, 1],
                    rotate: [0, -8, 8, -4, 0],
                  }
                : {
                    // Estado Idle (espera): respiración suave y vida continua
                    y: [0, -5, 0],
                    rotate: [-1, 1, -1],
                    scale: [1, 1.025, 1],
                  }
            }
            transition={
              observerState === 'saludo'
                ? { duration: 1.1, ease: 'easeOut' }
                : observerState === 'scrolling'
                ? { type: 'spring', stiffness: 300, damping: 20 }
                : observerState === 'interacting'
                ? { duration: 0.8, ease: 'easeInOut' }
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
            }
            whileHover={{ scale: 1.12, rotate: 2 }}
            whileTap={{ scale: 0.92, rotate: -4 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center filter drop-shadow-xl"
          >
            {/* Imagen transparente del camaleón */}
            <motion.img
              key={pose}
              src={poseImages[pose]}
              alt="Camaleón Observador dyser"
              className="w-full h-full object-contain select-none pointer-events-none transition-transform"
              referrerPolicy="no-referrer"
              animate={
                isBlinking
                  ? { scaleY: 0.75, opacity: 0.85 }
                  : { scaleY: 1, opacity: 1 }
              }
              transition={{ duration: 0.12 }}
            />

            {/* Ojos parpadeando: destello sutil si está en parpadeo */}
            {isBlinking && (
              <div className="absolute top-[30%] left-[45%] w-2 h-0.5 bg-emerald-950/60 rounded-full pointer-events-none" />
            )}

            {/* Efecto de corazón o chispa al hacer hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-2 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 pointer-events-none"
                >
                  <Heart className="w-2.5 h-2.5 fill-current text-rose-500" />
                  <span>¡Tócame!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Botones de acción discreta al pasar el cursor (Santuario y Silencio) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-md"
              >
                {onOpenSanctuary && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenSanctuary();
                    }}
                    title="Ver Santuario del Camaleón"
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5"
                  >
                    <span>🌴 Santuario</span>
                  </button>
                )}
                <button
                  onClick={handleToggleAudio}
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 p-0.5"
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-emerald-500" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};
