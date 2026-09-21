/**
 * SERVICIO OFICIAL DE CÓDIGOS DISSER ("Número Dyser")
 * 
 * Regla de generación:
 * 1. Toma las dos primeras letras del nombre del usuario registrado (ej. Alejandro -> A y L).
 * 2. Busca su valor en la matriz oficial de conversión:
 *    A = 1,   B = 4,   C = 12,  D = 32,  E = 10,  F = 128, G = 68,  H = 36,  I = 19,
 *    J = 11,  K = 28,  L = 60,  M = 116, N = 160, O = 44,  P = 20,  Q = 32,  R = 9,
 *    S = 1,   T = 4,   U = 32,  V = 32,  W = 8,   X = 36,  Y = 30,  Z = 2
 * 3. Cada código generado debe terminar obligatoriamente y sin excepciones en el número 10.
 * 4. Ejemplo práctico para Alejandro: A (1) + L (60) + cierre (10) = "1 60 10".
 * 5. Se guarda automáticamente en el perfil de Firebase de forma transparente al registrarse.
 */

export const DISSER_CONVERSION_MATRIX: Readonly<Record<string, number>> = Object.freeze({
  A: 1,
  B: 4,
  C: 12,
  D: 32,
  E: 10,
  F: 128,
  G: 68,
  H: 36,
  I: 19,
  J: 11,
  K: 28,
  L: 60,
  M: 116,
  N: 160,
  O: 44,
  P: 20,
  Q: 32,
  R: 9,
  S: 1,
  T: 4,
  U: 32,
  V: 32,
  W: 8,
  X: 36,
  Y: 30,
  Z: 2,
});

/**
 * Tabla inversa para decodificar códigos hacia letras candidatas
 */
export const INVERSE_DISSER_MATRIX: Readonly<Record<number, string[]>> = Object.freeze(
  Object.entries(DISSER_CONVERSION_MATRIX).reduce((acc, [letter, value]) => {
    if (!acc[value]) acc[value] = [];
    acc[value].push(letter);
    return acc;
  }, {} as Record<number, string[]>)
);

/**
 * Genera el Código Disser oficial a partir del nombre del usuario.
 * @param fullName Nombre completo o de usuario (ej. "Alejandro Valenzuela")
 * @returns Código en formato "1 60 10"
 */
export function generateDisserCode(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '1 60 10'; // Fallback estándar para Alejandro
  }

  // 1. Extraer las primeras dos letras del nombre del usuario registrado
  // Normalizar tildes y diacríticos (ej. Álvaro -> Alvaro, José -> Jose)
  const letters = fullName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  const letter1 = letters.charAt(0) || 'A';
  const letter2 = letters.charAt(1) || 'L';

  // 2. Buscar su valor en la matriz oficial de conversión
  const val1 = DISSER_CONVERSION_MATRIX[letter1] ?? 1;
  const val2 = DISSER_CONVERSION_MATRIX[letter2] ?? 60;

  // 3. Termina obligatoriamente y sin excepciones en el número 10
  // 4. Ejemplo: A (1) + L (60) + cierre (10) = "1 60 10"
  return `${val1} ${val2} 10`;
}

/**
 * Alias de compatibilidad con el sistema anterior
 */
export const generateDyserNumber = generateDisserCode;

/**
 * Normaliza un código escrito por el usuario (admite "1 60 10", "1-60-10", "16010", etc.)
 */
export function normalizeDisserCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Si ya viene con espacios "1 60 10"
  const parts = trimmed.split(/[\s\-._]+/);
  if (parts.length === 3 && parts[2] === '10') {
    return `${parts[0]} ${parts[1]} 10`;
  }
  
  return trimmed;
}

/**
 * Verifica si un texto tiene la estructura de un Código Disser (termina en 10)
 */
export function isDisserCode(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  
  // Formato estándar con espacios "X Y 10"
  const spaceMatch = trimmed.match(/^(\d{1,3})\s+(\d{1,3})\s+10$/);
  if (spaceMatch) {
    const v1 = parseInt(spaceMatch[1], 10);
    const v2 = parseInt(spaceMatch[2], 10);
    return !!INVERSE_DISSER_MATRIX[v1] && !!INVERSE_DISSER_MATRIX[v2];
  }

  // Formato con guiones "X-Y-10"
  const dashMatch = trimmed.match(/^(\d{1,3})-(\d{1,3})-10$/);
  if (dashMatch) {
    const v1 = parseInt(dashMatch[1], 10);
    const v2 = parseInt(dashMatch[2], 10);
    return !!INVERSE_DISSER_MATRIX[v1] && !!INVERSE_DISSER_MATRIX[v2];
  }

  return false;
}

