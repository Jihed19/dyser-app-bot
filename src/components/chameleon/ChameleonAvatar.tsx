import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, Crown, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChameleonSkinId, ChameleonMood } from '../../types';
import { CHAMELEON_SKINS } from '../../data/chameleonData';
import { sounds } from '../../services/soundEffects';
import { VectorChameleon } from './VectorChameleon';

export type ChameleonPose = 'wave' | 'laugh' | 'love' | 'kiss' | 'tongue' | 'celebrate';

interface ChameleonAvatarProps {
  skinId?: ChameleonSkinId;
  mood?: ChameleonMood;
  pose?: ChameleonPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onPet?: () => void;
  showAura?: boolean;
  celebrating?: boolean;
  speechText?: string;
  className?: string;
}

interface FloatingParticle {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const ChameleonAvatar: React.FC<ChameleonAvatarProps> = ({
  skinId = 'classic_emerald',
  mood = 'happy',
  pose,
  size = 'md',
  interactive = true,
  onPet,
  showAura = true,
  celebrating = false,
  speechText,
  className = '',
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [activePose, setActivePose] = useState<ChameleonPose>(pose || (celebrating ? 'celebrate' : 'wave'));
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [showTongue, setShowTongue] = useState(false);
  const [lookPos, setLookPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mantener sincronizado si la prop pose o celebrating cambian
  useEffect(() => {
    if (celebrating) {
      setActivePose('celebrate');
    } else if (pose) {
      setActivePose(pose);
    }
  }, [pose, celebrating]);

  const skin = CHAMELEON_SKINS.find(s => s.id === skinId) || CHAMELEON_SKINS[0];

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
    xl: 'w-52 h-52 sm:w-60 sm:h-60',
  }[size];

  // 1. CICLO NATURAL DE PESTAÑEO (Cada 2.8 a 4.5 segundos parpadea como Duolingo)
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const nextBlinkDelay = 2500 + Math.random() * 2000;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        // Pestañeo rápido natural de 160ms
        setTimeout(() => {
          setIsBlinking(false);
          // Ocasional doble pestañeo
          if (Math.random() > 0.65) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => setIsBlinking(false), 140);
            }, 180);
          }
          scheduleBlink();
        }, 160);
      }, nextBlinkDelay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 2. CICLO NATURAL DE MIRAR ALREDEDOR (Cuando está ocioso busca con sus ojos independientes)
  useEffect(() => {
    const lookInterval = setInterval(() => {
      if (isPetted) return;
      const directions = [
        { x: 0, y: 0 },
        { x: 0.8, y: -0.2 },
        { x: -0.6, y: 0.3 },
        { x: 0, y: -0.5 },
        { x: 0.4, y: 0.4 },
        { x: 0, y: 0 },
      ];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      setLookPos(randomDir);
    }, 3200);

    return () => clearInterval(lookInterval);
  }, [isPetted]);

  // 3. ANIMACIÓN DE HABLAR (Cuando hay texto en speechText o celebración, mueve la boca)
  useEffect(() => {
    if (speechText) {
      setIsTalking(true);
      const timer = setTimeout(() => setIsTalking(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsTalking(false);
    }
  }, [speechText]);

  // Seguimiento de cursor con los ojos cuando pasa el ratón encima
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isPetted) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);

    setLookPos({
      x: Math.max(-1, Math.min(1, dx)),
      y: Math.max(-1, Math.min(1, dy)),
    });
  };

  const handleMouseLeave = () => {
    setLookPos({ x: 0, y: 0 });
  };

  // 4. INTERACCIÓN Y CARICIAS (¡El camaleón reacciona vivo con las poses interactivas!)
  const handleInteraction = (e: React.MouseEvent) => {
    if (!interactive) return;

    sounds.playPop();
    sounds.playChirp();
    setIsBouncing(true);
    setIsPetted(true);
    setShowTongue(true);

    // Selecciona aleatoriamente una de las divertidas interacciones (risa, enamorado, beso, lengua)
    const interactivePoses: ChameleonPose[] = ['laugh', 'love', 'kiss', 'tongue'];
    const chosenPose = interactivePoses[Math.floor(Math.random() * interactivePoses.length)];
    setActivePose(chosenPose);

    // Vuelve al estado normal tras la interacción
    setTimeout(() => setShowTongue(false), 450);
    setTimeout(() => setIsBouncing(false), 650);
    setTimeout(() => setIsPetted(false), 1200);
    setTimeout(() => {
      setActivePose(pose || (celebrating ? 'celebrate' : 'wave'));
    }, 2000);

    // Generar partículas flotantes (+XP y corazones/estrellas)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left - 20;
    const clickY = e.clientY - rect.top - 20;

    const emotes = ['+10 XP', '💖', '⭐', '🔥', '✨', '🦎', '🥰'];
    const selectedEmote = emotes[Math.floor(Math.random() * emotes.length)];

    const newParticle: FloatingParticle = {
      id: Date.now() + Math.random(),
      text: selectedEmote,
      x: clickX,
      y: clickY,
      color: skin.glowColor,
    };

    setParticles(prev => [...prev.slice(-4), newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);

    if (onPet) {
      onPet();
    }
  };

  const getPoseImage = () => {
    switch (activePose) {
      case 'celebrate':
        return '/chameleon_celebration.png';
      case 'laugh':
        return '/chameleon_laugh.png';
      case 'love':
        return '/chameleon_love.png';
      case 'kiss':
        return '/chameleon_kiss.png';
      case 'tongue':
        return '/chameleon_tongue.png';
      case 'wave':
      default:
        return '/chameleon_wave.png';
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      title={interactive ? '¡Tócame para ver mis reacciones y ganar XP!' : 'Mascota dyser'}
    >
      {/* Bocadillo de Diálogo Inteligente (opcional) */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-12 z-30 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#111728] border-2 border-[#00236f]/30 dark:border-[#90a8ff]/40 shadow-xl text-[11px] font-black text-gray-800 dark:text-gray-100 whitespace-nowrap pointer-events-none"
        >
          <span>{speechText}</span>
          {/* Triángulo inferior del bocadillo */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#111728] border-r-2 border-b-2 border-[#00236f]/30 dark:border-[#90a8ff]/40 rotate-45" />
        </motion.div>
      )}

      {/* 1. Aura resplandeciente según la Skin */}
      {showAura && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.55, 0.8, 0.55],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 pointer-events-none ${skin.auraGradient} bg-gradient-to-tr`}
          style={{
            boxShadow: `0 0 50px ${skin.glowColor}40`,
          }}
        />
      )}

      {/* 2. Partículas orbitales dinámicas (fuego, corona o ciber-rayo) */}
      {skinId === 'phoenix_fire' && (
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-3 -right-2 text-orange-500 pointer-events-none z-20"
        >
          <Flame className="w-6 h-6 fill-orange-500 animate-pulse drop-shadow-md" />
        </motion.div>
      )}
      {skinId === 'royal_scholar' && (
        <motion.div
          animate={{ y: [-4, 2, -4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400 pointer-events-none z-20"
        >
          <Crown className="w-7 h-7 fill-amber-400 drop-shadow-lg" />
        </motion.div>
      )}
      {skinId === 'quantum_cyber' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute -top-2 -left-2 text-cyan-400 pointer-events-none z-20"
        >
          <Zap className="w-5 h-5 fill-cyan-400 drop-shadow-md" />
        </motion.div>
      )}

      {/* 3. Contenedor de la Mascota con Animaciones Flotantes Continuas y Reacciones Vivas */}
      <motion.div
        animate={
          celebrating
            ? {
                y: [0, -32, 0, -18, 0],
                rotate: [0, -12, 12, -6, 0],
                scale: [1, 1.25, 0.95, 1.15, 1],
              }
            : isBouncing
            ? {
                scale: [1, 1.22, 0.92, 1.1, 1],
                rotate: [-8, 8, -4, 0],
                y: [0, -16, 0],
              }
            : {
                y: [0, -8, 0],
                rotate: [0, 1.5, -1.5, 0],
              }
        }
        transition={
          celebrating
            ? { duration: 1.2, repeat: Infinity, ease: 'easeOut' }
            : isBouncing
            ? { duration: 0.6, ease: 'easeInOut' }
            : {
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        whileHover={interactive ? { scale: 1.08, y: -5 } : undefined}
        whileTap={interactive ? { scale: 0.92, rotate: -4 } : undefined}
        className={`relative ${sizeClasses} flex items-center justify-center`}
      >
        {/* Mascota del Camaleón dyser (diseño oficial sin fondo blanco, libre y transparente) */}
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.img
            key={activePose}
            src={getPoseImage()}
            alt="Mascota Camaleón dyser"
            initial={{ scale: 0.92, opacity: 0.8 }}
            animate={
              celebrating || activePose === 'celebrate'
                ? {
                    scale: [1, 1.14, 0.96, 1.08, 1],
                    rotate: [0, -8, 8, -4, 0],
                    opacity: 1,
                  }
                : activePose === 'tongue'
                ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, -6, 6, 0],
                    opacity: 1,
                  }
                : activePose === 'laugh'
                ? {
                    scale: [1, 1.08, 0.98, 1.06, 1],
                    rotate: [0, 4, -4, 0],
                    opacity: 1,
                  }
                : isTalking
                ? {
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                    opacity: 1,
                  }
                : {
                    scale: [1, 1.02, 1],
                    opacity: 1,
                  }
            }
            transition={{
              duration: celebrating || activePose === 'celebrate' ? 0.9 : 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full object-contain filter drop-shadow-xl select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Ojos de guiño/estrella cuando se le acaricia o está en modo celebración */}
          {isPetted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2 right-3 text-pink-500 pointer-events-none"
            >
              <Heart className="w-5 h-5 fill-pink-500 drop-shadow" />
            </motion.div>
          )}

          {/* Racha de fuego overlay en el libro o cresta */}
          {mood === 'fire_streak' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 text-orange-500 pointer-events-none"
            >
              <Flame className="w-6 h-6 fill-orange-500 drop-shadow-md" />
            </motion.div>
          )}
        </div>

        {/* Sombra de suelo reactiva que escala al flotar */}
        <motion.div
          animate={{
            scale: [1, 0.82, 1],
            opacity: [0.35, 0.15, 0.35],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-2 w-3/4 h-2.5 rounded-full bg-black/30 dark:bg-black/60 blur-xs pointer-events-none"
        />

        {/* Halo de pulso sutil cuando está en racha de fuego */}
        {mood === 'fire_streak' && (
          <span className="absolute bottom-0 w-3/4 h-2 rounded-full bg-orange-500/50 blur-sm animate-pulse" />
        )}
      </motion.div>

      {/* 4. Partículas flotantes de interacción animadas con AnimatePresence */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -50, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute pointer-events-none font-black text-sm drop-shadow-lg z-30 select-none"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              color: p.color,
            }}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
