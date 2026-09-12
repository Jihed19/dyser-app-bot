import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Layers,
  Copy,
  Check,
  RotateCw,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { SummaryResult } from '../../types';
import { nasserAI, ResumenEstructurado } from '../../services/nasserEngines';
import { sounds } from '../../services/soundEffects';
import { exportSummaryToPdf } from '../../utils/summaryPdfExport';

export const SummaryView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  // Carga automática si el estudiante envió una investigación desde Nasser AI
  useEffect(() => {
    try {
      const storedInput = sessionStorage.getItem('dyser_summary_input');
      const storedTopic = sessionStorage.getItem('dyser_summary_topic');
      if (storedInput) {
        sessionStorage.removeItem('dyser_summary_input');
        sessionStorage.removeItem('dyser_summary_topic');
        setInputText(storedInput);
        setResearchNotice(`Texto cargado desde tu investigación con Nasser AI${storedTopic ? ` sobre "${storedTopic}"` : ''}`);
        
        // Generar síntesis local inmediata con Nasser AI Core
        const coreOutput = nasserAI.generarResumenAvanzado(storedInput);
        if (coreOutput && coreOutput.resumenEstructurado) {
          setResult({
            executiveSummary: coreOutput.resumenEstructurado.ideaCentral,
            keyPoints: coreOutput.resumenEstructurado.puntosEsenciales,
            flashcards: coreOutput.resumenEstructurado.flashcards || [
              { front: 'Concepto Central', back: coreOutput.resumenEstructurado.ideaCentral }
            ],
            examTrap: coreOutput.resumenEstructurado.trampaExamen || 'Verificar definiciones y condiciones límite.',
            tutorAdvice: coreOutput.resumenEstructurado.conclusionTutor || 'Aplica estos conceptos resolviendo problemas prácticos.'
          });
        }
      }
    } catch (e) {
      console.warn('Error al leer investigación en SummaryView', e);
    }
  }, []);

  const loadSample = (type: 'distribuidos' | 'biologia') => {
    if (type === 'distribuidos') {
      setInputText(`Algoritmo de Consenso Raft en Sistemas Distribuidos.
Raft es un algoritmo para gestionar un registro replicado (replicated log) entre un clúster de computadoras. Fue propuesto por Ongaro y Ousterhout en Stanford como una alternativa mucho más comprensible que Paxos.
El algoritmo descompone el problema en tres subproblemas fundamentales:
1. Elección de Líder: Cuando el líder actual falla o no envía 'heartbeats' dentro del 'election timeout' (típicamente 150-300ms aleatorizados), un seguidor pasa al estado de Candidato, incrementa el 'term' (término) y solicita votos. Requiere una mayoría estricta (N/2 + 1) para convertirse en líder.
2. Replicación de Registros: El líder recibe peticiones de clientes, las añade a su log local y las envía a los seguidores mediante RPCs AppendEntries. Cuando la mayoría ha persistido la entrada, se considera 'committed' y se aplica a la máquina de estados.
3. Seguridad: Solo los candidatos con un registro al menos tan actualizado como la mayoría de los miembros pueden ser elegidos líderes. Si un nodo aplicó un comando en un índice y término dados, ningún otro nodo aplicará un comando diferente en ese mismo índice.`);
    } else {
      setInputText(`Transcripción y Traducción en Biología Molecular: El Dogma Central.
El flujo de información genética celular sigue la ruta ADN -> ARN mensajero -> Proteína.
1. Transcripción: Ocurre en el núcleo en eucariotas. La enzima ARN Polimerasa II reconoce la región promotora (caja TATA) y sintetiza una cadena complementaria de pre-ARNm en dirección 5' a 3'. El procesamiento post-transcripcional incluye el capping 5' con 7-metilguanosina, la poliadenilación 3' (cola poli-A) y el splicing por el espliceosoma, eliminando intrones y uniendo exones.
2. Traducción: El ARNm maduro viaja al citoplasma hacia los ribosomas (complejos 80S). Los codones de 3 nucleótidos son leídos por los ARNt con anticodones específicos. El codón de inicio es siempre AUG (que codifica para Metionina) y la terminación ocurre ante codones de stop (UAA, UAG, UGA) donde intervienen factores de liberación proteicos.`);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    sounds.playChirp();

    // Motor local rápido
    const coreOutput = nasserAI.generarResumenAvanzado(inputText);

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      setResult(data);
      sounds.playSuccess();
    } catch (err) {
      // Fallback cognitivo
      setResult({
        executiveSummary:
          coreOutput.resumenEstructurado?.ideaCentral ||
          'Síntesis generada analizando los conceptos y postulados primordiales del texto proporcionado.',
        keyPoints: coreOutput.resumenEstructurado?.puntosEsenciales || [
          'Comprensión estricta de las variables independientes.',
          'Formulación de invariantes y condiciones de borde.',
          'Consistencia lógica y conclusiones fundamentadas.',
        ],
        keyFormulasOrConcepts: coreOutput.resumenEstructurado?.conceptosClave || [
          'Principio Fundamental',
          'Condición de Límite',
          'Consistencia',
        ],
        flashcards: [
          {
            front: '¿Cuál es la idea o tesis central del texto?',
            back: coreOutput.resumenEstructurado?.ideaCentral.slice(0, 100) + '...' || 'Concepto analizado.',
          },
          {
            front: '¿Cuáles son los conceptos fundamentales a retener?',
            back: coreOutput.resumenEstructurado?.conceptosClave.join(', ') || 'Conceptos clave.',
          },
        ],
        examWarning:
          '¡Atención para el examen! Recuerda distinguir claramente las causas de las consecuencias en este tema.',
      });
      sounds.playSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = (index: number) => {
    sounds.playPop();
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const copySummary = () => {
    if (!result) return;
    const textToCopy = `${result.executiveSummary}\n\nPuntos Clave:\n${result.keyPoints.map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    setDownloadingPdf(true);
    sounds.playChirp();

    try {
      // Extraer un título coherente a partir de la primera línea de texto o del resumen
      const firstLine = inputText.trim().split('\n')[0]?.trim() || '';
      const cleanTitle = firstLine.length > 5 && firstLine.length < 80
        ? firstLine.replace(/[:.-]+$/, '')
        : 'Resumen de Estudio Académico';

      exportSummaryToPdf(result, cleanTitle);
      sounds.playSuccess();
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Cabecera */}
      <div className="pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Herramienta de Estudio
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Resúmenes y Flashcards
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Pega cualquier lectura o tema y obtén una síntesis ejecutiva lista para repasar.
        </p>
      </div>

      {researchNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold">{researchNotice}</span>
          </div>
          <button
            onClick={() => setResearchNotice(null)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjeta de Entrada de Texto */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Texto o apuntes de la clase
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Ejemplos:</span>
            <button
              onClick={() => loadSample('distribuidos')}
              className="text-[11px] font-bold text-[#00236f] dark:text-[#90a8ff] hover:underline"
            >
              Sistemas Distribuidos
            </button>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              onClick={() => loadSample('biologia')}
              className="text-[11px] font-bold text-[#00236f] dark:text-[#90a8ff] hover:underline"
            >
              Biología Celular
            </button>
          </div>
        </div>

        <textarea
          rows={6}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Pega aquí el contenido de un PDF, transcripción o apuntes de clase..."
          className="w-full p-4 text-xs sm:text-sm rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 resize-y"
        />

        <div className="flex items-center justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#00236f] hover:bg-[#142c6b] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Analizando y sintetizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Resumen con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados de la Síntesis */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* 1. Síntesis Ejecutiva */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-[#00236f] dark:text-[#90a8ff]">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-base font-black text-gray-900 dark:text-white">
                  Síntesis Ejecutiva
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#00236f] dark:text-[#90a8ff] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition active:scale-95 cursor-pointer shadow-2xs"
                  title="Descargar este resumen como archivo PDF formal"
                >
                  {pdfDownloaded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">¡PDF Listo!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{downloadingPdf ? 'Generando...' : 'Descargar PDF'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={copySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
              {result.executiveSummary}
            </p>

            {/* Puntos clave */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Puntos Esenciales
              </span>
              <ul className="space-y-1.5">
                {result.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-[#fe6b00] font-black mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Alerta para el Examen */}
          {result.examWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Tip Crítico para el Examen
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  {result.examWarning}
                </p>
              </div>
            </div>
          )}

          {/* 3. Flashcards de Repaso Rápido */}
          {result.flashcards && result.flashcards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Tarjetas de Memorización (Toca para voltear)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.flashcards.map((card, idx) => {
                  const isFlipped = flippedCards[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCard(idx)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 min-h-[120px] flex flex-col justify-between ${
                        isFlipped
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          {isFlipped ? 'Respuesta' : `Tarjeta #${idx + 1}`}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                          {isFlipped ? card.back : card.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-end text-[11px] font-semibold text-gray-400 gap-1 pt-2">
                        <RotateCcw className="w-3 h-3" />
                        <span>{isFlipped ? 'Volver a la pregunta' : 'Ver respuesta'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
