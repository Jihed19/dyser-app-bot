import {
  AcademicTask,
  StudentProfile,
  SlideDeck,
  ExamSimulation,
  StudyRoom,
  ChatMessage,
} from '../types';

export const DYSER_LOGO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-TNef0sjk0d-kxr5hhS0d_GlQ1PbXbhVX0kTn6F-7sxqYotRlF9nr5NAnf7856pCLzwEPke88H6xvfrpo8szXPpsRs2PtBNxeNMRy_-RfVq5g4J2yyd-S5TDtUOvyMslAKVcCiLsIC-LueT4SkgTmlKpCEjoOiQ7qsjDwBZcCE3XhNyyA-1oYhxkUcM9l8uoCnBNNYZwhXc7g-eIXd9tirrUOMGWKC6t_BZaeCMyUY9HJjSXiFAoR5QFS1GvaF1vN9A';

export const STUDENT_AVATAR = 'https://lh3.googleusercontent.com/aida/AEtjO1V1lhmVP0ld926h7AIuYHTaxvxlbja4bKvdxXO66kHTJQ3zXYLleFNCWxma-8BEV7B33OF7gqkR_jJI8FJ0t1nhFPHbZVXMKDVVs3GlcmUB7x1QxrVhgHZRkouFyTQQDKbzBjfUhug5LRLg-4Vtbbb_4viPVZqD5pDLl9H4WYvzgKHjt8Es2TuELK3zBrG3GVvDdfwdFBfMvzPVo3_gJMb3oCVa-BRYVBA6LXWYNPrOm-wD4hFXC_uMnWAVw_QB-hRuaPfv7wYd';

export const initialStudentProfile: StudentProfile = {
  name: 'Alejandro Valenzuela',
  avatar: STUDENT_AVATAR,
  program: 'Ingeniería de Software & Computación',
  semester: 'Semestre VI',
  gpa: 9.4,
  attendanceRate: 98,
  streakDays: 14,
  completedTasksCount: 18,
};

export const initialAcademicTasks: AcademicTask[] = [
  {
    id: 'task-1',
    title: 'Laboratorio de Algoritmos Distribuidos: Consenso Raft',
    subject: 'Sistemas Distribuidos',
    dueDate: 'Hoy, 23:59',
    dueTimestamp: Date.now() + 1000 * 60 * 60 * 4,
    priority: 'alta',
    status: 'pendiente',
    estimatedMinutes: 45,
    description: 'Implementar el algoritmo de consenso Raft en Python con simulación de pérdida de paquetes y elección de líder.',
    isOverdue: false,
  },
  {
    id: 'task-2',
    title: 'Análisis Sintáctico y Construcción de AST',
    subject: 'Compiladores y Lenguajes',
    dueDate: 'Mañana, 09:00 AM',
    dueTimestamp: Date.now() + 1000 * 60 * 60 * 20,
    priority: 'alta',
    status: 'en_progreso',
    estimatedMinutes: 60,
    description: 'Diseñar la gramática libre de contexto LL(1) para el mini-lenguaje evaluado.',
    isOverdue: false,
  },
  {
    id: 'task-3',
    title: 'Lectura: Replicación y Tolerancia a Fallos Bizantinos',
    subject: 'Sistemas Distribuidos',
    dueDate: 'Viernes, 18:00',
    dueTimestamp: Date.now() + 1000 * 60 * 60 * 68,
    priority: 'media',
    status: 'pendiente',
    estimatedMinutes: 30,
    description: 'Capítulo 4 del libro de Tanenbaum sobre quórum y particiones de red.',
    isOverdue: false,
  },
  {
    id: 'task-4',
    title: 'Práctica de Despliegue en Kubernetes Clúster',
    subject: 'Arquitectura Cloud',
    dueDate: 'Ayer, 23:59',
    dueTimestamp: Date.now() - 1000 * 60 * 60 * 12,
    priority: 'alta',
    status: 'pendiente',
    estimatedMinutes: 50,
    description: 'Configurar Ingress Controller y Horizontal Pod Autoscaler en GKE.',
    isOverdue: true,
  },
  {
    id: 'task-5',
    title: 'Avance de Proyecto Final: Fase 2 API & Base de Datos',
    subject: 'Ingeniería de Software',
    dueDate: 'Lunes próximo',
    dueTimestamp: Date.now() + 1000 * 60 * 60 * 140,
    priority: 'baja',
    status: 'en_progreso',
    estimatedMinutes: 90,
    description: 'Documentación OpenAPI y pruebas unitarias con cobertura > 85%.',
    isOverdue: false,
  },
  {
    id: 'task-6',
    title: 'Entrega de Base de Datos NoSQL y Sharding',
    subject: 'Bases de Datos Avanzadas',
    dueDate: 'Completado',
    dueTimestamp: Date.now() - 1000 * 60 * 60 * 72,
    priority: 'media',
    status: 'completada',
    estimatedMinutes: 40,
    description: 'Estrategias de particionado horizontal con MongoDB.',
    isOverdue: false,
  },
  {
    id: 'task-7',
    title: 'Quiz 2: Cálculo Multivariable y Gradientes',
    subject: 'Matemáticas Aplicadas',
    dueDate: 'Completado',
    dueTimestamp: Date.now() - 1000 * 60 * 60 * 96,
    priority: 'alta',
    status: 'completada',
    estimatedMinutes: 30,
    description: 'Derivadas direccionales y multiplicadores de Lagrange.',
    isOverdue: false,
  },
];

