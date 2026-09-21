import React, { useState } from 'react';
import {
  List,
  Download,
  CheckCircle2,
  RotateCcw,
  RotateCw,
  FolderArchive,
} from 'lucide-react';
import { StudioFormat, StudioMode } from './StudioTypes';
import { StudioControlDrawer } from './StudioControlDrawer';

interface StudioTopBarProps {
  currentFormat: StudioFormat;
  onSelectFormat: (format: StudioFormat) => void;
  currentMode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;
  docTitle: string;
  onChangeTitle: (title: string) => void;
  onOpenGallery: () => void;
  onSaveToGallery: () => void;
  onExport: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  currentFormat,
  onSelectFormat,
  currentMode,
  onSelectMode,
  docTitle,
  onChangeTitle,
  onOpenGallery,
  onSaveToGallery,
  onExport,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isSaving = false,
  isExporting = false,
}) => {
  // Estado del panel lateral de control exclusivo de Nasser AI Studio
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 sticky top-16 z-30 transition-all duration-200 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2.5">
          {/* LADO IZQUIERDO: Botón Discreto de Lista con Viñetas + Título y Formato */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* 1. ACTIVACIÓN EXCLUSIVA CON EL ICONO DE LISTA CON VIÑETAS (Recuadro con líneas y puntos) */}
            <button
              id="btn-open-studio-drawer"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/90 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200/90 dark:border-gray-700/80 transition-all shadow-2xs active:scale-95 cursor-pointer group shrink-0"
              title="Abrir panel de control y herramientas de Nasser AI Studio"
              aria-label="Abrir panel de control de estudio"
            >
              {/* Icono de lista con viñetas de Lucide: puntos y líneas horizontales */}
              <List className="w-4 h-4 text-[#00236F] dark:text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-900 dark:text-white hidden md:inline">
                Herramientas
              </span>
            </button>

            {/* Selector Rápido del Formato & Modo activo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[#00236F] text-white shadow-2xs font-mono shrink-0 hover:bg-[#001c59] transition cursor-pointer"
                title="Cambiar formato (PDF, Diapositivas, Imágenes)"
              >
                {currentFormat.toUpperCase()}
              </button>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition shrink-0 hidden sm:inline-block cursor-pointer ${
                  currentMode === 'ai'
                    ? 'bg-gradient-to-r from-[#00236F] to-[#FE6B00] text-white'
                    : 'bg-[#FE6B00] text-white'
                }`}
                title="Cambiar modo de edición (IA / Manual)"
              >
                {currentMode === 'ai' ? 'Nasser IA' : 'Manual Canva'}
              </button>
            </div>

            {/* Divisor vertical */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 shrink-0 hidden sm:block" />

            {/* Nombre del Proyecto / Título Editable */}
            <div className="min-w-0 flex-1 max-w-sm sm:max-w-md">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full bg-transparent font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:bg-white dark:focus:bg-gray-900 focus:border-[#00236F] focus:outline-none transition truncate"
              />
            </div>
          </div>

          {/* LADO DERECHO: Acciones Directas para mantener el flujo sin saturar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Deshacer / Rehacer */}
            <div className="hidden lg:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 border border-gray-200 dark:border-gray-700">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Deshacer (Ctrl+Z)"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Rehacer (Ctrl+Y)"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Galería Interna */}
            <button
              onClick={onOpenGallery}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
              title="Abrir Galería de Proyectos"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
              <span>Galería</span>
            </button>

            {/* Guardar en Galería Interna (Listo) */}
            <button
              onClick={onSaveToGallery}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Guardar cambios en Galería de Creaciones"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Listo</span>
            </button>

            {/* Exportar Archivo */}
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00236F] hover:bg-[#001b57] text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Descargar archivo en dispositivo"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </header>

      {/* PANEL DE CONTROL FLOTANTE / LATERAL EXCLUSIVO DE NASSER AI STUDIO
          Diseño y estructura idénticos a la referencia de Dyser Pro */}
      <StudioControlDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentFormat={currentFormat}
        onSelectFormat={onSelectFormat}
        currentMode={currentMode}
        onSelectMode={onSelectMode}
        docTitle={docTitle}
        onChangeTitle={onChangeTitle}
        onOpenGallery={onOpenGallery}
        onSaveToGallery={onSaveToGallery}
        onExport={onExport}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        isSaving={isSaving}
        isExporting={isExporting}
      />
    </>
  );
};
