import React from 'react';
import {
  CheckCircle2,
  Clock,
  Zap,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  Gift,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AcademicTask, StudentProfile, GamificationState, ActiveTab } from '../../types';
import { sounds } from '../../services/soundEffects';

interface GameQuestRoadmapProps {
  student: StudentProfile;
  tasks: AcademicTask[];
  gamification: GamificationState;
  onToggleTask: (taskId: string) => void;
  onNavigateTo: (tab: ActiveTab) => void;
  onOpenSanctuary: () => void;
}

export const GameQuestRoadmap: React.FC<GameQuestRoadmapProps> = ({
  student,
  tasks,
  gamification,
  onToggleTask,
  onNavigateTo,
  onOpenSanctuary,
}) => {
  const pendingTasks = tasks.filter(t => t.status !== 'completada');
  const mainTask = pendingTasks[0] || tasks[0];
  const isMainTaskDone = mainTask && mainTask.status === 'completada';

  const readyChest = gamification.chests.find(c => c.status === 'listo') || gamification.chests[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>Ruta de Misiones Diarias</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#00236f]/10 dark:bg-[#90a8ff]/20 text-[#00236f] dark:text-[#90a8ff]">
              Modo Juego
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Completa los 4 pasos del día para ganar XP, gemas y proteger tu racha
          </p>
        </div>

        <button
          onClick={onOpenSanctuary}
          className="text-xs font-black text-[#fe6b00] hover:underline flex items-center gap-1"
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Ver Recompensas</span>
        </button>
      </div>

      {/* Grid de Nodos de Aventura (Roadmap Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nodo 1: Tarea Académica como Misión de Juego */}
        <div
          className={`relative p-5 rounded-3xl border-2 transition-all shadow-sm ${
            isMainTaskDone
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-[#111728] border-orange-200/80 dark:border-orange-900/50 hover:border-[#fe6b00]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                  isMainTaskDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-orange-100 dark:bg-orange-950 text-[#fe6b00]'
                }`}
              >
                {isMainTaskDone ? <Check className="w-5 h-5 stroke-[3]" /> : '01'}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Paso 1 • Entrega Obligatoria
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  {mainTask ? mainTask.title : 'Todas las tareas al día'}
                </h4>
              </div>
            </div>

            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
              +150 XP
            </span>
          </div>

          {mainTask && (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-3">
              <span className="font-semibold text-gray-500">{mainTask.subject}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                Vence en {mainTask.dueDate}
              </span>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (mainTask) onToggleTask(mainTask.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 ${
                isMainTaskDone
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#fe6b00] hover:bg-[#e05e00] text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isMainTaskDone ? '¡Misión Cumplida! (Revertir)' : 'Marcar como Entregada'}</span>
            </button>

            <button
              onClick={() => onNavigateTo('tasks')}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              Ver detalles
            </button>
          </div>
        </div>

        {/* Nodo 2: Consulta & Tutoría Nasser IA */}
        <div className="relative p-5 rounded-3xl bg-white dark:bg-[#111728] border-2 border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-500 transition-all shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                02
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Paso 2 • Tutor IA 24/7
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  Despejar Dudas con Nasser IA
                </h4>
              </div>
            </div>

            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
              +100 XP
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Pregunta sobre cualquier fórmula, pide un resumen o genera ejemplos prácticos de Sistemas Distribuidos.
          </p>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => onNavigateTo('nasser-ia')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00236f] hover:bg-[#001c59] text-white text-xs font-black transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Abrir Nasser IA</span>
            </button>

            <span className="text-xs text-gray-400 font-medium">Respuestas instantáneas</span>
          </div>
        </div>

        {/* Nodo 3: Simulador de Exámenes */}
        <div className="relative p-5 rounded-3xl bg-white dark:bg-[#111728] border-2 border-purple-200/80 dark:border-purple-900/50 hover:border-purple-500 transition-all shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
                03
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Paso 3 • Evaluación Inminente
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  Simular Examen con Cronómetro
                </h4>
              </div>
            </div>

            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shrink-0">
              +200 XP
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Examen programado en 14 horas. Practica con 5 preguntas tipo test para memorizar conceptos clave.
          </p>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => onNavigateTo('exam-simulator')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition active:scale-95"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Comenzar Simulación</span>
            </button>

            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">14h restantes</span>
          </div>
        </div>

        {/* Nodo 4: Cofre de Recompensas */}
        <div
          onClick={onOpenSanctuary}
          className="relative p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-emerald-500/10 dark:from-amber-950/30 dark:to-emerald-950/20 border-2 border-amber-300 dark:border-amber-800/60 hover:border-amber-400 transition-all shadow-sm cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                🎁
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Paso 4 • Botín & Recompensa
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                  {readyChest.name}
                </h4>
              </div>
            </div>

            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 shrink-0">
              {readyChest.status === 'listo' ? '¡ABRIR AHORA!' : `${readyChest.unlockProgress}/${readyChest.unlockTarget}`}
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Contiene hasta {readyChest.coinsReward} monedas, {readyChest.gemsReward} gemas y skins legendarias para tu camaleón.
          </p>

          <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <span>Toca para abrir santuario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>

            <span className="text-xs font-bold text-gray-500">Skins desbloqueables</span>
          </div>
        </div>
      </div>
    </div>
  );
};