export const initialTasks = initialAcademicTasks;

export const sampleSlideDecks: SlideDeck[] = [
  {
    id: 'deck-1',
    deckTitle: 'Consenso Raft y Sistemas Distribuidos',
    author: 'Alejandro Valenzuela',
    templateType: 'Academic Canva Pro',
    themePalette: {
      primary: '#00236F',
      accent: '#FE6B00',
      background: '#F7F9FB',
    },
    slides: [
      {
        slideNumber: 1,
        layout: 'title',
        heading: 'Consenso Raft: Replicación Fiable en Clústeres',
        subheading: 'Cómo lograr acuerdo distribuido en presencia de fallas de red y particiones',
        highlightMetric: '99.999% Disponibilidad',
      },
      {
        slideNumber: 2,
        layout: 'split',
        heading: 'Estados de un Nodo: Líder, Seguidor, Candidato',
        subheading: 'La descomposición del problema de consenso en subproblemas ortogonales',
        bullets: [
          'Elección de líder: si un seguidor deja de escuchar heartbeats, pasa a candidato.',
          'Replicación de logs: el líder recibe entradas del cliente y las propaga.',
          'Seguridad: si un nodo aplicó un comando en un índice, ningún otro aplicará otro distinto.',
        ],
      },
      {
        slideNumber: 3,
        layout: 'bullet_grid',
        heading: 'Manejo de Partición de Red (Split-Brain)',
        subheading: 'Por qué una partición minoritaria no puede confirmar comandos',
        bullets: [
          'Mayoría estricta requerida: N/2 + 1 votos para comprometer un log.',
          'Partición minoritaria continúa en bucle de elección sin ganar.',
          'Al reconectar la red, el log más actualizado del líder legítimo sobrescribe discrepancias.',
        ],
        highlightMetric: 'Quórum = (N/2) + 1',
      },
      {
        slideNumber: 4,
        layout: 'quote',
        heading: 'Conclusión y Lección de Ingeniería',
        subheading: 'Diego Ongaro & John Ousterhout (Stanford University, 2014)',
        bullets: [
          '"La comprensibilidad no es un lujo estético, es un requisito de seguridad en sistemas críticos."',
        ],
      },
    ],
  },
];

