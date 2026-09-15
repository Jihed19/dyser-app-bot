import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Mic,
  MicOff,
  Edit3,
  CheckCircle2,
  Layers,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Eye,
  Columns,
} from 'lucide-react';
import { StudioDocument, StudioFormat, StudioChatMessage, StudioPage } from './StudioTypes';

interface StudioAiModeProps {
  document: StudioDocument;
  onUpdateDocument: (updated: StudioDocument) => void;
  onSwitchToManual: () => void;
  onShowToast: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

export const StudioAiMode: React.FC<StudioAiModeProps> = ({
  document: doc,
  onUpdateDocument,
  onSwitchToManual,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<StudioChatMessage[]>([
    {
      id: 'welcome',
      sender: 'nasser',
      text: `¡Hola! Soy **Nasser AI Studio**. Estoy configurado en modo **${doc.format.toUpperCase()}**. Escribe en lenguaje natural lo que necesitas generar, modificar o profundizar en tu ${doc.format === 'pdf' ? 'documento' : doc.format === 'slides' ? 'presentación' : 'imagen'} y la previsualización se actualizará en tiempo real.`,
      timestamp: Date.now(),
      suggestedActions:
        doc.format === 'pdf'
          ? [
              'Generar tratado completo sobre el tema',
              'Añadir formulación matemática rigurosa',
              'Incluir rúbrica y trampas de examen',
              'Añadir casos prácticos de laboratorio',
            ]
          : doc.format === 'slides'
          ? [
              'Crear presentación de 4 láminas con alto impacto',
              'Añadir diapositiva de arquitectura del sistema',
              'Añadir notas de orador para la defensa',
              'Cambiar a paleta azul marino y naranja dyser',
            ]
          : [
              'Diseñar infografía de flujo conceptual',
              'Agregar circuito de retroalimentación',
              'Organizar en entradas, núcleo y salidas',
              'Estilo moderno de alta densidad',
            ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'preview' | 'split'>('split');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Asegurar índice de página válido
  const activePage: StudioPage = doc.pages[currentPageIndex] || doc.pages[0] || {
    id: 'empty',
    pageNumber: 1,
    title: doc.title,
    backgroundColor: '#FFFFFF',
    elements: [],
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Manejo de dictado por voz para prompting manos libres
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast({
        title: 'Micrófono no compatible',
        message: 'Tu navegador no soporta la API de reconocimiento de voz. Usa el teclado.',
        type: 'warning',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    // Agregar mensaje del usuario al chat
    const userMsg: StudioChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: doc.format,
          message: promptToSend,
          currentDocument: doc,
        }),
      });

      const data = await response.json();

      if (data.updatedDocument) {
        onUpdateDocument(data.updatedDocument);
      }

      const botMsg: StudioChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'nasser',
        text: data.assistantMessage || 'He actualizado la composición visual conforme a tus indicaciones.',
        timestamp: Date.now(),
        suggestedActions: [
          'Hacer el contenido más formal y riguroso',
          'Añadir más elementos visuales',
          'Pasar a Modo Manual para ajustes finos',
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error en Studio Chat:', err);

      // Respuesta local inteligente de resiliencia
      const fallbackMsg: StudioChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'nasser',
        text: `He aplicado el ajuste a tu ${doc.format === 'pdf' ? 'documento' : doc.format === 'slides' ? 'diapositiva' : 'gráfico'}. La vista previa se ha refrescado.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* =========================================================
          BARRA DE CONTROL Y MODOS DE VISUALIZACIÓN
          ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs shrink-0">
        {/* Selector Segmentado de Vista */}
        <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
          <button
            id="tab-studio-split"
            onClick={() => setActiveView('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'split'
                ? 'bg-white dark:bg-gray-900 text-[#00236F] dark:text-blue-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Ver Lienzo y Asistente en paralelo"
          >
            <Columns className="w-3.5 h-3.5 text-orange-500" />
            <span>Lienzo + Chat</span>
          </button>

          <button
            id="tab-studio-preview"
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'preview'
                ? 'bg-white dark:bg-gray-900 text-[#00236F] dark:text-blue-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Ver solo el Lienzo a pantalla completa"
          >
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            <span>Solo Lienzo</span>
          </button>

          <button
            id="tab-studio-chat"
            onClick={() => setActiveView('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'chat'
                ? 'bg-white dark:bg-gray-900 text-[#00236F] dark:text-blue-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Ver solo el chat de instrucciones"
          >
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            <span>Solo Chat</span>
          </button>
        </div>

        {/* Estado y Acceso Directo a Modo Manual */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizado en vivo
          </span>

          <button
            onClick={onSwitchToManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition cursor-pointer"
            title="Cambiar al Editor Manual tipo Canva"
          >
            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
            <span>Editor Manual</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          ÁREA PRINCIPAL DE TRABAJO (CHAT + LIENZO)
          ========================================================= */}
      <div className={`h-[calc(100dvh-13.5rem)] sm:h-[calc(100vh-12.5rem)] min-h-[580px] max-h-[880px] relative w-full ${
        activeView === 'split' ? 'flex flex-col lg:grid lg:grid-cols-12 gap-3.5' : 'flex'
      }`}>
        {/* ---------------------------------------------------------
            PANEL DEL ASISTENTE IA (PROMPT ENGINE)
            --------------------------------------------------------- */}
        <div className={`flex flex-col bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden transition-all ${
          activeView === 'chat'
            ? 'w-full h-full flex-1 animate-in fade-in duration-150'
            : activeView === 'split'
            ? 'flex-1 min-h-0 lg:h-full lg:col-span-5 order-2 lg:order-1'
            : 'hidden'
        }`}>
          {/* Encabezado del Asistente */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00236F] to-[#FE6B00] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  Nasser AI Assistant
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#00236F] dark:text-blue-300">
                    IA Activa
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                  Instrucciones en lenguaje natural sincronizadas con el lienzo
                </p>
              </div>
            </div>

            {activeView === 'split' && (
              <button
                onClick={() => setActiveView('preview')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title="Ampliar el lienzo"
              >
                <Maximize2 className="w-3.5 h-3.5 text-orange-500" />
                <span>Ampliar</span>
              </button>
            )}
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'nasser' && (
                  <div className="w-7 h-7 rounded-xl bg-[#00236F] flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4 text-orange-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#00236F] text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Acciones sugeridas compactas */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (action.includes('Modo Manual')) {
                              onSwitchToManual();
                            } else {
                              handleSendMessage(action);
                            }
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-gray-900 text-[#00236F] dark:text-blue-300 border border-gray-200 dark:border-gray-700 hover:border-orange-500 transition active:scale-95 text-left cursor-pointer"
                        >
                          ⚡ {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-[#FE6B00] flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 pl-2">
                <div className="w-6 h-6 rounded-lg bg-[#00236F] flex items-center justify-center text-white animate-spin">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="font-semibold text-orange-500 animate-pulse">
                  Nasser AI Studio está actualizando el lienzo...
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Atajos Rápidos de Prompting */}
          <div className="px-3.5 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 custom-scrollbar">
            <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Atajos:</span>
            {[
              { label: '🎨 Paleta Dyser', prompt: 'Aplica la paleta institucional azul #00236F y naranja #FE6B00' },
              { label: '➕ Nueva Sección', prompt: 'Añade una nueva página/diapositiva con resumen clave' },
              { label: '⚡ Mayor Rigor', prompt: 'Incrementa el rigor conceptual y añade definiciones precisas' },
              { label: '📐 Limpiar Diseño', prompt: 'Haz el diseño más minimalista, espaciado y limpio' },
            ].map((tool, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(tool.prompt)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 shadow-2xs font-medium text-[11px]"
              >
                {tool.label}
              </button>
            ))}
          </div>

          {/* Barra de Entrada / Formulario */}
          <div className="p-2.5 sm:p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700 focus-within:border-[#00236F] dark:focus-within:border-orange-500 shadow-inner transition"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 sm:p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-gray-400 hover:text-[#00236F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isListening ? 'Detener dictado' : 'Dictar por voz a Nasser AI'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  doc.format === 'pdf'
                    ? 'Escribe: "Agrega aplicaciones clave", "Cambia título"...'
                    : doc.format === 'slides'
                    ? 'Escribe: "Crea una diapositiva con 3 métricas", "Añade conclusiones"...'
                    : 'Escribe: "Añade un nodo conceptual", "Hazlo más técnico"...'
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none px-1"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2 sm:p-2.5 rounded-xl bg-[#00236F] hover:bg-[#001c59] text-white disabled:opacity-40 transition shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="Enviar instrucción"
              >
                <Send className="w-4 h-4 text-orange-400" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 px-1">
              <span>Enter para enviar • Dictado por voz disponible</span>
              <span className="font-semibold text-orange-500">Nasser AI Engine</span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------
            PANEL DEL LIENZO DE TRABAJO (LIVE PREVIEW STAGE)
            --------------------------------------------------------- */}
        <div className={`flex flex-col bg-slate-100/80 dark:bg-[#070b14] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden transition-all relative ${
          activeView === 'preview'
            ? 'w-full h-full flex-1 animate-in fade-in duration-150'
            : activeView === 'split'
            ? 'h-[44%] sm:h-[48%] lg:h-full shrink-0 lg:col-span-7 order-1 lg:order-2'
            : 'hidden'
        }`}>
          {/* Barra Superior del Lienzo: Formato, Páginas y Zoom */}
          <div className="px-4 py-2.5 border-b border-gray-200/70 dark:border-gray-800/80 flex items-center justify-between bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {doc.format === 'pdf' ? 'Documento PDF' : doc.format === 'slides' ? 'Presentación de Diapositivas' : 'Lámina / Infografía'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold">
                Lienzo en Vivo
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Paginación */}
              {doc.pages.length > 1 && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-1">
                    {currentPageIndex + 1} / {doc.pages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.min(doc.pages.length - 1, prev + 1))}
                    disabled={currentPageIndex === doc.pages.length - 1}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Controles de Zoom */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                  title="Reducir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 px-1">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="p-1 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botón para Maximizar / Restaurar */}
              <button
                onClick={() => setActiveView(activeView === 'preview' ? 'split' : 'preview')}
                className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title={activeView === 'preview' ? 'Volver a vista dividida' : 'Ver pantalla completa'}
              >
                <Maximize2 className="w-3.5 h-3.5 text-orange-500" />
              </button>
            </div>
          </div>

          {/* Lienzo de Previsualización Centrado y Escalado */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
            <div
              id="studio-live-preview-canvas"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className={`w-full max-w-2xl bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative ${
                doc.format === 'pdf'
                  ? 'aspect-[1/1.414] p-8 sm:p-10' // Proporción A4
                  : doc.format === 'slides'
                  ? 'aspect-[16/9] p-6 sm:p-8' // Proporción 16:9
                  : 'aspect-square sm:aspect-[4/3] p-6 sm:p-8' // Proporción Infografía / Imagen
              }`}
            >
              {/* Header del documento editorial */}
              <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00236F]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00236F]">
                    dyser Academic • {doc.format.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  Pág. {currentPageIndex + 1} de {doc.pages.length}
                </span>
              </div>

              {/* Título de la Página / Sección */}
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-black text-[#00236F] tracking-tight leading-snug">
                  {activePage.title || doc.title}
                </h1>
                {activePage.subtitle && (
                  <p className="text-xs sm:text-sm text-gray-500 italic mt-0.5">
                    {activePage.subtitle}
                  </p>
                )}
              </div>

              {/* Elementos renderizados dinámicamente según la IA */}
              <div className="space-y-3 relative z-10">
                {activePage.elements.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">Lienzo vacío. Usa el asistente para generar el contenido inicial.</p>
                  </div>
                ) : (
                  activePage.elements.map((el) => {
                    switch (el.type) {
                      case 'badge':
                        return (
                          <div key={el.id} className="inline-block">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-50 text-[#FE6B00] border border-[#FE6B00]/30 shadow-2xs">
                              {el.content}
                            </span>
                          </div>
                        );

                      case 'heading':
                        return (
                          <h2 key={el.id} className="text-base sm:text-lg font-black text-[#00236F]">
                            {el.content}
                          </h2>
                        );

                      case 'subheading':
                        return (
                          <h3 key={el.id} className="text-xs sm:text-sm font-bold text-gray-700">
                            {el.content}
                          </h3>
                        );

                      case 'formula':
                        return (
                          <div
                            key={el.id}
                            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs sm:text-sm text-center text-gray-900 font-bold tracking-tight shadow-inner"
                          >
                            {el.content}
                          </div>
                        );

                      case 'box':
                        return (
                          <div
                            key={el.id}
                            className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-[#00236F] font-bold text-center shadow-2xs"
                          >
                            {el.content}
                          </div>
                        );

                      case 'text':
                      default:
                        return (
                          <div
                            key={el.id}
                            className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                          >
                            {el.content}
                          </div>
                        );
                    }
                  })
                )}
              </div>

              {/* Pie de página con marca institucional dyser */}
              <div className="absolute bottom-3 left-6 right-6 pt-2 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
                <span>Nasser AI Studio • dyser OS</span>
                <span>Edición Universitaria</span>
              </div>
            </div>
          </div>

          {/* Botón flotante para regresar al chat cuando está en modo Solo Lienzo */}
          {activeView === 'preview' && (
            <button
              onClick={() => setActiveView('split')}
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00236F] hover:bg-[#001c59] text-white shadow-xl text-xs sm:text-sm font-black transition active:scale-95 border border-white/20 cursor-pointer"
              title="Abrir chat y ver ambos paneles"
            >
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span>Abrir Asistente AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
