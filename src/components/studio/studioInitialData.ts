import { StudioDocument, StudioFormat } from './StudioTypes';

export function createDefaultDocument(format: StudioFormat, topic?: string): StudioDocument {
  const currentTopic = topic || (
    format === 'pdf'
      ? 'Termodinámica Estadística y Sistemas Abiertos'
      : format === 'slides'
      ? 'Arquitectura de Redes Neuronales y Convolución'
      : 'Diagrama de Flujo: Algoritmo de Consenso Distribuido'
  );

  if (format === 'pdf') {
    return {
      id: `doc-pdf-${Date.now()}`,
      format: 'pdf',
      title: currentTopic,
      author: 'Estudiante dyser',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      theme: {
        primary: '#00236F',
        accent: '#FE6B00',
        background: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      pages: [
        {
          id: 'p1',
          pageNumber: 1,
          title: '1. Introducción y Marco Teórico Axiomático',
          subtitle: 'Postulados Rectores y Delimitación de Variables',
          backgroundColor: '#FFFFFF',
          elements: [
            {
              id: 'el-1',
              type: 'badge',
              content: 'dyser Academic • Documento de Investigación Formal',
              x: 10,
              y: 5,
              fontSize: 11,
              fontWeight: 'bold',
              color: '#FE6B00',
              backgroundColor: '#FFF5EB',
              borderColor: '#FE6B00',
              borderWidth: 1,
              borderRadius: 999,
              textAlign: 'center',
              zIndex: 1,
            },
            {
              id: 'el-2',
              type: 'heading',
              content: currentTopic,
              x: 10,
              y: 12,
              fontSize: 22,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 2,
            },
            {
              id: 'el-3',
              type: 'text',
              content: `El presente tratado analiza formalmente los principios constitutivos de ${currentTopic}. Se establecen las relaciones causales que gobiernan la dinámica del sistema bajo condiciones estrictas de contorno.`,
              x: 10,
              y: 24,
              fontSize: 14,
              color: '#334155',
              textAlign: 'left',
              zIndex: 3,
            },
            {
              id: 'el-4',
              type: 'subheading',
              content: 'Axioma Fundamental de Conservación',
              x: 10,
              y: 42,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 4,
            },
            {
              id: 'el-5',
              type: 'formula',
              content: '∮_∂Ω F · dS = ∭_Ω (∇ · F) dV = 0 (Condición de Invarianza Estacionaria)',
              x: 10,
              y: 50,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 5,
            },
            {
              id: 'el-6',
              type: 'text',
              content: 'La ecuación precedente garantiza que las trayectorias de fase no divergen estocásticamente, permitiendo la formulación de soluciones cerradas en los regímenes asintóticos.',
              x: 10,
              y: 64,
              fontSize: 13,
              color: '#475569',
              textAlign: 'left',
              zIndex: 6,
            },
          ],
        },
        {
          id: 'p2',
          pageNumber: 2,
          title: '2. Formulación Matemática y Derivaciones',
          subtitle: 'Análisis de Convergencia y Casos de Examen',
          backgroundColor: '#FFFFFF',
          elements: [
            {
              id: 'el-p2-1',
              type: 'heading',
              content: 'Derivación Estructural de Primer Orden',
              x: 10,
              y: 8,
              fontSize: 18,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 1,
            },
            {
              id: 'el-p2-2',
              type: 'text',
              content: 'Al aplicar la transformada canónica al sistema diferencial, se aíslan los autovalores dominantes que determinan la estabilidad en el espacio de Hilbert:',
              x: 10,
              y: 18,
              fontSize: 14,
              color: '#334155',
              textAlign: 'left',
              zIndex: 2,
            },
            {
              id: 'el-p2-3',
              type: 'formula',
              content: 'λ_max = lim_{t→∞} (1/t) ln ||Φ(t) x_0|| ≤ 0 (Exponente de Lyapunov)',
              x: 10,
              y: 32,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 3,
            },
            {
              id: 'el-p2-4',
              type: 'badge',
              content: '⚠️ Alerta de Examen: No omitir la condición de regularidad',
              x: 10,
              y: 48,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#DC2626',
              backgroundColor: '#FEF2F2',
              borderColor: '#FCA5A5',
              borderWidth: 1,
              borderRadius: 8,
              textAlign: 'left',
              zIndex: 4,
            },
            {
              id: 'el-p2-5',
              type: 'text',
              content: '• Evitar suponer simetría esférica a menos que el enunciado lo indique explícitamente.\n• Verificar siempre la coherencia dimensional antes de sustituir valores numéricos.\n• El límite inferior de error experimental aceptable es del ±0.8%.',
              x: 10,
              y: 60,
              fontSize: 13.5,
              color: '#334155',
              textAlign: 'left',
              zIndex: 5,
            },
          ],
        },
      ],
    };
  }

  if (format === 'slides') {
    return {
      id: `doc-slides-${Date.now()}`,
      format: 'slides',
      title: currentTopic,
      author: 'Estudiante dyser',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      theme: {
        primary: '#00236F',
        accent: '#FE6B00',
        background: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      pages: [
        {
          id: 's1',
          pageNumber: 1,
          title: currentTopic,
          subtitle: 'Marco de Exposición Académica • Nasser AI Studio Pro',
          backgroundColor: '#FFFFFF',
          elements: [
            {
              id: 's1-badge',
              type: 'badge',
              content: 'PRESENTACIÓN OFICIAL DYSER',
              x: 10,
              y: 12,
              fontSize: 11,
              fontWeight: 'bold',
              color: '#FE6B00',
              backgroundColor: '#FFF5EB',
              borderColor: '#FE6B00',
              borderWidth: 1,
              borderRadius: 999,
              textAlign: 'center',
              zIndex: 1,
            },
            {
              id: 's1-title',
              type: 'heading',
              content: currentTopic,
              x: 10,
              y: 22,
              fontSize: 26,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 2,
            },
            {
              id: 's1-sub',
              type: 'subheading',
              content: 'Análisis Estructural, Algoritmos Rectores y Validación Empírica',
              x: 10,
              y: 46,
              fontSize: 16,
              color: '#64748B',
              textAlign: 'left',
              zIndex: 3,
            },
            {
              id: 's1-desc',
              type: 'text',
              content: '• Formulado para defensas de tesis y coloquios universitarios de honores.\n• Estructurado en 4 momentos argumentativos clave.\n• Sincronizado en tiempo real con Nasser AI Studio.',
              x: 10,
              y: 60,
              fontSize: 14,
              color: '#334155',
              textAlign: 'left',
              zIndex: 4,
            },
          ],
        },
        {
          id: 's2',
          pageNumber: 2,
          title: 'El Dilema de Escalabilidad',
          subtitle: 'Por qué fallan los enfoques tradicionales de arquitectura',
          backgroundColor: '#FFFFFF',
          elements: [
            {
              id: 's2-h',
              type: 'heading',
              content: 'Cuellos de Botella en Sistemas Convencionales',
              x: 10,
              y: 12,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 1,
            },
            {
              id: 's2-body',
              type: 'text',
              content: '1. Acoplamiento Temporal Estricto: Dependencia síncrona que amplifica la latencia.\n2. Inconsistencia de Estado: Pérdida de consenso ante particiones de red (Teorema CAP).\n3. Sobrecarga de Serialización: Degradación exponencial de rendimiento con alto throughput.',
              x: 10,
              y: 30,
              fontSize: 14,
              color: '#1E293B',
              textAlign: 'left',
              zIndex: 2,
            },
            {
              id: 's2-metric',
              type: 'badge',
              content: 'Reducción de Latencia Lograda: 68%',
              x: 10,
              y: 68,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#00236F',
              backgroundColor: '#EFF6FF',
              borderColor: '#00236F',
              borderWidth: 1,
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 3,
            },
          ],
        },
        {
          id: 's3',
          pageNumber: 3,
          title: 'Arquitectura Propuesta y Solución',
          subtitle: 'Diseño modular desacoplado basado en eventos',
          backgroundColor: '#FFFFFF',
          elements: [
            {
              id: 's3-h',
              type: 'heading',
              content: 'Flujo Asíncrono de Cero Bloqueo',
              x: 10,
              y: 12,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#00236F',
              textAlign: 'left',
              zIndex: 1,
            },
            {
              id: 's3-body',
              type: 'text',
              content: '• Patrón Event-Driven con colas distribuidas tolerantes a fallos.\n• Balanceo dinámico de carga mediante algoritmos de mínima latencia observada.\n• Caché distribuida multinivel con invalidación en tiempo real.',
              x: 10,
              y: 32,
              fontSize: 14,
              color: '#334155',
              textAlign: 'left',
              zIndex: 2,
            },
            {
              id: 's3-box',
              type: 'formula',
              content: 'Throughput: T(n) = O(log n) • Disponibilidad: 99.999% Five Nines',
              x: 10,
              y: 62,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#FE6B00',
              backgroundColor: '#FFF7ED',
              borderColor: '#FDBA74',
              borderWidth: 1,
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 3,
            },
          ],
        },
      ],
    };
  }

  // format === 'images' (Infografía / Diagrama Visual)
  return {
    id: `doc-img-${Date.now()}`,
    format: 'images',
    title: currentTopic,
    author: 'Estudiante dyser',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    theme: {
      primary: '#00236F',
      accent: '#FE6B00',
      background: '#FFFFFF',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    pages: [
      {
        id: 'img-1',
        pageNumber: 1,
        title: currentTopic,
        subtitle: 'Infografía Conceptual de Alta Precisión',
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'img-top-badge',
            type: 'badge',
            content: 'INFOGRAFÍA ACADÉMICA DYSER STUDIO',
            x: 10,
            y: 8,
            fontSize: 11,
            fontWeight: 'bold',
            color: '#FE6B00',
            backgroundColor: '#FFF5EB',
            borderColor: '#FE6B00',
            borderWidth: 1,
            borderRadius: 999,
            textAlign: 'center',
            zIndex: 1,
          },
          {
            id: 'img-title',
            type: 'heading',
            content: currentTopic,
            x: 10,
            y: 16,
            fontSize: 22,
            fontWeight: 'bold',
            color: '#00236F',
            textAlign: 'center',
            zIndex: 2,
          },
          {
            id: 'node-1',
            type: 'box',
            content: '1. Insumos Teóricos: Requisitos, Postulados y Condiciones Iniciales',
            x: 10,
            y: 30,
            fontSize: 13,
            fontWeight: 'bold',
            color: '#00236F',
            backgroundColor: '#EFF6FF',
            borderColor: '#93C5FD',
            borderWidth: 1.5,
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 3,
          },
          {
            id: 'node-arrow-1',
            type: 'text',
            content: '↓ [Transformación Causal y Procesamiento] ↓',
            x: 10,
            y: 43,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#64748B',
            textAlign: 'center',
            zIndex: 4,
          },
          {
            id: 'node-2',
            type: 'box',
            content: '2. Núcleo Algorítmico: Ejecución de Leyes de Balance e Invarianza',
            x: 10,
            y: 52,
            fontSize: 13,
            fontWeight: 'bold',
            color: '#FE6B00',
            backgroundColor: '#FFF7ED',
            borderColor: '#FDBA74',
            borderWidth: 2,
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 5,
          },
          {
            id: 'node-arrow-2',
            type: 'text',
            content: '↓ [Emisión de Resultados y Salidas Validadas] ↓',
            x: 10,
            y: 65,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#64748B',
            textAlign: 'center',
            zIndex: 6,
          },
          {
            id: 'node-3',
            type: 'box',
            content: '3. Salidas Óptimas: Estado Estable, Cero Fugas y Convergencia de Honores',
            x: 10,
            y: 74,
            fontSize: 13,
            fontWeight: 'bold',
            color: '#047857',
            backgroundColor: '#ECFDF5',
            borderColor: '#6EE7B7',
            borderWidth: 1.5,
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 7,
          },
        ],
      },
    ],
  };
}

/**
 * Generador Automático de Láminas de Mapa Mental Visual para Exposiciones
 * Enfocado estrictamente en esquemas, estructuras y dibujos sin saturación de texto
 */
export function createMindMapDocument(
  topic: string,
  points?: Array<{ title: string; keyIdea?: string; number?: number }>
): StudioDocument {
  const cleanTopic = topic || 'Mapa Mental Conceptual';
  const effectivePoints = points && points.length > 0
    ? points
    : [
        { number: 1, title: 'Fundamentos y Axiomas', keyIdea: 'Base conceptual' },
        { number: 2, title: 'Dinámica y Mecanismo', keyIdea: 'Estructura operativa' },
        { number: 3, title: 'Aplicación e Impacto', keyIdea: 'Solución verificable' },
      ];

  const colors = ['#00236F', '#FE6B00', '#059669', '#7C3AED', '#DC2626', '#0284C7'];
  const bgColors = ['#EFF6FF', '#FFF7ED', '#ECFDF5', '#F5F3FF', '#FEF2F2', '#F0F9FF'];
  const borderColors = ['#93C5FD', '#FDBA74', '#6EE7B7', '#C4B5FD', '#FCA5A5', '#7DD3FC'];

  // Diseñar la lámina central tipo canvas con nodos radiales y esquema visual limpio
  const elements: any[] = [
    // 1. Badge superior oficial
    {
      id: 'mm-badge',
      type: 'badge',
      content: 'MAPA MENTAL VISUAL • ESQUEMA NODAL DE EXPOSICIÓN',
      x: 10,
      y: 4,
      width: 80,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FE6B00',
      backgroundColor: '#FFF5EB',
      borderColor: '#FE6B00',
      borderWidth: 1,
      borderRadius: 999,
      textAlign: 'center',
      zIndex: 1,
    },
    // 2. Nodo Central Rector (El núcleo del tema)
    {
      id: 'mm-core-box',
      type: 'box',
      content: `⚡ ${cleanTopic.toUpperCase()} ⚡`,
      x: 20,
      y: 12,
      width: 60,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#00236F',
      borderColor: '#FE6B00',
      borderWidth: 2,
      borderRadius: 16,
      textAlign: 'center',
      zIndex: 10,
    },
  ];

  // Generar ramas nodales visuales (sin párrafos saturados)
  effectivePoints.forEach((pt, idx) => {
    const colIdx = idx % colors.length;
    const branchColor = colors[colIdx];
    const branchBg = bgColors[colIdx];
    const branchBorder = borderColors[colIdx];
    
    // Distribución vertical armónica para dispositivos móviles y escritorio
    const baseY = 26 + idx * 17;

    // Conector visual
    elements.push({
      id: `mm-conn-${idx}`,
      type: 'text',
      content: `▼── [ Rama ${idx + 1} ] ──▼`,
      x: 15,
      y: baseY,
      width: 70,
      fontSize: 11,
      fontWeight: 'bold',
      color: branchColor,
      textAlign: 'center',
      zIndex: 3,
    });

    // Nodo esquemático
    elements.push({
      id: `mm-node-${idx}`,
      type: 'box',
      content: `● ${pt.title.replace(/^\d+[\.\-\s]*/, '')}`,
      x: 8,
      y: baseY + 5,
      width: 84,
      fontSize: 13,
      fontWeight: 'bold',
      color: branchColor,
      backgroundColor: branchBg,
      borderColor: branchBorder,
      borderWidth: 1.5,
      borderRadius: 12,
      textAlign: 'center',
      zIndex: 5,
    });

    // Sub-etiqueta concisa de soporte gráfico (máximo 4 palabras, sin saturar)
    if (pt.keyIdea) {
      const shortConcept = pt.keyIdea.split(' ').slice(0, 5).join(' ');
      elements.push({
        id: `mm-sub-${idx}`,
        type: 'badge',
        content: `➜ ${shortConcept}`,
        x: 25,
        y: baseY + 11,
        width: 50,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        borderRadius: 999,
        textAlign: 'center',
        zIndex: 6,
      });
    }
  });

  return {
    id: `doc-mindmap-${Date.now()}`,
    format: 'images',
    title: `Mapa Mental: ${cleanTopic}`,
    author: 'Nasser AI Studio',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    theme: {
      primary: '#00236F',
      accent: '#FE6B00',
      background: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    pages: [
      {
        id: 'page-mindmap-1',
        pageNumber: 1,
        title: `Mapa Mental: ${cleanTopic}`,
        subtitle: 'Esquema visual nodal de alta síntesis para exposición oral',
        backgroundColor: '#F8FAFC',
        elements,
      },
    ],
  };
}
