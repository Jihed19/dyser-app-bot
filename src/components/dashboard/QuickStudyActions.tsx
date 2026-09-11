import React from 'react';
import { Mic, Camera, ArrowRight, Sparkles, Radio, ScanLine } from 'lucide-react';
import { ActiveTab } from '../../types';

interface QuickStudyActionsProps {
  onNavigateTo: (tab: ActiveTab) => void;
}

export const QuickStudyActions: React.FC<QuickStudyActionsProps> = ({ onNavigateTo }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#fe6b00]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Accesos Rápidos de Captura (1 Clic)
          </h3>
        </div>
        <span className="text-xs text-gray-400">Herramientas instantáneas</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta 1: Grabación de Clases */}
        <div
          onClick={() => onNavigateTo('class-recorder')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#00236f] via-[#142d72] to-[#1e3a8a] text-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-98 border border-white/10"
        >
          {/* Círculo decorativo difuso de fondo */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white/25 transition-colors">
                <Mic className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-white/20 text-white backdrop-blur-md border border-white/20">
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                1 Clic
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Grabar Clase en Vivo
                <ArrowRight className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-xs text-blue-100/90 mt-1 leading-relaxed">
                Captura conferencias en vivo con transcripción de voz a texto y generación automática de resúmenes con IA.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-200">Audio a Apuntes</span>
              <span className="font-bold text-orange-400 group-hover:underline flex items-center gap-1">
                Iniciar grabación →
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Escaneo de Pizarras OCR */}
        <div
          onClick={() => onNavigateTo('blackboard')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#fe6b00] via-[#ea580c] to-[#c2410c] text-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-98 border border-white/10"
        >
          {/* Círculo decorativo difuso de fondo */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white/25 transition-colors">
                <Camera className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-white/20 text-white backdrop-blur-md border border-white/20">
                <ScanLine className="w-3 h-3 text-white" />
                1 Clic
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Escanear Pizarra OCR
                <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-xs text-orange-100/90 mt-1 leading-relaxed">
                Toma una foto o sube una imagen de la pizarra; digitaliza ecuaciones, diagramas y genera notas editables.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="font-semibold text-orange-200">Foto a Texto OCR</span>
              <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                Escanear ahora →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
