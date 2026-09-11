import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Flame,
  Crown,
  Lock,
  Gift,
  CheckCircle,
  Trophy,
  Coins,
  Gem,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  Star,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { ChameleonAvatar } from './ChameleonAvatar';
import { ChameleonSkinId, GamificationState, RewardChest, AcademicTask } from '../../types';
import { CHAMELEON_SKINS, CHAMELEON_QUOTES } from '../../data/chameleonData';
import { sounds } from '../../services/soundEffects';

interface ChameleonSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationState;
  onUpdateGamification: (updated: GamificationState) => void;
  studentGpa: number;
  streakDays: number;
}

export const ChameleonSanctuaryModal: React.FC<ChameleonSanctuaryModalProps> = ({
  isOpen,
  onClose,
  gamification,
  onUpdateGamification,
  studentGpa,
  streakDays,
}) => {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'chests' | 'quests'>('wardrobe');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [openedChestResult, setOpenedChestResult] = useState<{
    coins: number;
    gems: number;
    xp: number;
    chestName: string;
  } | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(sounds.getIsMuted());

  if (!isOpen) return null;

  const currentQuotes = streakDays >= 5
    ? CHAMELEON_QUOTES.highStreak
    : studentGpa >= 9.0
    ? CHAMELEON_QUOTES.highGPA
    : CHAMELEON_QUOTES.petting;

  const handleNextQuote = () => {
    sounds.playChirp();
    setCurrentQuoteIndex(prev => (prev + 1) % currentQuotes.length);
  };

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsSoundMuted(nextMuted);
    if (!nextMuted) {
      sounds.playCoin();
    }
  };

  const handleEquipSkin = (skinId: ChameleonSkinId) => {
    sounds.playPop();
    onUpdateGamification({
      ...gamification,
      activeSkin: skinId,
    });
  };

  const handleUnlockSkin = (skinId: ChameleonSkinId, costGems: number) => {
    if (gamification.dyserGems < costGems) {
      alert('¡Te faltan gemas! Completa misiones o simuladores de examen para obtener más gemas.');
      return;
    }

    sounds.playLevelUp();
    onUpdateGamification({
      ...gamification,
      dyserGems: gamification.dyserGems - costGems,
      unlockedSkins: [...gamification.unlockedSkins, skinId],
      activeSkin: skinId,
    });
  };

  const handleOpenChest = (chest: RewardChest) => {
    if (chest.status !== 'listo') return;

    sounds.playChestOpen();
    sounds.playCoin();

    // Actualizar estado de cofres y otorgar recompensas
    const updatedChests = gamification.chests.map(c =>
      c.id === chest.id ? { ...c, status: 'abierto' as const } : c
    );

    const newCoins = gamification.studyCoins + chest.rewardCoins;
    const newGems = gamification.dyserGems + chest.rewardGems;
    const newXp = gamification.xp + chest.rewardXp;

    onUpdateGamification({
      ...gamification,
      studyCoins: newCoins,
      dyserGems: newGems,
      xp: newXp,
      chests: updatedChests,
    });

    setOpenedChestResult({
      coins: chest.rewardCoins,
      gems: chest.rewardGems,
      xp: chest.rewardXp,
      chestName: chest.name,
    });
  };

  const handleClaimQuest = (questId: string) => {
    const quest = gamification.dailyQuests.find(q => q.id === questId);
    if (!quest || !quest.isCompleted || quest.isClaimed) return;

    sounds.playCoin();
    sounds.playLevelUp();

    const updatedQuests = gamification.dailyQuests.map(q =>
      q.id === questId ? { ...q, isClaimed: true } : q
    );

    onUpdateGamification({
      ...gamification,
      xp: gamification.xp + quest.xpReward,
      studyCoins: gamification.studyCoins + quest.coinsReward,
      dailyQuests: updatedQuests,
    });
  };

  const currentQuote = currentQuotes[currentQuoteIndex % currentQuotes.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111728] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header con Estado de Monedas y Gemas */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/70 dark:bg-[#151c30]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black">
              🦎
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none">
                Santuario del Camaleón
              </h2>
              <span className="text-[11px] font-semibold text-[#fe6b00]">
                {gamification.levelTitle} • Nivel {gamification.level}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Monedas de Estudio */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{gamification.studyCoins}</span>
            </div>

            {/* Gemas Dyser */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black shadow-2xs">
              <Gem className="w-3.5 h-3.5 text-cyan-500" />
              <span>{gamification.dyserGems}</span>
            </div>

            {/* Alternar Sonido */}
            <button
              onClick={handleToggleSound}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
              title={isSoundMuted ? 'Activar sonido de juego' : 'Silenciar sonido'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-200/60 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zona Central de Escaparate del Camaleón & Diálogo */}
        <div className="px-5 py-4 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 dark:from-[#151c30] dark:via-[#111728] dark:to-[#0e1422] border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ChameleonAvatar
              skinId={gamification.activeSkin}
              mood={gamification.chameleonMood}
              size="md"
              interactive={true}
              onPet={() => {
                onUpdateGamification({
                  ...gamification,
                  xp: gamification.xp + 10,
                  interactionCount: gamification.interactionCount + 1,
                });
              }}
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mascota de Estudio
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Ánimo: Activo
                </span>
              </div>
              <p
                onClick={handleNextQuote}
                className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mt-1 italic cursor-pointer hover:text-[#fe6b00] transition"
                title="Toca para cambiar de frase"
              >
                "{currentQuote}"
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                (Toca el camaleón para acariciarlo y ganar +10 XP)
              </span>
            </div>
          </div>

          {/* Barra de Nivel Rápida */}
          <div className="w-full sm:w-48 bg-white dark:bg-[#161f36] p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-gray-600 dark:text-gray-300">Progreso XP</span>
              <span className="text-[#fe6b00]">{gamification.xp} / {gamification.nextLevelXp}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#fe6b00] to-amber-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, (gamification.xp / gamification.nextLevelXp) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Pestañas estilo Videojuego: Armario de Skins / Cofres / Misiones */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-5 pt-2 gap-2 bg-gray-50/50 dark:bg-[#0e1422]">
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'wardrobe'
                ? 'border-[#fe6b00] text-[#fe6b00]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skins Desbloqueables</span>
          </button>

          <button
            onClick={() => setActiveTab('chests')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'chests'
                ? 'border-[#fe6b00] text-[#fe6b00]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Cofres de Recompensas</span>
            {gamification.chests.some(c => c.status === 'listo') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('quests')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'quests'
                ? 'border-[#fe6b00] text-[#fe6b00]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Misiones Diarias</span>
            {gamification.dailyQuests.some(q => q.isCompleted && !q.isClaimed) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          {/* 1. ARMARIO DE SKINS */}
          {activeTab === 'wardrobe' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CHAMELEON_SKINS.map(skin => {
                const isUnlocked = gamification.unlockedSkins.includes(skin.id);
                const isEquipped = gamification.activeSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-orange-50/50 dark:bg-orange-950/20 border-[#fe6b00] shadow-sm'
                        : 'bg-white dark:bg-[#141b2e] border-gray-200/80 dark:border-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {skin.badge}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          Niv. {skin.requiredLevel}
                        </span>
                      </div>

                      <div className="flex items-center justify-center my-3">
                        <ChameleonAvatar
                          skinId={skin.id}
                          size="sm"
                          interactive={false}
                          showAura={true}
                        />
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white text-center">
                        {skin.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-1 leading-snug">
                        {skin.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center">
                      {isEquipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#fe6b00]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Equipado</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          className="w-full py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs transition"
                        >
                          Equipar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockSkin(skin.id, skin.costGems)}
                          className="w-full py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Desbloquear ({skin.costGems} Gemas)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. COFRES DE RECOMPENSAS */}
          {activeTab === 'chests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {gamification.chests.map(chest => {
                  const isReady = chest.status === 'listo';
                  const isOpened = chest.status === 'abierto';

                  return (
                    <div
                      key={chest.id}
                      className={`p-4 rounded-2xl border text-center flex flex-col justify-between ${
                        isReady
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700 shadow-md ring-2 ring-amber-400/30'
                          : isOpened
                          ? 'bg-gray-50 dark:bg-[#121828] border-gray-200 dark:border-gray-800 opacity-60'
                          : 'bg-white dark:bg-[#141b2e] border-gray-200/80 dark:border-gray-800'
                      }`}
                    >
                      <div>
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-2xl mb-2">
                          {isOpened ? '📭' : isReady ? '🎁' : '🔒'}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {chest.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          {chest.description}
                        </p>

                        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span className="text-amber-500">+{chest.rewardCoins} 🪙</span>
                          <span className="text-cyan-500">+{chest.rewardGems} 💎</span>
                          <span className="text-[#fe6b00]">+{chest.rewardXp} XP</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {isReady ? (
                          <button
                            onClick={() => handleOpenChest(chest)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#fe6b00] text-white text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition"
                          >
                            ¡Abrir Cofre Ahora!
                          </button>
                        ) : isOpened ? (
                          <span className="text-xs font-medium text-gray-400">
                            Reclamado hoy
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[11px] text-gray-400 font-semibold block">
                              Progreso: {chest.unlockProgress} / {chest.unlockTarget}
                            </span>
                            <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{
                                  width: `${(chest.unlockProgress / chest.unlockTarget) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal de Recompensa de Cofre Abierto */}
              {openedChestResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center animate-in zoom-in-95 duration-200">
                  <span className="text-2xl">🎉</span>
                  <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-1">
                    ¡Cofre Reclamado con Éxito!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Has ganado +{openedChestResult.coins} Monedas, +{openedChestResult.gems} Gemas y +{openedChestResult.xp} XP.
                  </p>
                  <button
                    onClick={() => setOpenedChestResult(null)}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. MISIONES DIARIAS */}
          {activeTab === 'quests' && (
            <div className="space-y-2.5">
              {gamification.dailyQuests.map(quest => (
                <div
                  key={quest.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#141b2e] border border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {quest.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-1">
                        <span>Progreso: {quest.currentProgress}/{quest.targetProgress}</span>
                        <span>•</span>
                        <span className="text-[#fe6b00]">+{quest.xpReward} XP</span>
                        <span>•</span>
                        <span className="text-amber-500">+{quest.coinsReward} 🪙</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {quest.isClaimed ? (
                      <span className="text-xs font-bold text-gray-400 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                        Completado
                      </span>
                    ) : quest.isCompleted ? (
                      <button
                        onClick={() => handleClaimQuest(quest.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition active:scale-95 animate-pulse"
                      >
                        ¡Reclamar!
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">
                        En curso
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

interface TaskCompletionCelebrationModalProps {
  isOpen: boolean;
  task: AcademicTask | null;
  onClose: () => void;
  gamification: GamificationState;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

export const TaskCompletionCelebrationModal: React.FC<TaskCompletionCelebrationModalProps> = ({
  isOpen,
  task,
  onClose,
  gamification,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [displayedXp, setDisplayedXp] = useState(0);

  useEffect(() => {
    if (isOpen) {
      sounds.playDuolingoFanfare();

      const colors = ['#58cc02', '#fe6b00', '#1a357f', '#fbbf24', '#ec4899', '#38bdf8', '#a855f7'];
      const pieces: ConfettiPiece[] = Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.4,
      }));
      setConfetti(pieces);

      setDisplayedXp(0);
      let current = 0;
      const step = 5;
      const interval = setInterval(() => {
        current += step;
        if (current >= 150) {
          setDisplayedXp(150);
          clearInterval(interval);
        } else {
          setDisplayedXp(current);
        }
      }, 25);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div
        id="duolingo-celebration-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {confetti.map(piece => (
            <motion.div
              key={piece.id}
              initial={{ y: `${piece.y}vh`, x: `${piece.x}vw`, rotate: 0, opacity: 1 }}
              animate={{
                y: '110vh',
                x: `${piece.x + (Math.random() * 16 - 8)}vw`,
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                delay: piece.delay,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: '3px',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="relative z-20 w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-[#58cc02] dark:border-[#58cc02]/80 flex flex-col items-center text-center overflow-hidden"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-12 -left-12 -right-12 w-[130%] h-[130%] opacity-15 dark:opacity-10 pointer-events-none flex items-center justify-center"
          >
            <div className="w-full h-full bg-[radial-gradient(circle,rgba(88,204,2,0.6)_0%,transparent_70%)]" />
          </motion.div>

          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-1">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-2 rounded-full bg-gradient-to-tr from-yellow-300 to-emerald-400 blur-2xl opacity-70"
            />

            <motion.div
              animate={{
                y: [0, -32, 0, -18, 0],
                rotate: [0, -8, 8, -4, 0],
                scale: [1, 1.14, 0.95, 1.08, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative z-10 w-full h-full flex items-center justify-center"
            >
              <img
                src="/chameleon_celebration.png"
                alt="Camaleón dyser celebrando la tarea completada"
                className="w-full h-full object-contain filter drop-shadow-2xl select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />

              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-1 text-amber-400"
              >
                <Star className="w-9 h-9 fill-amber-400 drop-shadow-md" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute top-8 -left-2 text-yellow-400"
              >
                <Sparkles className="w-8 h-8 fill-yellow-400 drop-shadow-md" />
              </motion.div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 0.6, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1 w-32 h-3 rounded-full bg-black/30 dark:bg-black/60 blur-xs"
            />
          </div>

          <div className="relative z-10 mt-1 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#58cc02] dark:text-[#58cc02] text-xs font-black uppercase tracking-wider mb-2 border border-emerald-300 dark:border-emerald-800">
              ¡Misión Académica Cumplida!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              ¡Lección Completada!
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1 max-w-xs mx-auto line-clamp-2">
              «{task.title}»
            </p>
          </div>

          <div className="relative z-10 w-full grid grid-cols-3 gap-2.5 mb-6">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs mb-1 shadow">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                +{displayedXp}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                Puntos XP
              </span>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-700/60 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#fe6b00] text-white flex items-center justify-center font-black text-xs mb-1 shadow">
                🪙
              </div>
              <span className="text-base font-black text-[#fe6b00]">
                +25
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                Monedas
              </span>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700/60 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs mb-1 shadow">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                {gamification.level} Niv
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                Racha Activa
              </span>
            </div>
          </div>

          <div className="relative z-10 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
              <span>Progreso de Nivel {gamification.level}</span>
              <span className="text-[#58cc02] font-black">{gamification.xp + 150} / {gamification.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: `${Math.min(100, (gamification.xp / gamification.nextLevelXp) * 100)}%` }}
                animate={{ width: `${Math.min(100, ((gamification.xp + 150) / gamification.nextLevelXp) * 100)}%` }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[#58cc02] to-emerald-400 shadow-sm relative"
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
              </motion.div>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="relative z-10 w-full py-4 px-6 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] active:translate-y-1 text-white font-black text-lg tracking-wide uppercase shadow-[0_6px_0_#46a302] hover:shadow-[0_4px_0_#46a302] active:shadow-[0_0px_0_#46a302] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>¡Continuar!</span>
            <ArrowRight className="w-6 h-6 stroke-[3]" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
