import { jsPDF } from 'jspdf';
import { SummaryResult } from '../types';

/**
 * Sanitiza caracteres especiales para asegurar compatibilidad total con fuentes estándar de jsPDF.
 */
function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[•●▪]/g, '-')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’´`]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/\t/g, '  ')
    .trim();
}

/**
 * Genera y descarga un PDF académico formal y estructurado a partir del resultado de un resumen.
 */
export function exportSummaryToPdf(
  summary: SummaryResult,
  topicTitle: string = 'Resumen Académico'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174 mm
  let currentY = 20;

  // Verificador y generador de salto de página
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 25) {
      doc.addPage();
      currentY = 22;
      drawPageHeaderMini();
    }
  };

  const drawPageHeaderMini = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 35, 111);
    doc.text('dyser Academic • Resumen de Estudio', marginX, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(cleanTitle.slice(0, 40), pageWidth - marginX, 12, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 14, pageWidth - marginX, 14);
  };

  const cleanTitle = sanitizeForPdf(topicTitle || 'Síntesis y Fichas de Repaso');
  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // ==========================================
  // 1. CABECERA PRINCIPAL (PÁGINA 1)
  // ==========================================
  // Barra decorativa superior de dos tonos (Azul y Naranja dyser)
  doc.setFillColor(0, 35, 111);
  doc.rect(marginX, currentY, contentWidth * 0.75, 2.5, 'F');
  doc.setFillColor(254, 107, 0);
  doc.rect(marginX + contentWidth * 0.75, currentY, contentWidth * 0.25, 2.5, 'F');
  currentY += 8;

  // Marca y categoría
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(254, 107, 0);
  doc.text('DYSER ACADEMIC PRESS • MOTOR AUTÓNOMO NASSER AI', marginX, currentY);
  currentY += 7;

  // Título del tema
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 7 + 2;

  // Metadatos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de compilación: ${today}  |  Formato: Síntesis Ejecutiva con Flashcards`, marginX, currentY);
  currentY += 5;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // ==========================================
  // 2. SÍNTESIS EJECUTIVA
  // ==========================================
  ensureSpace(25);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 35, 111);
  doc.text('1. SÍNTESIS EJECUTIVA', marginX + 3.5, currentY + 5.5);
  currentY += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const cleanSummary = sanitizeForPdf(summary.executiveSummary || '');
  const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth);
  
  ensureSpace(summaryLines.length * 5 + 4);
  doc.text(summaryLines, marginX, currentY, { lineHeightFactor: 1.35 });
  currentY += summaryLines.length * 5.2 + 8;

  // ==========================================
  // 3. PUNTOS ESENCIALES
  // ==========================================
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    ensureSpace(20);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 35, 111);
    doc.text('2. PUNTOS ESENCIALES Y PRINCIPIOS RECTORES', marginX + 3.5, currentY + 5.5);
    currentY += 12;

    summary.keyPoints.forEach((pt, index) => {
      const cleanPt = sanitizeForPdf(pt);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(254, 107, 0);
      doc.text(`${index + 1}.`, marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const ptLines = doc.splitTextToSize(cleanPt, contentWidth - 8);
      ensureSpace(ptLines.length * 5 + 3);
      doc.text(ptLines, marginX + 7, currentY, { lineHeightFactor: 1.3 });
      currentY += ptLines.length * 5 + 3;
    });
    currentY += 4;
  }

  // ==========================================
  // 4. CONCEPTOS CLAVE O FÓRMULAS
  // ==========================================
  if (summary.keyFormulasOrConcepts && summary.keyFormulasOrConcepts.length > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 35, 111);
    doc.text('CONCEPTOS CLAVE DETERMINANTES:', marginX, currentY);
    currentY += 5;

    const conceptsStr = summary.keyFormulasOrConcepts.map(c => sanitizeForPdf(c)).join('  •  ');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const conceptLines = doc.splitTextToSize(conceptsStr, contentWidth);
    ensureSpace(conceptLines.length * 5);
    doc.text(conceptLines, marginX, currentY);
    currentY += conceptLines.length * 5 + 6;
  }

  // ==========================================
  // 5. ALERTA / TIP CRÍTICO PARA EXAMEN
  // ==========================================
  if (summary.examWarning) {
    const cleanWarning = sanitizeForPdf(summary.examWarning);
    const warningLines = doc.splitTextToSize(cleanWarning, contentWidth - 14);
    const boxHeight = warningLines.length * 4.8 + 12;

    ensureSpace(boxHeight + 4);
    // Fondo de aviso ambar
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('¡TIP CRÍTICO DE EXAMEN Y TRAMPA FRECUENTE!', marginX + 6, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    doc.text(warningLines, marginX + 6, currentY + 11.5, { lineHeightFactor: 1.3 });

    currentY += boxHeight + 8;
  }

  // ==========================================
  // 6. FLASHCARDS DE MEMORIZACIÓN
  // ==========================================
  if (summary.flashcards && summary.flashcards.length > 0) {
    ensureSpace(25);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 35, 111);
    doc.text('3. TARJETAS DE MEMORIZACIÓN ACTIVA (FLASHCARDS)', marginX + 3.5, currentY + 5.5);
    currentY += 12;

    summary.flashcards.forEach((card, idx) => {
      const cleanFront = sanitizeForPdf(card.front);
      const cleanBack = sanitizeForPdf(card.back);

      const qLines = doc.splitTextToSize(`P: ${cleanFront}`, contentWidth - 8);
      const aLines = doc.splitTextToSize(`R: ${cleanBack}`, contentWidth - 8);
      const cardHeight = qLines.length * 4.5 + aLines.length * 4.5 + 8;

      ensureSpace(cardHeight + 4);

      // Tarjeta
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

      // Línea vertical izquierda decorativa
      doc.setFillColor(idx % 2 === 0 ? 0 : 254, idx % 2 === 0 ? 35 : 107, idx % 2 === 0 ? 111 : 0);
      doc.rect(marginX, currentY, 2, cardHeight, 'F');

      let cardInnerY = currentY + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, marginX + 5, cardInnerY, { lineHeightFactor: 1.25 });
      cardInnerY += qLines.length * 4.5 + 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(aLines, marginX + 5, cardInnerY, { lineHeightFactor: 1.25 });

      currentY += cardHeight + 4;
    });
  }

  // ==========================================
  // PIE DE PÁGINA EN TODAS LAS PÁGINAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('dyser PWA • Documento Oficial de Estudio Personal', marginX, pageHeight - 9);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 9, { align: 'right' });
  }

  // Nombre de archivo seguro
  const safeFilename = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 28)
    .replace(/_+/g, '_');

  doc.save(`Resumen_dyser_${safeFilename || 'academico'}_${Date.now().toString().slice(-4)}.pdf`);
}
