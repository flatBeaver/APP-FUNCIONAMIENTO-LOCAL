import { jsPDF } from 'jspdf';
import { ProductionJob, AppConfig } from '../types';
import { calcularJob, formatDayMonth } from './dateCalculations';

/**
 * Dibuja el emblema corporativo de MEB Estudio Gráfico vectorizado
 */
function drawMebBrandEmblem(doc: jsPDF, x: number, y: number): void {
  // Cuadrado negro de fondo con esquinas redondeadas
  doc.setFillColor(15, 15, 15);
  doc.roundedRect(x, y, 9, 9, 1.5, 1.5, 'F');
  
  // Punto rojo característico de la marca MEB
  doc.setFillColor(220, 38, 38);
  doc.circle(x + 7.2, y + 2.2, 0.9, 'F');
  
  // Iniciales MEB en blanco
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.text('MEB', x + 4.5, y + 6, { align: 'center' });
}

/**
 * Dibuja una línea punteada horizontal para campos manuales
 */
function drawDottedLine(doc: jsPDF, x1: number, y: number, x2: number): void {
  if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash([0.6, 1.2]);
  } else if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([0.6, 1.2], 0);
  }
  doc.line(x1, y, x2, y);
  if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash([]);
  } else if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([], 0);
  }
}

/**
 * Genera el PDF de la Planilla de Taller y Procesos siguiendo la distribución
 * exacta de la planilla base (PLANILLA BASE EXPORTAR.jpg):
 * - Cabecera con banda gris suave: "Meb Estudio Gráfico", "Planilla de taller y procesos",
 *   "Orden Nº:" y "Fecha emisión:"
 * - Estado del trabajo: recuadro con casillas redondeadas (Diseño, Impresión / corte, Taller, Armado de kit, Control, Entrega)
 * - 1_ Especificaciones técnicas y producción (Materiales, Tipo/color, Máquina, Tamaños, Retiro/Envío)
 * - 2_ Ubicación del archivo (//MAURICIOPC/My documents:...)
 * - 3_ Identificación del trabajo (Producto/kit, Cliente, Modelo/Nº Serie, Fechas, y recuadro destacado de Cantidad)
 * - 4_ Postprocesados que lleva (Corte, Laminado Mate, Laminado brillante, Barniz)
 * - 5_ Observaciones (Líneas punteadas para anotaciones a mano o impresas)
 * - 6_ Control de calidad (Firma operador, Control Conforme, Entrega / Retiro)
 */
