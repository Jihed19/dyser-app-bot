import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { StudentProfile } from '../types';
import { initialStudentProfile } from '../data/mockData';
import {
  generateDisserCode,
  findContactByDisserCode,
  isDisserCode,
  normalizeDisserCode,
  KNOWN_DISSER_DIRECTORY,
} from './disserCodeService';

// Servidores STUN gratuitos de Google para negociación WebRTC
export const GOOGLE_STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// -------------------------------------------------------------
// MODELO DE DATOS DE LA COMUNIDAD DYSER
// -------------------------------------------------------------

export interface DyserIdentity {
  dyserNumber: string; // ej. DYS-AL-8410
  name: string;
  initials: string;
  avatar: string;
  program: string;
  semester: string;
  status: 'online' | 'ensayando' | 'ocupado' | 'offline';
  assignedAt: number;
}

export interface CommunityAttachment {
  type: 'pdf' | 'code' | 'image' | 'slide' | 'notes';
  name: string;
  sizeFormatted: string;
  downloadUrl?: string;
  previewText?: string;
}

export interface CommunityVoiceNote {
  durationSeconds: number;
  durationFormatted: string;
  audioUrl?: string;
  waveform: number[];
}

export interface CommunityCallLog {
  type: 'video' | 'voice';
  status: 'missed' | 'completed' | 'no_answer';
  label?: string; // e.g. "Videollamada", "Llamada de voz"
  duration?: string; // e.g. "Sin respuesta", "14 min"
}

export interface CommunitySticker {
  imageUrl: string;
  alt?: string;
  isSelf?: boolean;
}

export interface CommunityImageMedia {
  imageUrl: string;
  caption?: string;
  sizeFormatted?: string;
  downloaded?: boolean;
}

export interface CommunityChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderDyserNumber: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachment?: CommunityAttachment;
  voiceNote?: CommunityVoiceNote;
  sticker?: CommunitySticker;
  imageMedia?: CommunityImageMedia;
  callLog?: CommunityCallLog;
}

export interface CommunityChatChannel {
  id: string;
  title: string;
  subtitle?: string;
  avatar: string;
  isGroup: boolean;
  subject?: string;
  phoneNumber?: string;
  companionDyserNumber?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTimestamp: number;
  membersCount?: number;
  participants: {
    name: string;
    dyserNumber: string;
    avatar: string;
    role?: string;
    phoneNumber?: string;
  }[];
  hasActiveRehearsal?: boolean;
}

// -------------------------------------------------------------
// CONSTANTES Y CLAVES DE ALMACENAMIENTO
// -------------------------------------------------------------

const LOCAL_STORAGE_KEYS = {
  MY_IDENTITY: 'dyser_my_identity_v2',
  COMMUNITY_CHANNELS: 'dyser_community_channels_v5',
  COMMUNITY_MESSAGES_PREFIX: 'dyser_community_msgs_v5_',
};

