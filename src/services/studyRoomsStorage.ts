import { ExamSimulation, ExpositionStudy } from '../types';
import { sampleExamSimulation } from '../data/mockData';

const EXAMS_STORAGE_KEY = 'dyser_saved_exams_v2';
const EXPOS_STORAGE_KEY = 'dyser_saved_expositions_v2';

// Colección inicial de exámenes
const INITIAL_EXAMS: ExamSimulation[] = [
  sampleExamSimulation,
  {
    id: 'exam-mat-1',
    title: 'Evaluación Parcial: Identidades Trigonométricas y Ley de Senos',
    subject: 'Matemáticas',
    timeLimitMinutes: 15,
    passingGrade: 70,
    questions: [
      {
        id: 'qm-1',
        questionText: '¿Cuál de las siguientes relaciones es la identidad pitagórica fundamental?',
        options: [
          'sin²(θ) + cos²(θ) = 1',
          'tan²(θ) - sec²(θ) = 1',
          'sin(2θ) = 2sin(θ)',
          'cos(θ) = 1 / tan(θ)',
        ],
        correctOptionIndex: 0,
        explanation: 'La identidad pitagórica fundamental se deriva directamente del teorema de Pitágoras en el círculo unitario: sin²(θ) + cos²(θ) = 1.',
      },
      {
        id: 'qm-2',
        questionText: 'En un triángulo oblicuángulo, ¿cuándo es mandatorio aplicar la Ley de Cosenos en lugar de la Ley de Senos?',
        options: [
          'Cuando conocemos dos lados y el ángulo comprendido entre ellos (LAL), o los tres lados (LLL).',
          'Solo cuando el triángulo es rectángulo.',
          'Cuando conocemos dos ángulos y un lado opuesto.',
          'Cuando el perímetro total es par.',
        ],
        correctOptionIndex: 0,
        explanation: 'La Ley de Cosenos (c² = a² + b² - 2ab·cos(C)) es indispensable para resolver los casos LAL y LLL donde la Ley de Senos genera indeterminaciones iniciales.',
      },
      {
        id: 'qm-3',
        questionText: '¿Cuál es el valor exacto de cos(2θ) expresado únicamente en función de cos(θ)?',
        options: [
          '2cos²(θ) - 1',
          '1 - 2cos(θ)',
          'cos²(θ) + 1',
          '4cos²(θ) - 2',
        ],
        correctOptionIndex: 0,
        explanation: 'A partir de cos(2θ) = cos²(θ) - sin²(θ) y sustituyendo sin²(θ) = 1 - cos²(θ), obtenemos la forma canónica 2cos²(θ) - 1.',
      },
      {
        id: 'qm-4',
        questionText: 'Si tan(θ) = 3/4 en el primer cuadrante, ¿cuál es el valor de sin(θ)?',
        options: [
          '3/5',
          '4/5',
          '3/7',
          '5/3',
        ],
        correctOptionIndex: 0,
        explanation: 'Cateto opuesto = 3, cateto adyacente = 4, hipotenusa = √(3² + 4²) = 5. Por lo tanto, sin(θ) = 3/5.',
      },
    ],
  },
  {
    id: 'exam-bio-1',
    title: 'Simulacro Teórico: Replicación Celular y Dogma Central de la Biología',
    subject: 'Biología',
    timeLimitMinutes: 12,
    passingGrade: 70,
    questions: [
      {
        id: 'qb-1',
        questionText: '¿Qué enzima desenrolla la doble hélice del ADN en la horquilla de replicación?',
        options: [
          'ADN Helicasa',
          'ADN Ligasa',
          'ARN Polimerasa II',
          'Topoisomerasa inversa',
        ],
        correctOptionIndex: 0,
        explanation: 'La Helicasa rompe los enlaces de hidrógeno entre las bases nitrogenadas separando las hebras complementarias.',
      },
      {
        id: 'qb-2',
        questionText: 'En eucariotas, ¿en qué dirección sintetiza la ADN Polimerasa la nueva hebra complementaria?',
        options: [
          'Exclusivamente en dirección 5\' → 3\'',
          'Exclusivamente en dirección 3\' → 5\'',
          'En ambas direcciones simultáneamente',
          'Aleatoriamente según el cebador',
        ],
        correctOptionIndex: 0,
        explanation: 'La ADN polimerasa añade nucleótidos únicamente al extremo 3\' libre, obligando a la síntesis en sentido 5\' → 3\' y generando los fragmentos de Okazaki en la hebra rezagada.',
      },
      {
        id: 'qb-3',
        questionText: '¿Cuál es la función principal de los Fragmentos de Okazaki?',
        options: [
          'Permitir la replicación discontinua de la hebra rezagada.',
          'Proteger los telómeros de la degradación oxidativa.',
          'Sintetizar ribosomas en el nucléolo.',
          'Servir de catalizadores en la traducción mitocondrial.',
        ],
        correctOptionIndex: 0,
        explanation: 'Dado que la síntesis es siempre 5\' a 3\', la hebra rezagada debe replicarse en fragmentos discontinuos (de Okazaki) que posteriormente une la ADN Ligasa.',
      },
    ],
  },
];