export function generateWorkOrderPDF(job: ProductionJob, config: AppConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const companyName = job.empresaNombre || config.parametros.empresaNombre || 'Meb Estudio Gráfico';
  const emissionDate = job.fechaEmision || new Date().toLocaleDateString('es-ES');

  // --- 1. CABECERA CON BANDA ROJA CORPORATIVA SUTIL Y FONDO BLANCO ---
  // Fondo general blanco puro
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Fina banda roja corporativa MEB en la parte superior (detalle puntual de marca)
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 2.8, 'F');

  // Banda cabecera suave
  doc.setFillColor(248, 249, 250);
  doc.rect(0, 2.8, 210, 23.2, 'F');
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.4);
  doc.line(14, 26, 196, 26);

  // Título: Meb Estudio Gráfico
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(companyName, 14, 13.5);

  // Subtítulo: Planilla de taller y procesos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Planilla de taller y procesos', 14, 20);

  // Lado derecho: Orden Nº y Fecha emisión con detalle rojo en Orden Nº
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Orden Nº:', 148, 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(job.id || '', 167, 12);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha emisión:', 148, 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(emissionDate, 175, 19);

  // --- 2. ESTADO DEL TRABAJO ---
  let y = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Estado del trabajo', 14, y);

  y += 3;
  // Recuadro redondeado exterior
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 9, 2.5, 2.5, 'D');

  const estadosPlanilla = [
    { label: 'Diseño', key: 'diseño' },
    { label: 'Impresión / corte', key: 'impresi' },
    { label: 'Taller', key: 'taller' },
    { label: 'Armado de kit', key: 'armado' },
    { label: 'Control', key: 'control' },
    { label: 'Entrega', key: 'entrega' },
  ];

  const currentStatusNorm = (job.estado || '').toLowerCase();
  const selectedList = job.estadosSeleccionados;
  const hasMultipleSelected = Array.isArray(selectedList) && selectedList.length > 0;
  const estadoWidth = 182 / estadosPlanilla.length;

  estadosPlanilla.forEach((st, idx) => {
    const itemX = 16 + idx * estadoWidth;
    let isSelected = false;

    if (hasMultipleSelected) {
      isSelected = selectedList.some((s) => {
        const sNorm = s.toLowerCase();
        return (
          sNorm === st.label.toLowerCase() ||
          sNorm.includes(st.key) ||
          (st.key === 'impresi' && (sNorm.includes('corte') || sNorm.includes('print'))) ||
          (st.key === 'taller' && (sNorm.includes('producci') || sNorm.includes('proceso'))) ||
          (st.key === 'armado' && (sNorm.includes('montaje') || sNorm.includes('kit'))) ||
          (st.key === 'control' && (sNorm.includes('calidad') || sNorm.includes('revisi'))) ||
          (st.key === 'entrega' && (sNorm.includes('entregado') || sNorm.includes('terminado') || sNorm.includes('listo')))
        );
      });
    } else {
      isSelected = 
        currentStatusNorm.includes(st.key) || 
        (st.key === 'impresi' && (currentStatusNorm.includes('corte') || currentStatusNorm.includes('print'))) ||
        (st.key === 'taller' && (currentStatusNorm.includes('producci') || currentStatusNorm.includes('proceso'))) ||
        (st.key === 'armado' && (currentStatusNorm.includes('montaje') || currentStatusNorm.includes('kit'))) ||
        (st.key === 'control' && (currentStatusNorm.includes('calidad') || currentStatusNorm.includes('revisi'))) ||
        (st.key === 'entrega' && (currentStatusNorm.includes('entregado') || currentStatusNorm.includes('terminado') || currentStatusNorm.includes('listo')));
    }

    // Checkbox redondeado / píldora
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(itemX, y + 2.2, 5.5, 4.2, 1.4, 1.4, 'D');

    if (isSelected) {
      // Relleno rojo de la marca para destacar los estados tildados
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(itemX + 0.8, y + 3, 3.9, 2.6, 0.8, 0.8, 'F');
    }

    doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(st.label, itemX + 7, y + 5.5);
  });

  // Helper para dibujar título de sección con doble línea inferior
  const drawPlanillaHeader = (title: string, sectionY: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, sectionY);

    // Doble línea horizontal
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(14, sectionY + 2.5, 196, sectionY + 2.5);
    doc.line(14, sectionY + 3.8, 196, sectionY + 3.8);
  };

  // --- 3. 1_ ESPECIFICACIONES TÉCNICAS Y PRODUCCIÓN ---
  y = 47;
  drawPlanillaHeader('1_ Especificaciones técnicas y producción', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 27, 2.5, 2.5, 'D');

  // Columna Izquierda
  // Materiales / soporte:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Materiales / soporte:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  const matVal = job.material || job.tipoVinilo || '—';
  doc.text(matVal, 56, y + 6);

  // Tipo y color:
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo y color:', 18, y + 14);
  doc.setFont('helvetica', 'normal');
  const tipoColorVal = [job.tipoVinilo, job.color].filter(Boolean).join(' · ') || job.color || job.tipoVinilo || '—';
  doc.text(tipoColorVal, 41, y + 14);

  // Máquina asignada:
  doc.setFont('helvetica', 'bold');
  doc.text('Máquina asignada:', 18, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(job.maquina || '—', 53, y + 22);

  // Columna Derecha
  // Tamaños:
  doc.setFont('helvetica', 'bold');
  doc.text('Tamaños:', 102, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(job.dimensiones || '—', 121, y + 6);

  // Metodo de entrega:
  doc.setFont('helvetica', 'bold');
  doc.text('Metodo de entrega:', 102, y + 14);

  // Checkboxes Retiro / Envío
  const isRetiro = Boolean(
    job.retiroPorCliente ||
    (job.metodoEntrega || '').toLowerCase().includes('retiro') ||
    (job.metodoEntrega || '').toLowerCase().includes('taller')
  );
  const isEnvio = Boolean(
    !isRetiro &&
    ((job.metodoEntrega || '').toLowerCase().includes('env') ||
     (job.metodoEntrega || '').toLowerCase().includes('mensaj') ||
     (job.metodoEntrega || '').toLowerCase().includes('transp'))
  );

  // ( ) Retiro
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.roundedRect(102, y + 18.5, 5.5, 4.2, 1.4, 1.4, 'D');
  if (isRetiro) {
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(102 + 0.8, y + 19.3, 3.9, 2.6, 0.8, 0.8, 'F');
  }
  doc.setFont('helvetica', isRetiro ? 'bold' : 'normal');
  doc.setFontSize(8.5);
  doc.text('Retiro', 109.5, y + 22);

  // ( ) Envío
  doc.setDrawColor(0, 0, 0);
  doc.roundedRect(132, y + 18.5, 5.5, 4.2, 1.4, 1.4, 'D');
  if (isEnvio) {
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(132 + 0.8, y + 19.3, 3.9, 2.6, 0.8, 0.8, 'F');
  }
  doc.setFont('helvetica', isEnvio ? 'bold' : 'normal');
  doc.text('Envío', 139.5, y + 22);

  // --- 4. 2_ UBICACIÓN DEL ARCHIVO ---
  y = 86;
  drawPlanillaHeader('2_ Ubicación del archivo', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 9, 2.5, 2.5, 'D');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const pathVal = job.ubicacionArchivos || job.rutaArchivo || '//MAURICIOPC/My documents:';
  doc.text(pathVal, 18, y + 6);

  // --- 5. 3_ IDENTIFICACIÓN DEL TRABAJO ---
  y = 107;
  drawPlanillaHeader('3_ Identificación del trabajo', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 30, 2.5, 2.5, 'D');

  // Columna 1
  // Producto / kit:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Producto / kit:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(job.kit || '—', 45, y + 7);

  // Modelo / Nº Serie:
  doc.setFont('helvetica', 'bold');
  doc.text('Modelo / Nº Serie:', 18, y + 16);
  doc.setFont('helvetica', 'normal');
  const modSer = [job.modelo, job.numSerie ? `(S/N: ${job.numSerie})` : ''].filter(Boolean).join(' ') || '—';
  doc.text(modSer, 52, y + 16);

  // Tipo de trabajo:
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de trabajo:', 18, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(job.tipo || '—', 47, y + 25);

  // Columna 2
  // Cliente:
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 102, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(job.clienteNombre || '—', 118, y + 7);

  // Fecha inicio:
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha inicio:', 102, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(job.fechaInicio || '—', 126, y + 16);

  // Fecha límite:
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha límite:', 102, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(job.fechaVencimiento || '—', 126, y + 25);

  // Recuadro Cantidad (Derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Cantidad', 178, y + 5.5, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(168, y + 7, 20, 19, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(job.cantidad || 1), 178, y + 19.5, { align: 'center' });

  // --- 6. 4_ POSTPROCESADOS QUE LLEVA ---
  y = 149;
  drawPlanillaHeader('4_ Postprocesados que lleva', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 9, 2.5, 2.5, 'D');

  const postprocesadosImg = [
    { 
      label: 'Corte', 
      checked: Boolean(
        job.postprocesados?.some(p => p.toLowerCase().includes('corte')) ||
        (job.notas || '').toLowerCase().includes('corte')
      )
    },
    { 
      label: 'Laminado Mate', 
      checked: Boolean(
        job.postprocesados?.some(p => p.toLowerCase().includes('mate')) ||
        (job.laminado && (job.notas || '').toLowerCase().includes('mate'))
      )
    },
    { 
      label: 'Laminado brillante', 
      checked: Boolean(
        job.postprocesados?.some(p => p.toLowerCase().includes('brillante')) ||
        (job.laminado && !(job.notas || '').toLowerCase().includes('mate'))
      )
    },
    { 
      label: 'Barniz', 
      checked: Boolean(
        job.barnizado ||
        job.postprocesados?.some(p => p.toLowerCase().includes('barniz')) ||
        job.laqueado
      )
    },
  ];

  const postPositions = [18, 60, 118, 170];
  postprocesadosImg.forEach((p, idx) => {
    const curX = postPositions[idx];
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(curX, y + 2.2, 5.5, 4.2, 1.4, 1.4, 'D');

    if (p.checked) {
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(curX + 0.8, y + 3, 3.9, 2.6, 0.8, 0.8, 'F');
    }

    doc.setFont('helvetica', p.checked ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(p.label, curX + 7, y + 5.5);
  });

  // --- 7. 5_ OBSERVACIONES ---
  y = 170;
  drawPlanillaHeader('5_ Observaciones', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 30, 2.5, 2.5, 'D');

  // Líneas punteadas para escritura manual
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  drawDottedLine(doc, 22, y + 12, 188);
  drawDottedLine(doc, 22, y + 21, 188);

  // Si hay notas, las imprimimos limpias en el recuadro
  if (job.notas && job.notas.trim().length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    const split = doc.splitTextToSize(job.notas, 166);
    doc.text(split, 22, y + 8);
  }

  // --- 8. 6_ CONTROL DE CALIDAD ---
  y = 212;
  drawPlanillaHeader('6_ Control de calidad', y);

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, 182, 32, 2.5, 2.5, 'D');

  // Columna 1: Firma operador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Firma operador', 45, y + 8, { align: 'center' });

  if (job.firmaOperador) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(job.firmaOperador, 45, y + 15, { align: 'center' });
  }

  doc.setLineWidth(0.25);
  drawDottedLine(doc, 25, y + 17, 65);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(job.fechaOperador ? `Fecha: ${job.fechaOperador}` : 'Fecha:    /    / 26', 45, y + 23, { align: 'center' });

  // Columna 2: Control
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Control', 105, y + 8, { align: 'center' });

  if (job.firmaControl || job.controlConforme) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(job.firmaControl || 'Conforme ✓', 105, y + 15, { align: 'center' });
  }

  drawDottedLine(doc, 85, y + 17, 125);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(job.controlConforme ? 'Conforme ✓' : 'Conforme', 105, y + 23, { align: 'center' });

  // Columna 3: Entrega / Retiro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Entrega / Retiro', 165, y + 8, { align: 'center' });

  if (job.firmaEntrega) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(job.firmaEntrega, 165, y + 15, { align: 'center' });
  }

  drawDottedLine(doc, 145, y + 17, 185);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(job.fechaEntrega ? `Fecha: ${job.fechaEntrega}` : 'Fecha:    /    / 26', 165, y + 23, { align: 'center' });

  // Download trigger
  const cleanKit = (job.kit || 'Planilla').slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Planilla-Taller-${job.id || 'MEB'}-${cleanKit}.pdf`;
  doc.save(filename);
}

/**
 * Genera el PDF del Planning Diario de Producción.
 * - Formato apaisado (Landscape A4).
 * - Banda roja corporativa superior MEB.
 * - Emblema MEB Estudio Gráfico.
 * - Fondo blanco, letras negras para óptima lectura.
 * - Casilleros de fases manuales para marcar a lápiz en taller.
 */
export function generateBatchSchedulePDF(
  jobs: ProductionJob[],
  config: AppConfig,
  filterDescription?: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const companyName = config.parametros.empresaNombre || 'MEB ESTUDIO GRÁFICO';
  const companySubtitle = config.parametros.empresaSubtitulo || 'Taller de Rotulación, Impresión Digital y Gran Formato';
  const today = new Date().toLocaleDateString('es-ES');

  // 1. Banda superior corporativa roja MEB (ancho 297mm en landscape)
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 297, 2.5, 'F');

  // 2. Emblema MEB en cabecera
  drawMebBrandEmblem(doc, 14, 6);

  // 3. Título y subtítulo
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${companyName} · PLANNING DE TALLER`, 26, 10.5);

  const compWidth = doc.getTextWidth(`${companyName} · PLANNING DE TALLER`);
  doc.setFillColor(220, 38, 38);
  doc.circle(26 + compWidth + 2.5, 9.4, 0.9, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const subtitle = filterDescription
    ? `${companySubtitle} · Filtro: ${filterDescription} · Total: ${jobs.length} trabajos`
    : `${companySubtitle} · Total en lista: ${jobs.length} órdenes de producción`;
  doc.text(subtitle, 26, 14.5);

  // 4. Distintivo superior derecho
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(240, 5.5, 43, 7.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONTROL TALLER', 261.5, 10.5, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Emisión: ${today}`, 283, 16.5, { align: 'right' });

  // 5. Divisor superior con acento rojo
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.6);
  doc.line(14, 18.5, 45, 18.5);

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.25);
  doc.line(45, 18.5, 283, 18.5);

  // Table header: cabecera limpia con fondo gris claro sutil y texto negro
  let y = 22;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 269, 7.5, 'F');

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(14, y, 283, y);
  doc.line(14, y + 7.5, 283, y + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  const cols = [
    { name: 'ID', x: 16 },
    { name: 'KIT / PRODUCTO', x: 38 },
    { name: 'CLIENTE', x: 92 },
    { name: 'MODELO / SERIE', x: 132 },
    { name: 'CANT.', x: 168 },
    { name: 'MATERIAL / SOPORTE', x: 180 },
    { name: 'MÁQUINA', x: 220 },
    { name: 'PLAZOS (D/M)', x: 248 },
    { name: 'FASES A LÁPIZ [  ]', x: 270 },
  ];

  cols.forEach((c) => doc.text(c.name, c.x, y + 5));
  y += 7.5;

  const tableStartY = 22;

  // Table rows: sin rellenos oscuros, fondo blanco, línea horizontal fina negra
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);

  jobs.forEach((j) => {
    if (y > 188) {
      // Cerrar líneas laterales de la página actual
      doc.setLineWidth(0.25);
      doc.line(14, tableStartY, 14, y);
      doc.line(283, tableStartY, 283, y);

      doc.addPage();
      y = 16;

      // Reimprimir encabezado de tabla
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, 269, 7.5, 'F');

      doc.setDrawColor(0, 0, 0);
      doc.line(14, y, 283, y);
      doc.line(14, y + 7.5, 283, y + 7.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      cols.forEach((c) => doc.text(c.name, c.x, y + 5));
      y += 7.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    const esVinilo = (j.material || '').toLowerCase().includes('vinilo') || Boolean(j.tipoVinilo);
    const materialSoporte = esVinilo 
      ? (j.tipoVinilo ? `Vinilo: ${j.tipoVinilo}` : 'Vinilo')
      : (j.material || '—');

    const modeloSerie = [j.modelo, j.numSerie].filter(Boolean).join(' · ') || '—';

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(j.id, 16, y + 5);
    doc.setFont('helvetica', 'normal');

    doc.text((j.kit || '').slice(0, 28), 38, y + 5);
    doc.text((j.clienteNombre || '').slice(0, 20), 92, y + 5);
    doc.text(modeloSerie.slice(0, 18), 132, y + 5);
    doc.text(String(j.cantidad), 170, y + 5);
    doc.text(materialSoporte.slice(0, 22), 180, y + 5);
    doc.text((j.maquina || '').slice(0, 16), 220, y + 5);
    doc.text(`${formatDayMonth(j.fechaInicio)} → ${formatDayMonth(j.fechaVencimiento)}`, 248, y + 5);

    // Casilleros a lápiz en cada fila: [ ] [ ] [ ]
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(271, y + 1.8, 3.2, 3.2, 'D');
    doc.rect(275.5, y + 1.8, 3.2, 3.2, 'D');
    doc.rect(280, y + 1.8, 3.2, 3.2, 'D');

    // Delgada línea negra entre filas
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 7.5, 283, y + 7.5);
    y += 7.5;
  });

  // Delgadas líneas de contorno lateral de tabla
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(14, tableStartY, 14, y);
  doc.line(283, tableStartY, 283, y);

  // Pie de página
  doc.setFontSize(7.2);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'MEB ESTUDIO GRÁFICO · PLANNING DIARIO DE TALLER · CONTROL FÍSICO DE PRODUCCIÓN',
    148.5,
    203,
    { align: 'center' }
  );

  doc.setFillColor(220, 38, 38);
  doc.circle(78, 202.7, 0.6, 'F');
  doc.circle(218, 202.7, 0.6, 'F');

  doc.save(`MEB-Planning-Taller-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Dibuja un título de sección con acento rojo MEB sutil y tipografía negra.
 * Sin relleno para garantizar contraste perfecto.
 */
function drawSectionHeader(doc: jsPDF, title: string, y: number): void {
  // Indicador rojo corporativo MEB en el margen izquierdo
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y - 3, 2, 3.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 18, y);

  // Línea gris sutil que se extiende a la derecha
  const tw = doc.getTextWidth(title);
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.2);
  doc.line(18 + tw + 3, y - 1, 196, y - 1);
}

/**
 * Dibuja un campo con etiqueta y valor.
 * Letras negras y sin fondos extraños.
 */
function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  boldValue = false
): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(label, x, y);

  doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(value || '—', x, y + 4);
}
