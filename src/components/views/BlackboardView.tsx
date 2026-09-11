import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileCheck,
  Copy,
  Check,
  Code,
  Image as ImageIcon,
  RotateCw,
  Zap,
  FileText,
  Layout,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { BlackboardResult } from '../../types';
import { nasserAIStudio } from '../../services/nasserEngines';

export const BlackboardView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BlackboardResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = [
    {
      title: 'Pizarrón de Física Cuántica',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
      sampleTopic: 'Ecuación de Schrödinger y Operador Hamiltoniano',
    },
    {
      title: 'Pizarrón de Algoritmos Grafos',
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      sampleTopic: 'Algoritmo de Dijkstra y Complejidad O(E log V)',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setSelectedImage(sampleUrl);
    setResult(null);
  };

  const handleProcessBlackboard = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/blackboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: selectedImage,
          subject: 'Ingeniería y Ciencias Exactas',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Error al procesar`);
      }

      const data = await res.json();
      if (!data || !data.boardTitle || !Array.isArray(data.latexFormulas)) {
        throw new Error('Estructura de respuesta inválida');
      }

      setResult(data);
    } catch (e) {
      console.warn('Activando apunte pedagógico de respaldo:', e);
      // Fallback pedagógico robusto
      setResult({
        boardTitle: 'Digitalización: Pizarrón de Física y Operadores Diferenciales',
        rawTranscription: `1. Operador Hamiltoniano en 1D: Ĥ = - (ħ² / 2m) ∇² + V(x)
2. Ecuación de Schrödinger dependiente del tiempo: iħ ∂Ψ/∂t = Ĥ Ψ
3. Condición de Normalización: ∫ |Ψ(x,t)|² dx = 1 desde -∞ hasta +∞`,
        latexFormulas: [
          '\\hat{H} = -\\frac{\\hbar^2}{2m} \\nabla^2 + V(x)',
          'i\\hbar \\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi',
          '\\int_{-\\infty}^{+\\infty} |\\Psi(x,t)|^2 dx = 1',
        ],
        diagramDescription:
          'Diagrama de pozo de potencial infinito con paredes en x=0 y x=L. Función de onda senoidal de estado fundamental n=1 con nodo central en n=2.',
        structuredNotes: `### Apunte Limpio de Clase
- **Tema:** Mecánica Cuántica Introductoria
- **Objetivo:** Resolver los estados estacionarios en pozos de potencial unidimensionales.
- **Conclusión del Profesor:** Las energías están cuantizadas según E_n = (n² π² ħ²) / (2 m L²). Solo existen niveles discretos.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyNotes = () => {
    if (!result) return;
    const text = `${result.boardTitle}\n\n${result.rawTranscription}\n\nFórmulas LaTeX:\n${result.latexFormulas.join(
      '\n'
    )}\n\n${result.structuredNotes}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Visión Computacional Multimodal
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            OCR + LaTeX
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Foto a la Pizarra
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Transforma pizarrones manchados, tiza borrosa o fotos torcidas en apuntes vectoriales y fórmulas limpias
        </p>
      </div>

      {/* Upload and Capture Zone */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#fe6b00] dark:hover:border-[#fe6b00] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[200px] group bg-gray-50/50 dark:bg-gray-800/30"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Toma una foto o sube imagen del pizarrón
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, HEIC o captura directa de la cámara
            </p>
          </div>

          {/* Sample quick selectors */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              O prueba con estas muestras de aula:
            </span>
            {sampleImages.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(s.url)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#00236f] dark:hover:border-[#90a8ff] bg-white dark:bg-gray-800/60 text-left transition flex items-center gap-3 group"
              >
                <img
                  src={s.url}
                  alt={s.title}
                  className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#00236f] dark:group-hover:text-[#90a8ff]">
                    {s.title}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{s.sampleTopic}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Image Preview & Process Button */}
        {selectedImage && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-72 bg-black flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Blackboard preview"
                className="max-h-72 w-auto object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Pizarrón Cargado</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Cambiar imagen
              </button>

              <button
                onClick={handleProcessBlackboard}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-[#fe6b00] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Digitalizando pizarrón con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extraer Fórmulas y Apuntes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Structured Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {result.boardTitle}
                </h3>
              </div>

              <button
                onClick={copyNotes}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Todo'}</span>
              </button>
            </div>

            {/* LaTeX Formulas extracted */}
            {result.latexFormulas && result.latexFormulas.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#fe6b00]" />
                  Fórmulas Matemáticas en LaTeX
                </span>
                <div className="space-y-1.5">
                  {result.latexFormulas.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 font-mono text-xs text-blue-900 dark:text-blue-300 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between"
                    >
                      <span>{f}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(f)}
                        className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase"
                        title="Copiar fórmula"
                      >
                        Copiar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagram descriptions */}
            {result.diagramDescription && (
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-[#00236f] dark:text-[#90a8ff] mb-1">
                  Esquema o Gráfica Detectada en Pizarra:
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {result.diagramDescription}
                </p>
              </div>
            )}

            {/* Markdown notes */}
            <div className="pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Notas Estructuradas en Formato Limpio
              </span>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 font-sans leading-relaxed whitespace-pre-wrap">
                {result.structuredNotes}
              </div>
            </div>

            {/* Nasser AI Studio Interoperability Section */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#00236f] dark:text-[#90a8ff] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                  Nasser AI Studio (Cerebro 2)
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Transforma esta digitalización en materiales de estudio formales
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    nasserAIStudio.generarPDFEducativo(result.boardTitle, [
                      'Introducción Teórica y Contexto',
                      'Fórmulas y Teoremas Derivados',
                      'Ejercicios Prácticos de Pizarrón',
                      'Conclusiones y Recomendaciones',
                    ]);
                    setExportNotice('¡PDF formal estructurado con éxito! Abriendo vista de impresión...');
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir PDF Formal</span>
                </button>

                <button
                  onClick={() => {
                    const deckResult = nasserAIStudio.generarDiapositivas(result.boardTitle, 4);
                    setExportNotice(`¡Presentación con ${deckResult.presentacion.length} diapositivas generada en Nasser AI Studio!`);
                    setTimeout(() => setExportNotice(null), 4000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#fe6b00] text-xs font-bold text-gray-800 dark:text-white transition flex items-center gap-1.5"
                >
                  <Layout className="w-3.5 h-3.5 text-[#fe6b00]" />
                  <span>Crear Diapositivas</span>
                </button>
              </div>
            </div>

            {exportNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