// Canales iniciales inspirados 100% en la interfaz de WhatsApp de las capturas del usuario
export const INITIAL_WHATSAPP_CHANNELS: CommunityChatChannel[] = [
  {
    id: 'chat-shedya-naser',
    title: 'Shedya Naser',
    subtitle: 'últ. vez ayer a las 3:30 p. m.',
    avatar: 'SN',
    isGroup: false,
    phoneNumber: '+58 412-555-1234',
    companionDyserNumber: '1 36 10', // S (1) + H (36) + 10
    unreadCount: 0,
    lastMessage: '📹 Videollamada',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 18,
    participants: [
      {
        name: 'Shedya Naser',
        dyserNumber: '1 36 10',
        avatar: 'SN',
        phoneNumber: '+58 412-555-1234',
      },
    ],
  },
  {
    id: 'chat-clarines-compra-venta',
    title: 'Compra&Venta Clarines 💸💰💳',
    subtitle: 'Daniela Donatti, Carmen...',
    avatar: 'https://images.unsplash.com/photo-1548625361-16a75f0a2022?w=150',
    isGroup: true,
    unreadCount: 793,
    lastMessage: '~ Daniela Donatti💜: 📷 Mantequillas Corpor...',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 25,
    participants: [],
  },
  {
    id: 'chat-bruzual-compra-venta',
    title: 'Compra/Venta - Manuel Ezequiel Bruz...',
    subtitle: 'Comunidad Bruzual',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
    isGroup: true,
    unreadCount: 387,
    lastMessage: '~ Carmen Triana: Quien con masa de cachap...',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 45,
    participants: [],
  },
  {
    id: 'chat-los-amo',
    title: 'Los amo ❤️🍒❤️',
    subtitle: 'Familia Dyser',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150',
    isGroup: true,
    unreadCount: 6,
    lastMessage: 'Tati Hermosa : 🗂️ Sticker',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 5,
    participants: [],
  },
  {
    id: 'chat-profe-herminia',
    title: 'Profe Herminia Chacin',
    subtitle: 'últ. vez ayer a las 7:15 p. m.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isGroup: false,
    phoneNumber: '+58 414-789-0123',
    companionDyserNumber: '36 10 10', // H (36) + E (10) + 10
    unreadCount: 0,
    lastMessage: 'Gracias 😊',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    participants: [],
  },
  {
    id: 'chat-num-414',
    title: '+58 414-0927436',
    subtitle: '+58 414-0927436',
    avatar: 'USER_SILHOUETTE',
    isGroup: false,
    phoneNumber: '+58 414-0927436',
    companionDyserNumber: '32 1 10', // D (32) + A (1) + 10
    unreadCount: 0,
    lastMessage: '✓✓ Hola en 250$',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 25,
    participants: [],
  },
  {
    id: 'chat-num-838',
    title: '+58 424-8381681',
    subtitle: '+58 424-8381681',
    avatar: 'J',
    isGroup: false,
    phoneNumber: '+58 424-8381681',
    companionDyserNumber: '11 19 10', // Jihad Nasser: J (11) + I (19) + 10
    unreadCount: 0,
    lastMessage: 'Que precio??',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 26,
    participants: [],
  },
  {
    id: 'chat-num-857',
    title: '+58 424-8573039',
    subtitle: '+58 424-8573039',
    avatar: 'R_CLOCK',
    isGroup: false,
    phoneNumber: '+58 424-8573039',
    companionDyserNumber: '9 12 10', // R (9) + C (12) + 10
    unreadCount: 0,
    lastMessage: '✓✓ Hola En 250$',
    lastMessageTimestamp: Date.now() - 1000 * 60 * 60 * 27,
    participants: [],
  },
];

export const INITIAL_COMMUNITY_CHANNELS: CommunityChatChannel[] = INITIAL_WHATSAPP_CHANNELS;

/**
 * Mensajes de Shedya Naser tomados con fidelidad de la captura del usuario
 */
export const INITIAL_SHEDYA_MESSAGES: CommunityChatMessage[] = [
  {
    id: 'msg-sn-1',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: 'No hagas bulla para que no te regañen',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    isSelf: false,
    status: 'read',
  },
  {
    id: 'msg-sn-2',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 18 + 60000,
    isSelf: false,
    status: 'read',
    imageMedia: {
      imageUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=600',
      caption: 'Experimento térmico con ignición controlada',
      sizeFormatted: '160 KB',
      downloaded: true,
    },
    sticker: {
      imageUrl: 'https://api.iconify.design/fluent-emoji:fire.svg',
      alt: 'Bonfire character sticker',
    },
  },
  {
    id: 'msg-sn-3',
    chatId: 'chat-shedya-naser',
    senderId: 'user-me',
    senderName: 'Alejandro Valenzuela',
    senderDyserNumber: '1 60 10',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 17,
    isSelf: true,
    status: 'read',
    sticker: {
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300',
      alt: 'Robot meme sticker',
      isSelf: true,
    },
  },
  {
    id: 'msg-sn-4',
    chatId: 'chat-shedya-naser',
    senderId: 'user-me',
    senderName: 'Alejandro Valenzuela',
    senderDyserNumber: '1 60 10',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 17 + 20000,
    isSelf: true,
    status: 'read',
    sticker: {
      imageUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300',
      alt: 'Streamer meme sticker',
      isSelf: true,
    },
  },
  {
    id: 'msg-sn-5',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 15,
    isSelf: false,
    status: 'read',
    callLog: {
      type: 'video',
      label: 'Videollamada',
      duration: 'Sin respuesta',
      status: 'missed',
    },
  },
  {
    id: 'msg-sn-6',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 15 + 15000,
    isSelf: false,
    status: 'read',
    callLog: {
      type: 'video',
      label: 'Videollamada',
      duration: 'Sin respuesta',
      status: 'missed',
    },
  },
  {
    id: 'msg-sn-7',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 14,
    isSelf: false,
    status: 'read',
    callLog: {
      type: 'video',
      label: 'Videollamada',
      duration: 'Sin respuesta',
      status: 'missed',
    },
  },
  {
    id: 'msg-sn-8',
    chatId: 'chat-shedya-naser',
    senderId: 'contact-shedya',
    senderName: 'Shedya Naser',
    senderDyserNumber: '1 36 10',
    senderAvatar: 'SN',
    text: '',
    timestamp: Date.now() - 1000 * 60 * 60 * 13,
    isSelf: false,
    status: 'read',
    callLog: {
      type: 'video',
      label: 'Videollamada',
      duration: 'Sin respuesta',
      status: 'missed',
    },
  },
];

