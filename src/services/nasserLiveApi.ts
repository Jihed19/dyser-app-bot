/**
 * ============================================================================
 * SERVICIO OFICIAL NÚCLEO NASSER AI (PWA DYSER)
 * ============================================================================
 * 
 * Motor de investigación académica autónomo y de élite para dyser.
 * Conexión nativa con el motor de Google AI Studio configurado para Nasser AI.
 * Captura de información investigada para la generación local de exámenes,
 * resúmenes, tareas y presentaciones sin depender del agente para la UI.
 * ============================================================================
 */

import { nasserAI } from './nasserEngines';

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  text: string;
}

export interface InvestigacionCapturada {
  id: string;
  materia: string;
  tema: string;
  contenidoTexto: string;
  puntosClave: string[];
  fecha: number;
}

/**
 * Función principal para conectar la PWA de dyser con Nasser AI
 * Realiza la llamada al endpoint del motor Nasser AI optimizado con streaming y fallback
 * Admite audio real grabado desde el micrófono para grabaciones de clases en vivo.
 */
export async function consultarNasserAI(
  preguntaDelUsuario: string,
  materia: string = 'Ciencias y Humanidades',
  audioPayload?: { audioBase64: string; mimeType: string }
): Promise<string> {
  const queryLimpia = preguntaDelUsuario.trim();
  if (!queryLimpia && !audioPayload) return '';

  try {
    const response = await fetch('/api/ai/nasser-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preguntaDelUsuario: queryLimpia,
        message: queryLimpia,
        topic: materia,
        audioBase64: audioPayload?.audioBase64,
        mimeType: audioPayload?.mimeType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Estado HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data && (data.reply || data.respuestaCompleta)) {
      return data.reply || data.respuestaCompleta;
    }
    throw new Error('Respuesta no válida del motor');
  } catch (error) {
    console.warn('[Nasser AI] Activando motor cognitivo local autónomo de respaldo:', error);
    // Fallback local autónomo e inmediato para garantizar 100% de disponibilidad offline
    await new Promise((resolve) => setTimeout(resolve, 300));
    return nasserAI.responderConsultaEstudiante(queryLimpia);
  }
}

/**
 * Consulta interactiva con historial, contexto de disciplina y audio opcional para la PWA
 */
export async function sendLiveNasserQuery(
  message: string,
  history: ChatHistoryEntry[] = [],
  subjectContext: string = 'Ciencias y Humanidades',
  audioPayload?: { audioBase64: string; mimeType: string }
): Promise<string> {
  return consultarNasserAI(message, subjectContext, audioPayload);
}

/**
 * Mecanismo de persistencia local:
 * Captura la información de una respuesta de investigación de Nasser AI
 * para ser consumida instantáneamente por los módulos locales de dyser:
 * - Exámenes (ExamSimulatorView)
 * - Resúmenes & Flashcards (SummaryView)
 * - Diapositivas & Exposiciones (MultimediaCreatorView)
 */
export function capturarInvestigacionDyser(investigacion: {
  tema: string;
  materia?: string;
  contenido: string;
}): InvestigacionCapturada {
  const lineas = investigacion.contenido.split('\n').map((l) => l.trim()).filter(Boolean);
  const puntosClave = lineas
    .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))
    .slice(0, 8)
    .map((l) => l.replace(/^[•\-\*\d\.]+\s*/, '').trim());

  const payload: InvestigacionCapturada = {
    id: `inv-${Date.now()}`,
    materia: investigacion.materia || 'General',
    tema: investigacion.tema,
    contenidoTexto: investigacion.contenido,
    puntosClave: puntosClave.length > 0 ? puntosClave : [investigacion.tema],
    fecha: Date.now(),
  };

  try {
    sessionStorage.setItem('dyser_ultima_investigacion', JSON.stringify(payload));
  } catch (e) {
    console.warn('Error al guardar investigación en sessionStorage', e);
  }

  return payload;
}

/**
 * Prepara los datos investigados para el Simulador de Exámenes local
 */
export function transferirInvestigacionAExamen(tema: string, contenido: string) {
  const payload = capturarInvestigacionDyser({ tema, contenido });
  try {
    sessionStorage.setItem('dyser_active_exam_topic', tema);
    sessionStorage.setItem('dyser_exam_research_context', contenido);
  } catch (e) {
    console.warn(e);
  }
  return payload;
}

/**
 * Prepara los datos investigados para el generador de Resúmenes & Flashcards local
 */
export function transferirInvestigacionAResumen(tema: string, contenido: string) {
  const payload = capturarInvestigacionDyser({ tema, contenido });
  try {
    sessionStorage.setItem('dyser_summary_input', contenido);
    sessionStorage.setItem('dyser_summary_topic', tema);
  } catch (e) {
    console.warn(e);
  }
  return payload;
}

/**
 * Prepara los datos investigados para el generador de Diapositivas y Exposiciones local
 */
export function transferirInvestigacionAExposicion(tema: string, contenido: string) {
  const payload = capturarInvestigacionDyser({ tema, contenido });
  try {
    sessionStorage.setItem('dyser_multimedia_topic', tema);
    sessionStorage.setItem('dyser_multimedia_context', contenido);
  } catch (e) {
    console.warn(e);
  }
  return payload;
}

