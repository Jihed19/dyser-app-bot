import React, { useState, useRef } from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  Image as ImageIcon,
  Palette,
  Upload,
  Layers,
  MoreHorizontal,
  RefreshCw,
  Wand2,
  Check,
  MessageSquare,
  Copy,
  Clipboard,
  Plus,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sliders,
} from 'lucide-react';
import { StudioDocument, StudioFormat, StudioPage, VisualElement } from './StudioTypes';

interface StudioManualModeProps {
  document: StudioDocument;
  onUpdateDocument: (updated: StudioDocument) => void;
  onShowToast: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
  isTopBarCollapsed?: boolean;
}

export const StudioManualMode: React.FC<StudioManualModeProps> = ({
  document: doc,
  onUpdateDocument,
  onShowToast,
  isTopBarCollapsed = false,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPageSelected, setIsPageSelected] = useState(true);

  // Modales y Hojas Inferiores (Bottom Sheets estilo Canva)
  const [activeBottomSheet, setActiveBottomSheet] = useState<
    'more_page' | 'templates' | 'elements' | 'text' | 'color' | 'layers' | 'effects' | null
  >(null);

  // Buffer de portapapeles para copiar/pegar
  const [clipboardElement, setClipboardElement] = useState<VisualElement | null>(null);
  const [clipboardPage, setClipboardPage] = useState<StudioPage | null>(null);

  // Paleta de Colores Oficial de dyser y Canva
  const colorPalette = [
    '#00236F', // Azul dyser
    '#FE6B00', // Naranja dyser
    '#1E3A8A', // Azul marino profundo
    '#059669', // Esmeralda
    '#DC2626', // Rojo alerta
    '#7C3AED', // Violeta Canva
    '#475569', // Gris pizarra
    '#0F172A', // Negro suave
    '#FFFFFF', // Blanco
    '#F8FAFC', // Blanco crema
    '#EFF6FF', // Azul claro
    '#FFF7ED', // Naranja claro
  ];

  const activePage: StudioPage = doc.pages[currentPageIndex] || doc.pages[0];
  const selectedElement = activePage?.elements.find((el) => el.id === selectedElementId);

  // Helper para actualizar la página activa
  const updateActivePage = (updater: (page: StudioPage) => StudioPage) => {
    const updatedPages = [...doc.pages];
    updatedPages[currentPageIndex] = updater(updatedPages[currentPageIndex]);
    onUpdateDocument({
      ...doc,
      updatedAt: Date.now(),
      pages: updatedPages,
    });
  };

  // Helper para actualizar un elemento específico
  const updateElement = (elementId: string, updates: Partial<VisualElement>) => {
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
    }));
  };

  // Agregar elemento
  const handleAddElement = (type: VisualElement['type'], content: string) => {
    const newId = `el-${Date.now()}`;
    const newEl: VisualElement = {
      id: newId,
      type,
      content,
      x: 10,
      y: 20 + (activePage.elements.length * 10) % 60,
      fontSize: type === 'heading' ? 22 : type === 'subheading' ? 16 : 13,
      fontWeight: type === 'heading' || type === 'badge' ? 'bold' : 'normal',
      color: type === 'heading' ? '#00236F' : type === 'badge' ? '#FE6B00' : '#1E293B',
      backgroundColor: type === 'badge' ? '#FFF5EB' : type === 'box' ? '#EFF6FF' : 'transparent',
      borderColor: type === 'badge' ? '#FE6B00' : type === 'box' ? '#93C5FD' : undefined,
      borderWidth: type === 'badge' || type === 'box' ? 1 : 0,
      borderRadius: type === 'badge' ? 999 : type === 'box' ? 10 : 0,
      textAlign: 'left',
      zIndex: activePage.elements.length + 1,
    };

    updateActivePage((page) => ({
      ...page,
      elements: [...page.elements, newEl],
    }));

    setSelectedElementId(newId);
    setIsPageSelected(false);
    setActiveBottomSheet(null);
    onShowToast({
      title: 'Elemento añadido',
      message: 'Se ha insertado en el lienzo de trabajo.',
      type: 'success',
    });
  };

  // Eliminar elemento seleccionado
  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.filter((el) => el.id !== selectedElementId),
    }));
    setSelectedElementId(null);
    setIsPageSelected(true);
  };

  // Duplicar elemento seleccionado
  const handleDuplicateSelectedElement = () => {
    if (!selectedElement) return;
    const duplicated: VisualElement = {
      ...selectedElement,
      id: `el-${Date.now()}`,
      y: Math.min(85, selectedElement.y + 6),
      zIndex: activePage.elements.length + 1,
    };
    updateActivePage((page) => ({
      ...page,
      elements: [...page.elements, duplicated],
    }));
    setSelectedElementId(duplicated.id);
  };

  // Copiar elemento
  const handleCopyElement = () => {
    if (selectedElement) {
      setClipboardElement(selectedElement);
      onShowToast({ title: 'Elemento copiado', message: 'Listo para pegar en cualquier página.', type: 'info' });
    }
  };

  // Pegar elemento
  const handlePasteElement = () => {
    if (clipboardElement) {
      const pasted: VisualElement = {
        ...clipboardElement,
        id: `el-${Date.now()}`,
        y: Math.min(85, clipboardElement.y + 5),
      };
      updateActivePage((page) => ({
        ...page,
        elements: [...page.elements, pasted],
      }));
      setSelectedElementId(pasted.id);
    }
  };

  // Acciones de Página
  const handleAddPage = () => {
    const newPage: StudioPage = {
      id: `page-${Date.now()}`,
      pageNumber: doc.pages.length + 1,
      title: `Página ${doc.pages.length + 1}`,
      backgroundColor: '#FFFFFF',
      elements: [
        {
          id: `el-${Date.now()}-h`,
          type: 'heading',
          content: `Sección ${doc.pages.length + 1}`,
          x: 10,
          y: 15,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#00236F',
          zIndex: 1,
        },
      ],
    };

    onUpdateDocument({
      ...doc,
      pages: [...doc.pages, newPage],
    });
    setCurrentPageIndex(doc.pages.length);
    setActiveBottomSheet(null);
    onShowToast({ title: 'Nueva página añadida', message: 'Página lista para diseñar.', type: 'success' });
  };

  const handleDuplicatePage = () => {
    const duplicated: StudioPage = {
      ...activePage,
      id: `page-${Date.now()}`,
      pageNumber: doc.pages.length + 1,
      title: `${activePage.title} (Copia)`,
      elements: activePage.elements.map((el) => ({ ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };

    onUpdateDocument({
      ...doc,
      pages: [...doc.pages, duplicated],
    });
    setCurrentPageIndex(doc.pages.length);
    setActiveBottomSheet(null);
    onShowToast({ title: 'Página duplicada', message: 'Copia exacta creada.', type: 'info' });
  };

  const handleDeletePage = () => {
    if (doc.pages.length <= 1) {
      onShowToast({ title: 'No se puede eliminar', message: 'El documento debe tener al menos una página.', type: 'warning' });
      return;
    }

    const filtered = doc.pages.filter((_, idx) => idx !== currentPageIndex);
    onUpdateDocument({
      ...doc,
      pages: filtered,
    });
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    setActiveBottomSheet(null);
    onShowToast({ title: 'Página eliminada', message: 'Página retirada del documento.', type: 'info' });
  };

  return (
    <div className={`flex flex-col ${
      isTopBarCollapsed
        ? 'h-[calc(100vh-115px)] min-h-[700px]'
        : 'h-[calc(100vh-175px)] min-h-[640px]'
    } bg-[#f0f2f5] dark:bg-[#070b14] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden select-none transition-all duration-300`}>
      {/* =========================================================
          ZONA CENTRAL DEL LIENZO DE TRABAJO (CANVA WORKSPACE)
          ========================================================= */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative cursor-default"
        onClick={() => {
          setSelectedElementId(null);
          setIsPageSelected(true);
        }}
      >
        {/* LIENZO DE LA PÁGINA (PAPEL BLANCO O COLOR SELECCIONADO) */}
        <div
          id="canva-main-canvas"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedElementId(null);
            setIsPageSelected(true);
          }}
          style={{ backgroundColor: activePage.backgroundColor || '#FFFFFF' }}
          className={`w-full max-w-xl transition-all relative rounded-2xl shadow-xl overflow-hidden ${
            doc.format === 'pdf'
              ? 'aspect-[1/1.414] p-6 sm:p-10' // A4
              : doc.format === 'slides'
              ? 'aspect-[16/9] p-5 sm:p-8' // 16:9 Slide
              : 'aspect-square sm:aspect-[4/3] p-6 sm:p-8' // Infografía
          } ${
            isPageSelected && !selectedElementId
              ? 'ring-3 ring-[#8B5CF6] shadow-2xl' // BORDE VIOLETA TIPO CANVA (PANTALLA 3 Y 4)
              : 'ring-1 ring-gray-300 dark:ring-gray-700'
          }`}
        >
          {/* PÍLDORA FLOTANTE SUPERIOR CUANDO LA PÁGINA ESTÁ SELECCIONADA [ 💬 ... ] */}
          {isPageSelected && !selectedElementId && (
            <div className="absolute top-2.5 right-3 z-30 flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-gray-200/70 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBottomSheet('more_page');
                }}
                className="hover:text-[#8B5CF6] transition flex items-center gap-1"
                title="Comentarios y Opciones"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <MoreHorizontal className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          )}

          {/* Encabezado Editorial sutil */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00236F]">
              {doc.title.slice(0, 30)}
            </span>
            <span className="text-[9px] font-mono text-gray-400">
              Pág. {currentPageIndex + 1}/{doc.pages.length}
            </span>
          </div>

          {/* ELEMENTOS VISUALES DENTRO DEL LIENZO */}
          <div className="space-y-3 relative h-full">
            {activePage.elements.map((el) => {
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                    setIsPageSelected(false);
                  }}
                  className={`relative p-2 rounded-xl transition cursor-pointer group ${
                    isSelected
                      ? 'ring-2 ring-[#8B5CF6] bg-purple-50/40 dark:bg-purple-900/20' // Recuadro morado de selección de Canva
                      : 'hover:ring-1 hover:ring-gray-300'
                  }`}
                >
                  {/* PÍLDORA FLOTANTE CUANDO EL ELEMENTO ESTÁ SELECCIONADO [ 💬 ... ] */}
                  {isSelected && (
                    <div className="absolute -top-7 right-0 z-30 flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full shadow-lg border border-purple-300 dark:border-purple-800 text-xs text-gray-600 dark:text-gray-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyElement();
                        }}
                        title="Copiar elemento"
                        className="p-1 hover:text-[#8B5CF6]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSelectedElement();
                        }}
                        title="Duplicar elemento"
                        className="p-1 hover:text-[#8B5CF6]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelectedElement();
                        }}
                        title="Eliminar elemento"
                        className="p-1 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}

                  {/* Renderizado del contenido editable */}
                  {el.type === 'badge' && (
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#FE6B00] border border-[#FE6B00]/40 outline-none"
                    >
                      {el.content}
                    </span>
                  )}

                  {el.type === 'heading' && (
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      style={{ color: el.color || '#00236F' }}
                      className="text-lg sm:text-xl font-black tracking-tight outline-none focus:bg-white/70 rounded"
                    >
                      {el.content}
                    </h2>
                  )}

                  {el.type === 'subheading' && (
                    <h3
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      style={{ color: el.color || '#475569' }}
                      className="text-xs sm:text-sm font-bold outline-none focus:bg-white/70 rounded"
                    >
                      {el.content}
                    </h3>
                  )}

                  {el.type === 'formula' && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs sm:text-sm text-gray-900 font-bold outline-none text-center shadow-inner"
                    >
                      {el.content}
                    </div>
                  )}

                  {el.type === 'box' && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      style={{
                        backgroundColor: el.backgroundColor || '#EFF6FF',
                        borderColor: el.borderColor || '#93C5FD',
                        color: el.color || '#00236F',
                      }}
                      className="p-3 rounded-xl border text-xs sm:text-sm font-bold text-center outline-none shadow-2xs"
                    >
                      {el.content}
                    </div>
                  )}

                  {el.type === 'text' && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                      style={{ color: el.color || '#334155' }}
                      className="text-xs sm:text-sm leading-relaxed whitespace-pre-line outline-none focus:bg-white/70 rounded p-1"
                    >
                      {el.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          INDICADOR DE PÁGINAS INFERIOR ESTILO CANVA ( • • • )
          ========================================================= */}
      <div className="py-2 flex items-center justify-center gap-2 bg-transparent z-20">
        <button
          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentPageIndex === 0}
          className="p-1 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {doc.pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPageIndex(idx)}
              className={`transition-all ${
                idx === currentPageIndex
                  ? 'w-6 h-2 rounded-full bg-[#8B5CF6]' // Pill activo estilo Canva
                  : 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentPageIndex((prev) => Math.min(doc.pages.length - 1, prev + 1))}
          disabled={currentPageIndex === doc.pages.length - 1}
          className="p-1 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================
          BARRA DE HERRAMIENTAS INFERIOR ESTILO CANVA (SCROLL HORIZONTAL)
          ========================================================= */}
      <div className="w-full bg-white dark:bg-[#0c1222] border-t border-gray-200 dark:border-gray-800 px-3 py-2 z-30 shadow-lg">
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 text-xs">
          {/* ESTADO A: SI HAY UN ELEMENTO SELECCIONADO (PANTALLA 3 Y 4) */}
          {selectedElementId ? (
            <>
              {/* Reemplazar */}
              <button
                onClick={() => setActiveBottomSheet('text')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold">Reemplazar</span>
              </button>

              {/* Efectos / Herramientas */}
              <button
                onClick={() => setActiveBottomSheet('effects')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-[10px] font-semibold">Efectos</span>
              </button>

              {/* Color con círculo cromático arcoíris */}
              <button
                onClick={() => setActiveBottomSheet('color')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 via-green-400 to-blue-500 p-0.5 flex items-center justify-center shadow-xs">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <Palette className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold">Color</span>
              </button>

              {/* Capas */}
              <button
                onClick={() => setActiveBottomSheet('layers')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-[10px] font-semibold">Capas</span>
              </button>

              {/* Más Opciones */}
              <button
                onClick={() => setActiveBottomSheet('more_page')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold">Más</span>
              </button>

              {/* Botón "Listo" (Checkmark circular de confirmación de Canva) */}
              <button
                onClick={() => {
                  setSelectedElementId(null);
                  setIsPageSelected(true);
                  onShowToast({ title: 'Ajuste fijado', message: 'Elemento guardado en el lienzo.', type: 'info' });
                }}
                className="flex flex-col items-center gap-1 min-w-[56px] text-[#059669] hover:text-[#047857] transition ml-2"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shadow-xs border border-emerald-300 dark:border-emerald-800">
                  <Check className="w-5 h-5 font-black" />
                </div>
                <span className="text-[10px] font-bold">Listo</span>
              </button>
            </>
          ) : (
            /* ESTADO B: MODO GENERAL (PANTALLA 1 Y 2 DE REFERENCIA CANVA) */
            <>
              {/* Plantillas */}
              <button
                onClick={() => setActiveBottomSheet('templates')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <LayoutTemplate className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-semibold">Plantillas</span>
              </button>

              {/* Elementos */}
              <button
                onClick={() => setActiveBottomSheet('elements')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Shapes className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[10px] font-semibold">Elementos</span>
              </button>

              {/* Texto */}
              <button
                onClick={() => setActiveBottomSheet('text')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Type className="w-4 h-4 text-[#00236F] dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-semibold">Texto</span>
              </button>

              {/* Color de Fondo */}
              <button
                onClick={() => setActiveBottomSheet('color')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 to-blue-500 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <Palette className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold">Fondo</span>
              </button>

              {/* Capas */}
              <button
                onClick={() => setActiveBottomSheet('layers')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-[10px] font-semibold">Capas</span>
              </button>

              {/* Más Opciones de Página */}
              <button
                onClick={() => setActiveBottomSheet('more_page')}
                className="flex flex-col items-center gap-1 min-w-[56px] text-gray-700 dark:text-gray-300 hover:text-[#8B5CF6] transition"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold">Más</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          HOJA INFERIOR MODAL ESTILO CANVA (BOTTOM SHEET - PANTALLAS 5 Y 6)
          ========================================================= */}
      {activeBottomSheet && (
        <div
          onClick={() => setActiveBottomSheet(null)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-t-3xl border-t border-gray-200 dark:border-gray-700 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Pill de arrastre superior */}
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto" />

            {/* Cabecera del Bottom Sheet */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                {activeBottomSheet === 'more_page' && 'Opciones de Página y Fondo'}
                {activeBottomSheet === 'templates' && 'Plantillas Académicas'}
                {activeBottomSheet === 'elements' && 'Insertar Elementos Visuales'}
                {activeBottomSheet === 'text' && 'Añadir Tipografía'}
                {activeBottomSheet === 'color' && 'Paleta de Color y Fondo'}
                {activeBottomSheet === 'layers' && 'Organización de Capas'}
                {activeBottomSheet === 'effects' && 'Herramientas y Estilos de Texto'}
              </h3>
              <button
                onClick={() => setActiveBottomSheet(null)}
                className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO ESPECÍFICO SEGÚN EL SHEET ABIERTO */}

            {/* 1. MÁS / OPCIONES DE PÁGINA (PANTALLA 5 Y 6 DE CANVA) */}
            {activeBottomSheet === 'more_page' && (
              <div className="space-y-3">
                {/* Fila de Accesos Rápidos: Copiar y Pegar */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (selectedElement) {
                        handleCopyElement();
                      } else {
                        setClipboardPage(activePage);
                        onShowToast({ title: 'Página copiada', message: 'Lista para duplicar.', type: 'info' });
                      }
                      setActiveBottomSheet(null);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold transition"
                  >
                    <Copy className="w-4 h-4 text-blue-500" />
                    <span>Copiar</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePasteElement();
                      setActiveBottomSheet(null);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold transition"
                  >
                    <Clipboard className="w-4 h-4 text-orange-500" />
                    <span>Pegar</span>
                  </button>
                </div>

                {/* Lista de Acciones Idéntica a Canva */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <button
                    onClick={handleAddPage}
                    className="w-full py-3 flex items-center gap-3 hover:text-[#00236F] dark:hover:text-white transition"
                  >
                    <Plus className="w-4 h-4 text-[#00236F]" />
                    <span>Agregar una página</span>
                  </button>

                  <button
                    onClick={handleDuplicatePage}
                    className="w-full py-3 flex items-center gap-3 hover:text-[#00236F] dark:hover:text-white transition"
                  >
                    <Copy className="w-4 h-4 text-purple-500" />
                    <span>Duplicar la página</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveBottomSheet('color');
                    }}
                    className="w-full py-3 flex items-center gap-3 hover:text-[#00236F] dark:hover:text-white transition"
                  >
                    <Palette className="w-4 h-4 text-pink-500" />
                    <span>Copiar el estilo de la página</span>
                  </button>

                  <button
                    onClick={handleDeletePage}
                    className="w-full py-3 flex items-center gap-3 text-red-500 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Eliminar la página</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveBottomSheet(null);
                      onShowToast({ title: 'Comentario agregado', message: 'Nota anclada en el margen del documento.', type: 'info' });
                    }}
                    className="w-full py-3 flex items-center gap-3 hover:text-[#00236F] dark:hover:text-white transition"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Comentar o añadir apuntes</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. TEXTO: AÑADIR ENCABEZADOS Y FÓRMULAS */}
            {activeBottomSheet === 'text' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Selecciona el tipo de texto que deseas agregar:</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleAddElement('heading', 'Nuevo Título Principal')}
                    className="p-3 text-left rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 text-lg font-black text-[#00236F] dark:text-blue-300 transition"
                  >
                    Agregar un título
                  </button>

                  <button
                    onClick={() => handleAddElement('subheading', 'Subtítulo descriptivo de sección')}
                    className="p-3 text-left rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 text-sm font-bold text-gray-700 dark:text-gray-300 transition"
                  >
                    Agregar un subtítulo
                  </button>

                  <button
                    onClick={() => handleAddElement('text', 'Párrafo de texto con desarrollo académico y rigor conceptual.')}
                    className="p-3 text-left rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 text-xs text-gray-600 dark:text-gray-400 transition"
                  >
                    Agregar un poco de texto
                  </button>

                  <button
                    onClick={() => handleAddElement('formula', 'f(x) = ∫ e^(-t^2) dt + C (Ecuación formal)')}
                    className="p-3 text-left rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 font-mono text-xs font-bold text-[#FE6B00] transition"
                  >
                    + Insertar fórmula matemática
                  </button>
                </div>
              </div>
            )}

            {/* 3. ELEMENTOS: FIGURAS, BADGES Y CUADROS */}
            {activeBottomSheet === 'elements' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => handleAddElement('badge', 'dyser Academic Edition')}
                    className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FE6B00] border border-orange-200 text-center font-bold"
                  >
                    🏷️ Insignia / Badge
                  </button>
                  <button
                    onClick={() => handleAddElement('box', 'Bloque Conceptual o Tarjeta de Datos')}
                    className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#00236F] dark:text-blue-300 border border-blue-200 text-center font-bold"
                  >
                    📦 Caja de Concepto
                  </button>
                  <button
                    onClick={() => handleAddElement('text', '• Punto 1 de análisis\n• Punto 2 de desarrollo')}
                    className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-center font-bold"
                  >
                    📝 Lista de Viñetas
                  </button>
                  <button
                    onClick={() => handleAddElement('badge', '⚠️ Alerta de Examen Crítica')}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 text-center font-bold"
                  >
                    ⚠️ Alerta de Examen
                  </button>
                </div>
              </div>
            )}

            {/* 4. PALETA DE COLOR (PARA FONDO O ELEMENTO SELECCIONADO) */}
            {activeBottomSheet === 'color' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {selectedElementId ? 'Color del elemento seleccionado:' : 'Color de fondo de la página:'}
                </p>
                <div className="grid grid-cols-6 gap-3">
                  {colorPalette.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedElementId) {
                          updateElement(selectedElementId, { color: col });
                        } else {
                          updateActivePage((page) => ({ ...page, backgroundColor: col }));
                        }
                        setActiveBottomSheet(null);
                      }}
                      style={{ backgroundColor: col }}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-xs hover:scale-110 transition active:scale-95 mx-auto"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 5. CAPAS Y ORDEN */}
            {activeBottomSheet === 'layers' && (
              <div className="space-y-2 text-xs font-semibold">
                <button
                  onClick={() => {
                    if (selectedElementId) {
                      updateElement(selectedElementId, { zIndex: (selectedElement?.zIndex || 1) + 2 });
                    }
                    setActiveBottomSheet(null);
                  }}
                  className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-between"
                >
                  <span>Traer al frente</span>
                  <MoveUp className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={() => {
                    if (selectedElementId) {
                      updateElement(selectedElementId, { zIndex: Math.max(1, (selectedElement?.zIndex || 1) - 2) });
                    }
                    setActiveBottomSheet(null);
                  }}
                  className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-between"
                >
                  <span>Enviar al fondo</span>
                  <MoveDown className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            )}

            {/* 6. EFECTOS Y ALINEACIÓN DE TEXTO */}
            {activeBottomSheet === 'effects' && selectedElement && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-around bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                    className={`p-2 rounded-lg ${selectedElement.textAlign === 'left' ? 'bg-white text-[#00236F] font-bold shadow-xs' : 'text-gray-500'}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                    className={`p-2 rounded-lg ${selectedElement.textAlign === 'center' ? 'bg-white text-[#00236F] font-bold shadow-xs' : 'text-gray-500'}`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                    className={`p-2 rounded-lg ${selectedElement.textAlign === 'right' ? 'bg-white text-[#00236F] font-bold shadow-xs' : 'text-gray-500'}`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Grosor de fuente</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateElement(selectedElement.id, { fontWeight: 'normal' })}
                      className="px-2.5 py-1 rounded bg-gray-200 dark:bg-gray-700 font-normal"
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement.id, { fontWeight: 'bold' })}
                      className="px-2.5 py-1 rounded bg-gray-200 dark:bg-gray-700 font-bold"
                    >
                      Negrita
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