/**
 * Genera el Código Disser oficial según la regla exacta:
 * 1. Toma las dos primeras letras del nombre del usuario registrado (ejemplo: Alejandro -> A y L).
 * 2. Busca su valor en la matriz oficial de conversión:
 *    A = 1, B = 4, C = 12, D = 32, E = 10, F = 128, G = 68, H = 36, I = 19
 *    J = 11, K = 28, L = 60, M = 116, N = 160, O = 44, P = 20, Q = 32, R = 9
 *    S = 1, T = 4, U = 32, V = 32, W = 8, X = 36, Y = 30, Z = 2
 * 3. Cada código generado debe terminar obligatoriamente y sin excepciones en el número 10.
 * 4. Ejemplo práctico para Alejandro: A (1) + L (60) + cierre (10) = "1 60 10".
 */
export function generateDyserNumber(fullName: string): string {
  return generateDisserCode(fullName);
}

/**
 * Obtiene o asigna automáticamente la identidad de Alejandro (o usuario actual)
 * y la sincroniza en Firebase Firestore de forma transparente.
 */
export async function getOrAssignDyserIdentity(student?: StudentProfile): Promise<DyserIdentity> {
  const studentName = student?.name || initialStudentProfile.name;
  const avatar = student?.avatar || initialStudentProfile.avatar;

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.MY_IDENTITY);
    if (cached) {
      const parsed: DyserIdentity = JSON.parse(cached);
      // Validar que use el código Disser oficial (termina en 10 y no inicia con DYS-)
      if (
        parsed.name === studentName &&
        parsed.dyserNumber &&
        parsed.dyserNumber.endsWith('10') &&
        !parsed.dyserNumber.startsWith('DYS-')
      ) {
        syncIdentityToFirebase(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Dyser Community] Error leyendo identidad local:', e);
  }

  // Generar con la regla exacta oficial
  const dyserNumber = generateDisserCode(studentName);
  const initials = studentName.substring(0, 2).toUpperCase();

  const newIdentity: DyserIdentity = {
    dyserNumber,
    name: studentName,
    initials,
    avatar,
    program: student?.program || initialStudentProfile.program,
    semester: student?.semester || initialStudentProfile.semester,
    status: 'online',
    assignedAt: Date.now(),
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MY_IDENTITY, JSON.stringify(newIdentity));
  } catch (e) {}

  syncIdentityToFirebase(newIdentity);
  return newIdentity;
}

/**
 * Sincroniza la identidad en Firestore de forma transparente
 */
