import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  Sparkles,
  Trophy,
  Lock,
  CheckCircle,
  Play,
  Flame,
  ChevronLeft,
  ChevronRight,
  Shield,
  BookOpen,
  HelpCircle,
  Gift,
  TreePine,
  Sun,
  Palette,
} from 'lucide-react';
import {
  ArenaId,
  ArenaInfo,
  ArenaNode,
  GamificationState,
  ChameleonUrgencyStatus,
} from '../../types';
import {
  ARENAS_DATA,
  INITIAL_ARENA_NODES,
  SUBJECT_PIGMENTATIONS,
} from '../../data/chameleonData';
import { ChameleonViewport3D } from './ChameleonViewport3D';
import { ArenaExamModal } from './ArenaExamModal';
import { sounds } from '../../services/soundEffects';

interface ChameleonRoadArenas3DProps {
  gamification: GamificationState;
  onUpdateGamification: (updated: GamificationState) => void;
  onOpenSanctuary?: () => void;
}

export const ChameleonRoadArenas3D: React.FC<ChameleonRoadArenas3DProps> = ({
  gamification,
  onUpdateGamification,
  onOpenSanctuary,
}) => {
  // Arena seleccionada para inspección visual (por defecto la actual del usuario)
  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>(gamification.currentArenaId || 'arena-1');
  const [nodes, setNodes] = useState<ArenaNode[]>(INITIAL_ARENA_NODES);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [activeNodeModal, setActiveNodeModal] = useState<ArenaNode | null>(null);

  const selectedArena = ARENAS_DATA.find((a) => a.id === selectedArenaId) || ARENAS_DATA[0];
  const currentArenaIndex = ARENAS_DATA.findIndex((a) => a.id === selectedArenaId);

  // Navegación entre Arenas
  const handlePrevArena = () => {
    if (currentArenaIndex > 0) {
      const prev = ARENAS_DATA[currentArenaIndex - 1].id;
      setSelectedArenaId(prev);
      sounds.playPop();
    }
  };

  const handleNextArena = () => {
    if (currentArenaIndex < ARENAS_DATA.length - 1) {
      const next = ARENAS_DATA[currentArenaIndex + 1].id;
      setSelectedArenaId(next);
      sounds.playPop();
    }
  };

  // Progreso de Gotas de Rocío en la Arena actual
  const dewDrops = gamification.dewDrops ?? 380;
  const arenaMin = selectedArena.minDew;
  const arenaMax = selectedArena.maxDew;
  const arenaRange = Math.max(1, arenaMax - arenaMin);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((dewDrops - arenaMin) / arenaRange) * 100)
  );

  // Multiplicador por hidratación (50% si está deshidratado)
  const isDehydrated = gamification.urgencyStatus === 'dehydrated';
  const multiplier = isDehydrated ? 0.5 : 1.0;

  // Interacción con un nodo
  const handleNodeClick = (node: ArenaNode) => {
    if (node.isLocked) {
      sounds.playDefeat();
      return;
    }

    if (node.type === 'boss_exam') {
      setIsExamModalOpen(true);
      return;
    }

    sounds.playPop();
    setActiveNodeModal(node);
  };

  // Completar nodo de la ruta
  const handleCompleteNode = (node: ArenaNode) => {
    sounds.playDewDrop();
    const rewardEarned = Math.round(node.dewReward * multiplier);

    // Actualizar nodos
    const updatedNodes = nodes.map((n) => {
      if (n.id === node.id) {
        return { ...n, isCompleted: true, isCurrent: false };
      }
      if (n.index === node.index + 1) {
        return { ...n, isLocked: false, isCurrent: true };
      }
      return n;
    });
    setNodes(updatedNodes);

    // Actualizar gamificación con Gotas de Rocío
    const updatedGamification: GamificationState = {
      ...gamification,
      dewDrops: dewDrops + rewardEarned,
      studyCoins: gamification.studyCoins + 35,
      xp: gamification.xp + 45,
      hoursInactive: 0,
      urgencyStatus: 'optimal', // Rehidrata al camaleón al estudiar
      lastStudyTimestamp: Date.now(),
    };
    onUpdateGamification(updatedGamification);
    setActiveNodeModal(null);
  };

  // Pasar Examen de Arena y ascender
  const handlePassArenaExam = (targetArenaId: ArenaId, reward: number) => {
    setIsExamModalOpen(false);
    sounds.playArenaAscend();

    const currentUnlocked = gamification.unlockedArenas || ['arena-1'];
    const newUnlocked = Array.from(new Set([...currentUnlocked, targetArenaId]));

    const updatedGamification: GamificationState = {
      ...gamification,
      currentArenaId: targetArenaId,
      unlockedArenas: newUnlocked,
      dewDrops: dewDrops + reward,
      studyCoins: gamification.studyCoins + 100,
      xp: gamification.xp + 200,
      urgencyStatus: 'optimal',
      hoursInactive: 0,
      lastStudyTimestamp: Date.now(),
    };

    onUpdateGamification(updatedGamification);
    setSelectedArenaId(targetArenaId);
  };

  // Cambio de pigmentación de piel por asignatura
  const handleSubjectColorChange = (hex: string) => {
    sounds.playPop();
    onUpdateGamification({
      ...gamification,
      activeSubjectColor: hex,
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. CABECERA DEL CAMINO DE ARENAS (SELECTOR ESTILO CLASH ROYALE) */}
      <div className="w-full max-w-4xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden mb-6">
        {/* Glow temático de fondo */}
        <div
          className="absolute inset-0 opacity-20 transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${selectedArena.theme.accentColor}, transparent 70%)`,
          }}
        />

        {/* Barra superior con balance de Gotas de Rocío y Liga */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-3 mb-4">
          {/* Balance central de Gotas de Rocío (💧) */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
              <Droplet className="w-6 h-6 fill-cyan-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {dewDrops.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Gotas de Rocío
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unidad vital de progreso y salud del camaleón
              </p>
            </div>
          </div>

          {/* Multiplicador y Acceso al Santuario */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isDehydrated
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDehydrated ? 'x0.5 Gotas (Deshidratado)' : 'x1.0 Gotas Óptimo'}</span>
            </div>

            {onOpenSanctuary && (
              <button
                onClick={onOpenSanctuary}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Santuario 3D
              </button>
            )}
          </div>
        </div>

        {/* Selector de Arenas (Navegación horizontal 1 a 5) */}
        <div className="flex items-center justify-between relative z-10">
          <button
            onClick={handlePrevArena}
            disabled={currentArenaIndex === 0}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition cursor-pointer"
            title="Arena anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              LIGA {selectedArena.number} DE 5
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {selectedArena.name}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              {selectedArena.subtitle}
            </p>
            <span className="inline-block mt-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              {selectedArena.minDew.toLocaleString()} - {selectedArena.maxDew.toLocaleString()} Gotas
            </span>
          </div>

          <button
            onClick={handleNextArena}
            disabled={currentArenaIndex === ARENAS_DATA.length - 1}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition cursor-pointer"
            title="Siguiente Arena"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso de Gotas de la Arena seleccionada */}
        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Progreso hacia {ARENAS_DATA[Math.min(4, currentArenaIndex + 1)].name}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: selectedArena.theme.accentColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. DIORAMA 3D ESCÉNICO DE LA ARENA (CON LA MASCOTA 3D INTERACTIVA EN EL CENTRO) */}
      <div className="w-full max-w-4xl relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl mb-8">
        {/* Fondo del Diorama con atmósfera y partículas dinámicas */}
        <div
          className="w-full relative min-h-[380px] sm:min-h-[420px] flex flex-col items-center justify-between p-6 transition-all duration-700"
          style={{
            backgroundColor: selectedArena.theme.bgColor,
            backgroundImage: `radial-gradient(ellipse at 50% 10%, ${selectedArena.theme.ambientColor}, ${selectedArena.theme.bgColor} 85%)`,
          }}
        >
          {/* Efectos ambientales decorativos de hojas y esporas según la Arena */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {selectedArena.id === 'arena-1' && (
              /* Arena 1: El Nido (Raíces, luciérnagas y musgo) */
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-4 left-8 w-2.5 h-2.5 rounded-full bg-emerald-400 blur-xs animate-ping" />
                <div className="absolute bottom-16 right-12 w-2 h-2 rounded-full bg-lime-300 blur-xs animate-pulse" />
                <div className="absolute top-20 right-24 w-3 h-3 rounded-full bg-amber-400 blur-xs animate-bounce" />
              </div>
            )}
            {selectedArena.id === 'arena-2' && (
              /* Arena 2: Sotobosque (Hojas cayendo y hongos bioluminiscentes) */
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-6 right-10 text-emerald-400/60 animate-spin text-sm">🍃</div>
                <div className="absolute top-24 left-14 text-teal-400/60 animate-bounce text-xs">🌿</div>
                <div className="absolute bottom-8 right-32 w-4 h-4 rounded-full bg-teal-400 blur-sm animate-pulse" />
              </div>
            )}
            {selectedArena.id === 'arena-3' && (
              /* Arena 3: El Dosel (Lianas y lluvia de rocío) */
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-10 left-1/4 w-1 h-8 bg-blue-400/40 rounded-full animate-pulse" />
                <div className="absolute top-16 right-1/4 w-1 h-6 bg-cyan-400/40 rounded-full animate-pulse" />
              </div>
            )}
            {selectedArena.id === 'arena-4' && (
              /* Arena 4: Prisma (Destellos cromáticos de luz) */
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-8 left-12 w-6 h-6 bg-fuchsia-500/30 rounded-full blur-md animate-pulse" />
                <div className="absolute top-28 right-16 w-8 h-8 bg-purple-500/30 rounded-full blur-md animate-ping" />
              </div>
            )}
            {selectedArena.id === 'arena-5' && (
              /* Arena 5: La Cúpula Solar (Rayos dorados de sol) */
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
              </div>
            )}
          </div>

          {/* Selector de Pigmentación de Asignatura (Reacción dinámica de piel) */}
          <div className="relative z-10 flex items-center gap-2 p-1.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white">
            <Palette className="w-3.5 h-3.5 text-slate-300 ml-1.5" />
            <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
              Color de Asignatura:
            </span>
            <div className="flex items-center gap-1.5">
              {Object.entries(SUBJECT_PIGMENTATIONS).map(([subject, info]) => {
                const isActive = (gamification.activeSubjectColor || '#10b981') === info.hex;
                return (
                  <button
                    key={subject}
                    onClick={() => handleSubjectColorChange(info.hex)}
                    style={{ backgroundColor: info.hex }}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      isActive ? 'ring-2 ring-white scale-125' : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    title={`${subject} (${info.label})`}
                  />
                );
              })}
            </div>
          </div>

          {/* VISTA 3D DE LA MASCOTA CON THREE.JS (En el centro sobre el diorama) */}
          <div className="w-full max-w-sm relative z-10 flex flex-col items-center my-2">
            <ChameleonViewport3D
              urgencyStatus={gamification.urgencyStatus}
              mood={gamification.chameleonMood}
              subjectColorHex={gamification.activeSubjectColor || '#10b981'}
              customModelUrl={gamification.customModelUrl}
              onShootTongue={() => {
                const updated = {
                  ...gamification,
                  dewDrops: (gamification.dewDrops ?? 380) + 5,
                };
                onUpdateGamification(updated);
              }}
              onPet={() => {
                sounds.playChirp();
              }}
            />
          </div>

          {/* Etiqueta del Diorama */}
          <div className="relative z-10 text-center px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-slate-200">
            <span className="font-semibold">{selectedArena.description}</span>
          </div>
        </div>
      </div>

      {/* 3. CAMINO VERTICAL NODO A NODO (ESTILO CLASH ROYALE ROAD) */}
      <div className="w-full max-w-xl flex flex-col items-center relative py-6">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
            Sendero de Progresión Vertical
          </span>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
            El Camino de {selectedArena.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avanza lección a lección para acumular Gotas y desbloquear el Examen de Arena
          </p>
        </div>

        {/* Sendero y Nodos */}
        <div className="relative w-full flex flex-col items-center space-y-6 sm:space-y-8">
          {/* Línea o liana vertical conectora */}
          <div className="absolute top-6 bottom-6 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-amber-500 rounded-full opacity-40 pointer-events-none" />

          {nodes.map((node, index) => {
            const isBoss = node.type === 'boss_exam';
            // Alternancia curva izquierda-centro-derecha estilo Clash Royale
            const offsetClass = index % 2 === 0 ? 'sm:-translate-x-12' : 'sm:translate-x-12';

            return (
              <motion.div
                key={node.id}
                whileHover={{ scale: node.isLocked ? 1 : 1.05 }}
                whileTap={{ scale: node.isLocked ? 1 : 0.95 }}
                className={`relative z-10 transition-transform ${offsetClass}`}
              >
                <div
                  onClick={() => handleNodeClick(node)}
                  className={`relative p-3.5 sm:p-4 rounded-3xl border shadow-lg flex items-center gap-3.5 transition-all cursor-pointer select-none max-w-xs sm:max-w-sm ${
                    node.isCompleted
                      ? 'bg-emerald-950/40 dark:bg-emerald-950/60 border-emerald-500/60 text-white'
                      : node.isCurrent
                      ? 'bg-slate-900 dark:bg-slate-950 border-emerald-400 ring-4 ring-emerald-500/20 text-white'
                      : 'bg-gray-100 dark:bg-slate-900/60 border-gray-300 dark:border-gray-800 text-gray-400 dark:text-gray-500 opacity-70'
                  }`}
                >
                  {/* Ícono de Estado del Nodo */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                      node.isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : node.isCurrent
                        ? 'bg-emerald-400 text-slate-950 animate-pulse'
                        : isBoss
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-400'
                    }`}
                  >
                    {node.isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : node.isCurrent ? (
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    ) : isBoss ? (
                      <Trophy className="w-6 h-6 text-amber-400" />
                    ) : node.isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      node.index
                    )}
                  </div>

                  {/* Información del Nodo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-400">
                        {node.subject}
                      </span>
                      {node.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                          ● En curso
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">
                      {node.title}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-cyan-400">
                      <Droplet className="w-3.5 h-3.5 fill-cyan-400" />
                      <span>+{Math.round(node.dewReward * multiplier)} Gotas de Rocío</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL INTERACTIVO DE NODO (LECCIÓN / QUIZ) */}
      <AnimatePresence>
        {activeNodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-white relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    {activeNodeModal.subject}
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {activeNodeModal.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed mb-5">
                <p className="font-semibold text-emerald-300 mb-1.5">Concepto Clave:</p>
                <p>{activeNodeModal.summaryNote || 'Completa esta actividad para nutrir a tu camaleón con Gotas de Rocío.'}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <button
                  onClick={() => setActiveNodeModal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  onClick={() => handleCompleteNode(activeNodeModal)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Droplet className="w-4 h-4 fill-slate-950" />
                  <span>Recolectar +{Math.round(activeNodeModal.dewReward * multiplier)} Gotas</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL DE EXAMEN DE ARENA (EVALUACIÓN DE CIERRE DE 10 PREGUNTAS) */}
      <ArenaExamModal
        isOpen={isExamModalOpen}
        arenaId={selectedArenaId}
        onClose={() => setIsExamModalOpen(false)}
        onPassExam={handlePassArenaExam}
      />
    </div>
  );
};