// Colección inicial de exposiciones
const INITIAL_EXPOSITIONS: ExpositionStudy[] = [
  {
    id: 'expo-sistemas-distribuidos',
    topic: 'Arquitectura de Sistemas Distribuidos y Consenso Raft',
    subject: 'Sistemas Distribuidos',
    numPoints: 4,
    summaryIdea: 'La arquitectura distribuida moderna reemplaza la fragilidad de nodos únicos con consenso asimétrico tolerante a fallos de red.',
    points: [
      {
        id: 'p-1',
        number: 1,
        title: 'Fundamentos de Concurrencia y el Teorema CAP',
        keyIdea: 'En presencia de particiones de red inevitables, un sistema debe equilibrar Consistencia estricta y Disponibilidad.',
        speechScript: 'Un sistema distribuido es un conjunto de computadoras independientes que se presentan ante los usuarios como un único sistema coherente. La regla de oro que define su diseño es el Teorema CAP: cuando ocurre una partición de red inevitable en cables o enlaces submarinos, estamos matemáticamente obligados a elegir entre garantizar consistencia absoluta en las transacciones o mantener la disponibilidad continua para los usuarios.',
        example: 'Pensemos en dos cajeros automáticos conectados por un enlace de red que se corta: si permitimos retiros en ambos (alta disponibilidad), corremos el riesgo de duplicar dinero. Si bloqueamos operaciones hasta restaurar el enlace (alta consistencia), protegemos la integridad del saldo.',
        warningNote: 'No afirmes que un sistema puede tener C, A y P a la vez. Siempre aclara que P es una condición del entorno físico y la elección real es entre CP o AP.',
      },
      {
        id: 'p-2',
        number: 2,
        title: 'El Desafío del Consenso y la Descomposición de Raft',
        keyIdea: 'Raft fue diseñado en Stanford para hacer comprensible lo que Paxos volvió inaccesible.',
        speechScript: 'Durante décadas, el algoritmo Paxos fue el estándar para lograr que múltiples máquinas acordaran un mismo valor, pero su complejidad teórica dificultaba implementaciones fiables en producción. En 2014, Diego Ongaro y John Ousterhout introdujeron Raft en Stanford con un objetivo transformador: la comprensibilidad. Raft divide el consenso en tres subproblemas ortogonales e independientes: elección de líder, replicación de registros y seguridad del estado.',
        example: 'Imaginemos una orquesta sinfónica: si todos los músicos tocan por su cuenta se genera cacofonía. Raft asegura que siempre haya un director de orquesta indiscutible; si el director se desmaya, los músicos eligen democráticamente a un sucesor en milisegundos.',
        warningNote: 'Destaca que el quórum mínimo para tomar decisiones válidas es siempre la mayoría estricta: N/2 + 1 nodos.',
      },
      {
        id: 'p-3',
        number: 3,
        title: 'Replicación de Logs y Quórum de Mayoría',
        keyIdea: 'Una entrada solo se consolida cuando la mayoría estricta de nodos la ha persistido en disco.',
        speechScript: 'Una vez electo, el líder recibe todas las solicitudes de los clientes y las convierte en entradas de un registro cronológico o log. El líder propaga esta entrada a todos los servidores seguidores mediante mensajes AppendEntries. Una entrada se considera oficialmente confirmada o committed únicamente cuando el líder recibe acuses de recibo de una mayoría estricta de nodos. A partir de ese microsegundo, la instrucción se ejecuta en la máquina de estados y jamás podrá ser sobrescrita.',
        example: 'Es el equivalente a un libro contable notarial donde para validar una transferencia bancaria se requiere la firma simultánea de al menos 3 de 5 notarios autorizados.',
        warningNote: 'Explica qué ocurre si un líder muere a mitad de una replicación: el nuevo líder electo forzará la sincronización de logs asegurando que nadie tenga datos divergentes.',
      },
      {
        id: 'p-4',
        number: 4,
        title: 'Tolerancia a Fallos y Prevención de Split-Brain',
        keyIdea: 'Los tiempos de espera aleatorios impiden empates infinitos y blindan ante particiones.',
        speechScript: 'El mayor peligro en redes distribuidas es el fenómeno de cerebro dividido o Split-Brain, donde un corte de fibra hace creer a dos grupos aislados que el otro ha muerto. Raft neutraliza esto con dos mecanismos elegantes: primero, tiempos de espera de elección aleatorios entre 150 y 300 milisegundos que evitan que dos candidatos dividan los votos al unísono. Y segundo, la regla de quórum estricto: la partición minoritaria nunca reúne los votos suficientes para elegir un líder ni para confirmar transacciones, manteniendo los datos a salvo.',
        example: 'Si un parlamento de 5 personas se divide en 3 en una sala y 2 en otra, solo la sala con 3 personas tiene quórum legal para aprobar leyes; la sala con 2 queda en pausa.',
        warningNote: 'Cierra tu defensa enfatizando que Raft es el corazón operativo de tecnologías nucleares modernas como etcd en Kubernetes y consul de HashiCorp.',
      },
    ],
    conclusionScript: 'En conclusión: la arquitectura distribuida y el algoritmo Raft nos demuestran que la robustez ante desastres no surge de fabricar hardware indestructible, sino de diseñar protocolos matemáticamente tolerantes a fallos con quórum mayoritario y líderes transparentes.',
  },
  {
    id: 'expo-teorema-pitagoras',
    topic: 'Demostración Geométrica: Aplicaciones del Teorema de Pitágoras',
    subject: 'Matemáticas',
    numPoints: 3,
    summaryIdea: 'La relación a² + b² = c² es el cimiento de la geometría euclidiana, la trigonometría analítica y el cálculo vectorial en el espacio.',
    points: [
      {
        id: 'pp-1',
        number: 1,
        title: 'Enunciado Axiomático y Demostración Visual de Euclides',
        keyIdea: 'El área del cuadrado construido sobre la hipotenusa es igual a la suma de las áreas de los cuadrados sobre los catetos.',
        speechScript: 'El Teorema de Pitágoras es una de las verdades geométricas más sólidas y bellas de la civilización. No es simplemente una fórmula de cálculo algebraico, sino una afirmación sobre la conservación de áreas espaciales: si sobre cada cateto de un triángulo rectángulo levantamos un cuadrado físico y sobre la hipotenusa levantamos otro, la superficie del cuadrado mayor equivale exactamente a la suma de las dos superficies menores.',
        example: 'Si cortamos en piezas de cartulina los dos cuadrados menores de 3x3 y 4x4 centímetros, sus fragmentos encajan con precisión milimétrica dentro del cuadrado de 5x5 centímetros sin que sobre ni falte un solo milímetro.',
        warningNote: 'Recuerda que solo es válido si uno de los ángulos interiores del triángulo mide exactamente noventa grados.',
      },
      {
        id: 'pp-2',
        number: 2,
        title: 'Generalización a Tres Dimensiones y Espacios Métricos',
        keyIdea: 'La distancia euclidiana en R³ y en gráficos por computadora se fundamenta en la aplicación iterada del teorema.',
        speechScript: 'Cuando pasamos del plano bidimensional al espacio tridimensional de la ingeniería civil, la robótica o los videojuegos en 3D, el teorema no pierde vigencia; se expande. La diagonal de un prisma rectangular o la distancia entre dos partículas en el espacio se calcula aplicando Pitágoras dos veces consecutivas, resultando en la fórmula canónica: distancia = raíz de delta x al cuadrado más delta y al cuadrado más delta z al cuadrado.',
        example: 'El sensor de un dron que localiza un obstáculo en coordenadas de altitud, latitud y longitud calcula su distancia vectorial instantánea utilizando esta misma relación pitagórica.',
        warningNote: 'Menciona que este concepto es el que permite calcular el módulo de vectores en física mecánica.',
      },
      {
        id: 'pp-3',
        number: 3,
        title: 'Aplicaciones Críticas en Arquitectura y Navegación GPS',
        keyIdea: 'Desde la escuadra egipcia 3-4-5 hasta la trilateración satelital, Pitágoras rige la precisión espacial.',
        speechScript: 'Históricamente, los agrimensores del antiguo Egipto utilizaban cuerdas con doce nudos equidistantes para trazar ángulos rectos perfectos con proporciones 3, 4 y 5 tras las crecidas del río Nilo. Hoy en día, nuestros teléfonos móviles determinan su posición exacta en el mapa mediante satélites GPS que utilizan trilateración basada en esferas y distancias calculadas con el teorema de Pitágoras corregido por relatividad.',
        example: 'Cuando un albañil verifica que una pared esté a escuadra midiendo 60 cm en un muro, 80 cm en el otro y comprobando que la diagonal mida exactamente 100 cm, está aplicando a² + b² = c².',
        warningNote: 'Enfatiza que sin esta propiedad geométrica, no existiría la trigonometría moderna ni la navegación aérea.',
      },
    ],
    conclusionScript: 'El Teorema de Pitágoras no es una reliquia del pasado; es la herramienta milenaria que nos permite estructurar el espacio físico, medir distancias invisibles y construir con certeza geométrica.',
  },
];

