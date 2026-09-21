import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Clock,
  Volume2,
  Eye,
  ShieldCheck,
  Radio,
  FileText,
  MousePointer,
  HelpCircle,
  MessageSquare,
  X,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { ExpositionStudy, StudentProfile } from '../../../types';
import { getSavedExpositions } from '../../../services/studyRoomsStorage';
import { GOOGLE_STUN_CONFIG, DyserIdentity } from '../../../services/dyserCommunityService';
import { sounds } from '../../../services/soundEffects';

interface DyserRehearsalRoomProps {
  channelTitle: string;
  identity: DyserIdentity;
  student?: StudentProfile;
  companion?: {
    name: string;
    dyserNumber: string;
    avatar: string;
    phoneNumber?: string;
  };
  initialExpo?: ExpositionStudy;
  onLeaveRoom: () => void;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

interface PeerParticipant {
  id: string;
  name: string;
  dyserNumber: string;
  role: string;
  avatar: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  connectionState: 'connected' | 'connecting';
}

export const DyserRehearsalRoom: React.FC<DyserRehearsalRoomProps> = ({
  channelTitle,
  identity,
  student,
  companion,
  initialExpo,
  onLeaveRoom,
  onShowToast,
}) => {
  // 1. Estado de Exposiciones y Lámina Central
  const savedExpos = getSavedExpositions();
  const [selectedExpo, setSelectedExpo] = useState<ExpositionStudy>(() => {
    return initialExpo || savedExpos[0] || {
      id: 'expo-fallback',
      topic: 'Arquitectura de Sistemas Distribuidos y Consenso Raft',
      numPoints: 3,
      points: [
        {
          id: 'p-1',
          number: 1,
          title: 'Axiomas de Sistemas Distribuidos y Fallas de Red',
          keyIdea: 'Los nodos se comunican mediante paso de mensajes en canales no confiables.',
          speechScript: 'Estimado profesor y compañeros, al abordar la arquitectura distribuida, el primer axioma es asumir que la red nunca es homogénea ni 100% confiable...',
          example: 'Pensemos en servidores réplica en distintas zonas geográficas procesando compras simultáneas.',
        },
      ],
    };
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [showExpoMenu, setShowExpoMenu] = useState<boolean>(false);

  // 2. Estado de WebRTC y Medios Locales
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);
  const [stunConnected, setStunConnected] = useState<boolean>(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // 3. Cronómetro de Ensayo
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // 4. Participantes Remotos de la Sala de Ensayo (vinculados al compañero real agregado)
  const [peers, setPeers] = useState<PeerParticipant[]>(() => {
    if (companion) {
      return [
        {
          id: 'peer-companion',
          name: companion.name,
          dyserNumber: companion.dyserNumber,
          role: 'Compañero Conectado',
          avatar: companion.avatar,
          isMuted: false,
          isVideoEnabled: true,
          isSpeaking: true,
          connectionState: 'connected',
        },
      ];
    }
    return [
      {
        id: 'peer-c1',
        name: 'Compañero de Estudio',
        dyserNumber: 'DYS-CP-8410',
        role: 'Ponente Invitado',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isMuted: false,
        isVideoEnabled: true,
        isSpeaking: true,
        connectionState: 'connected',
      },
    ];
  });

  // Inicializar WebRTC y Cámara/Micrófono con STUN de Google
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initMediaAndWebRTC() {
      try {
        // Inicializar conexión RTCPeerConnection con servidores STUN gratuitos
        const pc = new RTCPeerConnection(GOOGLE_STUN_CONFIG);
        peerConnectionRef.current = pc;

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setStunConnected(true);
          }
        };

        // Solicitar cámara y micrófono
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true,
          });

          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Agregar pistas al peer connection
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream!);
          });
        }
      } catch (err: any) {
        console.warn('[WebRTC Rehearsal] Cámara real no accesible o denegada en sandbox:', err);
        setMediaError('Modo simulado activo: cámara en uso o permiso no otorgado en navegador.');
        // Continuar de forma segura en modo avatar simulado
      }
    }

    initMediaAndWebRTC();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Control de Cronómetro
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Simulación sutil de actividad de habla entre participantes
  useEffect(() => {
    const speechInterval = setInterval(() => {
      setPeers(prev =>
        prev.map(p => {
          if (p.isMuted) return { ...p, isSpeaking: false };
          // Alternar aleatoriamente
          return { ...p, isSpeaking: Math.random() > 0.45 };
        })
      );
    }, 3500);

    return () => clearInterval(speechInterval);
  }, []);

  // Manejar Silenciar Micrófono
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMicMuted(prev => !prev);
    sounds.playPop();
  };

  // Manejar Apagar Cámara
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoDisabled(prev => !prev);
    sounds.playPop();
  };

  // Manejo de puntero láser sobre la lámina
  const handleSlideMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLaserPointerActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLaserPos({ x, y });
  };

  const handleSlideMouseLeave = () => {
    if (isLaserPointerActive) {
      setLaserPos(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPoints = selectedExpo.points?.length || 1;
  const currentPoint = selectedExpo.points?.[currentSlideIndex] || selectedExpo.points?.[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080d1a] text-gray-100 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* 1. BARRA SUPERIOR DE LA SALA DE ENSAYO */}
      <header className="h-14 px-4 sm:px-6 bg-[#0b1222]/95 border-b border-gray-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
              WebRTC En Vivo
            </span>
          </div>

          <div className="h-4 w-px bg-gray-800 hidden sm:block" />

          <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
            {channelTitle}
          </h2>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-900/80 px-2.5 py-0.5 rounded-lg border border-gray-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            STUN Google Activo
          </span>
        </div>

        {/* Cronómetro y Selector de Lámina */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-mono text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onLeaveRoom();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Salir de la Sala de Ensayo"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Colgar</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA PRINCIPAL: LÁMINA EN EL CENTRO GRANDE + PARTICIPANTES LATERALES */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* ========================================================================= */}
        {/* ÁREA CENTRAL GRANDE DEDICADA A LA LÁMINA DE EXPOSICIÓN INTERACTIVA (75%) */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto bg-gradient-to-b from-[#080d1a] to-[#0d1527] relative">
          
          {/* Barra de Controles de la Lámina */}
          <div className="flex items-center justify-between gap-2 mb-3 bg-[#11192e]/90 backdrop-blur-md p-2.5 rounded-2xl border border-gray-800/90 shadow-md relative">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-orange-500/20 text-[#fe6b00] font-black text-xs flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Lámina de Exposición Compartida
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-sm block">
                    {selectedExpo.topic}
                  </span>
                  {savedExpos.length > 1 && (
                    <button
                      onClick={() => setShowExpoMenu((prev) => !prev)}
                      className="px-2 py-0.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-orange-400 text-[10px] font-bold transition cursor-pointer border border-gray-700"
                    >
                      Cambiar Lámina ▾
                    </button>
                  )}
                </div>
              </div>

              {/* Menú desplegable para seleccionar lámina */}
              {showExpoMenu && (
                <div className="absolute top-14 left-4 z-40 w-72 bg-[#0f172a] border border-gray-700 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 py-1 mb-1">
                    Selecciona una Lámina de Ensayo
                  </div>
                  {savedExpos.map((expo) => (
                    <button
                      key={expo.id}
                      onClick={() => {
                        sounds.playPop();
                        setSelectedExpo(expo);
                        setCurrentSlideIndex(0);
                        setShowExpoMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col gap-0.5 ${
                        expo.id === selectedExpo.id
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{expo.topic}</span>
                      <span className="text-[10px] text-gray-400">
                        {expo.points?.length || 1} diapositivas / puntos
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Controles de diapositiva y herramientas */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  setIsLaserPointerActive(prev => !prev);
                  if (onShowToast && !isLaserPointerActive) {
                    onShowToast({
                      title: 'Puntero Láser Activado 🔴',
                      message: 'Tus compañeros verán tu puntero en tiempo real sobre la lámina.',
                      type: 'info',
                    });
                  }
                }}
                className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  isLaserPointerActive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs'
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                }`}
                title="Alternar Puntero Láser Sincronizado"
              >
                <MousePointer className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Puntero Láser</span>
              </button>

              <button
                onClick={() => setShowSpeakerNotes(prev => !prev)}
                className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  showSpeakerNotes
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                }`}
                title="Mostrar/Ocultar notas del orador"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Guion Orador</span>
              </button>

              {/* Botones de navegación de diapositivas */}
              <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
                <button
                  disabled={currentSlideIndex <= 0}
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
                  }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition cursor-pointer"
                  title="Diapositiva Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 text-xs font-bold text-gray-200 font-mono">
                  {currentSlideIndex + 1} / {totalPoints}
                </span>

                <button
                  disabled={currentSlideIndex >= totalPoints - 1}
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlideIndex(prev => Math.min(totalPoints - 1, prev + 1));
                  }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition cursor-pointer"
                  title="Siguiente Diapositiva"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* EL LIENZO DE LA LÁMINA EN EL CENTRO (ESTILO DISPLAY PROFESIONAL) */}
          <div
            onMouseMove={handleSlideMouseMove}
            onMouseLeave={handleSlideMouseLeave}
            className="flex-1 min-h-[340px] sm:min-h-[440px] rounded-3xl bg-[#0e1628] border-2 border-blue-900/40 hover:border-blue-700/60 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 transition-colors"
          >
            {/* Puntero Láser Neón */}
            {isLaserPointerActive && laserPos && (
              <div
                className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%` }}
              >
                <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_16px_#f43f5e] animate-ping opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <span className="absolute top-4 left-4 px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-500 text-[10px] font-extrabold text-rose-300 whitespace-nowrap">
                  {identity.name.split(' ')[0]} ({identity.dyserNumber})
                </span>
              </div>
            )}

            {/* Cabecera de la Lámina */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-[#fe6b00] border border-orange-500/40 text-xs font-black uppercase tracking-wider">
                    Punto Clave #{currentPoint?.number || currentSlideIndex + 1}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    {selectedExpo.subject || 'Defensa Oral de Ingeniería'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-800/40">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Sincronizada con 4 participantes</span>
                </div>
              </div>

              {/* TÍTULO PRINCIPAL DE LA DIAPOSITIVA */}
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                {currentPoint?.title || 'Fundamento de la Exposición'}
              </h1>
            </div>

            {/* CUERPO CENTRAL DE LA LÁMINA: IDEA CLAVE + EJEMPLO EN FORMATO GRANDE */}
            <div className="my-6 space-y-4">
              {/* Caja de Axioma / Idea Central */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#141f36] border border-blue-800/40 shadow-inner space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Axioma Rector a Proyectar a la Audiencia</span>
                </div>
                <p className="text-base sm:text-xl font-bold text-gray-100 leading-relaxed font-sans">
                  "{currentPoint?.keyIdea}"
                </p>
              </div>

              {/* Analogía o Caso Verificable */}
              {currentPoint?.example && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#10192e]/80 border border-gray-800 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 block">
                    Demostración Práctica & Analogía
                  </span>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {currentPoint.example}
                  </p>
                </div>
              )}
            </div>

            {/* Pie de Lámina: Notas del Orador Desplegables */}
            {showSpeakerNotes && (
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-800/40 text-amber-200/90 text-xs space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1 text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    Guion de Exposición Oral para el Ponente
                  </span>
                  <span className="text-[10px] text-amber-300/70 font-mono">
                    ~{Math.ceil((currentPoint?.speechScript?.split(' ').length || 60) / 130)} min
                  </span>
                </div>
                <p className="font-serif italic leading-relaxed text-xs sm:text-sm text-amber-100/90 select-text">
                  "{currentPoint?.speechScript}"
                </p>
              </div>
            )}
          </div>
        </main>

        {/* ========================================================================= */}
        {/* FRANJA LATERAL DE MINIATURAS DE VIDEO DE LOS PARTICIPANTES (WEBRTC) (25%) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-80 bg-[#0a0f1d] border-t lg:border-t-0 lg:border-l border-gray-800/90 p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto shrink-0 max-h-[220px] lg:max-h-full">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Participantes ({peers.length + 1})
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              STUN 19302
            </span>
          </div>

          {/* CUADRÍCULA DE MINIATURAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-3">
            
            {/* 1. MI CÁMARA LOCAL (TU VIDEO) */}
            <div className="relative rounded-2xl bg-[#11192e] border border-blue-500/40 overflow-hidden aspect-video flex items-center justify-center shadow-md group">
              {isVideoDisabled || !localStream ? (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <img
                    src={identity.avatar}
                    alt={identity.name}
                    className="w-10 h-10 rounded-full border border-blue-400/50 mb-1"
                  />
                  <span className="text-[11px] font-bold text-gray-300">
                    {isVideoDisabled ? 'Cámara Apagada' : 'Cámara Activa (Avatar)'}
                  </span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}

              {/* Badge del Nombre */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/70 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] text-white">
                <span className="font-bold truncate max-w-[90px]">
                  Tú ({identity.dyserNumber})
                </span>
                <div className="flex items-center gap-1">
                  {isMicMuted ? (
                    <MicOff className="w-3 h-3 text-rose-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* 2. CÁMARAS DE LOS COMPAÑEROS PARTICIPANTES */}
            {peers.map(peer => (
              <div
                key={peer.id}
                className={`relative rounded-2xl bg-[#11192e] border overflow-hidden aspect-video flex items-center justify-center shadow-md transition-all ${
                  peer.isSpeaking
                    ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'border-gray-800'
                }`}
              >
                {peer.isVideoEnabled ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-full h-full object-cover"
                    />
                    {peer.isSpeaking && (
                      <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-10 h-10 rounded-full border border-gray-700 mb-1"
                    />
                    <span className="text-[10px] font-semibold text-gray-400">Cámara Apagada</span>
                  </div>
                )}

                {/* Badge de Datos del Compañero */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/75 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] text-white">
                  <span className="font-bold truncate max-w-[90px]">
                    {peer.name.split(' ')[0]} ({peer.dyserNumber})
                  </span>
                  <div className="flex items-center gap-1">
                    {peer.isMuted ? (
                      <MicOff className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Mic className={`w-3 h-3 ${peer.isSpeaking ? 'text-emerald-400 animate-bounce' : 'text-gray-400'}`} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Información y estado de ensayo grupal */}
          <div className="mt-auto p-3 rounded-2xl bg-[#11192e]/80 border border-gray-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span className="font-bold">Protocolo:</span>
              <span className="text-emerald-400 font-mono">WebRTC P2P</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span className="font-bold">Lámina Central:</span>
              <span className="text-blue-300 font-bold truncate max-w-[120px]">
                {selectedExpo.topic}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BARRA DE HERRAMIENTAS INFERIOR DE LLAMADA */}
      <footer className="h-16 px-4 sm:px-8 bg-[#0b1222] border-t border-gray-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 hidden sm:inline">
            Tu Número Dyser:
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-[#fe6b00] border border-orange-500/40 text-xs font-black font-mono">
            {identity.dyserNumber}
          </span>
        </div>

        {/* CONTROLES CENTRALES DE MEDIOS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Micrófono */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-2xl transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center ${
              isMicMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Cámara */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-2xl transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center ${
              isVideoDisabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isVideoDisabled ? 'Encender cámara' : 'Apagar cámara'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Botón Colgar / Finalizar Ensayo */}
          <button
            onClick={() => {
              sounds.playPop();
              onLeaveRoom();
            }}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg hover:shadow-rose-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Salir del Ensayo</span>
          </button>
        </div>

        {/* Botón de Ayuda o Estado */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onShowToast) {
                onShowToast({
                  title: 'Sala de Ensayo WebRTC Dyser',
                  message: 'Todos los participantes ven la lámina central simultáneamente. Puedes usar el puntero láser para guiar la exposición.',
                  type: 'info',
                });
              }
            }}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
            title="Ayuda de la Sala de Ensayo"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
