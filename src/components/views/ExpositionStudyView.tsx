import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Palette,
  Edit3,
  Check,
  RotateCcw,
  Send,
  X,
  Sliders,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Mic,
  Bot,
  User,
  ExternalLink,
  Columns,
} from 'lucide-react';
import { ExpositionStudy, ExpositionPoint, ActiveTab } from '../../types';
import { sounds } from '../../services/soundEffects';
import { createMindMapDocument } from '../studio/studioInitialData';
import { saveExposition } from '../../services/studyRoomsStorage';

export interface ExpositionStudyViewProps {
  initialTopic?: string;
  initialResearchContext?: string;
  initialExpo?: ExpositionStudy;
  onNavigateTo?: (tab: ActiveTab) => void;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
  onBackToList?: () => void;
}

export const ExpositionStudyView: React.FC<ExpositionStudyViewProps> = ({
  initialTopic,
  initialResearchContext,
  initialExpo,
  onNavigateTo,
  onShowToast,
  onBackToList,
}) => {
  // 1. Estado del Tema y Contexto
  const [topic, setTopic] = useState<string>(() => {
    return initialExpo?.topic || initialTopic || sessionStorage.getItem('dyser_active_expo_topic') || 'Arquitectura de Sistemas Distribuidos';
  });

  const [researchContext, setResearchContext] = useState<string>(() => {
    return initialResearchContext || sessionStorage.getItem('dyser_expo_research_context') || '';
  });

  // 2. Selección de Cantidad de Puntos (Fase Inicial del Embudo)
  const [hasSelectedPoints, setHasSelectedPoints] = useState(() => !!initialExpo);
  const [numPointsInput, setNumPointsInput] = useState<number>(() => initialExpo?.numPoints || 3);
  const [isGenerating, setIsGenerating] = useState(false);

  // 3. Estructura de la Exposición
  const [exposition, setExposition] = useState<ExpositionStudy | null>(() => initialExpo || null);

  // 4. Modal de Corrección ("Así no es mi exposición" - Rediseñado con pestañas superiores sin scroll engorroso)
  const [isDualCorrectionOpen, setIsDualCorrectionOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'chat' | 'preview' | 'split'>('chat');
  const [correctionInput, setCorrectionInput] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [correctionMessages, setCorrectionMessages] = useState<Array<{ sender: 'user' | 'nasser'; text: string }>>([]);
  const [previewExposition, setPreviewExposition] = useState<ExpositionStudy | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sanitizador de guion: elimina saludos, formalismos y teatralidad innecesaria
  const sanitizeSpeechScript = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/^(?:¡?(?:buen\s+día|buenos\s+días|buenas\s+tardes|buenas\s+noches|hola\s+a\s+todos|hola\s+profesor|hola|estimado\s+profesor|estimado\s+jurado|compañeros\s+y\s+profesor|compañeros|hoy\s+les\s+voy\s+a\s+hablar\s+de|en\s+esta\s+ocasión|el\s+día\s+de\s+hoy|para\s+comenzar|en\s+primer\s+lugar|a\s+continuación)[,.:!]?\s*)+/i, '')
      .trim();
  };

  // Toast Helper
  const showToast = (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => {
    if (onShowToast) onShowToast(toast);
  };

  // Carga inicial al montar si hay un tema pendiente
  useEffect(() => {
    try {
      const storedTopic = sessionStorage.getItem('dyser_active_expo_topic');
      const storedContext = sessionStorage.getItem('dyser_expo_research_context');
      if (storedTopic) {
        setTopic(storedTopic);
      }
      if (storedContext) {
        setResearchContext(storedContext);
      }
    } catch (_) {}
  }, []);

  // Generar la exposición con Nasser AI basada en los puntos elegidos
  const handleGenerateExposition = async (pointsCount: number) => {
    setIsGenerating(true);
    sounds.playChirp();

    try {
      const res = await fetch('/api/ai/exposition-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          numPoints: pointsCount,
          researchContext,
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con Nasser AI');
      const data = await res.json();

      if (data && Array.isArray(data.points) && data.points.length > 0) {
        const newExpo: ExpositionStudy = {
          id: `expo-${Date.now()}`,
          topic: data.topic || topic,
          numPoints: pointsCount,
          summaryIdea: data.summaryIdea,
          points: data.points,
          conclusionScript: data.conclusionScript,
        };
        setExposition(newExpo);
        setPreviewExposition(newExpo);
        saveExposition(newExpo);
        setHasSelectedPoints(true);
        sounds.playSuccess();
        showToast({
          title: '¡Exposición Estructurada! 🎙️',
          message: `Nasser AI redactó el guion y contenido para ${pointsCount} puntos clave.`,
          type: 'success',
        });
      } else {
        throw new Error('Formato no válido');
      }
    } catch (err) {
      console.warn('Fallback en generación de exposición:', err);
      // Fallback cognitivo local
      const fallbackPoints: ExpositionPoint[] = Array.from({ length: pointsCount }, (_, i) => {
        const num = i + 1;
        return {
          id: `p-${num}`,
          number: num,
          title:
            num === 1
              ? `1. Postulados Rectores y Contexto de ${topic}`
              : num === 2
              ? `2. Dinámica del Sistema y Relaciones Causales`
              : num === 3
              ? `3. Casos de Estudio y Demostración Práctica`
              : `${num}. Implicaciones y Soluciones Verificables`,
          keyIdea: `Definir el axioma fundamental del punto ${num} delimitando las variables clave.`,
          speechScript: `Buenas tardes profesor y compañeros. En este ${num}° momento de mi presentación sobre ${topic}, quiero destacar que la variable central opera bajo condiciones de equilibrio. Si analizamos la evidencia, observamos que...`,
          example: `Imaginen un puente con sensores de vibración: si la carga se distribuye uniformemente, la estructura se mantiene sólida.`,
          warningNote: `Cuidado con titubear si el docente pregunta por la condición límite; menciona con firmeza el principio de conservación.`,
        };
      });

      const fallbackExpo: ExpositionStudy = {
        id: `expo-${Date.now()}`,
        topic,
        numPoints: pointsCount,
        summaryIdea: `Defensa académica estructurada sobre ${topic}.`,
        points: fallbackPoints,
        conclusionScript: `Para cerrar esta exposición: comprender ${topic} nos permite tomar decisiones de ingeniería precisas y sustentadas en hechos. Agradezco su atención y quedo a disposición para sus preguntas.`,
      };

      setExposition(fallbackExpo);
      setPreviewExposition(fallbackExpo);
      saveExposition(fallbackExpo);
      setHasSelectedPoints(true);
      sounds.playSuccess();
    } finally {
      setIsGenerating(false);
    }
  };

  // Abrir interfaz dual de corrección ("Así no es mi exposición")
  const handleOpenDualCorrection = () => {
    sounds.playPop();
    setPreviewExposition(exposition ? JSON.parse(JSON.stringify(exposition)) : null);
    setCorrectionMessages([
      {
        sender: 'nasser',
        text: `Hola. Estoy listo para ajustar tu exposición sobre **${topic}**. Cuéntame: ¿Qué cambios deseas? Puedes pedirme reescribir un punto, hacerlo más técnico, cambiar las analogías o modificar el tono del guion de oratoria.`,
      },
    ]);
    setIsDualCorrectionOpen(true);
  };

  // Enviar instrucción de corrección en la interfaz dual
  const handleSendCorrection = async (customPrompt?: string) => {
    const text = (customPrompt || correctionInput).trim();
    if (!text || isAdjusting || !exposition) return;

    sounds.playPop();
    const userMsg = { sender: 'user' as const, text };
    setCorrectionMessages(prev => [...prev, userMsg]);
    setCorrectionInput('');
    setIsAdjusting(true);

    try {
      const res = await fetch('/api/ai/exposition-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          numPoints: exposition.numPoints,
          researchContext,
          adjustInstruction: text,
        }),
      });

      const data = await res.json();
      if (data && Array.isArray(data.points) && data.points.length > 0) {
        const updatedExpo: ExpositionStudy = {
          ...exposition,
          summaryIdea: data.summaryIdea || exposition.summaryIdea,
          points: data.points,
          conclusionScript: data.conclusionScript || exposition.conclusionScript,
        };
        setPreviewExposition(updatedExpo);
        setCorrectionMessages(prev => [
          ...prev,
          {
            sender: 'nasser',
            text: `He modificado tu exposición según tu indicación ("${text}"). Puedes revisar los cambios reflejados en tiempo real en la vista previa a la derecha. Si estás satisfecho, presiona **"Listo"** para confirmar.`,
          },
        ]);
        sounds.playSuccess();
      }
    } catch (err) {
      console.warn('Error adjusting exposition:', err);
      // Ajuste simulado local
      if (previewExposition) {
        const modifiedPoints = previewExposition.points.map((p, idx) => ({
          ...p,
          title: idx === 0 ? `${p.title} (Ajustado)` : p.title,
          speechScript: `[Versión ajustada con enfoque en "${text}"]: ${p.speechScript}`,
        }));
        const updated = { ...previewExposition, points: modifiedPoints };
        setPreviewExposition(updated);
        setCorrectionMessages(prev => [
          ...prev,
          {
            sender: 'nasser',
            text: `He adaptado el guion y los puntos en base a "${text}". Revisa la vista previa y pulsa "Listo" para guardar.`,
          },
        ]);
      }
    } finally {
      setIsAdjusting(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Botón "Listo" en la interfaz dual: aplicar cambios y cerrar
  const handleApplyDualChanges = () => {
    if (previewExposition) {
      setExposition(previewExposition);
      saveExposition(previewExposition);
      sounds.playSuccess();
      showToast({
        title: '¡Cambios aplicados! 🎉',
        message: 'Tu exposición se ha actualizado con las modificaciones acordadas.',
        type: 'success',
      });
    }
    setIsDualCorrectionOpen(false);
  };

  // Botón: "Crear una lámina para esta exposición" (Generación Automática de Mapa Mental)
  const handleCreateMindMapSlide = () => {
    if (!exposition) return;
    sounds.playChirp();

    // 1. Generar automáticamente el documento de Mapa Mental visual nodal
    const mindMapDoc = createMindMapDocument(
      exposition.topic,
      exposition.points.map(p => ({
        number: p.number,
        title: p.title,
        keyIdea: p.keyIdea,
      }))
    );

    // 2. Almacenar en sessionStorage para ser cargado de inmediato por Nasser AI Studio
    try {
      sessionStorage.setItem('dyser_multimedia_doc', JSON.stringify(mindMapDoc));
      sessionStorage.setItem('dyser_multimedia_topic', exposition.topic);
    } catch (e) {
      console.warn('Error saving mindmap doc to storage', e);
    }

    showToast({
      title: '✨ Abriendo Nasser AI Studio...',
      message: 'Mapa mental visual generado automáticamente sin saturación de texto.',
      type: 'success',
    });

    // 3. Abrir automáticamente Nasser AI Studio
    if (onNavigateTo) {
      onNavigateTo('multimedia');
    } else {
      window.dispatchEvent(new CustomEvent('dyser-navigate', { detail: 'multimedia' }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* 1. CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00]">
              Ruta 2 • Embudo Académico
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              Estructura & Oratoria
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#fe6b00]" />
            <span>Estudio de Exposición Oral</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tema: <strong className="text-gray-800 dark:text-gray-200">{topic}</strong>
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer"
              title="Volver a Salas de Estudio"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Exposiciones</span>
            </button>
          )}

          {/* Botón "Así no es mi exposición" */}
          {hasSelectedPoints && exposition && (
            <>
              <button
                id="btn-asi-no-es-mi-exposicion"
                onClick={handleOpenDualCorrection}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-[#fe6b00] border border-orange-200 dark:border-orange-800 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Corregir y ajustar la exposición en interfaz dual con Nasser AI"
              >
                <Sliders className="w-4 h-4" />
                <span>Así no es mi exposición</span>
              </button>

              {/* Botón "Crear lámina para esta exposición" */}
              <button
                id="btn-crear-lamina-exposicion"
                onClick={handleCreateMindMapSlide}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] hover:from-[#fe6b00] hover:to-[#ea580c] text-white text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
                title="Abrir Nasser AI Studio y generar mapa mental visual automático"
              >
                <Palette className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform animate-pulse" />
                <span>Crear una lámina para esta exposición</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. FASE INICIAL: SELECCIÓN DE CANTIDAD DE PUNTOS */}
      {!hasSelectedPoints ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-[#fe6b00] flex items-center justify-center mx-auto shadow-inner">
            <Mic className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              ¿Cuántos puntos clave deseas para tu exposición?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Nasser AI redactará el guion de oratoria completo, ideas clave, analogías prácticas y advertencias de examen adaptadas exactamente a esa cantidad de puntos, utilizando toda la memoria de tu investigación previa.
            </p>
          </div>

          {/* Opciones Rápidas de Puntos */}
          <div className="grid grid-cols-3 gap-3">
            {[3, 4, 5].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setNumPointsInput(count);
                  handleGenerateExposition(count);
                }}
                disabled={isGenerating}
                className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-1 group ${
                  numPointsInput === count
                    ? 'border-[#fe6b00] bg-orange-50/50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-orange-300 bg-gray-50/50 dark:bg-gray-900/40'
                }`}
              >
                <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-[#fe6b00] transition">
                  {count}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {count === 3 ? '3 Puntos (Rápida)' : count === 4 ? '4 Puntos (Estándar)' : '5 Puntos (Profunda)'}
                </span>
              </button>
            ))}
          </div>

          {/* Selector de número personalizado */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400">
              O indica una cantidad específica:
            </label>
            <input
              type="number"
              min={2}
              max={8}
              value={numPointsInput}
              onChange={(e) => setNumPointsInput(Math.max(2, Math.min(8, Number(e.target.value) || 3)))}
              className="w-16 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]"
            />
            <button
              onClick={() => handleGenerateExposition(numPointsInput)}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-[#fe6b00] hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isGenerating ? (
                <span>Estructurando con IA...</span>
              ) : (
                <>
                  <span>Estructurar Exposición</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : exposition ? (
        /* 3. VISTA COMPLETA DE LA EXPOSICIÓN REDACTADA POR NASSER AI */
        <div className="space-y-6">
          {/* Banner de Tesis / Hilo Conductor */}
          {exposition.summaryIdea && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/80 shadow-xs flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#00236f] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00236f] dark:text-blue-300">
                  Hilo Conductor de tu Exposición Oral
                </span>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {exposition.summaryIdea}
                </p>
              </div>
            </div>
          )}

          {/* Tarjetas de Puntos de Exposición: Estructura Limpia y Directa */}
          <div className="space-y-4">
            {exposition.points.map((pt) => {
              const directContent = sanitizeSpeechScript(pt.speechScript || pt.keyIdea || '');

              return (
                <div
                  key={pt.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3.5 hover:border-gray-300 dark:hover:border-gray-700 transition"
                >
                  {/* El Título del Punto Arriba */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#00236f] text-white font-black text-sm flex items-center justify-center shrink-0">
                        {pt.number}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                        {pt.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      Punto {pt.number} de {exposition.numPoints}
                    </span>
                  </div>

                  {/* La Información Directa de la Exposición Abajo (Texto limpio, negro sobre blanco o blanco sobre fondo oscuro) */}
                  <div className="text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed font-normal whitespace-pre-line">
                    {directContent}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conclusión y Resumen Breve */}
          {exposition.conclusionScript && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Paso 3 • Resumen Breve y Cierre Contundente
              </span>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                "{sanitizeSpeechScript(exposition.conclusionScript)}"
              </div>
            </div>
          )}

          {/* Barra de Llamado a la Acción Inferior para Crear Lámina */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-black flex items-center justify-center sm:justify-start gap-2">
                <Palette className="w-5 h-5 text-amber-300" />
                <span>¿Listo para exponer? Crea tu lámina visual ahora</span>
              </h3>
              <p className="text-xs text-blue-200 max-w-xl">
                Genera en 1 clic un mapa mental visual en Nasser AI Studio, enfocado estrictamente en diagramas y esquemas sin saturación de texto.
              </p>
            </div>

            <button
              onClick={handleCreateMindMapSlide}
              className="px-6 py-3 rounded-2xl bg-[#fe6b00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Crear una lámina para esta exposición</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 4. MODAL DE MODIFICACIÓN: "ASÍ NO ES MI EXPOSICIÓN" (CON PESTAÑAS)         */}
      {/* ========================================================================= */}
      {isDualCorrectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1222] w-full max-w-6xl h-[92vh] max-h-[850px] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Cabecera del Modal */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/90 dark:bg-gray-900/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00] flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                    Modificar Exposición: "Así no es mi exposición"
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Ajusta por chat y revisa la estructura directa en 4 pasos sin rodeos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-listo-dual-exposicion"
                  onClick={handleApplyDualChanges}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Listo</span>
                  <span className="hidden sm:inline">(Guardar Cambios)</span>
                </button>

                <button
                  onClick={() => setIsDualCorrectionOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barra de Pestañas Superiores (Elimina el scroll vertical conflictivo) */}
            <div className="px-4 sm:px-6 py-2 bg-gray-100/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xs">
                <button
                  type="button"
                  id="tab-expo-modal-chat"
                  onClick={() => setModalTab('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'chat'
                      ? 'bg-[#fe6b00] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#fe6b00] dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ajustar por Chat</span>
                </button>

                <button
                  type="button"
                  id="tab-expo-modal-preview"
                  onClick={() => setModalTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'preview'
                      ? 'bg-[#fe6b00] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#fe6b00] dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa Estructurada</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                <button
                  type="button"
                  id="tab-expo-modal-split"
                  onClick={() => setModalTab('split')}
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    modalTab === 'split'
                      ? 'bg-[#fe6b00] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#fe6b00] dark:hover:text-white'
                  }`}
                  title="Ver ambos paneles lado a lado"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Vista Dividida</span>
                </button>
              </div>

              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hidden sm:block">
                {modalTab === 'chat' ? 'Pide ajustes o enfoques pedagógicos' : 'Estructura en 4 pasos (Cero saludos innecesarios)'}
              </div>
            </div>

            {/* Contenido Principal según Pestaña Activa */}
            <div className={`flex-1 min-h-0 overflow-hidden ${
              modalTab === 'split' ? 'grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800' : 'flex flex-col'
            }`}>
              
              {/* PANEL 1: CHAT CON NASSER AI */}
              <div className={`flex flex-col h-full bg-white dark:bg-[#111728] overflow-hidden ${
                modalTab === 'chat' ? 'flex flex-1' : modalTab === 'split' ? 'flex' : 'hidden'
              }`}>
                {/* Mensajes del Chat con Scroll Suave */}
                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 text-xs custom-scrollbar">
                  {correctionMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'nasser' && (
                        <div className="w-7 h-7 rounded-xl bg-[#00236f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#fe6b00] text-white rounded-tr-xs shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-xs border border-gray-200/50 dark:border-gray-700/50'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {/* Botón directo a vista previa si es respuesta de Nasser */}
                        {msg.sender === 'nasser' && previewExposition && (
                          <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setModalTab('preview')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#fe6b00] dark:text-orange-400 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-900/60 hover:bg-orange-50 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Vista Previa en 4 Pasos</span>
                            </button>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1 toque</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAdjusting && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 italic pl-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold">Nasser AI reestructurando el contenido en 4 pasos directos...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chips de sugerencia rápida */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                  <span className="text-gray-400 font-bold shrink-0">Sugerencias:</span>
                  {[
                    'Hacer los puntos más concisos',
                    'Añadir preguntas trampa del docente',
                    'Enfocar en demostración práctica',
                    'Redactar un resumen breve de 2 líneas',
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendCorrection(chip)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-[#fe6b00] whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Caja de Entrada de Prompt */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-[#111728] shrink-0">
                  <input
                    type="text"
                    value={correctionInput}
                    onChange={(e) => setCorrectionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCorrection()}
                    placeholder="Escribe cómo deseas corregir tu exposición (ej: 'cambiar punto 2', 'más formal')..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendCorrection()}
                    disabled={isAdjusting || !correctionInput.trim()}
                    className="p-2.5 rounded-xl bg-[#fe6b00] hover:bg-orange-600 disabled:opacity-40 text-white transition active:scale-95 cursor-pointer"
                    title="Enviar ajuste"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PANEL 2: VISTA PREVIA EN TIEMPO REAL (4 PASOS DIRECTOS) */}
              <div className={`flex flex-col h-full bg-gray-50/60 dark:bg-[#0c1222] overflow-hidden ${
                modalTab === 'preview' ? 'flex flex-1' : modalTab === 'split' ? 'flex' : 'hidden'
              }`}>
                <div className="px-4 py-2.5 bg-gray-100/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5 text-[#fe6b00]">
                    <Eye className="w-3.5 h-3.5" />
                    Vista Previa: Estructura Directa en 4 Pasos
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sincronizado
                  </span>
                </div>

                {/* Contenedor con scroll de la previsualización */}
                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                  {previewExposition ? (
                    <div className="space-y-4 text-xs">
                      {/* PASO 1: TÍTULO */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 shadow-2xs">
                        <div className="text-[10px] uppercase font-black text-gray-400 mb-1">
                          Paso 1 • Título de la Exposición
                        </div>
                        <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                          {previewExposition.topic}
                        </h2>
                      </div>

                      {/* PASO 2: PUNTOS CLAVE */}
                      <div className="space-y-2.5">
                        <div className="text-[10px] uppercase font-black text-gray-400 px-1">
                          Paso 2 • Puntos Clave ({previewExposition.points.length} Ideas Concisas)
                        </div>
                        {previewExposition.points.map((p) => (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#00236f] text-white font-black text-xs flex items-center justify-center shrink-0">
                                {p.number}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                {p.title}
                              </span>
                            </div>
                            <div className="text-gray-900 dark:text-gray-100 bg-transparent p-1 leading-relaxed font-normal text-xs whitespace-pre-line">
                              {sanitizeSpeechScript(p.speechScript || p.keyIdea)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* PASO 3: RESUMEN BREVE */}
                      <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                        <div className="text-[10px] uppercase font-black text-[#00236f] dark:text-blue-400 mb-1">
                          Paso 3 • Resumen Breve de Cierre
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          {previewExposition.summaryIdea}
                        </p>
                      </div>

                      {/* Botón Listo al pie de la vista previa */}
                      <div className="pt-2 sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent dark:from-[#0c1222] dark:via-[#0c1222]/90">
                        <button
                          type="button"
                          onClick={handleApplyDualChanges}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Listo • Confirmar y Guardar Exposición</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      Cargando vista previa...
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
