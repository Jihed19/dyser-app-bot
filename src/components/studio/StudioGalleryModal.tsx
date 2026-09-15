import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  X,
  FileText,
  Layers,
  Image as ImageIcon,
  Trash2,
  Download,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StudioDocument, StudioFormat, StudioGalleryItem } from './StudioTypes';
import { getInternalGallery, deleteFromInternalGallery, executeExport } from '../../utils/studioExport';

interface StudioGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (doc: StudioDocument) => void;
  onShowToast: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

export const StudioGalleryModal: React.FC<StudioGalleryModalProps> = ({
  isOpen,
  onClose,
  onLoadDocument,
  onShowToast,
}) => {
  const [items, setItems] = useState<StudioGalleryItem[]>([]);
  const [filterFormat, setFilterFormat] = useState<'all' | StudioFormat>('all');

  useEffect(() => {
    if (isOpen) {
      setItems(getInternalGallery());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter((it) => (filterFormat === 'all' ? true : it.format === filterFormat));

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromInternalGallery(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    onShowToast({
      title: 'Eliminado',
      message: 'Proyecto retirado de la galería interna.',
      type: 'info',
    });
  };

  const handleExportItem = async (item: StudioGalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await executeExport(item.documentData);
    onShowToast({
      title: res.success ? 'Exportación exitosa' : 'Aviso',
      message: res.message,
      type: res.success ? 'success' : 'warning',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00236F] to-[#FE6B00] flex items-center justify-center text-white shadow-xs">
              <FolderArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Galería Interna de Nasser AI Studio
              </h2>
              <p className="text-xs text-gray-500">
                Tus creaciones guardadas localmente en dyser Academic OS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterFormat('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterFormat === 'all'
                ? 'bg-[#00236F] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFilterFormat('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              filterFormat === 'pdf'
                ? 'bg-[#00236F] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            PDFs ({items.filter((i) => i.format === 'pdf').length})
          </button>
          <button
            onClick={() => setFilterFormat('slides')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              filterFormat === 'slides'
                ? 'bg-[#00236F] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            Diapositivas ({items.filter((i) => i.format === 'slides').length})
          </button>
          <button
            onClick={() => setFilterFormat('images')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              filterFormat === 'images'
                ? 'bg-[#00236F] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
            Imágenes ({items.filter((i) => i.format === 'images').length})
          </button>
        </div>

        {/* Lista de Proyectos Guardados */}
        <div className="p-5 flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                No hay proyectos en esta categoría
              </h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Crea o modifica un documento en Modo IA o Modo Manual y presiona "Listo" para guardarlo aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onLoadDocument(item.documentData);
                    onClose();
                    onShowToast({
                      title: 'Proyecto cargado',
                      message: `"${item.title}" abierto en el editor.`,
                      type: 'success',
                    });
                  }}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 hover:border-[#00236F] dark:hover:border-[#FE6B00] transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-[#00236F] dark:text-blue-300">
                        {item.format === 'pdf' && <FileText className="w-3 h-3" />}
                        {item.format === 'slides' && <Layers className="w-3 h-3" />}
                        {item.format === 'images' && <ImageIcon className="w-3 h-3" />}
                        {item.format}
                      </span>

                      <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updatedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#00236F] dark:group-hover:text-orange-400 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.pagesCount} {item.pagesCount === 1 ? 'página' : 'páginas'} • Guardado local
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleExportItem(item, e)}
                        title="Exportar archivo"
                        className="p-1.5 rounded-lg bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Eliminar de la galería"
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-[#00236F] dark:text-blue-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Abrir <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                    </span>
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
