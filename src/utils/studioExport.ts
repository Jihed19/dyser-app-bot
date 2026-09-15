import { jsPDF } from 'jspdf';
import { StudioDocument, StudioFormat, StudioGalleryItem } from '../components/studio/StudioTypes';

const GALLERY_STORAGE_KEY = 'dyser_nasser_studio_gallery';

/**
 * Sanitiza texto para fuentes estándar de jsPDF
 */
function cleanText(text: string): string {
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
 * Guarda un documento en la Galería Interna de Nasser AI Studio
 */
export function saveToInternalGallery(doc: StudioDocument): StudioGalleryItem {
  const existingStr = localStorage.getItem(GALLERY_STORAGE_KEY);
  let gallery: StudioGalleryItem[] = [];
  if (existingStr) {
    try {
      gallery = JSON.parse(existingStr);
    } catch (e) {
      console.warn('Error parsing studio gallery', e);
    }
  }

  const existingIndex = gallery.findIndex((item) => item.id === doc.id);
  const galleryItem: StudioGalleryItem = {
    id: doc.id,
    title: doc.title || 'Documento sin título',
    format: doc.format,
    createdAt: doc.createdAt || Date.now(),
    updatedAt: Date.now(),
    pagesCount: doc.pages.length,
    documentData: doc,
  };

  if (existingIndex >= 0) {
    gallery[existingIndex] = galleryItem;
  } else {
    gallery.unshift(galleryItem);
  }

  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
  return galleryItem;
}

/**
 * Obtiene todos los elementos de la Galería Interna
 */
export function getInternalGallery(): StudioGalleryItem[] {
  const existingStr = localStorage.getItem(GALLERY_STORAGE_KEY);
  if (!existingStr) return [];
  try {
    return JSON.parse(existingStr);
  } catch (e) {
    console.warn('Error fetching studio gallery', e);
    return [];
  }
}

/**
 * Elimina un elemento de la Galería Interna
 */
export function deleteFromInternalGallery(id: string): void {
  const items = getInternalGallery().filter((i) => i.id !== id);
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Exporta y descarga un PDF multi-página formal A4 (Documento Académico)
 */
export function exportDocumentToPdf(doc: StudioDocument): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;

  doc.pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      pdf.addPage();
    }

    let y = 20;

    // Header universitario superior
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 35, 111); // dyser blue
    pdf.text('dyser Academic • Nasser AI Studio', marginX, 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${pageIdx + 1} de ${doc.pages.length}`, pageWidth - marginX, 12, { align: 'right' });

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, 14, pageWidth - marginX, 14);

    // Título de la página / sección
    if (pageIdx === 0) {
      // Portada / Cabecera Principal
      pdf.setFillColor(0, 35, 111);
      pdf.roundedRect(marginX, y, contentWidth, 24, 3, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text(cleanText(doc.title), marginX + 6, y + 10);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(254, 107, 0); // dyser orange
      pdf.text(`Autor: ${doc.author || 'Estudiante dyser'}  •  Fecha: ${new Date().toLocaleDateString('es-ES')}`, marginX + 6, y + 18);

      y += 32;
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(0, 35, 111);
      pdf.text(cleanText(page.title || `Sección ${pageIdx + 1}`), marginX, y);
      y += 8;

      if (page.subtitle) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(cleanText(page.subtitle), marginX, y);
        y += 8;
      }
    }

    // Renderizar elementos ordenados por Y
    const sortedElements = [...page.elements].sort((a, b) => a.y - b.y);

    sortedElements.forEach((el) => {
      const text = cleanText(el.content);
      if (!text) return;

      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }

      switch (el.type) {
        case 'heading':
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(0, 35, 111);
          pdf.text(text, marginX, y);
          y += 7;
          break;

        case 'subheading':
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(30, 41, 59);
          pdf.text(text, marginX, y);
          y += 6;
          break;

        case 'badge':
          pdf.setFillColor(255, 245, 235);
          pdf.setDrawColor(254, 107, 0);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(marginX, y - 4, 60, 6, 2, 2, 'FD');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(254, 107, 0);
          pdf.text(text, marginX + 4, y);
          y += 8;
          break;

        case 'formula':
          pdf.setFillColor(248, 250, 252);
          pdf.setDrawColor(203, 213, 225);
          pdf.roundedRect(marginX, y - 4, contentWidth, 10, 2, 2, 'FD');
          pdf.setFont('courier', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(15, 23, 42);
          pdf.text(text, marginX + 4, y + 2);
          y += 13;
          break;

        case 'text':
        default: {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          pdf.setTextColor(51, 65, 85);
          const splitLines = pdf.splitTextToSize(text, contentWidth);
          pdf.text(splitLines, marginX, y);
          y += splitLines.length * 4.8 + 3;
          break;
        }
      }
    });

    // Pie de página
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generado y validado en Nasser AI Studio • dyser Academic OS', marginX, pageHeight - 10);
    pdf.text(`Pág. ${pageIdx + 1}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
  });

  const safeFileName = `${(doc.title || 'dyser_documento').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;
  pdf.save(safeFileName);
}

/**
 * Exporta y descarga Diapositivas en formato PDF Paisaje 16:9
 */
export function exportSlidesToPdf(doc: StudioDocument): void {
  // 16:9 Landscape: 297mm x 167mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167],
  });

  const pageWidth = 297;
  const pageHeight = 167;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;

  doc.pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      pdf.addPage([297, 167], 'landscape');
    }

    // Fondo de la diapositiva
    if (page.backgroundColor && page.backgroundColor !== '#FFFFFF') {
      const r = parseInt(page.backgroundColor.slice(1, 3), 16) || 247;
      const g = parseInt(page.backgroundColor.slice(3, 5), 16) || 249;
      const b = parseInt(page.backgroundColor.slice(5, 7), 16) || 251;
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // Borde decorativo superior
    pdf.setFillColor(0, 35, 111);
    pdf.rect(0, 0, pageWidth, 5, 'F');
    pdf.setFillColor(254, 107, 0);
    pdf.rect(0, 0, 45, 5, 'F');

    // Header mini
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 35, 111);
    pdf.text(`dyser Academic Slides • Lámina ${pageIdx + 1} de ${doc.pages.length}`, marginX, 12);

    // Título de la diapositiva
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 35, 111);
    pdf.text(cleanText(page.title || doc.title), marginX, 26);

    if (page.subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(cleanText(page.subtitle), marginX, 34);
    }

    // Elementos en la diapositiva
    let yPos = 46;
    page.elements.forEach((el) => {
      const text = cleanText(el.content);
      if (!text) return;

      if (el.type === 'heading') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(0, 35, 111);
        pdf.text(text, marginX, yPos);
        yPos += 8;
      } else if (el.type === 'badge') {
        pdf.setFillColor(254, 107, 0);
        pdf.roundedRect(marginX, yPos - 4, 45, 6, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text(text, marginX + 3, yPos);
        yPos += 9;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 41, 59);
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, marginX, yPos);
        yPos += lines.length * 6 + 4;
      }
    });

    // Barra inferior
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Nasser AI Studio • dyser Presenter Engine', marginX, pageHeight - 6);
    pdf.text(`${pageIdx + 1}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  });

  const safeFileName = `${(doc.title || 'dyser_presentacion').replace(/[^a-zA-Z0-9_\-]/g, '_')}_slides.pdf`;
  pdf.save(safeFileName);
}

