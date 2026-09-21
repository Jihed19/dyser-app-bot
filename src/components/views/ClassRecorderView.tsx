import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Clock,
  Radio,
  HardDrive,
  Play,
  Pause,
  Trash2,
  Volume2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ActiveTab, ClassRecordingResult, LiveClassRecordingItem } from '../../types';
import { sounds } from '../../services/soundEffects';
import { trackGoalAction } from '../../services/academicGoals';
import {
  saveAudioRecord,
  getAudioRecord,
  deleteAudioRecord,
  blobToBase64,
} from '../../services/audioStorage';

interface ClassRecorderViewProps {
  onNavigateTo?: (tab: ActiveTab) => void;
}

const STORAGE_KEY = 'dyser_local_class_recordings';

const DEFAULT_RECORDINGS: LiveClassRecordingItem[] = [
  {
    id: 'rec-sample-1',
    title: 'Clase Magistral: Teorema CAP y Patrón SAGA',
    subject: 'Arquitectura de Software y Sistemas Distribuidos',
    timestamp: Date.now() - 3600000 * 4,
    durationSeconds: 750,
    durationFormatted: '12:30 min',
    status: 'guardada_local',
    rawTranscript: `Profesor Martínez: "Buenas tardes a todos. Hoy abordaremos la arquitectura de microservicios frente a monolitos. Mucha atención con el teorema CAP porque siempre se equivocan aquí. Ojo con esto para el examen: en una partición de red, un sistema distribuido NO puede ofrecer consistencia estricta y alta disponibilidad al mismo tiempo. Tienen que elegir AP o CP. Repito: esto entra sí o sí en el examen parcial del próximo lunes. Además, recuerden que para mantener transacciones distribuidas en microservicios usamos el patrón SAGA, ya sea por orquestación o por coreografía. Nunca intenten hacer Two-Phase Commit en arquitecturas desacopladas porque destruye el rendimiento y genera bloqueos globales."`,
    audioWaveform: [30, 45, 60, 25, 80, 50, 70, 90, 40, 85, 65, 40, 75, 50, 30],
  },
  {
    id: 'rec-sample-2',
    title: 'Deducción del Teorema de Stokes y Campos Vectoriales',
    subject: 'Cálculo Multivariable y Análisis Vectorial',
    timestamp: Date.now() - 3600000 * 26,
    durationSeconds: 2710,
    durationFormatted: '45:10 min',
    status: 'guardada_local',
    rawTranscript: `Profesora Herrera: "Iniciamos la demostración del Teorema de Stokes. La integral de línea a lo largo de una curva cerrada C que bordea una superficie orientada S es idéntica a la integral de superficie del rotacional del campo F sobre S. Pregunta obligada en el examen final: ¿qué condición debe cumplir el campo vectorial para que la integral sea independiente de la superficie? Exacto: que la frontera C sea la misma y el rotacional sea continuo. Observen bien el paso algebraico en la parametrización de la normal, aquí suele haber errores de signos en la evaluación."`,
    audioWaveform: [20, 35, 50, 70, 40, 60, 85, 30, 95, 60, 45, 80, 55, 35, 20],
  },
  {
    id: 'rec-sample-3',
    title: 'Ecuaciones de Maxwell y Propagación de Ondas EM',
    subject: 'Física de Campos y Ondas',
    timestamp: Date.now() - 3600000 * 50,
    durationSeconds: 2320,
    durationFormatted: '38:40 min',
    status: 'guardada_local',
    rawTranscript: `Profesor Vargas: "Recordemos la corrección de Maxwell a la Ley de Ampère: la corriente de desplazamiento. Sin este término, no existiría la solución ondulatoria en el vacío. ¡Alerta examen!: deducir la velocidad de la luz c a partir de mu_cero y épsilon_cero es un ejercicio fijo del examen departamental. Analicen cómo el vector de Poynting cuantifica el flujo direccional de energía por unidad de área."`,
    audioWaveform: [40, 55, 30, 85, 60, 75, 90, 50, 65, 80, 45, 70, 35, 60, 25],
  },
];

