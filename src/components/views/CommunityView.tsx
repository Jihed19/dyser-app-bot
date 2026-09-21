import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Mic,
  Video,
  Phone,
  CheckCheck,
  FileText,
  Copy,
  Users,
  Sparkles,
  ChevronLeft,
  X,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Layers,
  Trash2,
  UserPlus,
  Radio,
  Check,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  MoreVertical,
  Smile,
  Camera,
  Image as ImageIcon,
  ArrowDown,
  PhoneMissed,
  PhoneIncoming,
} from 'lucide-react';
import { StudentProfile } from '../../types';
import { initialStudentProfile } from '../../data/mockData';
import {
  DyserIdentity,
  CommunityChatMessage,
  CommunityChatChannel,
  CommunitySticker,
  CommunityImageMedia,
  CommunityCallLog,
  getOrAssignDyserIdentity,
  getStoredCommunityChannels,
  saveStoredCommunityChannels,
  addCompanionByPhone,
  deleteCommunityChannel,
  subscribeToCommunityMessages,
  sendCommunityMessageToFirestore,
  INITIAL_WHATSAPP_CHANNELS,
} from '../../services/dyserCommunityService';
import { DyserRehearsalRoom } from './community/DyserRehearsalRoom';
import { sounds } from '../../services/soundEffects';
import {
  generateDisserCode,
  findContactByDisserCode,
  isDisserCode,
  normalizeDisserCode,
  KNOWN_DISSER_DIRECTORY,
} from '../../services/disserCodeService';

interface CommunityViewProps {
  student?: StudentProfile;
  onNavigateTo?: (tab: string) => void;
  onShowToast?: (toast: { title: string; message: string; type?: 'success' | 'warning' | 'error' | 'info' }) => void;
}

// Prefijos telefónicos comunes de Hispanoamérica y Norteamérica
const COUNTRY_CODES = [
  { code: '+58', label: 'Venezuela (+58)' },
  { code: '+57', label: 'Colombia (+57)' },
  { code: '+52', label: 'México (+52)' },
  { code: '+1', label: 'Estados Unidos / CAN (+1)' },
  { code: '+34', label: 'España (+34)' },
  { code: '+54', label: 'Argentina (+54)' },
  { code: '+56', label: 'Chile (+56)' },
  { code: '+51', label: 'Perú (+51)' },
  { code: '+593', label: 'Ecuador (+593)' },
];

