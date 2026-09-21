import React from 'react';
import {
  X,
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
  Sun,
  Moon,
} from 'lucide-react';
import { StudioFormat, StudioMode } from './StudioTypes';
import { DyserLogo } from '../Header';
import { useTheme } from '../../context/ThemeContext';

interface StudioControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

export const StudioControlDrawer: React.FC<StudioControlDrawerProps> = ({
  isOpen,
  onClose,
  currentFormat,
  onSelectFormat,
  currentMode,
  onSelectMode,
  docTitle,
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
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const handleSelectFormatAndClose = (format: StudioFormat) => {
    onSelectFormat(format);
    onClose();
  };

  const handleSelectModeAndClose = (mode: StudioMode) => {
    onSelectMode(mode);
    onClose();
  };

  const handleActionAndClose = (action: () => void) => {
    action();
    onClose();
  };

  const formatSections = [
    {
      title: 'Formato de Documento',
      items: [
        {
          id: 'pdf',
          label: 'Documento PDF Vectorial',
          icon: FileText,
          badge: 'A4 Vector',
          badgeColor: 'bg-[#fe6b00] text-white',
          isActive: currentFormat === 'pdf',
          onClick: () => handleSelectFormatAndClose('pdf'),
        },
        {
          id: 'slides',
          label: 'Presentación de Diapositivas',
          icon: Layers,
          badge: '16:9 HD',
          badgeColor: 'bg-orange-500 text-white',
          isActive: currentFormat === 'slides',
          onClick: () => handleSelectFormatAndClose('slides'),
        },
        {
          id: 'images',
          label: 'Infografías & Póster',
          icon: ImageIcon,
          badge: 'Redes & Print',
          badgeColor: 'bg-blue-600 text-white',
          isActive: currentFormat === 'images',
          onClick: () => handleSelectFormatAndClose('images'),
        },
      ],
    },
    {
      title: 'Modos de Trabajo',
      items: [
        {
          id: 'ai',
          label: 'Modo IA Copilot (Nasser IA)',
          icon: Sparkles,
          badge: 'Inteligente',
          badgeColor: 'bg-gradient-to-r from-[#00236f] to-[#fe6b00] text-white',
          isActive: currentMode === 'ai',
          onClick: () => handleSelectModeAndClose('ai'),
        },
        {
          id: 'manual',
          label: 'Modo Manual (Canva Editor)',
          icon: Edit3,
          badge: 'Lienzo Pro',
          badgeColor: 'bg-orange-100 text-[#fe6b00] dark:bg-orange-950 dark:text-orange-300',
          isActive: currentMode === 'manual',
          onClick: () => handleSelectModeAndClose('manual'),
        },
      ],
    },
    {
      title: 'Gestión & Acciones',
      items: [
        {
          id: 'save',
          label: isSaving ? 'Guardando en galería...' : 'Guardar en Galería (Listo)',
          icon: CheckCircle2,
          badge: 'Guardar',
          badgeColor: 'bg-emerald-600 text-white',
          isActive: false,
          onClick: () => handleActionAndClose(onSaveToGallery),
        },
        {
          id: 'export',
          label: isExporting ? 'Procesando descarga...' : 'Exportar Archivo',
          icon: Download,
          badge: 'Descargar',
          badgeColor: 'bg-[#00236f] text-white',
          isActive: false,
          onClick: () => handleActionAndClose(onExport),
        },
        {
          id: 'gallery',
          label: 'Galería de Mis Creaciones',
          icon: FolderArchive,
          badge: 'Biblioteca',
          badgeColor: 'bg-blue-100 text-[#00236f] dark:bg-blue-950 dark:text-blue-300',
          isActive: false,
          onClick: () => handleActionAndClose(onOpenGallery),
        },
      ],
    },
    {
      title: 'Historial de Cambios',
      items: [
        {
          id: 'undo',
          label: 'Deshacer último cambio',
          icon: RotateCcw,
          badge: canUndo ? 'Disponible' : 'Sin cambios',
          badgeColor: canUndo ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'opacity-40',
          isActive: false,
          disabled: !canUndo,
          onClick: () => onUndo && onUndo(),
        },
        {
          id: 'redo',
          label: 'Rehacer cambio',
          icon: RotateCw,
          badge: canRedo ? 'Disponible' : 'Sin cambios',
          badgeColor: canRedo ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'opacity-40',
          isActive: false,
          disabled: !canRedo,
          onClick: () => onRedo && onRedo(),
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Fondo oscuro con difuminado suave idéntico a la referencia */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral desplegable con fondo oscuro sólido y bordes limpios */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#0e1320] border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200 select-none">
        
        {/* 1. Cabecera Limpia: Logotipo, título del estudio y botón de cierre con X arriba a la derecha */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DyserLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-[#00236f] dark:text-white">Nasser Studio</span>
                <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-[#fe6b00]/10 text-[#fe6b00] border border-[#fe6b00]/20">
                  AI PRO
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Google AI Studio • dyser
              </p>
            </div>
          </div>

          <button
            id="btn-close-studio-control-drawer"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Cerrar panel de control"
            title="Cerrar panel de control"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Tarjeta Resumen del Documento Activo */}
        <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00236f]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#00236f] dark:text-blue-400 font-black text-sm shrink-0 border border-[#00236f]/20">
            {currentFormat === 'pdf' ? (
              <FileText className="w-5 h-5 text-orange-400" />
            ) : currentFormat === 'slides' ? (
              <Layers className="w-5 h-5 text-orange-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-orange-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
              {docTitle || 'Proyecto sin título'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {currentFormat.toUpperCase()} • Modo {currentMode === 'ai' ? 'Nasser IA' : 'Manual Canva'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Menú Organizado en Secciones Categorizadas con Iconos Alineados a la Izquierda y Badges */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {formatSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 block">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#00236f] text-white shadow-xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 4. Pie del Panel con Alternador de Tema y Cierre Rápido */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0c101b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Tema {theme === 'light' ? 'Claro' : 'Oscuro'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition cursor-pointer"
              title="Alternar tema claro/oscuro"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#00236f]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
