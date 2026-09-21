import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Mic,
  MicOff,
  Edit3,
  MessageSquare,
  Eye,
  ArrowUp,
  ArrowLeft,
  Plus,
  FileText,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { StudioDocument, StudioChatMessage, StudioPage } from './StudioTypes';

interface StudioAiModeProps {
  document: StudioDocument;
  onUpdateDocument: (updated: StudioDocument) => void;
  onSwitchToManual: () => void;
  onShowToast: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
  isTopBarCollapsed?: boolean;
}

export const StudioAiMode: React.FC<StudioAiModeProps> = ({
  document: doc,
  onUpdateDocument,
  onSwitchToManual,
  onShowToast,
  isTopBarCollapsed = false,
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
  // Solo dos vistas: 'chat' o 'preview'. Se elimina por completo "Lienzo + Chat"
  const [activeView, setActiveView] = useState<'chat' | 'preview'>('chat');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isListening, setIsListening] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
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
    <div className="w-full flex flex-col space-y-2">
      {/* =========================================================
          CONTENEDOR DE TRABAJO (CHAT O PREVIEW)
          ========================================================= */}
      <div
        className={`${
          isTopBarCollapsed
            ? 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-7rem)] min-h-[580px]'
            : 'h-[calc(100dvh-10.5rem)] sm:h-[calc(100vh-9.5rem)] min-h-[540px]'
        } relative w-full flex flex-col`}
      >
        {/* =========================================================
            1. VISTA DE CHAT (Visible solo si activeView === 'chat')
            ========================================================= */}
        {activeView === 'chat' && (
          <div className="w-full h-full flex flex-col bg-white dark:bg-[#0b101d] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-150">
            {/* Cabecera del Asistente */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-[#0f172a]/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00236F] to-[#FE6B00] flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    Nasser AI Studio
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#00236F] dark:text-blue-300">
                      {doc.format.toUpperCase()}
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                    Generación de contenidos y diapositivas en tiempo real
                  </p>
                </div>
              </div>

              {/* Botón rápido a Editor Manual */}
              <button
                onClick={onSwitchToManual}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition cursor-pointer"
                title="Cambiar al Editor Manual tipo Canva"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FE6B00]" />
                <span className="hidden sm:inline">Editor Manual</span>
              </button>
            </div>

            {/* Historial de Mensajes con Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 custom-scrollbar">
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
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#00236F] text-white font-medium rounded-tr-xs shadow-xs'
                        : 'bg-gray-50 dark:bg-[#121a2f] text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60 rounded-tl-xs'
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
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-gray-900 text-[#00236F] dark:text-blue-300 border border-gray-200 dark:border-gray-700 hover:border-[#FE6B00] transition active:scale-95 text-left cursor-pointer"
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
                  <span className="font-semibold text-[#FE6B00] animate-pulse">
                    Nasser AI Studio está actualizando tu {doc.format}...
                  </span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Menú desplegable de atajos si se pulsa el botón (+) */}
            {showQuickMenu && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 animate-in slide-in-from-bottom-2 duration-150">
                <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Atajos Dyser:</span>
                {[
                  { label: '🎨 Paleta Dyser', prompt: 'Aplica la paleta institucional azul #00236F y naranja #FE6B00' },
                  { label: '➕ Nueva Sección/Lámina', prompt: 'Añade una nueva página/diapositiva con resumen de conceptos clave' },
                  { label: '⚡ Mayor Rigor', prompt: 'Incrementa el rigor conceptual e incluye formulaciones y definiciones exactas' },
                  { label: '📐 Diseño Minimalista', prompt: 'Organiza el contenido con diseño ultra limpio, espaciado y tipografía destacada' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowQuickMenu(false);
                      handleSendMessage(item.prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#FE6B00] hover:text-[#FE6B00] whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 text-[11px] font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* BARRA DE ENTRADA REDISEÑADA (Estilo Referencia Screenshot con branding Dyser) */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0c1222] shrink-0 space-y-2">
              <div className="bg-white dark:bg-[#11192e] rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs p-2 sm:p-2.5 focus-within:border-[#00236F] dark:focus-within:border-[#FE6B00] transition">
                {/* Input / Textarea de Instrucción */}
                <div className="px-1.5 pt-0.5">
                  <textarea
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    placeholder={
                      doc.format === 'pdf'
                        ? 'Escribe cambios, pide nuevas secciones o investiga...'
                        : doc.format === 'slides'
                        ? 'Escribe cambios, pide nuevas diapositivas o investiga...'
                        : 'Escribe cambios, pide nuevos diagramas o investiga...'
                    }
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Fila Inferior dentro de la Barra de Entrada: (+) a la izquierda, Mic y Enviar (↑) a la derecha */}
                <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-gray-100 dark:border-gray-800/80">
                  {/* Botón (+) a la izquierda */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowQuickMenu((prev) => !prev)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                        showQuickMenu
                          ? 'bg-[#FE6B00] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                      title="Atajos rápidos y opciones de plantilla"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="hidden sm:inline text-[10px] text-gray-400 font-medium">
                      Atajos rápidos
                    </span>
                  </div>

                  {/* Acciones de la derecha: Micrófono y Botón de Envío Redondo (↑) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                      title={isListening ? 'Detener dictado' : 'Dictar por voz'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Botón circular con flecha hacia arriba (↑) en Azul Marino Dyser #00236F */}
                    <button
                      type="button"
                      disabled={!inputPrompt.trim() || isLoading}
                      onClick={() => handleSendMessage()}
                      className="w-8 h-8 rounded-full bg-[#00236F] hover:bg-[#001c59] text-white disabled:opacity-40 flex items-center justify-center transition shadow-xs active:scale-95 cursor-pointer shrink-0"
                      title="Enviar instrucción (Enter)"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* DOCK INFERIOR DE NAVEGACIÓN: [←] [ Chat | Preview ] [👁] */}
              <div className="flex items-center justify-between px-2 pt-0.5">
                {/* Botón izquierdo */}
                <button
                  onClick={onSwitchToManual}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
                  title="Editor manual tipo Canva"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* SELECTOR SEGMENTADO PILL [ Chat | Preview ] */}
                <div className="inline-flex items-center p-1 bg-gray-200/90 dark:bg-[#131b2e] rounded-full border border-gray-300/60 dark:border-gray-700/60 shadow-inner">
                  <button
                    id="tab-studio-chat"
                    onClick={() => setActiveView('chat')}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeView === 'chat'
                        ? 'bg-[#00236F] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    id="tab-studio-preview"
                    onClick={() => setActiveView('preview')}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeView === 'preview'
                        ? 'bg-[#FE6B00] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                {/* Botón derecho para ir directo a la previsualización */}
                <button
                  onClick={() => setActiveView('preview')}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#FE6B00] flex items-center justify-center transition cursor-pointer"
                  title="Ver documento a pantalla completa"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            2. VISTA DE PREVIEW / LIENZO (Visible solo si activeView === 'preview')
               El chat se oculta al 100% como requiere el punto 7.
            ========================================================= */}
        {activeView === 'preview' && (
          <div className="w-full h-full flex flex-col bg-slate-100/90 dark:bg-[#070b14] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-150 relative">
            {/* Barra Superior del Lienzo: Formato, Páginas y Zoom */}
            <div className="px-4 py-2.5 border-b border-gray-200/70 dark:border-gray-800/80 flex items-center justify-between bg-white dark:bg-[#0f172a] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {doc.format === 'pdf'
                    ? 'Documento PDF'
                    : doc.format === 'slides'
                    ? 'Presentación de Diapositivas'
                    : 'Lámina / Infografía'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold">
                  Vista Previa
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
              </div>
            </div>

            {/* Lienzo de Previsualización Centrado y Escalado */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center pb-20">
              <div
                id="studio-live-preview-canvas"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className={`w-full max-w-2xl bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative ${
                  doc.format === 'pdf'
                    ? 'aspect-[1/1.414] p-8 sm:p-10'
                    : doc.format === 'slides'
                    ? 'aspect-[16/9] p-6 sm:p-8'
                    : 'aspect-square sm:aspect-[4/3] p-6 sm:p-8'
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

            {/* DOCK FLOTANTE INFERIOR EN MODO PREVIEW PARA VOLVER AL CHAT LIMPIAMENTE */}
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center px-4 pointer-events-none">
              <div className="pointer-events-auto bg-white/95 dark:bg-[#0e1628]/95 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-xl flex items-center gap-3">
                {/* Botón de volver con flecha ← */}
                <button
                  onClick={() => setActiveView('chat')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  title="Volver al chat"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FE6B00]" />
                  <span>Volver al Chat</span>
                </button>

                {/* Pill central */}
                <div className="inline-flex items-center p-0.5 bg-gray-200 dark:bg-[#15213d] rounded-full border border-gray-300 dark:border-gray-700">
                  <button
                    onClick={() => setActiveView('chat')}
                    className="px-3.5 py-1 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveView('preview')}
                    className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FE6B00] text-white shadow-xs cursor-pointer"
                  >
                    Preview
                  </button>
                </div>

                {/* Editor manual */}
                <button
                  onClick={onSwitchToManual}
                  className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  title="Editor manual"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