// Obtener exámenes guardados
export function getSavedExams(): ExamSimulation[] {
  try {
    const raw = localStorage.getItem(EXAMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_EXAMS));
      return INITIAL_EXAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_EXAMS;
  } catch (err) {
    console.warn('Error leyendo exámenes de storage', err);
    return INITIAL_EXAMS;
  }
}

// Guardar o actualizar un examen
export function saveExam(exam: ExamSimulation): void {
  try {
    const existing = getSavedExams();
    const index = existing.findIndex(e => e.id === exam.id);
    let updated: ExamSimulation[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = exam;
    } else {
      updated = [exam, ...existing];
    }
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dyser-exams-changed', { detail: updated }));
  } catch (err) {
    console.warn('Error guardando examen', err);
  }
}

// Eliminar un examen
export function deleteExam(examId: string): void {
  try {
    const existing = getSavedExams();
    const updated = existing.filter(e => e.id !== examId);
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dyser-exams-changed', { detail: updated }));
  } catch (err) {
    console.warn('Error eliminando examen', err);
  }
}

// Obtener exposiciones guardadas
export function getSavedExpositions(): ExpositionStudy[] {
  try {
    const raw = localStorage.getItem(EXPOS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXPOS_STORAGE_KEY, JSON.stringify(INITIAL_EXPOSITIONS));
      return INITIAL_EXPOSITIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_EXPOSITIONS;
  } catch (err) {
    console.warn('Error leyendo exposiciones de storage', err);
    return INITIAL_EXPOSITIONS;
  }
}

// Guardar o actualizar una exposición
export function saveExposition(expo: ExpositionStudy): void {
  try {
    const existing = getSavedExpositions();
    const index = existing.findIndex(e => e.id === expo.id);
    let updated: ExpositionStudy[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = expo;
    } else {
      updated = [expo, ...existing];
    }
    localStorage.setItem(EXPOS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dyser-expositions-changed', { detail: updated }));
  } catch (err) {
    console.warn('Error guardando exposición', err);
  }
}

// Eliminar una exposición
export function deleteExposition(expoId: string): void {
  try {
    const existing = getSavedExpositions();
    const updated = existing.filter(e => e.id !== expoId);
    localStorage.setItem(EXPOS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dyser-expositions-changed', { detail: updated }));
  } catch (err) {
    console.warn('Error eliminando exposición', err);
  }
}