export async function syncIdentityToFirebase(identity: DyserIdentity): Promise<void> {
  try {
    const docRef = doc(db, 'dyser_identities', 'current_student');
    await setDoc(
      docRef,
      {
        ...identity,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.debug('[Firebase] Modo local para identidad Dyser.');
  }
}

// -------------------------------------------------------------
// GESTIÓN DE CANALES Y COMPAÑEROS POR NÚMERO DE TELÉFONO
// -------------------------------------------------------------

// Avatares variados de alta calidad para nuevos compañeros agregados
const COMPANION_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
];

/**
 * Obtiene los canales de chat activos del usuario.
 * Se purgan automáticamente canales de prueba anteriores para garantizar que
 * la lista inicie limpia según la solicitud del usuario.
 */
export function getStoredCommunityChannels(): CommunityChatChannel[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.COMMUNITY_CHANNELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrar automáticamente números al formato oficial Código Disser si alguno tiene el prefijo anterior DYS-
        let hasChanges = false;
        const migrated: CommunityChatChannel[] = parsed.map((ch: CommunityChatChannel) => {
          const updated = { ...ch };
          if (updated.companionDyserNumber && updated.companionDyserNumber.startsWith('DYS-')) {
            updated.companionDyserNumber = generateDisserCode(updated.title);
            hasChanges = true;
          }
          if (Array.isArray(updated.participants)) {
            updated.participants = updated.participants.map((p) => {
              if (p.dyserNumber && p.dyserNumber.startsWith('DYS-')) {
                hasChanges = true;
                return { ...p, dyserNumber: generateDisserCode(p.name) };
              }
              return p;
            });
          }
          return updated;
        });

        if (hasChanges) {
          saveStoredCommunityChannels(migrated);
        }
        return migrated;
      }
    }
  } catch (e) {
    console.warn('[Community] Error leyendo canales guardados:', e);
  }

  // Si no hay canales, sembramos con la lista visual de WhatsApp de las capturas
  try {
    saveStoredCommunityChannels(INITIAL_WHATSAPP_CHANNELS);
    saveLocalMessagesForChat('chat-shedya-naser', INITIAL_SHEDYA_MESSAGES);
  } catch (_) {}

  return INITIAL_WHATSAPP_CHANNELS;
}

/**
 * Guarda los canales en almacenamiento local y emite evento reactivo
 */
export function saveStoredCommunityChannels(channels: CommunityChatChannel[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMMUNITY_CHANNELS, JSON.stringify(channels));
    window.dispatchEvent(new CustomEvent('dyser-channels-changed', { detail: channels }));
  } catch (e) {
    console.warn('[Community] Error guardando canales:', e);
  }
}

/**
 * Formatea y normaliza un número telefónico (conserva dígitos y '+' si aplica)
 */
export function formatPhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Limpiar espacios dobles y guiones raros
  return trimmed.replace(/[^\d+]/g, '');
}

/**
 * Agrega o busca un compañero mediante su Código Disser ("1 60 10") o número de teléfono.
 * Crea el canal individual, le asigna su Código Disser oficial y lo selecciona para chatear.
 */