export const sampleExamSimulation: ExamSimulation = {
  id: 'exam-1',
  title: 'Simulacro Crítico: Sistemas Distribuidos y Teorema CAP',
  subject: 'Sistemas Distribuidos',
  timeLimitMinutes: 15,
  passingGrade: 7.0,
  questions: [
    {
      id: 'q-1',
      questionText:
        'En el algoritmo de consenso Raft, ¿cuál es la condición estricta para que una entrada de log sea considerada "committed" por el líder?',
      options: [
        'Haber sido replicada en una mayoría estricta (N/2 + 1) de los nodos del clúster.',
        'Haber sido aceptada unánimemente por el 100% de los nodos en línea.',
        'Haber sido guardada en la caché volátil del cliente.',
        'Que hayan transcurrido al menos 5 ciclos de heartbeat sin excepciones.',
      ],
      correctOptionIndex: 0,
      explanation:
        'En Raft, una entrada se compromete cuando el líder la ha persistido en una mayoría estricta de nodos (quórum = ⌊N/2⌋ + 1). A partir de ese instante es seguro aplicarla a la máquina de estados.',
    },
    {
      id: 'q-2',
      questionText:
        '¿Qué mecanismo previene en Raft que dos candidatos compitan y dividan indefinidamente los votos (Split Vote)?',
      options: [
        'Un árbitro central externo designado por balanceador DNS.',
        'Tiempos de espera de elección aleatorizados (Randomized Election Timeouts entre 150ms y 300ms).',
        'Prioridad absoluta basada en la dirección MAC más baja.',
        'La cancelación automática del proceso de votación tras 3 intentos fallidos.',
      ],
      correctOptionIndex: 1,
      explanation:
        'Los timeouts aleatorios provocan que un nodo despierte antes que los demás, solicite votos y gane la mayoría antes de que surja un competidor.',
    },
    {
      id: 'q-3',
      questionText:
        'Bajo el Teorema CAP, en presencia de una partición de red inevitable (P), ¿qué característica prioriza un sistema CP?',
      options: [
        'Responder a todas las lecturas de inmediato, aunque los datos sean viejos.',
        'Rechazar o bloquear escrituras en particiones aisladas para evitar divergencia de datos.',
        'Aumentar la latencia a infinito sin devolver códigos de error.',
        'Desconectar el clúster entero de la red eléctrica.',
      ],
      correctOptionIndex: 1,
      explanation:
        'Un sistema CP garantiza consistencia estricta rechazando operaciones en nodos desconectados de la mayoría para no admitir inconsistencias.',
    },
  ],
};

export const sampleStudyRooms: StudyRoom[] = [
  {
    id: 'room-1',
    name: 'Sistemas Distribuidos & Algoritmo Raft',
    subject: 'Sistemas Distribuidos',
    topic: 'Repaso previo al examen de mañana: Quórum, Particiones y Logs Replicados',
    activeMembersCount: 4,
    pomodoroMinutes: 25,
    mode: 'deep_work',
    members: [
      { id: 'm-1', name: 'María Sandoval', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isMuted: false },
      { id: 'm-2', name: 'Carlos Morales', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isMuted: true },
      { id: 'm-3', name: 'Sofía Chen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isMuted: true },
      { id: 'm-4', name: 'Alejandro Valenzuela (Tú)', avatar: STUDENT_AVATAR, isMuted: false },
    ],
  },
  {
    id: 'room-2',
    name: 'Compiladores: Parsing LL(1) & AST',
    subject: 'Compiladores',
    topic: 'Resolución conjunta del laboratorio 3 y diseño de tablas sintácticas',
    activeMembersCount: 3,
    pomodoroMinutes: 50,
    mode: 'collaborative',
    members: [
      { id: 'm-5', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isMuted: false },
      { id: 'm-6', name: 'Elena Ruiz', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', isMuted: true },
    ],
  },
  {
    id: 'room-3',
    name: 'Taller de Oratoria & Defensas de Tesis',
    subject: 'Exposiciones',
    topic: 'Ensayos con Voice Coach IA antes de jurado universitario',
    activeMembersCount: 2,
    pomodoroMinutes: 25,
    mode: 'collaborative',
    members: [
      { id: 'm-7', name: 'Lucía Méndez', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', isMuted: false },
    ],
  },
];

export const initialNasserChatHistory: ChatMessage[] = [];
