import React from 'react';
import { motion } from 'motion/react';
import { Droplet, AlertTriangle, Skull, ShieldAlert, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { ChameleonUrgencyStatus } from '../../types';
import { sounds } from '../../services/soundEffects';

interface ChameleonUrgencyBarProps {
  urgencyStatus: ChameleonUrgencyStatus;
  hoursInactive: number;
  dewDrops: number;
  onSelectUrgencyStatus: (status: ChameleonUrgencyStatus) => void;
  onTriggerPredatorQuiz: () => void;
}

export const ChameleonUrgencyBar: React.FC<ChameleonUrgencyBarProps> = ({
  urgencyStatus,
  hoursInactive,
  dewDrops,
  onSelectUrgencyStatus,
  onTriggerPredatorQuiz,
}) => {
  // Configuración visual según el estado de salud
  const getStatusConfig = () => {
    switch (urgencyStatus) {
      case 'dehydrated':
        return {
          title: 'Camaleón Deshidratado (24h Inactivo)',
          desc: 'Piel café y seca. Ganancia de Gotas reducida al 50%. ¡Estudia hoy para rehidratarlo!',
          badge: '50% Gotas de Rocío',
          badgeBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          bannerBg: 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-amber-500/30',
          icon: Droplet,
          iconColor: 'text-amber-500',
        };
      case 'predator_attack':
        return {
          title: '¡Alerta de Depredador Acechando! (48h Inactivo)',
          desc: 'Un ave rapaz acecha el nido. Tienes 2 horas para el Quiz Relámpago o perderás -75 Gotas de Rocío.',
          badge: '¡Peligro Inminente!',
          badgeBg: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse',
          bannerBg: 'bg-gradient-to-r from-rose-500/15 via-red-500/15 to-transparent border-rose-500/40',
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
        };
      case 'pale':
        return {
          title: 'Estado Pálido Crítico (72h+ Inactivo)',
          desc: 'Piel gris pálido por falta de hidratación académica. La reputación de tu avatar está debilitada.',
          badge: 'Piel Gris Pálido',
          badgeBg: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
          bannerBg: 'bg-gradient-to-r from-slate-500/15 via-zinc-500/15 to-transparent border-slate-500/30',
          icon: Skull,
          iconColor: 'text-slate-400',
        };
      case 'optimal':
      default:
        return {
          title: 'Óptimo e Hidratado (0 - 24h)',
          desc: 'Piel brillante y vivaz con 100% de absorción de Gotas de Rocío. ¡Tu constancia protege a tu compañero!',
          badge: '100% Gotas Activas',
          badgeBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          bannerBg: 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-500/30',
          icon: Sparkles,
          iconColor: 'text-emerald-500',
        };
    }
  };

  const current = getStatusConfig();
  const IconComp = current.icon;

  return (
    <div className="w-full rounded-2xl border p-3.5 backdrop-blur-md transition-all shadow-xs bg-white/70 dark:bg-slate-900/70 border-gray-200/80 dark:border-gray-800">
      {/* Banner Principal de Urgencia */}
      <div className={`rounded-xl p-3 border ${current.bannerBg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-gray-200/60 dark:border-gray-800 ${current.iconColor}`}>
            <IconComp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {current.title}
              </h4>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${current.badgeBg}`}>
                {current.badge}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-xl">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Botón de acción si hay ataque de depredador */}
        {urgencyStatus === 'predator_attack' && (
          <button
            onClick={() => {
              sounds.playPredatorAlarm();
              onTriggerPredatorQuiz();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Defender al Camaleón</span>
          </button>
        )}
      </div>

      {/* Selector de Simulación Rápida de Inactividad (Permite verificar las 4 etapas interactivamente) */}
      <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px]">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">Simular Estado de Inactividad:</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              sounds.playDewDrop();
              onSelectUrgencyStatus('optimal');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              urgencyStatus === 'optimal'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            0h Óptimo
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onSelectUrgencyStatus('dehydrated');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              urgencyStatus === 'dehydrated'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            24h Café/Deshidratado
          </button>

          <button
            onClick={() => {
              sounds.playPredatorAlarm();
              onSelectUrgencyStatus('predator_attack');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              urgencyStatus === 'predator_attack'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            48h Depredador
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onSelectUrgencyStatus('pale');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              urgencyStatus === 'pale'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            72h+ Gris Pálido
          </button>
        </div>
      </div>
    </div>
  );
};