export async function addCompanionByPhone(
  rawInput: string,
  companionName?: string,
  studentProfile?: StudentProfile
): Promise<CommunityChatChannel> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Por favor ingresa un Código Disser (ej. 1 60 10) o número telefónico.');
  }

  const existingChannels = getStoredCommunityChannels();

  // 1. Verificar si es un Código Disser oficial ("X Y 10") o contacto del directorio
  const matchedContact = findContactByDisserCode(trimmed);
  const isCode = isDisserCode(trimmed) || !!matchedContact;

  if (isCode) {
    const targetCode = matchedContact?.disserCode || normalizeDisserCode(trimmed);
    const existing = existingChannels.find(
      (c) =>
        (c.companionDyserNumber && c.companionDyserNumber.replace(/\s+/g, '') === targetCode.replace(/\s+/g, '')) ||
        (matchedContact && c.title.toLowerCase() === matchedContact.name.toLowerCase())
    );
    if (existing) {
      return existing;
    }

    // Crear nuevo canal a partir del Código Disser
    const myIdentity = await getOrAssignDyserIdentity(studentProfile);
    const displayName = companionName?.trim() || matchedContact?.name || `Compañero ${targetCode}`;
    const avatarUrl = matchedContact?.avatar && matchedContact.avatar !== 'USER_SILHOUETTE'
      ? matchedContact.avatar
      : COMPANION_AVATARS[0];
    const phone = matchedContact?.phoneNumber || `Código ${targetCode}`;

    const newChannelId = `chat-disser-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newChannel: CommunityChatChannel = {
      id: newChannelId,
      title: displayName,
      subtitle: `${targetCode} • En línea`,
      avatar: avatarUrl,
      phoneNumber: phone,
      companionDyserNumber: targetCode,
      isGroup: false,
      subject: matchedContact?.program || 'Compañero de Estudio',
      unreadCount: 0,
      lastMessage: 'Chat iniciado • Listo para enviar mensajes y ensayar',
      lastMessageTimestamp: Date.now(),
      membersCount: 2,
      hasActiveRehearsal: false,
      participants: [
        {
          name: myIdentity.name,
          dyserNumber: myIdentity.dyserNumber,
          avatar: myIdentity.avatar,
          role: 'Tú',
        },
        {
          name: displayName,
          dyserNumber: targetCode,
          avatar: avatarUrl,
          role: 'Compañero',
          phoneNumber: phone,
        },
      ],
    };

    const welcomeMsg: CommunityChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      chatId: newChannelId,
      senderId: 'system',
      senderName: 'Dyser Comunidad',
      senderDyserNumber: '10 10 10',
      senderAvatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
      text: `👋 ¡Chat conectado con ${displayName} (${targetCode})!\nAquí puedes enviarle mensajes de texto, notas de voz, adjuntar apuntes y pulsar "Sala de Ensayo (Lámina)" para ensayar juntos.`,
      timestamp: Date.now(),
      isSelf: false,
      status: 'read',
    };

    saveLocalMessagesForChat(newChannelId, [welcomeMsg]);
    const updatedChannels = [newChannel, ...existingChannels];
    saveStoredCommunityChannels(updatedChannels);

    try {
      const channelDocRef = doc(db, 'community_channels', newChannelId);
      await setDoc(channelDocRef, {
        ...newChannel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (_) {}

    return newChannel;
  }

  // 2. Manejo estándar por número de teléfono
  const phone = formatPhoneNumber(trimmed);
  if (!phone) {
    throw new Error('Por favor ingresa un número de teléfono válido o Código Disser (ej. 1 60 10).');
  }

  // Si ya existe un chat con este número telefónico, devolverlo
  const existing = existingChannels.find(
    (c) => c.phoneNumber === phone || c.title.includes(phone)
  );
  if (existing) {
    return existing;
  }

  // Crear nuevo compañero
  const myIdentity = await getOrAssignDyserIdentity(studentProfile);
  const displayName = companionName?.trim() || `Compañero ${phone}`;
  const companionDyserNumber = generateDisserCode(displayName);

  // Seleccionar avatar rotativo
  const avatarIndex = Math.abs(phone.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % COMPANION_AVATARS.length;
  const avatarUrl = COMPANION_AVATARS[avatarIndex];

  const newChannelId = `chat-phone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newChannel: CommunityChatChannel = {
    id: newChannelId,
    title: displayName,
    subtitle: `${phone} • En línea`,
    avatar: avatarUrl,
    phoneNumber: phone,
    companionDyserNumber,
    isGroup: false,
    subject: 'Compañero de Estudio',
    unreadCount: 0,
    lastMessage: 'Chat iniciado • Listo para enviar mensajes y ensayar',
    lastMessageTimestamp: Date.now(),
    membersCount: 2,
    hasActiveRehearsal: false,
    participants: [
      {
        name: myIdentity.name,
        dyserNumber: myIdentity.dyserNumber,
        avatar: myIdentity.avatar,
        role: 'Tú',
      },
      {
        name: displayName,
        dyserNumber: companionDyserNumber,
        avatar: avatarUrl,
        role: 'Compañero',
        phoneNumber: phone,
      },
    ],
  };

  const welcomeMsg: CommunityChatMessage = {
    id: `msg-welcome-${Date.now()}`,
    chatId: newChannelId,
    senderId: 'system',
    senderName: 'Dyser Comunidad',
    senderDyserNumber: '10 10 10',
    senderAvatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
    text: `👋 ¡Chat conectado con ${displayName} (${phone})!\nCódigo Disser generado: ${companionDyserNumber}\nAquí puedes enviarle mensajes de texto, notas de voz, adjuntar apuntes y pulsar "Sala de Ensayo (Lámina)" para ensayar juntos con la lámina interactiva en el centro.`,
    timestamp: Date.now(),
    isSelf: false,
    status: 'read',
  };

  saveLocalMessagesForChat(newChannelId, [welcomeMsg]);

  // Guardar canal
  const updatedChannels = [newChannel, ...existingChannels];
  saveStoredCommunityChannels(updatedChannels);

  // Sincronizar en Firebase Firestore de forma transparente
  try {
    const channelDocRef = doc(db, 'community_channels', newChannelId);
    await setDoc(channelDocRef, {
      ...newChannel,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const msgDocRef = doc(db, 'community_chats', newChannelId, 'messages', welcomeMsg.id);
    await setDoc(msgDocRef, {
      ...welcomeMsg,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.debug('[Firebase] Canal y mensaje guardados en modo local.');
  }

  return newChannel;
}

/**
 * Elimina una conversación de compañeros
 */
export async function deleteCommunityChannel(channelId: string): Promise<void> {
  const channels = getStoredCommunityChannels();
  const updated = channels.filter((c) => c.id !== channelId);
  saveStoredCommunityChannels(updated);

  try {
    localStorage.removeItem(`${LOCAL_STORAGE_KEYS.COMMUNITY_MESSAGES_PREFIX}${channelId}`);
    const channelDocRef = doc(db, 'community_channels', channelId);
    await deleteDoc(channelDocRef);
  } catch (_) {}
}

// -------------------------------------------------------------
// FUNCIONES DE SINCRONIZACIÓN DE MENSAJES (FIRESTORE + CACHÉ)
// -------------------------------------------------------------

export function getLocalMessagesForChat(chatId: string): CommunityChatMessage[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEYS.COMMUNITY_MESSAGES_PREFIX}${chatId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Community] Error leyendo mensajes locales:', e);
  }

  if (chatId === 'chat-shedya-naser') {
    try {
      saveLocalMessagesForChat('chat-shedya-naser', INITIAL_SHEDYA_MESSAGES);
    } catch (_) {}
    return INITIAL_SHEDYA_MESSAGES;
  }

  return [];
}

export function saveLocalMessagesForChat(chatId: string, messages: CommunityChatMessage[]): void {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.COMMUNITY_MESSAGES_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (e) {}
}

/**
 * Suscripción en tiempo real a los mensajes de un chat en Firebase Firestore
 */
export function subscribeToCommunityMessages(
  chatId: string,
  callback: (messages: CommunityChatMessage[]) => void
): () => void {
  // Entregar inmediatamente caché local
  const cachedMessages = getLocalMessagesForChat(chatId);
  callback(cachedMessages);

  if (!chatId) return () => {};

  try {
    const messagesCol = collection(db, 'community_chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteMsgs: CommunityChatMessage[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              chatId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderDyserNumber: data.senderDyserNumber || 'DYS-XX-10',
              senderAvatar: data.senderAvatar,
              text: data.text || '',
              timestamp: data.timestamp || Date.now(),
              isSelf: data.senderId === 'user-me' || data.senderName === initialStudentProfile.name,
              status: data.status || 'read',
              attachment: data.attachment,
              voiceNote: data.voiceNote,
            };
          });

          saveLocalMessagesForChat(chatId, remoteMsgs);
          callback(remoteMsgs);
        } else {
          // Si está vacío en Firestore pero tenemos en local, sincronizar
          if (cachedMessages.length > 0) {
            cachedMessages.forEach((msg) => {
              try {
                setDoc(doc(messagesCol, msg.id), msg);
              } catch (_) {}
            });
          }
        }
      },
      () => {
        callback(getLocalMessagesForChat(chatId));
      }
    );

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