/**
 * Directorio de usuarios conocidos con sus Códigos Disser oficiales calculados:
 */
export interface RegisteredDisserContact {
  disserCode: string; // ej. "1 60 10"
  name: string;
  avatar: string;
  program?: string;
  phoneNumber?: string;
  subtitle?: string;
}

export const KNOWN_DISSER_DIRECTORY: RegisteredDisserContact[] = [
  {
    disserCode: '1 60 10', // A (1) + L (60) + 10
    name: 'Alejandro Valenzuela',
    avatar: 'https://lh3.googleusercontent.com/aida/AEtjO1V1lhmVP0ld926h7AIuYHTaxvxlbja4bKvdxXO66kHTJQ3zXYLleFNCWxma-8BEV7B33OF7gqkR_jJI8FJ0t1nhFPHbZVXMKDVVs3GlcmUB7x1QxrVhgHZRkouFyTQQDKbzBjfUhug5LRLg-4Vtbbb_4viPVZqD5pDLl9H4WYvzgKHjt8Es2TuELK3zBrG3GVvDdfwdFBfMvzPVo3_gJMb3oCVa-BRYVBA6LXWYNPrOm-wD4hFXC_uMnWAVw_QB-hRuaPfv7wYd',
    program: 'Ingeniería de Software & Computación',
    phoneNumber: '+58 412 123 4567',
    subtitle: 'Estudiante Dyser Activo',
  },
  {
    disserCode: '1 36 10', // S (1) + H (36) + 10
    name: 'Shedya Naser',
    avatar: 'SN',
    program: 'Medicina & Bioestadística',
    phoneNumber: '+58 412 555 1234',
    subtitle: 'en línea',
  },
  {
    disserCode: '36 10 10', // H (36) + E (10) + 10
    name: 'Profe Herminia Chacin',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    program: 'Cátedra de Arquitectura Distribuida',
    phoneNumber: '+58 414 789 0123',
    subtitle: 'Docente Titular',
  },
  {
    disserCode: '11 19 10', // J (11) + I (19) + 10 (Jihad Nasser)
    name: 'Jihad Nasser',
    avatar: 'J',
    program: 'Ingeniería & Ciencias Computacionales',
    phoneNumber: '+58 424 838 1681',
    subtitle: 'Investigador & Colaborador Dyser',
  },
  {
    disserCode: '32 1 10', // D (32) + A (1) + 10
    name: 'Daniela Donatti',
    avatar: 'https://images.unsplash.com/photo-1548625361-16a75f0a2022?w=150',
    program: 'Comunidad Dyser Clarines',
    phoneNumber: '+58 414 092 7436',
    subtitle: 'Estudiante',
  },
  {
    disserCode: '12 1 10', // C (12) + A (1) + 10
    name: 'Carmen Triana',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
    program: 'Comunidad Manuel Ezequiel Bruzual',
    phoneNumber: '+58 412 987 6543',
    subtitle: 'Estudiante',
  },
  {
    disserCode: '4 1 10', // T (4) + A (1) + 10
    name: 'Tatiana Hermosa',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150',
    program: 'Comunidad Familia Dyser',
    phoneNumber: '+58 416 333 4455',
    subtitle: 'Estudiante',
  },
];

/**
 * Busca si un código corresponde a un usuario registrado en el directorio
 */
export function findContactByDisserCode(query: string): RegisteredDisserContact | null {
  if (!query) return null;
  const cleanQ = query.trim().toLowerCase().replace(/[\-_]/g, ' ');

  for (const contact of KNOWN_DISSER_DIRECTORY) {
    const cleanCode = contact.disserCode.toLowerCase();
    // Comparación directa "1 60 10"
    if (cleanCode === cleanQ) return contact;
    // Comparación sin espacios "16010"
    if (cleanCode.replace(/\s+/g, '') === cleanQ.replace(/\s+/g, '')) return contact;
  }

  // Si no está explícitamente en la lista estática, pero es un código válido (termina en 10)
  if (isDisserCode(query)) {
    const parts = query.trim().split(/[\s\-._]+/);
    const v1 = parseInt(parts[0], 10);
    const v2 = parseInt(parts[1], 10);
    const let1 = INVERSE_DISSER_MATRIX[v1]?.[0] || 'C';
    const let2 = INVERSE_DISSER_MATRIX[v2]?.[0] || 'D';
    const candidateInitials = `${let1}${let2}`;
    
    return {
      disserCode: `${v1} ${v2} 10`,
      name: `Compañero ${candidateInitials}`,
      avatar: 'USER_SILHOUETTE',
      program: 'Estudiante Dyser',
      phoneNumber: `Código ${v1} ${v2} 10`,
      subtitle: 'Usuario verificado por Código Disser',
    };
  }

  return null;
}