// Stickers interactivos disponibles para enviar inmediatamente (incluye los memes de las capturas)
const QUICK_STICKERS: { label: string; url: string; alt: string }[] = [
  {
    label: 'Robot Meme',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300',
    alt: 'Robot meme pensando',
  },
  {
    label: 'Streamer Meme',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300',
    alt: 'Streamer con audífonos',
  },
  {
    label: 'Fogata Meme',
    url: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=300',
    alt: 'Personaje junto a la fogata',
  },
  {
    label: 'Dyser Aprobado',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300',
    alt: '100% Calificación Aprobada',
  },
  {
    label: 'Nasser IA Brain',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    alt: 'Nasser IA Neurona',
  },
  {
    label: 'Lámina Lista',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300',
    alt: 'Lámina interactiva lista',
  },
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  student = initialStudentProfile,
  onNavigateTo,
  onShowToast,
}) => {
  // 1. Identidad Dyser (Número Dyser automático asignado y persistido)
  const [identity, setIdentity] = useState<DyserIdentity | null>(null);
  const [copiedDyserNumber, setCopiedDyserNumber] = useState(false);

  // 2. Canales de Chat (Inspirados en WhatsApp de las capturas)
  const [channels, setChannels] = useState<CommunityChatChannel[]>(() => getStoredCommunityChannels());
  // Por defecto iniciamos con el chat de Shedya Naser abierto para ver el flujo exacto de la captura
  const [selectedChannelId, setSelectedChannelId] = useState<string>('chat-shedya-naser');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');

  // 3. Formulario Modal para agregar compañeros por número telefónico
  const [countryCode, setCountryCode] = useState('+58');
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [showAddCompanionModal, setShowAddCompanionModal] = useState(false);

  // 4. Mensajes en tiempo real del chat activo
  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  // 5. Estados de notas de voz, adjuntos y stickers
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // 6. Estado de la Sala de Videollamada de Ensayo (WebRTC con Lámina Central)
  const [isInRehearsalRoom, setIsInRehearsalRoom] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Carga inicial de identidad Dyser
  useEffect(() => {
    async function loadIdentity() {
      const assigned = await getOrAssignDyserIdentity(student);
      setIdentity(assigned);
    }
    loadIdentity();
  }, [student]);

  // Escuchar cambios externos o sincronizados en canales
  useEffect(() => {
    const handleChannelsChanged = (e: CustomEvent<CommunityChatChannel[]>) => {
      setChannels(e.detail);
    };
    window.addEventListener('dyser-channels-changed', handleChannelsChanged as EventListener);
    return () => {
      window.removeEventListener('dyser-channels-changed', handleChannelsChanged as EventListener);
    };
  }, []);

  // Suscripción a los mensajes del chat seleccionado en Firestore
  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToCommunityMessages(selectedChannelId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedChannelId]);

  // Scroll automático al último mensaje
  useEffect(() => {
    if (selectedChannelId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedChannelId]);

  // Temporizador para grabación de nota de voz
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecordingVoice]);

  // Copiar Número Dyser al portapapeles
  const handleCopyDyserNumber = () => {
    if (!identity) return;
    navigator.clipboard.writeText(identity.dyserNumber);
    setCopiedDyserNumber(true);
    sounds.playSuccess();
    if (onShowToast) {
      onShowToast({
        title: 'Número Dyser Copiado 📋',
        message: `${identity.dyserNumber} copiado al portapapeles. Compártelo con tus compañeros.`,
        type: 'success',
      });
    }
    setTimeout(() => setCopiedDyserNumber(false), 2500);
  };

  // Agregar compañero por Código Disser ("1 60 10") o número de teléfono
  const handleAddCompanion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError(null);

    const raw = phoneInput.trim();
    if (!raw) {
      setPhoneError('Por favor escribe un Código Disser (ej. 1 60 10) o número telefónico.');
      return;
    }

    const matchedContact = findContactByDisserCode(raw);
    const isCode = isDisserCode(raw) || !!matchedContact;

    let targetInput = raw;
    if (!isCode) {
      const cleanNumber = raw.replace(/[^\d+]/g, '');
      if (!cleanNumber || cleanNumber.length < 6) {
        setPhoneError('Por favor escribe un Código Disser válido (ej. 1 60 10) o número telefónico de al menos 7 dígitos.');
        return;
      }
      targetInput = cleanNumber.startsWith('+') ? cleanNumber : `${countryCode} ${cleanNumber}`;
    }

    setIsAddingCompanion(true);
    try {
      sounds.playSuccess();
      const newChannel = await addCompanionByPhone(
        targetInput,
        nameInput.trim() || matchedContact?.name || undefined,
        student
      );
      
      const freshChannels = getStoredCommunityChannels();
      setChannels(freshChannels);
      setSelectedChannelId(newChannel.id);
      setShowAddCompanionModal(false);

      setPhoneInput('');
      setNameInput('');

      if (onShowToast) {
        onShowToast({
          title: 'Compañero Conectado ✨',
          message: `Chat abierto con ${newChannel.title}. ¡Ya puedes mandarle mensajes y ensayar la lámina!`,
          type: 'success',
        });
      }

      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      setPhoneError(err?.message || 'Error al conectar con el compañero.');
    } finally {
      setIsAddingCompanion(false);
    }
  };

  // Eliminar conversación
  const handleDeleteChat = async (channelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playPop();
    await deleteCommunityChannel(channelId);
    const fresh = getStoredCommunityChannels();
    setChannels(fresh);
    if (selectedChannelId === channelId) {
      setSelectedChannelId(fresh.length > 0 ? fresh[0].id : '');
    }
    if (onShowToast) {
      onShowToast({
        title: 'Conversación eliminada',
        message: 'El chat ha sido removido de tu lista.',
        type: 'info',
      });
    }
  };

  // Enviar mensaje de texto
  const handleSendMessage = async () => {
    if (!inputText.trim() || !identity || !selectedChannelId) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg: CommunityChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: selectedChannelId,
      senderId: 'user-me',
      senderName: identity.name,
      senderDyserNumber: identity.dyserNumber,
      senderAvatar: identity.avatar,
      text,
      timestamp: Date.now(),
      isSelf: true,
      status: 'read',
    };

    sounds.playPop();
    await sendCommunityMessageToFirestore(selectedChannelId, newMsg);
    setChannels(getStoredCommunityChannels());
  };

  // Enviar nota de voz
  const handleSendVoiceNote = async () => {
    if (!identity || !selectedChannelId) return;
    setIsRecordingVoice(false);

    const seconds = Math.max(1, recordingSeconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    const waveform = Array.from({ length: 24 }, () => Math.floor(Math.random() * 75) + 25);

    const voiceMsg: CommunityChatMessage = {
      id: `msg-voice-${Date.now()}`,
      chatId: selectedChannelId,
      senderId: 'user-me',
      senderName: identity.name,
      senderDyserNumber: identity.dyserNumber,
      senderAvatar: identity.avatar,
      text: '',
      timestamp: Date.now(),
      isSelf: true,
      status: 'read',
      voiceNote: {
        durationSeconds: seconds,
        durationFormatted: formatted,
        waveform,
      },
    };

    sounds.playSuccess();
    await sendCommunityMessageToFirestore(selectedChannelId, voiceMsg);
    setChannels(getStoredCommunityChannels());
    if (onShowToast) {
      onShowToast({
        title: 'Nota de voz enviada 🎙️',
        message: `Duración: ${formatted}. Tu compañero ya puede escucharla.`,
        type: 'success',
      });
    }
  };

  // Enviar sticker
  const handleSendSticker = async (stickerItem: { url: string; alt: string }) => {
    if (!identity || !selectedChannelId) return;
    setShowStickerTray(false);

    const stickerMsg: CommunityChatMessage = {
      id: `msg-sticker-${Date.now()}`,
      chatId: selectedChannelId,
      senderId: 'user-me',
      senderName: identity.name,
      senderDyserNumber: identity.dyserNumber,
      senderAvatar: identity.avatar,
      text: '',
      timestamp: Date.now(),
      isSelf: true,
      status: 'read',
      sticker: {
        imageUrl: stickerItem.url,
        alt: stickerItem.alt,
        isSelf: true,
      },
    };

    sounds.playPop();
    await sendCommunityMessageToFirestore(selectedChannelId, stickerMsg);
    setChannels(getStoredCommunityChannels());
  };

  // Compartir apunte o resumen de Nasser IA
  const handleShareAttachment = async (type: 'pdf' | 'notes' | 'code') => {
    if (!identity || !selectedChannelId) return;
    setShowAttachMenu(false);

    let attachData = {
      name: 'Apunte_Resumen_Dyser.pdf',
      size: '1.9 MB • 5 páginas',
      preview: 'Síntesis generada y verificada con Nasser IA.',
    };

    if (type === 'notes') {
      attachData = {
        name: 'Sintesis_Axiomas_Exposicion.pdf',
        size: '2.4 MB • 8 páginas',
        preview: 'Puntos clave, axiomas rectores y oratoria.',
      };
    } else if (type === 'code') {
      attachData = {
        name: 'algoritmo_consenso_distribuido.ts',
        size: '18 KB • TypeScript',
        preview: 'Implementación del algoritmo distribuido.',
      };
    }

    const attachMsg: CommunityChatMessage = {
      id: `msg-attach-${Date.now()}`,
      chatId: selectedChannelId,
      senderId: 'user-me',
      senderName: identity.name,
      senderDyserNumber: identity.dyserNumber,
      senderAvatar: identity.avatar,
      text: `He compartido un archivo académico: ${attachData.name}`,
      timestamp: Date.now(),
      isSelf: true,
      status: 'read',
      attachment: {
        type: type === 'code' ? 'code' : 'pdf',
        name: attachData.name,
        sizeFormatted: attachData.size,
        previewText: attachData.preview,
      },
    };

    sounds.playSuccess();
    await sendCommunityMessageToFirestore(selectedChannelId, attachMsg);
    setChannels(getStoredCommunityChannels());
  };

  // Iniciar videollamada de ensayo
  const handleStartVideoCall = () => {
    sounds.playSuccess();
    setIsInRehearsalRoom(true);
    if (onShowToast) {
      onShowToast({
        title: 'Sala de Ensayo Conectada 📹',
        message: 'Iniciando videollamada WebRTC con lámina interactiva en el centro.',
        type: 'info',
      });
    }
  };

  // Canal actualmente seleccionado
  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  // Compañero participante para la videollamada
  const activeCompanion = activeChannel
    ? {
        name: activeChannel.title,
        dyserNumber: activeChannel.companionDyserNumber || '1 36 10',
        avatar: activeChannel.avatar,
        phoneNumber: activeChannel.phoneNumber,
      }
    : undefined;

  // Filtrado de canales para la barra de búsqueda y tabs (reconoce Código Disser oficial "1 60 10", teléfono y nombre)
  const filteredChannels = channels.filter((c) => {
    if (filterTab === 'unread' && c.unreadCount === 0) return false;
    if (filterTab === 'groups' && !c.isGroup) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const qClean = q.replace(/\s+/g, '');
    const companionNumClean = c.companionDyserNumber?.replace(/\s+/g, '').toLowerCase() || '';
    const phoneClean = c.phoneNumber?.replace(/[^\d+]/g, '') || '';

    return (
      c.title.toLowerCase().includes(q) ||
      companionNumClean.includes(qClean) ||
      (c.companionDyserNumber && c.companionDyserNumber.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q)) ||
      phoneClean.includes(qClean) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  // Contacto sugerido si la búsqueda coincide con un Código Disser
  const trimmedSearch = searchQuery.trim();
  const disserContactCandidate = trimmedSearch ? findContactByDisserCode(trimmedSearch) : null;
  const isCandidateAlreadyInList = disserContactCandidate
    ? filteredChannels.some(
        (c) =>
          c.title.toLowerCase() === disserContactCandidate.name.toLowerCase() ||
          (c.companionDyserNumber &&
            c.companionDyserNumber.replace(/\s+/g, '') === disserContactCandidate.disserCode.replace(/\s+/g, ''))
      )
    : false;

  const isGenericValidCode = !disserContactCandidate && isDisserCode(trimmedSearch);
  const isGenericAlreadyInList = isGenericValidCode
    ? filteredChannels.some(
        (c) =>
          c.companionDyserNumber &&
          c.companionDyserNumber.replace(/\s+/g, '') === normalizeDisserCode(trimmedSearch).replace(/\s+/g, '')
      )
    : false;

  // Renderizar avatar tipo WhatsApp
  const renderAvatar = (avatar: string, title: string, sizeClass = 'w-12 h-12 text-sm') => {
    if (avatar === 'SN') {
      return (
        <div
          className={`${sizeClass} rounded-full bg-[#005c4b] text-white font-bold flex items-center justify-center shrink-0 shadow-inner`}
        >
          SN
        </div>
      );
    }
    if (avatar === 'USER_SILHOUETTE') {
      return (
        <div
          className={`${sizeClass} rounded-full bg-[#523d2b] text-amber-200 flex items-center justify-center shrink-0 shadow-inner`}
        >
          <Users className="w-5 h-5" />
        </div>
      );
    }
    if (avatar === 'J') {
      return (
        <div
          className={`${sizeClass} rounded-full bg-[#665518] text-amber-100 font-bold flex items-center justify-center shrink-0 shadow-inner`}
        >
          J
        </div>
      );
    }
    if (avatar === 'R_CLOCK') {
      return (
        <div
          className={`${sizeClass} rounded-full bg-[#1b4348] text-cyan-200 font-bold flex items-center justify-center shrink-0 shadow-inner`}
        >
          R
        </div>
      );
    }
    if (avatar.startsWith('http')) {
      return (
        <img
          src={avatar}
          alt={title}
          className={`${sizeClass} rounded-full object-cover shrink-0 border border-gray-700/60`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-blue-100 dark:bg-[#1d273a] text-[#00236f] dark:text-gray-200 font-bold flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-gray-700`}
      >
        {title.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="w-full h-[calc(100dvh-10rem)] sm:h-[calc(100vh-8.5rem)] min-h-[580px] flex overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c1222] border border-gray-200/90 dark:border-gray-800/80 shadow-xs transition-colors duration-200 relative animate-in fade-in duration-150">
      {/* 1. MODAL O SALA DE ENSAYO INTERACTIVA (WebRTC con Lámina en el Centro) */}
      {isInRehearsalRoom && identity && (
        <DyserRehearsalRoom
          channelTitle={activeChannel?.title || 'Sala de Ensayo Grupal'}
          identity={identity}
          student={student}
          companion={activeCompanion}
          onLeaveRoom={() => setIsInRehearsalRoom(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* 2. MODAL DE AGREGAR COMPAÑERO POR NÚMERO DE TELÉFONO */}
      {showAddCompanionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1628] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddCompanionModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#fe6b00]">
              <UserPlus className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Nuevo Chat Directo</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Escribe el Código Disser o Teléfono</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Escribe el Código Disser del compañero (ej. <span className="text-[#fe6b00] font-mono font-bold">1 60 10</span>) o su número telefónico para empezar a chatear y ensayar de inmediato.
            </p>

            <form onSubmit={handleAddCompanion} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase block mb-1.5">
                  Código Disser ("X Y 10") o Teléfono
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-gray-100 dark:bg-[#141d38] text-xs font-bold text-gray-800 dark:text-gray-200 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 focus:outline-none focus:border-[#fe6b00]"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code} className="bg-white dark:bg-[#0e1628] text-gray-900 dark:text-white">
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value);
                        if (phoneError) setPhoneError(null);
                      }}
                      placeholder="Ej: 1 60 10 o 412 123 4567"
                      className="w-full bg-gray-100 dark:bg-[#141d38] text-xs font-semibold text-gray-900 dark:text-white pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 focus:outline-none focus:border-[#fe6b00]"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Detección automática en vivo del Código Disser */}
                {phoneInput.trim() && (findContactByDisserCode(phoneInput.trim()) || isDisserCode(phoneInput.trim())) && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Código Disser detectado
                      {findContactByDisserCode(phoneInput.trim())?.name
                        ? `: ${findContactByDisserCode(phoneInput.trim())?.name}`
                        : ' (Formato oficial verificado)'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase block mb-1.5">
                  Nombre del Contacto <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ej: Daniel, María..."
                  className="w-full bg-gray-100 dark:bg-[#141d38] text-xs text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 focus:outline-none focus:border-[#fe6b00]"
                />
              </div>

              {phoneError && (
                <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60">
                  {phoneError}
                </p>
              )}

              <button
                type="submit"
                disabled={isAddingCompanion}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fe6b00] to-amber-600 hover:from-[#e56000] hover:to-amber-500 text-white text-xs font-black shadow-md shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAddingCompanion ? 'Conectando...' : 'Iniciar Conversación'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. VISOR DE IMAGEN A PANTALLA COMPLETA */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800/80 hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Vista completa"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL IZQUIERDO: LISTA DE CHATS */}
      {/* ========================================================================= */}
      <aside
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200/80 dark:border-gray-800/70 bg-white dark:bg-[#0d1322] shrink-0 relative ${
          selectedChannelId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera Superior: Barra de Búsqueda estilo Pill */}
        <div className="p-3 bg-gray-50/80 dark:bg-[#0f1628] border-b border-gray-200/80 dark:border-gray-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 dark:text-white tracking-wide">Comunidad</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-[#fe6b00] text-[10px] font-extrabold font-mono">
                Dyser P2P
              </span>
            </div>
            {identity && (
              <button
                onClick={handleCopyDyserNumber}
                className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-[#fe6b00] dark:hover:text-orange-400 font-mono transition"
                title="Copiar mi Número Dyser"
              >
                <span>{identity.dyserNumber}</span>
                {copiedDyserNumber ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {/* Input de Búsqueda */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white dark:bg-[#162038] text-xs text-gray-900 dark:text-white placeholder-gray-400 pl-9 pr-8 py-2 rounded-full border border-gray-200 dark:border-gray-700/60 focus:outline-none focus:border-[#fe6b00] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chips de filtro: Todos, No leídos, Grupos */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[#00236f] dark:bg-[#fe6b00] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#15203a] dark:hover:bg-[#1a2849] text-gray-600 dark:text-gray-400'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                filterTab === 'unread'
                  ? 'bg-[#00236f] dark:bg-[#fe6b00] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#15203a] dark:hover:bg-[#1a2849] text-gray-600 dark:text-gray-400'
              }`}
            >
              No leídos
            </button>
            <button
              onClick={() => setFilterTab('groups')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                filterTab === 'groups'
                  ? 'bg-[#00236f] dark:bg-[#fe6b00] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#15203a] dark:hover:bg-[#1a2849] text-gray-600 dark:text-gray-400'
              }`}
            >
              Grupos
            </button>
          </div>
        </div>

          {/* Listado de Conversaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40">
            {/* Si la búsqueda coincide con un Código Disser del directorio oficial y aún no está en la lista de chats */}
            {disserContactCandidate && !isCandidateAlreadyInList && (
              <div
                onClick={async () => {
                  sounds.playSuccess();
                  const newCh = await addCompanionByPhone(
                    disserContactCandidate.disserCode,
                    disserContactCandidate.name,
                    student
                  );
                  setChannels(getStoredCommunityChannels());
                  setSelectedChannelId(newCh.id);
                  setSearchQuery('');
                  if (onShowToast) {
                    onShowToast({
                      title: `${disserContactCandidate.name} encontrado ✨`,
                      message: `Iniciando chat directo por Código Disser ${disserContactCandidate.disserCode}.`,
                      type: 'success',
                    });
                  }
                }}
                className="w-full px-3.5 py-3 flex items-center gap-3 text-left bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 border-l-4 border-[#fe6b00] transition cursor-pointer"
              >
                <div className="relative shrink-0">
                  {renderAvatar(disserContactCandidate.avatar, disserContactCandidate.name, 'w-12 h-12 text-sm')}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1322]" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block">
                      {disserContactCandidate.name}
                    </span>
                    <span className="text-[10px] font-black text-[#fe6b00] uppercase tracking-wider">
                      Nuevo
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono truncate flex items-center gap-1">
                    <span>Código Disser: {disserContactCandidate.disserCode}</span>
                    <span className="text-gray-500 dark:text-gray-400">• Toca para chatear</span>
                  </p>
                </div>
              </div>
            )}

            {/* Si la búsqueda es un Código Disser válido libre y aún no está en la lista */}
            {isGenericValidCode && !isGenericAlreadyInList && !disserContactCandidate && (
              <div
                onClick={async () => {
                  sounds.playSuccess();
                  const code = normalizeDisserCode(trimmedSearch);
                  const newCh = await addCompanionByPhone(code, undefined, student);
                  setChannels(getStoredCommunityChannels());
                  setSelectedChannelId(newCh.id);
                  setSearchQuery('');
                }}
                className="w-full px-3.5 py-3 flex items-center gap-3 text-left bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-l-4 border-emerald-500 transition cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-inner">
                    #
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block">
                      Compañero ({normalizeDisserCode(trimmedSearch)})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Válido
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-mono truncate">
                    Código Disser verificado • Toca para iniciar chat
                  </p>
                </div>
              </div>
            )}

            {filteredChannels.length === 0 && !disserContactCandidate && !isGenericValidCode ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                <p>No hay conversaciones que coincidan.</p>
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      setPhoneInput(searchQuery.trim());
                    }
                    setShowAddCompanionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-[#fe6b00] font-bold hover:bg-orange-200 dark:hover:bg-orange-500/30 transition text-xs cursor-pointer"
                >
                  + Agregar compañero {searchQuery.trim() ? `"${searchQuery.trim()}"` : ''}
                </button>
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const isSelected = channel.id === selectedChannelId;
                const isUnread = channel.unreadCount > 0;

                return (
                  <div
                    key={channel.id}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedChannelId(channel.id);
                    }}
                    className={`group w-full px-3.5 py-3 flex items-center gap-3 text-left transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-[#182442] border-l-4 border-[#00236f] dark:border-[#fe6b00]'
                        : 'hover:bg-gray-50 dark:hover:bg-[#11192e]'
                    }`}
                  >
                    {/* Avatar circular con badge de estado */}
                    <div className="relative shrink-0">
                      {renderAvatar(channel.avatar, channel.title, 'w-12 h-12 text-sm')}
                      {!channel.isGroup && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1322]" />
                      )}
                    </div>

                    {/* Contenido central del item */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block">
                          {channel.title}
                        </span>
                        <span
                          className={`text-[10px] font-medium shrink-0 ml-1.5 ${
                            isUnread ? 'text-[#fe6b00] font-bold' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {new Date(channel.lastMessageTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Subtítulo: Icono de tipo de mensaje + texto preview */}
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          {channel.lastMessage.includes('Videollamada') ? (
                            <Video className="w-3.5 h-3.5 text-[#fe6b00] shrink-0 inline" />
                          ) : channel.lastMessage.includes('Sticker') ? (
                            <Smile className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
                          ) : channel.lastMessage.includes('✓✓') ? (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0 inline" />
                          ) : null}
                          <span>{channel.lastMessage}</span>
                        </p>

                        {/* Badge de mensajes no leídos con color de acento Dyser */}
                        {isUnread && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#fe6b00] text-white text-[10px] font-black shrink-0 min-w-4 text-center shadow-xs">
                            {channel.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón rápido para eliminar chat al posar cursor */}
                    <button
                      onClick={(e) => handleDeleteChat(channel.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* BOTÓN FLOTANTE DE ACCIÓN RÁPIDA (FAB) */}
          <button
            onClick={() => {
              sounds.playPop();
              setShowAddCompanionModal(true);
            }}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-[#fe6b00] hover:bg-[#e25e00] text-white shadow-xl shadow-orange-500/30 flex items-center justify-center transition active:scale-95 cursor-pointer z-10 border border-orange-400/40"
            title="Agregar a un nuevo compañero por número de teléfono"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </aside>

        {/* ========================================================================= */}
        {/* PANEL DERECHO: VISTA DE CHAT INDIVIDUAL */}
        {/* ========================================================================= */}
        <main
          className={`flex-1 flex flex-col bg-white dark:bg-[#090e1c] relative ${
            !selectedChannelId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* SI NO HAY NINGÚN CHAT SELECCIONADO */}
          {!activeChannel ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 text-[#fe6b00]/60 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Selecciona una conversación</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">
                Elige un contacto de la lista o pulsa el botón naranja para agregar a tus compañeros.
              </p>
              <button
                onClick={() => setShowAddCompanionModal(true)}
                className="px-4 py-2 rounded-xl bg-[#00236f] dark:bg-[#fe6b00] hover:bg-[#1a3880] dark:hover:bg-[#e25e00] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                + Agregar Compañero
              </button>
            </div>
          ) : (
            <>
              {/* 1. CABECERA SUPERIOR DE LA CONVERSACIÓN */}
              <div className="h-16 px-3 sm:px-4 bg-white dark:bg-[#0f1628] border-b border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Flecha de retroceso (móvil y tablet) */}
                  <button
                    onClick={() => setSelectedChannelId('')}
                    className="p-1 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white md:hidden"
                    title="Volver a la lista de chats"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  {/* Foto/Avatar del contacto o grupo */}
                  <div className="relative shrink-0">
                    {renderAvatar(activeChannel.avatar, activeChannel.title, 'w-10 h-10 text-xs')}
                    {!activeChannel.isGroup && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-[#0f1628]" />
                    )}
                  </div>

                  {/* Nombre y Estado de conexión */}
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {activeChannel.title}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                      {activeChannel.subtitle || 'en línea'}
                    </span>
                  </div>
                </div>

                {/* BOTONES DIRECTOS: VIDEOLLAMADA (ENSAYO CON LÁMINA), LLAMADA DE VOZ Y MENÚ */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Botón Videollamada: Abre la sala WebRTC con la lámina interactiva en el centro */}
                  <button
                    onClick={handleStartVideoCall}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#fe6b00] to-amber-600 hover:from-[#e56000] hover:to-amber-500 text-white text-xs font-black shadow-md shadow-orange-500/20 transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-orange-400/40"
                    title="Iniciar Videollamada y Sala de Ensayo con Lámina Interactiva"
                  >
                    <Video className="w-4 h-4 animate-pulse" />
                    <span className="hidden sm:inline">Sala de Ensayo (Lámina)</span>
                  </button>

                  {/* Botón Llamada de Voz */}
                  <button
                    onClick={handleStartVideoCall}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                    title="Llamada de voz"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {/* Menú de opciones */}
                  <button
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast({
                          title: activeChannel.title,
                          message: `Contacto Dyser: ${activeChannel.companionDyserNumber || 'DYS-CP-10'}`,
                          type: 'info',
                        });
                      }
                    }}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                    title="Opciones"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. CUERPO DEL CHAT CON BURBUJAS ESTILO WHATSAPP */}
              <div
                className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 relative bg-[#f8fafc] dark:bg-[#0a0f1d]"
              >
                {/* Separador de Fecha */}
                <div className="flex justify-center my-1.5">
                  <span className="px-3 py-1 rounded-lg bg-white/90 dark:bg-[#141d34] text-gray-600 dark:text-gray-400 text-[10px] font-bold shadow-2xs border border-gray-200/80 dark:border-gray-800/80">
                    Ayer
                  </span>
                </div>

                {/* Renderizado de mensajes */}
                {messages.map((msg) => {
                  const isSelf = msg.isSelf;

                  // 2.1. REGISTRO DE VIDEOLLAMADA
                  if (msg.callLog) {
                    return (
                      <div
                        key={msg.id}
                        className="my-1.5 max-w-[85%] sm:max-w-xs rounded-2xl p-3 bg-emerald-50 dark:bg-[#0d2122] border border-emerald-300 dark:border-[#005c4b]/50 shadow-2xs text-gray-900 dark:text-white flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500 transition"
                        onClick={handleStartVideoCall}
                        title="Toca para devolver la videollamada y entrar a la sala de ensayo con la lámina"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-gray-900 dark:text-white">
                              {msg.callLog.label || 'Videollamada'}
                            </span>
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 block">
                              {msg.callLog.duration || 'Sin respuesta'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase tracking-wider">
                            Reensayar
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // 2.2. BURBUJA DE STICKER TRANSPARENTE (Exacto a la captura de WhatsApp sin tarjeta circundante)
                  if (msg.sticker) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col my-1 ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="relative group">
                          <img
                            src={msg.sticker.imageUrl}
                            alt={msg.sticker.alt || 'Sticker'}
                            className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-2xl drop-shadow-xl select-none"
                            loading="lazy"
                          />
                          {/* Badge flotante con hora y doble check */}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] text-gray-200 font-mono flex items-center gap-1">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isSelf && (
                              <CheckCheck className="w-3 h-3 text-cyan-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // 2.3. BURBUJA DE IMAGEN / FOTO
                  if (msg.imageMedia) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col my-1 ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-xs rounded-2xl overflow-hidden shadow-md border relative ${
                            isSelf
                              ? 'bg-blue-50 dark:bg-[#003859] border-blue-200 dark:border-blue-600/40 text-gray-900 dark:text-white'
                              : 'bg-white dark:bg-[#15203a] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="relative group cursor-pointer" onClick={() => setPreviewImage(msg.imageMedia?.imageUrl || null)}>
                            <img
                              src={msg.imageMedia.imageUrl}
                              alt="Archivo multimedia"
                              className="w-full h-44 object-cover"
                            />
                            {/* Overlay de tamaño / descarga (160 KB) */}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-90 group-hover:opacity-100 transition">
                              <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 border border-white/20">
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>{msg.imageMedia.sizeFormatted || '160 KB'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="p-2 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
                            <span className="truncate pr-2 font-medium">
                              {msg.imageMedia.caption || 'Fotografía de estudio'}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 font-mono">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isSelf && <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2.4. BURBUJA ESTÁNDAR (TEXTO, NOTAS DE VOZ, ARCHIVOS ADJUNTOS)
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col my-0.5 ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md rounded-2xl p-2.5 sm:p-3 shadow-2xs text-xs relative ${
                          isSelf
                            ? 'bg-[#00236f] dark:bg-[#00405c] text-white rounded-tr-xs border border-blue-900/40 dark:border-cyan-600/30'
                            : 'bg-white dark:bg-[#18233c] text-gray-900 dark:text-gray-100 rounded-tl-xs border border-gray-200/90 dark:border-gray-800/80 shadow-2xs'
                        }`}
                      >
                        {/* Remitente en chats grupales */}
                        {!isSelf && activeChannel.isGroup && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-bold text-[#fe6b00] text-[11px]">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                              {msg.senderDyserNumber}
                            </span>
                          </div>
                        )}

                        {/* Texto */}
                        {msg.text && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words text-[12px] sm:text-[13px]">
                            {msg.text}
                          </p>
                        )}

                        {/* Adjunto si aplica */}
                        {msg.attachment && (
                          <div className="mt-2 p-2 rounded-xl bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-[#fe6b00] shrink-0">
                                <FileText className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 dark:text-white truncate block text-[11px]">
                                  {msg.attachment.name}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-300 block">
                                  {msg.attachment.sizeFormatted}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Nota de voz interactiva */}
                        {msg.voiceNote && (
                          <div className="mt-1.5 p-2 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center gap-2.5 w-60 max-w-full">
                            <button
                              onClick={() => {
                                sounds.playPop();
                                setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id);
                              }}
                              className="w-8 h-8 rounded-full bg-[#00236f] dark:bg-[#fe6b00] hover:opacity-90 text-white flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer shadow-xs"
                            >
                              {playingVoiceId === msg.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1 flex items-center gap-0.5 h-5">
                              {msg.voiceNote.waveform.map((bar, i) => (
                                <span
                                  key={i}
                                  className={`flex-1 rounded-full transition-all duration-300 ${
                                    playingVoiceId === msg.id
                                      ? 'bg-[#fe6b00] dark:bg-orange-400 animate-pulse'
                                      : 'bg-gray-300 dark:bg-gray-400/60'
                                  }`}
                                  style={{ height: `${Math.max(20, (bar / 100) * 100)}%` }}
                                />
                              ))}
                            </div>

                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-300 shrink-0">
                              {msg.voiceNote.durationFormatted}
                            </span>
                          </div>
                        )}

                        {/* Pie de burbuja: Hora y Checks dobles */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                          isSelf ? 'text-blue-100/90 dark:text-gray-300/80' : 'text-gray-400 dark:text-gray-400'
                        }`}>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isSelf && (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-200 dark:text-cyan-400 inline ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* 3. TRAY DE STICKERS (SELECCIONADOR RÁPIDO) */}
              {showStickerTray && (
                <div className="p-3 bg-gray-50 dark:bg-[#0d1424] border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 overflow-x-auto shrink-0 animate-in slide-in-from-bottom-2 duration-150">
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider shrink-0">
                    Stickers Dyser:
                  </span>
                  {QUICK_STICKERS.map((stk, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendSticker(stk)}
                      className="p-1 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0 cursor-pointer group shadow-2xs"
                      title={stk.label}
                    >
                      <img
                        src={stk.url}
                        alt={stk.alt}
                        className="w-12 h-12 object-cover rounded-lg group-hover:scale-105 transition"
                      />
                    </button>
                  ))}
                  <button
                    onClick={() => setShowStickerTray(false)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 4. BARRA DE ENTRADA INFERIOR */}
              <div className="p-2 sm:p-2.5 bg-white dark:bg-[#0f1628] border-t border-gray-200/80 dark:border-gray-800/80 shrink-0 relative">
                {/* Menú flotante de adjuntos */}
                {showAttachMenu && (
                  <div className="absolute bottom-16 left-12 bg-white dark:bg-[#141e3a] border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-xl p-2 flex flex-col gap-1 w-56 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <button
                      onClick={() => handleShareAttachment('pdf')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-600/20 hover:text-[#00236f] dark:hover:text-blue-300 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span>Compartir Apunte PDF</span>
                    </button>
                    <button
                      onClick={() => handleShareAttachment('notes')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-600/20 hover:text-[#fe6b00] flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#fe6b00]" />
                      <span>Resumen Nasser IA</span>
                    </button>
                    <button
                      onClick={() => handleShareAttachment('code')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-600/20 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>Código / Script</span>
                    </button>
                  </div>
                )}

                {/* Si está grabando nota de voz */}
                {isRecordingVoice ? (
                  <div className="flex items-center justify-between gap-3 bg-rose-50 dark:bg-[#15203d] border border-rose-300 dark:border-rose-500/50 p-2 rounded-2xl animate-pulse">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span>Grabando nota de voz: {recordingSeconds}s</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRecordingVoice(false)}
                        className="px-3 py-1 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs font-bold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSendVoiceNote}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Barra con dos bloques: píldora de texto a la izquierda y botón circular a la derecha */
                  <div className="flex items-center gap-2">
                    {/* Contenedor tipo píldora alargada */}
                    <div className="flex-1 flex items-center bg-gray-100 dark:bg-[#15203a] rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-700/60 focus-within:border-[#fe6b00] transition">
                      {/* Botón de Stickers/Emoji */}
                      <button
                        type="button"
                        onClick={() => setShowStickerTray((prev) => !prev)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                        title="Abrir stickers de Dyser"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {/* Campo de texto con placeholder "Mensaje" */}
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Mensaje"
                        className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 px-2 py-1.5 focus:outline-none"
                      />

                      {/* Botón Clip para adjuntar */}
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu((prev) => !prev)}
                        className={`p-1.5 transition cursor-pointer ${
                          showAttachMenu ? 'text-[#fe6b00]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title="Adjuntar apunte o archivo"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      {/* Botón Cámara rápida */}
                      <button
                        type="button"
                        onClick={() => handleShareAttachment('notes')}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                        title="Compartir captura / apunte rápido"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Botón circular a la derecha (Micrófono o Enviar) */}
                    {inputText.trim() ? (
                      <button
                        onClick={handleSendMessage}
                        className="w-11 h-11 rounded-full bg-[#00236f] hover:bg-[#001c59] dark:bg-[#fe6b00] dark:hover:bg-[#e25e00] text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer shrink-0"
                        title="Enviar mensaje"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playPop();
                          setIsRecordingVoice(true);
                        }}
                        className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#15203a] dark:hover:bg-[#1c2b4e] text-[#00236f] dark:text-[#fe6b00] flex items-center justify-center border border-gray-200 dark:border-gray-700/60 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                        title="Grabar nota de voz"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    );
  };