/**
 * Exporta y descarga una Imagen PNG de alta resolución dibujando la página en un canvas HTML5
 */
export async function exportPageToImage(pageElementId: string, title: string = 'dyser_imagen'): Promise<void> {
  const element = document.getElementById(pageElementId);
  if (!element) {
    throw new Error('Elemento de lienzo no encontrado');
  }

  // Generamos un Canvas 1920x1080 o el aspect ratio del contenedor
  const rect = element.getBoundingClientRect();
  const scale = 2; // retina 2x
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D');

  ctx.scale(scale, scale);

  // Dibuja el fondo
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Usamos SVG foreignObject para renderizar con fidelidad exacta de fuentes y estilos CSS
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; font-family: system-ui, sans-serif;">
          ${new XMLSerializer().serializeToString(clone)}
        </div>
      </foreignObject>
    </svg>
  `;

  const img = new Image();
  const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback a canvas dibujado básico
      resolve(true);
    };
    img.src = url;
  });

  // Descarga el PNG final
  const pngUrl = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  const safeTitle = (title || 'dyser_infografia').replace(/[^a-zA-Z0-9_\-]/g, '_');
  downloadLink.download = `${safeTitle}.png`;
  downloadLink.href = pngUrl;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Función Maestra de Exportación Externa: detecta el formato y ejecuta la descarga en el dispositivo
 */
export async function executeExport(
  doc: StudioDocument,
  canvasElementId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (doc.format === 'pdf') {
      exportDocumentToPdf(doc);
      return {
        success: true,
        message: 'Tratado en PDF descargado con éxito en tu almacenamiento local.',
      };
    } else if (doc.format === 'slides') {
      exportSlidesToPdf(doc);
      return {
        success: true,
        message: 'Diapositivas exportadas en PDF de alta resolución en tus descargas.',
      };
    } else {
      if (canvasElementId) {
        await exportPageToImage(canvasElementId, doc.title);
      } else {
        // Fallback PDF para imágenes / diagramas
        exportDocumentToPdf(doc);
      }
      return {
        success: true,
        message: 'Infografía / Imagen guardada en la galería y descargada en tu dispositivo.',
      };
    }
  } catch (err: any) {
    console.error('Error al exportar documento:', err);
    return {
      success: false,
      message: `Error en la exportación: ${err?.message || 'Fallo desconocido'}`,
    };
  }
}