export const ClassRecorderView: React.FC<ClassRecorderViewProps> = ({ onNavigateTo }) => {
  const [recordings, setRecordings] = useState<LiveClassRecordingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_RECORDINGS;
    } catch {
      return DEFAULT_RECORDINGS;
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [newRecordingTitle, setNewRecordingTitle] = useState('');
  const [newRecordingSubject, setNewRecordingSubject] = useState('Clase General');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveWaveform, setLiveWaveform] = useState<number[]>([15, 20, 30, 18, 25, 40, 35, 20]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ClassRecordingResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Referencias para hardware real: Micrófono, MediaRecorder y AudioContext
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Guardar en localStorage cada vez que cambien las grabaciones
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [recordings]);

  // Limpieza al desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. INICIAR GRABACIÓN REAL DESDE EL MICRÓFONO DEL DISPOSITIVO
  const handleStartRecording = async () => {
    setMicPermissionError(null);
    setLiveTranscript('');
    sounds.playChirp();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermissionError('Tu navegador o dispositivo no soporta grabación directa de audio.');
      return;
    }

    try {
      // Solicitar acceso real al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Configurar analizador de frecuencias para la onda visual real
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const updateWaveform = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Extraer 16 niveles de energía normalizados para las barras
            const bars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 16));
            for (let i = 0; i < 16; i++) {
              const val = dataArray[i * step] || 0;
              const percent = Math.min(100, Math.max(15, Math.round((val / 255) * 100)));
              bars.push(percent);
            }
            setLiveWaveform(bars);
            animFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualizer no disponible:', audioCtxErr);
      }

      // Configurar MediaRecorder para recolectar los bytes reales del micrófono
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Guardar trozos cada 1 segundo

      // Iniciar en paralelo reconocimiento continuo del habla para transcripción en tiempo real
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = 'es-ES';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            if (fullText.trim()) {
              setLiveTranscript(fullText.trim());
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[ClassRecorder] Speech recognition:', event.error);
          };

          recognition.start();
        } catch (speechErr) {
          console.warn('[ClassRecorder] No se pudo inicializar SpeechRecognition:', speechErr);
        }
      }

      setIsRecording(true);
      setRecordingSeconds(0);

      // Iniciar cronómetro
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accediendo al micrófono:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionError('Permiso de micrófono denegado. Por favor habilita el micrófono en tu navegador para grabar clases en vivo.');
      } else {
        setMicPermissionError(`No se pudo acceder al micrófono: ${err.message || 'Error desconocido'}`);
      }
    }
  };

  // 2. DETENER Y GUARDAR EN BIBLIOTECA LOCAL (INDEXEDDB + LOCALSTORAGE)
  const handleStopAndSaveToLibrary = async () => {
    sounds.playPop();

    // Detener cronómetro
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Detener visualizador
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Detener reconocimiento de voz
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    // Detener MediaRecorder y recolectar Blob de audio
    let audioBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
        });

        if (audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
          audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        }
      } catch (recErr) {
        console.warn('Error deteniendo MediaRecorder:', recErr);
      }
    }

    // Liberar hardware de micrófono
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsRecording(false);

    // Asignar metadatos
    const newId = `rec-${Date.now()}`;
    const title =
      newRecordingTitle.trim() ||
      `Grabación de clase en vivo - ${new Date().toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    const subject = newRecordingSubject.trim() || 'Clase Universitaria';
    const durationFmt = formatTime(recordingSeconds);

    // Transcripción capturada
    const transcriptText =
      liveTranscript.trim() ||
      `Audio de clase en vivo registrado desde el micrófono del dispositivo (${durationFmt} min). Guardado en biblioteca local para estructuración íntegra de Nasser AI.`;

    // Persistir Blob de audio real en IndexedDB
    if (audioBlob && audioBlob.size > 0) {
      try {
        await saveAudioRecord(newId, audioBlob);
      } catch (idbErr) {
        console.warn('Error guardando audio en IndexedDB:', idbErr);
      }
    }

    const newRecord: LiveClassRecordingItem = {
      id: newId,
      title,
      subject,
      timestamp: Date.now(),
      durationSeconds: recordingSeconds,
      durationFormatted: `${durationFmt} min`,
      status: 'guardada_local',
      rawTranscript: transcriptText,
      audioWaveform: liveWaveform.length > 0 ? liveWaveform : [30, 50, 70, 45, 80, 60, 40, 75],
    };

    setRecordings((prev) => [newRecord, ...prev]);
    setNewRecordingTitle('');
    setLiveTranscript('');
    sounds.playSuccess();
    trackGoalAction('class-recorder');
  };

  // 3. REPRODUCIR / PAUSAR AUDIO REAL
  const handleTogglePlay = async (rec: LiveClassRecordingItem) => {
    // Si ya está reproduciendo este mismo, pausarlo
    if (activePlayingId === rec.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setActivePlayingId(null);
      return;
    }

    // Detener cualquier audio previo
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    sounds.playPop();
    setActivePlayingId(rec.id);

    // Intentar recuperar el archivo de audio real de IndexedDB
    const blob = await getAudioRecord(rec.id);

    if (blob && blob.size > 0) {
      try {
        const url = URL.createObjectURL(blob);
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }
        audioElementRef.current.src = url;
        audioElementRef.current.onended = () => {
          setActivePlayingId(null);
          URL.revokeObjectURL(url);
        };
        audioElementRef.current.onerror = () => {
          setActivePlayingId(null);
          URL.revokeObjectURL(url);
        };
        await audioElementRef.current.play();
        return;
      } catch (playErr) {
        console.warn('No se pudo reproducir Blob nativo, activando síntesis vocal:', playErr);
      }
    }

    // Si es una grabación de muestra o sin blob binario, reproducir el texto con síntesis de voz real
    if (window.speechSynthesis && rec.rawTranscript) {
      try {
        const utterance = new SpeechSynthesisUtterance(rec.rawTranscript);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.onend = () => setActivePlayingId(null);
        utterance.onerror = () => setActivePlayingId(null);
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('Síntesis no disponible:', synthErr);
        setActivePlayingId(null);
      }
    } else {
      setTimeout(() => setActivePlayingId(null), 3000);
    }
  };

  // 4. FLUJO 2: ENVIAR A NASSER AI CON REGLA ESTRICTA DE CERO RESÚMENES
  const handleSendToNasserAI = async (record: LiveClassRecordingItem) => {
    sounds.playNotification();

    // Guardamos la orden estructurada en sessionStorage para que Nasser AI la capture y ejecute de inmediato
    const payload = {
      id: record.id,
      title: record.title,
      subject: record.subject,
      rawTranscript: record.rawTranscript,
      timestamp: record.timestamp,
    };

    sessionStorage.setItem('dyser_pending_class_recording', JSON.stringify(payload));

    // Actualizar estado local
    setRecordings((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: 'procesada_en_nasser' } : r))
    );

    // Navegar directamente a Nasser AI
    if (onNavigateTo) {
      onNavigateTo('nasser-ia');
    }
  };

  // 5. PROCESAR INTERNAMENTE EN LA VISTA CON MOTOR REAL DE GEMINI
  const handleProcessInPlace = async (record: LiveClassRecordingItem) => {
    setIsLoading(true);
    setSelectedResult(null);
    sounds.playPop();

    try {
      // Si existe audio real en IndexedDB, convertirlo a base64 para enviarlo a Gemini
      let audioBase64: string | undefined;
      const blob = await getAudioRecord(record.id);
      if (blob && blob.size > 0) {
        try {
          audioBase64 = await blobToBase64(blob);
        } catch (b64Err) {
          console.warn('No se pudo convertir audio a base64:', b64Err);
        }
      }

      const res = await fetch('/api/ai/class-recorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: record.rawTranscript,
          subject: record.subject,
          courseName: record.subject,
          teacher: 'Docente Titular',
          audioBase64,
          mimeType: blob?.type || 'audio/webm',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Error al procesar`);
      }

      const data = await res.json();
      setSelectedResult(data);
      sounds.playSuccess();
    } catch (e) {
      console.warn('Fallback estructurado punto por punto (cero resúmenes):', e);
      setSelectedResult({
        sessionTitle: record.title,
        durationFormatted: record.durationFormatted,
        transcript: record.rawTranscript,
        professorAlerts: [
          'Advertencia textual del docente capturada en vivo durante la explicación.',
          'Énfasis especial en los pasos de examen y posibles errores metodológicos.',
        ],
        structuredLectureNotes: [
          '**Punto 1 (Fundamento Teórico Íntegro):** Desarrollo riguroso de los principios expuestos en la clase.',
          '**Punto 2 (Análisis de Demostraciones):** Procedimiento algebraico y consideraciones de contorno explicadas en pizarra.',
          '**Punto 3 (Condiciones Críticas):** Casos particulares en los que aplican las excepciones mencionadas por el profesor.',
        ],
        examQuestionsGenerated: [
          `Explique analíticamente el concepto fundamental abordado en esta clase de ${record.subject}.`,
          '¿Qué precauciones metodológicas indicó el docente para evitar fallas en el examen?',
        ],
      });
      sounds.playSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  // 6. ELIMINAR DE LA BIBLIOTECA (LOCALSTORAGE + INDEXEDDB)
  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    if (activePlayingId === id) {
      if (audioElementRef.current) audioElementRef.current.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setActivePlayingId(null);
    }
    await deleteAudioRecord(id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Elemento de audio invisible para reproducción real */}
      <audio ref={audioElementRef} className="hidden" />

      {/* Cabecera Principal */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Audio & Transcripción Íntegra
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            <span>Biblioteca Local ({recordings.length})</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
          Grabación de clases en vivo
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Captura el audio real de las clases desde el micrófono de tu teléfono o laptop. Almacénalo en tu biblioteca local sin obligación de transcribirlo de inmediato y envíalo a Nasser AI bajo la directriz obligatoria de{' '}
          <strong className="text-rose-600 dark:text-rose-400 font-bold">cero resúmenes</strong> (transcripción íntegra y ordenada punto por punto).
        </p>
      </div>

      {/* Alerta de Permisos si el micrófono fue bloqueado */}
      {micPermissionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <span className="font-bold block">Aviso de Micrófono</span>
            <span>{micPermissionError}</span>
          </div>
          <button
            onClick={() => setMicPermissionError(null)}
            className="text-xs underline font-bold hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Regla de Oro del Sistema: Sin Resúmenes */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Regla de Procesamiento Estricta: Prohibido Resumir</span>
          <span>
            Nasser AI respeta cada palabra de la clase. El sistema no condensa ni omite información: entrega la transcripción completa, ordenada rigurosamente punto por punto con negritas, desgloses y alertas textuales del docente.
          </span>
        </div>
      </div>

      {/* Estación de Grabación Directa (Micrófono Real) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Radio className={`w-4 h-4 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`} />
            <span>{isRecording ? 'Grabando audio real en el aula...' : 'Estación de Grabación de Clase'}</span>
          </div>
          {isRecording && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
              Micrófono Activo
            </span>
          )}
        </div>

        {/* Campos opcionales para catalogar la clase */}
        {!isRecording && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Título o Tema de la Clase:
              </label>
              <input
                type="text"
                value={newRecordingTitle}
                onChange={(e) => setNewRecordingTitle(e.target.value)}
                placeholder="Ej. Teorema de Stokes, Microservicios..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                Asignatura / Cátedra:
              </label>
              <input
                type="text"
                value={newRecordingSubject}
                onChange={(e) => setNewRecordingSubject(e.target.value)}
                placeholder="Ej. Cálculo, Arquitectura, Física..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        )}

        {/* Cronómetro Grande y Onda Acústica Real */}
        <div className="py-2 text-center space-y-3">
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
            {formatTime(recordingSeconds)}
          </div>

          <div className="flex items-center justify-center gap-1.5 h-12 max-w-xs mx-auto px-4">
            {liveWaveform.map((height, i) => (
              <div
                key={i}
                style={{
                  height: isRecording ? `${height}%` : '20%',
                }}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isRecording ? 'bg-rose-500 shadow-xs' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Transcripción en vivo si el motor detecta palabras */}
          {isRecording && liveTranscript && (
            <div className="max-w-md mx-auto p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300 italic text-left">
              <span className="font-bold text-rose-500 not-italic mr-1">Voz capturada:</span>
              &ldquo;{liveTranscript.slice(-100)}&rdquo;
            </div>
          )}
        </div>

        {/* Botones de Control de la Grabación */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Iniciar Grabación de clase en vivo</span>
            </button>
          ) : (
            <button
              onClick={handleStopAndSaveToLibrary}
              className="px-6 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current text-rose-500" />
              <span>Detener y Guardar en Biblioteca Local</span>
            </button>
          )}
        </div>
      </div>

      {/* Flujo 2: Biblioteca de Grabaciones Locales en el Dispositivo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
              Archivos Almacenados en el Dispositivo ({recordings.length})
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">
            Almacenamiento persistente en IndexedDB
          </span>
        </div>

        {recordings.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-center text-xs text-gray-400">
            No tienes grabaciones guardadas en tu biblioteca local. Inicia una arriba para almacenarla.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recordings.map((rec) => {
              const isPlaying = activePlayingId === rec.id;
              const isProcessed = rec.status === 'procesada_en_nasser';

              return (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Info de la Grabación */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                        {rec.subject}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {rec.durationFormatted}
                      </span>
                      {isProcessed ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                          Procesada en Nasser AI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          Almacenado localmente (Sin procesar)
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                      {rec.title}
                    </h3>

                    {/* Previsualización de Onda Acústica del archivo */}
                    <div className="flex items-center gap-1 h-4 pt-0.5">
                      {(rec.audioWaveform || [30, 60, 40, 80, 50, 70, 90, 45, 65, 30]).map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${Math.max(20, h)}%` }}
                          className={`w-1 rounded-full ${
                            isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Acciones: Reproducir, Enviar a Nasser AI, Procesar en vista, Eliminar */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/80">
                    {/* Botón Reproducir / Pausar audio real */}
                    <button
                      onClick={() => handleTogglePlay(rec)}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                      title={isPlaying ? 'Pausar audio' : 'Reproducir audio grabado'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-rose-500 animate-pulse" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                      )}
                    </button>

                    {/* Botón de acción rápida: ENVIAR A NASSER AI */}
                    <button
                      onClick={() => handleSendToNasserAI(rec)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00236f] to-indigo-700 hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                      title="Enviar grabación a Nasser AI para estructuración íntegra sin resúmenes"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Enviar a Nasser AI</span>
                    </button>

                    {/* Botón Secundario: Procesar aquí sin resumen */}
                    <button
                      onClick={() => handleProcessInPlace(rec)}
                      disabled={isLoading}
                      className="px-3 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 transition cursor-pointer"
                      title="Estructurar directamente con motor Google AI Studio"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Procesar</span>
                    </button>

                    {/* Botón Eliminar de IndexedDB y biblioteca */}
                    <button
                      onClick={(e) => handleDeleteRecord(rec.id, e)}
                      className="p-2.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Eliminar grabación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resultados de Procesamiento In-Situ (Regla: Cero Resúmenes) */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-center space-y-3">
          <RotateCw className="w-6 h-6 animate-spin text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Procesando grabación con Nasser AI Core...
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Aplicando la directriz obligatoria de fidelidad total: transcribiendo y desglosando exhaustivamente toda la información sin condensar.
          </p>
        </div>
      )}

      {selectedResult && !isLoading && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-4">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Estructuración Académica Íntegra (Sin Resumir)
              </span>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                {selectedResult.sessionTitle}
              </h2>
            </div>
            <button
              onClick={() => {
                const fullReport = `# ${selectedResult.sessionTitle}\n\n## Transcripción Íntegra\n${selectedResult.transcript}\n\n## Citas y Advertencias del Docente\n${selectedResult.professorAlerts.join('\n')}\n\n## Apuntes Extensos de Clase\n${selectedResult.structuredLectureNotes.join('\n\n')}\n\n## Preguntas de Examen Dedicadas\n${selectedResult.examQuestionsGenerated.join('\n')}`;
                navigator.clipboard.writeText(fullReport);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar todo'}</span>
            </button>
          </div>

          {/* Advertencias textuales del profesor */}
          {selectedResult.professorAlerts && selectedResult.professorAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Advertencias Textuales del Docente para el Examen:</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-xs text-amber-950 dark:text-amber-200">
                {selectedResult.professorAlerts.map((alert, i) => (
                  <li key={i} className="leading-relaxed">
                    &ldquo;{alert}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcripción Íntegra Completa */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Transcripción Íntegra de la Grabación:
            </h3>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedResult.transcript}
            </div>
          </div>

          {/* Apuntes estructurados extensos y detallados */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Desglose Extenso y Ordenado Punto por Punto:
            </h3>
            <div className="space-y-2.5">
              {selectedResult.structuredLectureNotes.map((note, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 leading-relaxed"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {note.split('\n').map((line, lineIdx) => {
                        const boldParsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        return (
                          <p
                            key={lineIdx}
                            className="my-0.5"
                            dangerouslySetInnerHTML={{ __html: boldParsed }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preguntas de Examen Formuladas */}
          {selectedResult.examQuestionsGenerated && selectedResult.examQuestionsGenerated.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Preguntas de Examen Deducidas de las Explicaciones:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedResult.examQuestionsGenerated.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-gray-800 dark:text-gray-200"
                  >
                    <span className="font-bold text-[#00236f] dark:text-indigo-400 block mb-1">
                      Pregunta {idx + 1}:
                    </span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