/**
 * Enviar mensaje de chat a Firebase Firestore y caché local
 */
export async function sendCommunityMessageToFirestore(
  chatId: string,
  message: CommunityChatMessage
): Promise<void> {
  const current = getLocalMessagesForChat(chatId);
  const updated = [...current, message];
  saveLocalMessagesForChat(chatId, updated);

  window.dispatchEvent(
    new CustomEvent('dyser-community-message-sent', { detail: { chatId, message } })
  );

  // Actualizar también en el listado de canales locales para reflejar el último mensaje
  const channels = getStoredCommunityChannels();
  const channelIndex = channels.findIndex((c) => c.id === chatId);
  if (channelIndex >= 0) {
    channels[channelIndex].lastMessage =
      message.text || (message.attachment ? `📎 ${message.attachment.name}` : '🎤 Nota de voz');
    channels[channelIndex].lastMessageTimestamp = message.timestamp;
    saveStoredCommunityChannels([...channels]);
  }

  // Persistir en Firestore
  try {
    const messageDocRef = doc(db, 'community_chats', chatId, 'messages', message.id);
    await setDoc(messageDocRef, {
      ...message,
      createdAt: serverTimestamp(),
    });

    const chatDocRef = doc(db, 'community_channels', chatId);
    await setDoc(
      chatDocRef,
      {
        lastMessage: message.text || (message.attachment ? `📎 ${message.attachment.name}` : '🎤 Nota de voz'),
        lastMessageTimestamp: message.timestamp,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.debug('[Firebase] Mensaje guardado localmente.');
  }
}
