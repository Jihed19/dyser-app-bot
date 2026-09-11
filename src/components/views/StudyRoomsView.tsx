import React, { useState, useEffect } from 'react';
import {
  Users,
  Play,
  Pause,
  RotateCcw,
  Mic,
  MessageSquare,
  Sparkles,
  Award,
  Clock,
  Radio,
  Send,
  Volume2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { StudyRoom, VoiceCoachAnalysis } from '../../types';
import { sampleStudyRooms } from '../../data/mockData';

export const StudyRoomsView: React.FC = () => {
  const [rooms, setRooms] = useState<StudyRoom[]>(sampleStudyRooms);
  const [activeRoomId, setActiveRoomId] = useState<string>(sampleStudyRooms[0].id);
  const [activeTab, setActiveTab] = useState<'room' | 'voice-coach'>('room');

  // Pomodoro state
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Chat in active room
  const [chatInput, setChatInput] = useState('');
  const [roomMessages, setRoomMessages] = useState<
    { sender: string; text: string; time: string; isAi?: boolean }[]
  >([
    { sender: 'María S.', text: '¿Alguien tiene clara la diferencia entre Raft y Paxos?', time: '10:14' },
    {
      sender: 'Carlos M.',
      text: 'Raft descompone en 3 fases: elección, replicación y seguridad. Mucho más fácil de entender.',
      time: '10:16',
    },
    {
      sender: 'Nasser Bot',
      text: '¡Exacto! Paxos tiene consenso simétrico generalizado, mientras que Raft impone un líder fuerte asimétrico.',
      time: '10:17',
      isAi: true,
    },
  ]);

  // Voice Coach state
  const [speechText, setSpeechText] = useState(
    'Buenos días estimado comité y compañeros. Hoy presento nuestra arquitectura de alta disponibilidad. Como podemos observar... ehhh... el sistema cuenta con réplicas activas distribuidas en tres zonas geográficas... ehhh... garantizando un tiempo de respuesta de menos de cincuenta milisegundos.'
  );
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceCoachAnalysis | null>(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  useEffect(() => {
    let timer: any;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => setPomodoroSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pomodoroRunning, pomodoroSeconds]);

  const formatPomoTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setRoomMessages(prev => [
      ...prev,
      {
        sender: 'Alejandro V. (Tú)',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  const handleAnalyzeSpeech = async () => {
    if (!speechText.trim()) return;
    setIsAnalyzingVoice(true);
    try {
      const res = await fetch('/api/ai/voice-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationTranscript: speechText,
          targetDurationSeconds: 180,
          topic: 'Arquitectura de Alta Disponibilidad',
        }),
      });
      const data = await res.json();
      setVoiceAnalysis(data);
    } catch (e) {
      console.error(e);
      // Fallback
      setVoiceAnalysis({
        speechTitle: 'Ensayo: Arquitectura de Alta Disponibilidad',
        wordsPerMinute: 128,
        pacingAssessment: 'Excelente cadencia (ritmo óptimo académico entre 120-140 ppm)',
        fillerWordsDetected: [
          { word: 'ehhh', count: 2, suggestion: 'Pausa en silencio en vez de alargar la vocal' },
        ],
        persuasionScore: 88,
        clarityScore: 92,
        actionableFeedback: [
          'Tu apertura es formal y adecuada para el comité evaluador.',
          'Reemplaza las dos muletillas detectadas con una inhalación diafragmática de 1 segundo.',
          'Enfatiza la cifra "cincuenta milisegundos" bajando ligeramente el tono para mayor impacto técnico.',
        ],
      });
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Colaboración en Tiempo Real
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
              Salas Activas & Voice Coach
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Salas de Estudio & Exposiciones
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Estudia en grupo con timer sincronizado o entrena tus defensas orales con el Voice Coach IA
          </p>
        </div>

        {/* Top Tab switch */}
        <div className="p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-2xl flex items-center shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('room')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'room'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Salas Grupales</span>
          </button>
          <button
            onClick={() => setActiveTab('voice-coach')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'voice-coach'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#fe6b00]" />
            <span>Voice Coach IA</span>
          </button>
        </div>
      </div>

      {activeTab === 'room' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Available Rooms */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">
              Salas de Estudio Disponibles
            </span>

            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full p-4 rounded-2xl border text-left transition ${
                  activeRoomId === room.id
                    ? 'bg-white dark:bg-[#111728] border-[#00236f] dark:border-[#90a8ff] shadow-md ring-1 ring-[#00236f]'
                    : 'bg-white/60 dark:bg-[#0c1220] border-gray-200 dark:border-gray-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#fe6b00]">{room.subject}</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {room.activeMembersCount} en vivo
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {room.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {room.topic}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                  <span>Modo: {room.mode === 'deep_work' ? 'Deep Work (Silencioso)' : 'Colaborativo'}</span>
                  <span>{room.pomodoroMinutes} min ciclo</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Active Room Space (Pomodoro + Participants + Chat) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Pomodoro Timer Bar */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                    Ciclo Pomodoro Grupal
                  </span>
                  <span className="text-xs text-blue-200">• Sala: {activeRoom.name}</span>
                </div>
                <div className="font-mono text-4xl sm:text-5xl font-black mt-2 tracking-tight">
                  {formatPomoTime(pomodoroSeconds)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPomodoroRunning(!pomodoroRunning)}
                  className="px-5 py-2.5 rounded-full bg-[#fe6b00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition"
                >
                  {pomodoroRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Iniciar Bloque</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setPomodoroRunning(false);
                    setPomodoroSeconds(25 * 60);
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Reiniciar a 25 min"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Members in Room */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Compañeros Conectados:
                </span>
                <div className="flex -space-x-2">
                  {activeRoom.members.map(m => (
                    <div
                      key={m.id}
                      className="relative group"
                      title={`${m.name} (${m.isMuted ? 'Silenciado' : 'Micrófono activo'})`}
                    >
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 shadow-xs"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-1 ring-white dark:ring-gray-900 ${
                          m.isMuted ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Pizarrón Colaborativo Activo
              </span>
            </div>

            {/* Room Chat & Scratchpad */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col h-[320px]">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00236f] dark:text-[#90a8ff]" />
                  Chat Académico de la Sala
                </span>
                <span className="text-[11px] text-gray-400">Nasser Bot activo para resolver dudas</span>
              </div>

              {/* Message scroll */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                {roomMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs ${
                      msg.isAi
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-200'
                        : 'bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold mb-0.5 text-gray-500">
                      <span className={msg.isAi ? 'text-indigo-600 dark:text-indigo-400' : ''}>
                        {msg.sender}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat form */}
              <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje o pregunta al grupo..."
                  className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-[#00236f] text-white hover:bg-[#1e3a8a] transition"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Voice Coach Tab */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00] flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Entrenador de Exposiciones & Defensas Orales
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Practica tu discurso. dyser analiza tu velocidad (ppm), muletillas, pausas y nivel persuasivo.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Discurso o presentación ensayada:
              </label>
              <textarea
                rows={4}
                value={speechText}
                onChange={e => setSpeechText(e.target.value)}
                placeholder="Pega la transcripción de tu ensayo o escribe el guion que vas a exponer..."
                className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0c1220] text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {speechText.split(/\s+/).filter(Boolean).length} palabras estimadas
              </span>

              <button
                onClick={handleAnalyzeSpeech}
                disabled={isAnalyzingVoice || !speechText.trim()}
                className="px-6 py-2.5 rounded-full bg-[#fe6b00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzingVoice ? 'Analizando oratoria...' : 'Evaluar con Voice Coach'}</span>
              </button>
            </div>
          </div>

          {/* Voice Coach Results */}
          {voiceAnalysis && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    Diagnóstico de Exposición Oral
                  </h4>
                  <span className="text-xs font-bold text-[#fe6b00]">{voiceAnalysis.speechTitle}</span>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <span className="text-xs font-bold text-gray-500 block">Velocidad</span>
                    <span className="text-2xl font-black text-[#00236f] dark:text-[#90a8ff]">
                      {voiceAnalysis.wordsPerMinute} PPM
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {voiceAnalysis.pacingAssessment}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <span className="text-xs font-bold text-gray-500 block">Claridad Vocal</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {voiceAnalysis.clarityScore} / 100
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 block">Articulación nítida</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <span className="text-xs font-bold text-gray-500 block">Nivel Persuasivo</span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {voiceAnalysis.persuasionScore} / 100
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 block">Impacto en jurado</span>
                  </div>
                </div>

                {/* Muletillas */}
                {voiceAnalysis.fillerWordsDetected && voiceAnalysis.fillerWordsDetected.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Muletillas Detectadas para Pulir:
                    </h5>
                    <div className="space-y-1">
                      {voiceAnalysis.fillerWordsDetected.map((fw, i) => (
                        <div key={i} className="text-xs text-amber-800 dark:text-amber-300">
                          • <strong>"{fw.word}"</strong> ({fw.count} veces) → {fw.suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coaching Tips */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Recomendaciones de Élite del Coach:
                  </h5>
                  <ul className="space-y-2">
                    {voiceAnalysis.actionableFeedback.map((tip, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-gray-800 dark:text-gray-200 flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-[#fe6b00] shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
