import React from 'react';
import {
  FileText,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  Download,
  CheckCircle2,
  FolderArchive,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { StudioFormat, StudioMode } from './StudioTypes';

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
  return (
    <header className="w-full bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 sticky top-16 z-30 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 space-y-2.5">
        {/* Fila Superior: Selector de Formato (PDF | Diapositivas | Imágenes) y Selector de Modo (Manual | IA) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 1. TRES BOTONES PRINCIPALES DE FORMATO */}
          <div className="flex items-center p-1 bg-gray-100/90 dark:bg-gray-800/90 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
            <button
              onClick={() => onSelectFormat('pdf')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentFormat === 'pdf'
                  ? 'bg-[#00236F] text-white shadow-md scale-102'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-orange-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => onSelectFormat('slides')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentFormat === 'slides'
                  ? 'bg-[#00236F] text-white shadow-md scale-102'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Diapositivas</span>
            </button>

            <button
              onClick={() => onSelectFormat('images')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentFormat === 'images'
                  ? 'bg-[#00236F] text-white shadow-md scale-102'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-orange-400" />
              <span>Imágenes</span>
            </button>
          </div>

          {/* 2. DOS OPCIONES DE MODO (Modo Manual | Modo IA) */}
          <div className="flex items-center p-1 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60">
            <button
              onClick={() => onSelectMode('manual')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentMode === 'manual'
                  ? 'bg-[#FE6B00] text-white shadow-md scale-102'
                  : 'text-indigo-900 dark:text-indigo-200 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Modo Manual</span>
            </button>

            <button
              onClick={() => onSelectMode('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentMode === 'ai'
                  ? 'bg-gradient-to-r from-[#00236F] to-[#1E3A8A] text-white shadow-md scale-102'
                  : 'text-indigo-900 dark:text-indigo-200 hover:text-[#00236F] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>Modo IA</span>
            </button>
          </div>

          {/* 3. ACCIONES DE GESTIÓN Y PERSISTENCIA */}
          <div className="flex items-center gap-2">
            {/* Deshacer / Rehacer */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 border border-gray-200 dark:border-gray-700">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Deshacer"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Rehacer"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Galería Interna */}
            <button
              onClick={onOpenGallery}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition"
              title="Abrir Galería de Creaciones"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Galería</span>
            </button>

            {/* Guardar en Galería Interna (Listo) */}
            <button
              onClick={onSaveToGallery}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Guardar en Galería Interna"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Listo</span>
            </button>

            {/* Exportación Externa (Descargar archivo en dispositivo) */}
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00236F] hover:bg-[#001b57] text-white shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Descargar en Almacenamiento Local"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Fila Inferior: Título editable del documento con indicador visual */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <span className="font-semibold text-gray-400">Proyecto:</span>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Nombre del documento o lámina..."
              className="bg-transparent font-bold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:bg-white dark:focus:bg-gray-900 focus:border-[#00236F] focus:outline-none transition w-full text-xs sm:text-sm truncate"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Sincronización Bidireccional Activa</span>
            <span className="uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono text-[10px]">
              {currentFormat}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
