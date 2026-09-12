import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Play,
  Layout,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCw,
  FileText,
  Network,
  Download,
  Printer,
  Bot,
} from 'lucide-react';
import { SlideDeck, SlideItem } from '../../types';
import { sampleSlideDecks } from '../../data/mockData';
import {
  nasserAIStudio,
  PDFDocumento,
  EsquemaConceptual,
} from '../../services/nasserEngines';

export const MultimediaCreatorView: React.FC = () => {
  // Studio Active Tab: Slides | PDFs | Diagrams
  const [studioSection, setStudioSection] = useState<'slides' | 'pdf' | 'diagrams'>('slides');

  // =================== 1. SLIDES STATE ===================
  const [slideMode, setSlideMode] = useState<'ai' | 'manual'>('ai');
  const [deck, setDeck] = useState<SlideDeck>(sampleSlideDecks[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlayingFullscreen, setIsPlayingFullscreen] = useState(false);
  const [slideTopic, setSlideTopic] = useState('Arquitectura de Microservicios y Balanceo de Carga');
  const [slideTemplate, setSlideTemplate] = useState('Academic Canva Pro');
  const [slideCount, setSlideCount] = useState(4);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  // Carga automática si el estudiante preparó diapositivas desde Nasser AI
  React.useEffect(() => {
    try {
      const storedTopic = sessionStorage.getItem('dyser_multimedia_topic');
      if (storedTopic) {
        sessionStorage.removeItem('dyser_multimedia_topic');
        setSlideTopic(storedTopic);
        setResearchNotice(`Tema de exposición transferido desde Nasser AI: "${storedTopic}"`);
      }
    } catch (e) {
      console.warn('Error al leer tema multimedia', e);
    }
  }, []);

  const currentSlide: SlideItem = deck.slides[currentSlideIndex] || deck.slides[0];

  const handleGenerateSlides = async () => {
    if (!slideTopic.trim()) return;
    setIsGeneratingSlides(true);

    // Call Nasser AI Studio Engine
    const studioOutput = nasserAIStudio.generarDiapositivas(slideTopic, slideCount);

    try {
      const res = await fetch('/api/ai/multimedia-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: slideTopic, templateType: slideTemplate, slideCount }),
      });
      const data = await res.json();
      if (data.slides && data.slides.length > 0) {
        setDeck({
          id: `deck-${Date.now()}`,
          deckTitle: data.deckTitle || slideTopic,
          author: 'Estudiante dyser',
          templateType: slideTemplate,
          themePalette: data.themePalette || {
            primary: '#00236F',
            accent: '#FE6B00',
            background: '#F7F9FB',
          },
          slides: data.slides,
        });
        setCurrentSlideIndex(0);
      }
    } catch (e) {
      console.error(e);
      // Fallback with Nasser AI Studio Engine
      const convertedSlides: SlideItem[] = studioOutput.presentacion.map(s => ({
        slideNumber: s.slideNum,
        layout: s.slideNum === 1 ? 'title' : 'split',
        heading: s.titulo,
        subheading: s.subtitulo || 'Guía Estructurada por Nasser AI Studio',
        bullets: s.viñetas,
      }));

      setDeck({
        id: `deck-${Date.now()}`,
        deckTitle: `Presentación: ${slideTopic}`,
        author: 'Nasser AI Studio v2.0',
        templateType: slideTemplate,
        themePalette: {
          primary: '#00236F',
          accent: '#FE6B00',
          background: '#F7F9FB',
        },
        slides: convertedSlides,
      });
      setCurrentSlideIndex(0);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      slideNumber: deck.slides.length + 1,
      layout: 'split',
      heading: 'Nueva Diapositiva',
      subheading: 'Escribe aquí tu subtítulo explicativo',
      bullets: ['Punto clave 1', 'Punto clave 2', 'Punto clave 3'],
    };
    setDeck(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setCurrentSlideIndex(deck.slides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (deck.slides.length <= 1) return;
    const newSlides = deck.slides.filter((_, i) => i !== index);
    setDeck(prev => ({ ...prev, slides: newSlides }));
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const handleUpdateCurrentSlide = (field: keyof SlideItem, value: any) => {
    setDeck(prev => {
      const updated = [...prev.slides];
      updated[currentSlideIndex] = {
        ...updated[currentSlideIndex],
        [field]: value,
      };
      return { ...prev, slides: updated };
    });
  };

  // =================== 2. PDF GENERATOR STATE ===================
  const [pdfMode, setPdfMode] = useState<'ai' | 'manual'>('ai');
  const [pdfTopic, setPdfTopic] = useState('Fundamentos de Redes Neuronales y Retropropagación');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<PDFDocumento>(() => {
    const res = nasserAIStudio.generarPDFEducativo('Compiladores y Análisis Sintáctico', [
      'Introducción Teórica y Gramáticas GLC',
      'Modelos de Parsing LL(1) y LR(1)',
      'Construcción de Árboles AST',
      'Conclusiones y Recomendaciones',
    ]);
    return res.documento;
  });

  const handleGeneratePDF = async () => {
    if (!pdfTopic.trim()) return;
    setIsGeneratingPDF(true);

    try {
      const res = await fetch('/api/ai/studio/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pdfTopic }),
      });
      const data = await res.json();
      if (data.documento && data.documento.seccionesDetalladas) {
        setCurrentPDF(data.documento);
        return;
      }
      throw new Error('Formato devuelto incompleto');
    } catch (e) {
      console.warn('Fallback a Nasser AI Studio Engine para PDF:', e);
      const generated = nasserAIStudio.generarPDFEducativo(pdfTopic, [
        `Introducción y Axiomas de ${pdfTopic}`,
        'Fórmulas y Modelos Formales',
        'Casos Prácticos de Aplicación Universitaria',
        'Conclusiones y Estrategia de Examen',
      ]);
      setCurrentPDF(generated.documento);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // =================== 3. DIAGRAM / SCHEMA STATE ===================
  const [diagramMode, setDiagramMode] = useState<'ai' | 'manual'>('ai');
  const [diagramConcept, setDiagramConcept] = useState('Consenso Distribuido Raft');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState<EsquemaConceptual>(() => {
    const res = nasserAIStudio.generarImagenEducativaEsquema('Consenso Distribuido Raft');
    return res.esquema;
  });
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  const handleGenerateDiagram = async () => {
    if (!diagramConcept.trim()) return;
    setIsGeneratingDiagram(true);

    try {
      const res = await fetch('/api/ai/studio/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: diagramConcept }),
      });
      const data = await res.json();
      if (data.esquema && data.esquema.conexiones) {
        setCurrentDiagram(data.esquema);
        setSelectedNodeIndex(null);
        return;
      }
      throw new Error('Esquema devuelto incompleto');
    } catch (e) {
      console.warn('Fallback a Nasser AI Studio Engine para Esquema:', e);
      const generated = nasserAIStudio.generarImagenEducativaEsquema(diagramConcept);
      setCurrentDiagram(generated.esquema);
      setSelectedNodeIndex(null);
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleAddDiagramNode = () => {
    const newNode = `Módulo ${currentDiagram.elementosRelacionados.length + 1}`;
    setCurrentDiagram(prev => ({
      ...prev,
      elementosRelacionados: [...prev.elementosRelacionados, newNode],
      conexiones: [
        ...(prev.conexiones || []),
        { origen: prev.etiquetaCentral, destino: newNode, etiqueta: 'Extensión' },
      ],
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Nasser AI Studio Official Engine Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fe6b00] to-pink-600 text-white flex items-center justify-center shadow-lg shadow-[#fe6b00]/25 shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Nasser AI Studio
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fe6b00]/10 text-[#fe6b00] border border-[#fe6b00]/20">
                v{nasserAIStudio.version}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Cerebro 2 • Motor Multimedia
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Estudio creativo para la producción formal de diapositivas, PDFs universitarios y esquemas conceptuales
            </p>
          </div>
        </div>

        {/* Global Print / Presentation quick actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {studioSection === 'slides' && (
            <button
              onClick={() => setIsPlayingFullscreen(true)}
              className="px-4 py-2 rounded-xl bg-[#00236f] text-white text-xs font-bold hover:bg-[#1e3a8a] transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Presentar Diapositivas</span>
            </button>
          )}

          {studioSection === 'pdf' && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#00236f] text-white text-xs font-bold hover:bg-[#1e3a8a] transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Exportar PDF</span>
            </button>
          )}

          {studioSection === 'diagrams' && (
            <button
              onClick={() => {
                alert(`Diagrama "${currentDiagram.etiquetaCentral}" listo para ser exportado como recurso vectorial SVG.`);
              }}
              className="px-4 py-2 rounded-xl bg-[#00236f] text-white text-xs font-bold hover:bg-[#1e3a8a] transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Esquema</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Studio Hub Switcher (3 Mandated Modalities) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-2xl max-w-xl shadow-inner">
        <button
          onClick={() => setStudioSection('slides')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            studioSection === 'slides'
              ? 'bg-white dark:bg-[#111728] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layout className="w-4 h-4 text-[#fe6b00]" />
          <span>Diapositivas Pro</span>
        </button>

        <button
          onClick={() => setStudioSection('pdf')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            studioSection === 'pdf'
              ? 'bg-white dark:bg-[#111728] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-[#fe6b00]" />
          <span>PDFs Educativos</span>
        </button>

        <button
          onClick={() => setStudioSection('diagrams')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            studioSection === 'diagrams'
              ? 'bg-white dark:bg-[#111728] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Network className="w-4 h-4 text-[#fe6b00]" />
          <span>Diagramas Conceptuales</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. SECCIÓN DE DIAPOSITIVAS AUTOMÁTICAS (CANVA STYLE)     */}
      {/* ========================================================= */}
      {studioSection === 'slides' && (
        <div className="space-y-6">
          {/* Mode Selector (Asistido por IA vs Manual) */}
          <div className="flex items-center justify-between">
            <div className="p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-2xl flex items-center max-w-xs shadow-inner">
              <button
                onClick={() => setSlideMode('ai')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  slideMode === 'ai'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#fe6b00]" />
                <span>Asistido por IA</span>
              </button>
              <button
                onClick={() => setSlideMode('manual')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  slideMode === 'manual'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Modo Manual</span>
              </button>
            </div>

            <span className="text-xs text-gray-400 hidden sm:inline">
              Paleta Oficial dyser: Cobalt Blue (#00236F) & Coral Orange (#FE6B00)
            </span>
          </div>

          {/* AI Generator Form */}
          {slideMode === 'ai' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tema o concepto a estructurar en diapositivas
                  </label>
                  <input
                    type="text"
                    value={slideTopic}
                    onChange={e => setSlideTopic(e.target.value)}
                    placeholder="Ej: Redes Neuronales Convolucionales, Ciclo de Krebs..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Estilo de Plantilla
                  </label>
                  <select
                    value={slideTemplate}
                    onChange={e => setSlideTemplate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="Academic Canva Pro">Academic Canva Pro (Azul & Naranja)</option>
                    <option value="Midnight Tech Dark">Midnight Tech Dark (Minimalista)</option>
                    <option value="Vibrant University">Vibrant University (Editorial)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    onClick={handleGenerateSlides}
                    disabled={isGeneratingSlides || !slideTopic.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
                  >
                    {isGeneratingSlides ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-[#fe6b00]" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#fe6b00]" />
                        <span>Generar Diapositivas</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slide Deck Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Slide Thumbnails List */}
            <div className="lg:col-span-3 space-y-2 order-2 lg:order-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Diapositivas ({deck.slides.length})
                </span>
                <button
                  onClick={handleAddSlide}
                  className="p-1 rounded-lg text-[#fe6b00] hover:bg-orange-50 dark:hover:bg-gray-800 transition flex items-center gap-1 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {deck.slides.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition relative group ${
                      currentSlideIndex === idx
                        ? 'border-[#00236f] bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111728] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
                      <span>SLIDE 0{idx + 1}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteSlide(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"
                        title="Eliminar diapositiva"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                      {s.heading}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">
                      {s.subheading || 'Sin subtítulo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Stage / Canvas */}
            <div className="lg:col-span-9 space-y-4 order-1 lg:order-2">
              <div
                className="aspect-video w-full rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: deck.themePalette?.background || '#F7F9FB',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {/* Visual watermark / corner branding */}
                <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-[#fe6b00]" />
                  <span className="text-[10px] font-black tracking-widest text-[#00236f]">
                    dyser studio
                  </span>
                </div>

                {/* Top slide tracker */}
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span className="text-[#fe6b00] uppercase tracking-wider text-[11px]">
                    {deck.deckTitle}
                  </span>
                  <span>
                    0{currentSlideIndex + 1} / 0{deck.slides.length}
                  </span>
                </div>

                {/* Slide Core Content */}
                <div className="my-auto space-y-4 max-w-2xl">
                  {currentSlide.layout === 'title' ? (
                    <div className="space-y-3">
                      <div className="inline-block px-3 py-1 rounded-full bg-[#fe6b00]/10 text-[#fe6b00] text-xs font-bold uppercase tracking-wider">
                        {currentSlide.highlightMetric || 'Introducción Formal'}
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black text-[#00236f] dark:text-[#90a8ff] tracking-tight leading-tight">
                        {currentSlide.heading}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                        {currentSlide.subheading}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl sm:text-3xl font-black text-[#00236f] dark:text-[#90a8ff] tracking-tight">
                          {currentSlide.heading}
                        </h2>
                        {currentSlide.subheading && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                            {currentSlide.subheading}
                          </p>
                        )}
                      </div>

                      {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {currentSlide.bullets.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-2xs border border-gray-200/50 dark:border-gray-700/50"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#fe6b00] mt-1.5 shrink-0" />
                              <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                {b}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Slide Footer */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-200/50 dark:border-gray-800/50 pt-3">
                  <span>Nasser AI Studio • Generador de Materiales Académicos</span>
                  <span>Página {currentSlideIndex + 1}</span>
                </div>
              </div>

              {/* Inline Editor for Current Slide */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#fe6b00]" />
                    Edición de Contenido (Slide {currentSlideIndex + 1})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentSlideIndex(Math.min(deck.slides.length - 1, currentSlideIndex + 1))
                      }
                      disabled={currentSlideIndex === deck.slides.length - 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Título</label>
                    <input
                      type="text"
                      value={currentSlide.heading}
                      onChange={e => handleUpdateCurrentSlide('heading', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={currentSlide.subheading || ''}
                      onChange={e => handleUpdateCurrentSlide('subheading', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SECCIÓN DE PDFs EDUCATIVOS COMPLETOS                  */}
      {/* ========================================================= */}
      {studioSection === 'pdf' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-2xl flex items-center max-w-xs shadow-inner">
              <button
                onClick={() => setPdfMode('ai')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  pdfMode === 'ai'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#fe6b00]" />
                <span>Generar con IA</span>
              </button>
              <button
                onClick={() => setPdfMode('manual')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  pdfMode === 'manual'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Editor Manual</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                Formato: A4 Universitario Formal • {currentPDF.formato}
              </span>
            </div>
          </div>

          {/* AI Generator Box */}
          {pdfMode === 'ai' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tema Académico para el Documento PDF Completo
                  </label>
                  <input
                    type="text"
                    value={pdfTopic}
                    onChange={e => setPdfTopic(e.target.value)}
                    placeholder="Ej: Termodinámica Estadística, Estructuras de Datos Avanzadas..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !pdfTopic.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-[#fe6b00]" />
                        <span>Compilando...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-[#fe6b00]" />
                        <span>Redactar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formal PDF Viewer (Rendered Document Page) */}
          <div className="bg-gray-200/50 dark:bg-gray-900/60 p-4 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-800 flex justify-center">
            {/* A4 Sheet Simulation */}
            <div className="w-full max-w-3xl bg-white text-gray-900 shadow-2xl rounded-2xl p-8 sm:p-12 space-y-6 print:m-0 print:shadow-none print:w-full">
              {/* University Header */}
              <div className="border-b-2 border-[#00236f] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#fe6b00]" />
                    <span className="text-xs font-black tracking-wider text-[#00236f] uppercase">
                      dyser Academic Press • Nasser AI Studio
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 mt-1">
                    {currentPDF.titulo}
                  </h1>
                </div>

                <div className="text-right text-[11px] text-gray-500 font-mono">
                  <div>ESTADO: {currentPDF.estado}</div>
                  <div>{currentPDF.fechaCreacion}</div>
                </div>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
                {(currentPDF.seccionesDetalladas || []).map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#00236f] flex items-center gap-2 border-b border-gray-100 pb-1">
                      <span className="w-5 h-5 rounded-md bg-[#00236f] text-white text-[11px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {sec.titulo}
                    </h3>

                    {sec.subtitulo && (
                      <p className="text-xs font-semibold text-gray-500">{sec.subtitulo}</p>
                    )}

                    <p className="text-gray-700 leading-relaxed font-serif text-justify">
                      {sec.contenido}
                    </p>

                    {sec.formulasOClaves && sec.formulasOClaves.length > 0 && (
                      <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        {sec.formulasOClaves.map((item, i) => (
                          <div
                            key={i}
                            className="font-mono text-xs bg-white p-2 rounded-lg border border-gray-200 text-gray-900"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Document Signature Footer */}
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#00236f]" />
                  <span>Certificado por Nasser AI Studio v2.0</span>
                </div>
                <span>Documento Oficial de Estudio</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SECCIÓN DE DIAGRAMAS CONCEPTUALES INTELIGENTES         */}
      {/* ========================================================= */}
      {studioSection === 'diagrams' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-2xl flex items-center max-w-xs shadow-inner">
              <button
                onClick={() => setDiagramMode('ai')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  diagramMode === 'ai'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#fe6b00]" />
                <span>Generar con IA</span>
              </button>
              <button
                onClick={() => setDiagramMode('manual')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  diagramMode === 'manual'
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Modo Manual</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddDiagramNode}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#fe6b00]" />
                <span>Añadir Nodo</span>
              </button>
            </div>
          </div>

          {/* AI Generator Box */}
          {diagramMode === 'ai' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Concepto o Sistema para Modelar en Diagrama
                  </label>
                  <input
                    type="text"
                    value={diagramConcept}
                    onChange={e => setDiagramConcept(e.target.value)}
                    placeholder="Ej: Pipeline de CI/CD, Ciclo de Carnot, Sistema Nervioso Autónomo..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    onClick={handleGenerateDiagram}
                    disabled={isGeneratingDiagram || !diagramConcept.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
                  >
                    {isGeneratingDiagram ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-[#fe6b00]" />
                        <span>Construyendo...</span>
                      </>
                    ) : (
                      <>
                        <Network className="w-4 h-4 text-[#fe6b00]" />
                        <span>Mapear Esquema</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Visual Canvas */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fe6b00]">
                  Esquema Conceptual Inteligente
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentDiagram.etiquetaCentral}
                </h3>
              </div>

              <span className="text-xs font-mono text-gray-400">
                {currentDiagram.elementosRelacionados.length} Nodos Conectados
              </span>
            </div>

            {/* Visual Node Network Representation */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-gray-900 dark:to-slate-900/60 border border-gray-200/70 dark:border-gray-800 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Central Core Node */}
              <div className="p-5 rounded-2xl bg-[#00236f] text-white shadow-xl max-w-sm text-center z-10 ring-4 ring-blue-500/20 animate-in zoom-in-95 duration-300">
                <span className="text-[10px] font-bold text-[#fe6b00] uppercase tracking-wider block">
                  Nodo Central
                </span>
                <h4 className="text-base font-black mt-0.5">{currentDiagram.etiquetaCentral}</h4>
                <p className="text-[11px] text-blue-200 mt-1">Eje fundamental del sistema</p>
              </div>

              {/* Dynamic Connecting Lines and Satellites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full z-10">
                {currentDiagram.elementosRelacionados.map((item, idx) => {
                  const isSelected = selectedNodeIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedNodeIndex(isSelected ? null : idx)}
                      className={`p-4 rounded-2xl border transition cursor-pointer text-left shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'bg-[#fe6b00] text-white border-[#fe6b00] scale-102'
                          : 'bg-white dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-[#00236f]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1">
                        <span>COMPONENTE #{idx + 1}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <h5 className="text-xs font-bold leading-snug">{item}</h5>
                      <p
                        className={`text-[11px] mt-1 ${
                          isSelected ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Interdependencia directa con el nodo central.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connection Map details */}
            {currentDiagram.conexiones && currentDiagram.conexiones.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300 block mb-2">
                  Relaciones Lógicas Mapeadas por Nasser AI Studio:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentDiagram.conexiones.map((con, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono text-[11px]"
                    >
                      {con.origen} → {con.destino} ({con.etiqueta})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Player Modal for Slides */}
      {isPlayingFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-12 text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#fe6b00]" />
              <span className="font-bold text-sm">dyser Presenter • Nasser AI Studio</span>
            </div>
            <button
              onClick={() => setIsPlayingFullscreen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="my-auto max-w-4xl mx-auto text-center space-y-6">
            <span className="px-3 py-1 rounded-full bg-[#fe6b00]/20 text-[#fe6b00] text-xs font-bold uppercase tracking-wider">
              {deck.deckTitle}
            </span>
            <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight">
              {currentSlide.heading}
            </h1>
            <p className="text-lg sm:text-2xl text-gray-300">{currentSlide.subheading}</p>

            {currentSlide.bullets && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 max-w-3xl mx-auto">
                {currentSlide.bullets.map((b, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/10 text-sm leading-relaxed">
                    • {b}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30"
              >
                ← Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentSlideIndex(Math.min(deck.slides.length - 1, currentSlideIndex + 1))
                }
                disabled={currentSlideIndex === deck.slides.length - 1}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
            <span>
              {currentSlideIndex + 1} de {deck.slides.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
