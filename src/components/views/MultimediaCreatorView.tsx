import React, { useState, useEffect, useRef } from 'react';
import { StudioTopBar } from '../studio/StudioTopBar';
import { StudioAiMode } from '../studio/StudioAiMode';
import { StudioManualMode } from '../studio/StudioManualMode';
import { StudioGalleryModal } from '../studio/StudioGalleryModal';
import { StudioDocument, StudioFormat, StudioMode } from '../studio/StudioTypes';
import { createDefaultDocument } from '../studio/studioInitialData';
import { saveToInternalGallery, executeExport } from '../../utils/studioExport';

interface MultimediaCreatorViewProps {
  initialTopic?: string;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

export const MultimediaCreatorView: React.FC<MultimediaCreatorViewProps> = ({
  initialTopic,
  onShowToast,
}) => {
  // 1. Estados Principales de Formato y Modo
  const [currentFormat, setCurrentFormat] = useState<StudioFormat>('slides');
  const [currentMode, setCurrentMode] = useState<StudioMode>('ai');

  // 2. Estado Único Central del Documento (Sincronización Bidireccional Total)
  const [currentDoc, setCurrentDoc] = useState<StudioDocument>(() =>
    createDefaultDocument('slides', initialTopic)
  );

  // 3. Historial de Deshacer / Rehacer
  const [history, setHistory] = useState<StudioDocument[]>([currentDoc]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 4. Modal de Galería Interna
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Toast interno de respaldo si no viene por props
  const [localToast, setLocalToast] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const showToast = (toast: {
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'error' | 'info';
  }) => {
    if (onShowToast) {
      onShowToast(toast);
    } else {
      setLocalToast(toast);
      setTimeout(() => setLocalToast(null), 4000);
    }
  };

  // Detección de tema transferido desde Nasser AI Chat o Estudio de Exposición
  useEffect(() => {
    try {
      const storedDocRaw = sessionStorage.getItem('dyser_multimedia_doc');
      if (storedDocRaw) {
        sessionStorage.removeItem('dyser_multimedia_doc');
        const customDoc = JSON.parse(storedDocRaw);
        if (customDoc && customDoc.slides) {
          setCurrentFormat('slides');
          setCurrentDoc(customDoc);
          setHistory([customDoc]);
          setHistoryIndex(0);
          showToast({
            title: 'Lámina Mental Cargada en Studio 🎨',
            message: `Generada automáticamente desde tu exposición: "${customDoc.title}"`,
            type: 'success',
          });
          return;
        }
      }

      const storedTopic = sessionStorage.getItem('dyser_multimedia_topic');
      if (storedTopic) {
        sessionStorage.removeItem('dyser_multimedia_topic');
        const newDoc = createDefaultDocument(currentFormat, storedTopic);
        setCurrentDoc(newDoc);
        setHistory([newDoc]);
        setHistoryIndex(0);
        showToast({
          title: 'Tema transferido',
          message: `Nasser AI preparó el lienzo para: "${storedTopic}"`,
          type: 'success',
        });
      }
    } catch (e) {
      console.warn('Error reading stored multimedia document or topic', e);
    }
  }, [currentFormat]);

  // Manejo de actualización del documento con historial
  const handleUpdateDocument = (updated: StudioDocument) => {
    setCurrentDoc(updated);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    if (newHistory.length > 25) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentDoc(history[prevIndex]);
      showToast({ title: 'Deshecho', message: 'Cambio revertido.', type: 'info' });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentDoc(history[nextIndex]);
      showToast({ title: 'Rehecho', message: 'Cambio restaurado.', type: 'info' });
    }
  };

  // Cambio de Formato (PDF | Diapositivas | Imágenes)
  const handleSelectFormat = (format: StudioFormat) => {
    if (format === currentFormat) return;
    setCurrentFormat(format);
    // Preservar el título si es posible al adaptar al nuevo formato
    const newDoc = createDefaultDocument(format, currentDoc.title);
    newDoc.format = format;
    handleUpdateDocument(newDoc);
    showToast({
      title: `Formato: ${format.toUpperCase()}`,
      message: `Lienzo adaptado para ${format === 'pdf' ? 'documento académico' : format === 'slides' ? 'presentación' : 'infografía e imagen'}.`,
      type: 'info',
    });
  };

  // Cambio de Modo (Modo Manual | Modo IA) con sincronización bidireccional garantizada
  const handleSelectMode = (mode: StudioMode) => {
    if (mode === currentMode) return;
    setCurrentMode(mode);
    showToast({
      title: mode === 'manual' ? '🎨 Modo Manual Activo' : '✨ Modo IA Activo',
      message:
        mode === 'manual'
          ? 'Todo el contenido de la IA se ha transferido al editor visual tipo Canva.'
          : 'Interactúa con Nasser AI mediante prompting en tiempo real.',
      type: 'success',
    });
  };

  // Guardado en Galería Interna ("Listo")
  const handleSaveToGallery = async () => {
    setIsSaving(true);
    try {
      saveToInternalGallery(currentDoc);
      showToast({
        title: '¡Guardado con éxito! 🎉',
        message: 'Tu proyecto se almacenó en la galería interna de Nasser AI Studio.',
        type: 'success',
      });
    } catch (e: any) {
      showToast({
        title: 'Error al guardar',
        message: e?.message || 'No se pudo almacenar en la galería.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Exportación Externa al Almacenamiento Local (Google Files / Descargas)
  const handleExport = async () => {
    setIsExporting(true);
    showToast({
      title: 'Generando archivo...',
      message: `Compilando ${currentFormat.toUpperCase()} para tu dispositivo.`,
      type: 'info',
    });

    try {
      const canvasId =
        currentMode === 'manual' ? 'canva-main-canvas' : 'studio-live-preview-canvas';
      const result = await executeExport(currentDoc, canvasId);
      showToast({
        title: result.success ? 'Exportación completada 📥' : 'Aviso',
        message: result.message,
        type: result.success ? 'success' : 'warning',
      });
    } catch (e: any) {
      showToast({
        title: 'Error en la exportación',
        message: e?.message || 'Fallo al procesar el archivo.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 font-sans select-none">
      {/* 1. BARRA SUPERIOR CON SELECTORES Y ACCIONES */}
      <StudioTopBar
        currentFormat={currentFormat}
        onSelectFormat={handleSelectFormat}
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        docTitle={currentDoc.title}
        onChangeTitle={(newTitle) => handleUpdateDocument({ ...currentDoc, title: newTitle })}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onSaveToGallery={handleSaveToGallery}
        onExport={handleExport}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isSaving={isSaving}
        isExporting={isExporting}
      />

      {/* 2. ÁREA DE TRABAJO PRINCIPAL SEGÚN EL MODO SELECCIONADO */}
      <div className="w-full">
        {currentMode === 'ai' ? (
          <StudioAiMode
            document={currentDoc}
            onUpdateDocument={handleUpdateDocument}
            onSwitchToManual={() => handleSelectMode('manual')}
            onShowToast={showToast}
          />
        ) : (
          <StudioManualMode
            document={currentDoc}
            onUpdateDocument={handleUpdateDocument}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* 3. MODAL DE GALERÍA INTERNA */}
      <StudioGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoadDocument={(loadedDoc) => {
          setCurrentDoc(loadedDoc);
          setCurrentFormat(loadedDoc.format);
          setHistory([loadedDoc]);
          setHistoryIndex(0);
        }}
        onShowToast={showToast}
      />

      {/* Toast Notifier Flotante si es llamado internamente */}
      {localToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold text-white flex items-center gap-2 ${
              localToast.type === 'error'
                ? 'bg-red-600 border-red-500'
                : localToast.type === 'warning'
                ? 'bg-amber-600 border-amber-500'
                : localToast.type === 'info'
                ? 'bg-[#00236F] border-blue-500'
                : 'bg-emerald-600 border-emerald-500'
            }`}
          >
            <div>
              <p className="text-sm font-black">{localToast.title}</p>
              <p className="text-xs font-normal opacity-90">{localToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
