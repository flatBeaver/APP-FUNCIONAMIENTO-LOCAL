import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Copy, 
  CheckCheck,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { ProductionJob, AppConfig } from '../types';
import { generateWorkOrderPDF } from '../utils/pdfGenerator';
import { MebLogo } from './MebLogo';

interface JobDetailModalProps {
  job: ProductionJob | null;
  config: AppConfig;
  onClose: () => void;
  onEdit?: (job: ProductionJob) => void;
  onUpdateJob?: (job: ProductionJob) => void;
  onDeleteJob?: (id: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  config,
  onClose,
  onEdit: _onEdit,
  onUpdateJob,
  onDeleteJob,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [localJob, setLocalJob] = useState<ProductionJob | null>(job);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);

  useEffect(() => {
    setLocalJob(job);
    setHasUnsavedChanges(false);
  }, [job]);

  if (!localJob) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateWorkOrderPDF(localJob, config);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 15, 140));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 15, 60));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const handleZoomFit = () => {
    setZoom(80);
  };

  // Helper para persistir cambios inmediatamente tanto localmente como en el padre/backend
  const mutateJob = (updater: (prev: ProductionJob) => ProductionJob) => {
    setLocalJob((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      if (onUpdateJob) {
        onUpdateJob(updated);
      }
      setHasUnsavedChanges(true);
      setTimeout(() => setHasUnsavedChanges(false), 2000);
      return updated;
    });
  };

  // Helper para actualizar campos individuales de forma directa
  const updateField = <K extends keyof ProductionJob>(field: K, value: ProductionJob[K]) => {
    mutateJob((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 1. Alternar Estado del trabajo (Permite seleccionar múltiples estados a medida que avanza la producción)
  const handleSelectEstado = (targetEstado: string) => {
    mutateJob((prev) => {
      // Si ya tiene estadosSeleccionados, usamos ese array
      // Si no, inicializamos a partir del estado actual
      let currentSelected: string[] = [];
      if (prev.estadosSeleccionados && prev.estadosSeleccionados.length > 0) {
        currentSelected = [...prev.estadosSeleccionados];
      } else {
        const norm = (prev.estado || '').toLowerCase();
        const initialList: string[] = [];
        if (norm.includes('diseño')) initialList.push('Diseño');
        if (norm.includes('impresi') || norm.includes('corte') || norm.includes('print')) initialList.push('Impresión / corte');
        if (norm.includes('taller') || norm.includes('producci') || norm.includes('proceso')) initialList.push('Taller');
        if (norm.includes('armado') || norm.includes('montaje') || norm.includes('kit')) initialList.push('Armado de kit');
        if (norm.includes('control') || norm.includes('calidad') || norm.includes('revisi')) initialList.push('Control');
        if (norm.includes('entrega') || norm.includes('terminado') || norm.includes('listo')) initialList.push('Entrega');
        currentSelected = initialList;
      }

      const isAlreadySelected = currentSelected.includes(targetEstado);
      const updatedList = isAlreadySelected
        ? currentSelected.filter((item) => item !== targetEstado)
        : [...currentSelected, targetEstado];

      // Actualizamos estado general con el último estado seleccionado para mantener compatibilidad
      const lastStatus = updatedList.length > 0 ? updatedList[updatedList.length - 1] : prev.estado;

      return {
        ...prev,
        estadosSeleccionados: updatedList,
        estado: lastStatus,
      };
    });
  };

  // 2. Alternar Retiro vs Envío
  const handleToggleRetiroEnvio = (isRetiro: boolean) => {
    mutateJob((prev) => ({
      ...prev,
      retiroPorCliente: isRetiro,
      metodoEntrega: isRetiro ? 'Retiro en taller' : 'Envío por mensajería',
    }));
  };

  // 3. Alternar Postprocesados
  const handleTogglePostprocesado = (item: string) => {
    mutateJob((prev) => {
      const currentList = prev.postprocesados || [];
      const exists = currentList.some((p) => p.toLowerCase().includes(item.toLowerCase()));
      let newList: string[];
      if (exists) {
        newList = currentList.filter((p) => !p.toLowerCase().includes(item.toLowerCase()));
      } else {
        newList = [...currentList, item];
      }

      const updated = { ...prev, postprocesados: newList };
      if (item === 'Laminado Mate' || item === 'Laminado brillante') {
        updated.laminado = newList.some((p) => p.toLowerCase().includes('laminado'));
      }
      if (item === 'Barniz') {
        updated.barnizado = newList.some((p) => p.toLowerCase().includes('barniz'));
      }
      return updated;
    });
  };

  // 4. Actualizar Observaciones
  const handleUpdateNotas = (notas: string) => {
    mutateJob((prev) => ({
      ...prev,
      notas,
    }));
  };

  // 5. Actualizar Ubicación de Archivo
  const handleUpdateUbicacion = (val: string) => {
    mutateJob((prev) => ({
      ...prev,
      ubicacionArchivos: val,
      rutaArchivo: val,
    }));
  };

  const handleCopyPath = () => {
    const p = localJob.ubicacionArchivos || localJob.rutaArchivo || '//MAURICIOPC/My documents:';
    navigator.clipboard.writeText(p);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Comprobaciones de estado (soporta selección múltiple de estados para seguimiento de producción)
  const currentStatusNorm = (localJob.estado || '').toLowerCase();
  const selectedList = localJob.estadosSeleccionados;
  const hasMultipleList = Array.isArray(selectedList) && selectedList.length > 0;

  const isEstadoActive = (label: string, matchKeywords: string[]): boolean => {
    if (hasMultipleList) {
      return selectedList.some((s) => s.toLowerCase() === label.toLowerCase() || matchKeywords.some((k) => s.toLowerCase().includes(k)));
    }
    return matchKeywords.some((k) => currentStatusNorm.includes(k));
  };

  const estadosPills = [
    { label: 'Diseño', match: isEstadoActive('Diseño', ['diseño', 'design']) },
    { 
      label: 'Impresión / corte', 
      match: isEstadoActive('Impresión / corte', ['impresi', 'corte', 'print']) 
    },
    { 
      label: 'Taller', 
      match: isEstadoActive('Taller', ['taller', 'producci', 'proceso']) 
    },
    { 
      label: 'Armado de kit', 
      match: isEstadoActive('Armado de kit', ['armado', 'montaje', 'kit']) 
    },
    { 
      label: 'Control', 
      match: isEstadoActive('Control', ['control', 'calidad', 'revisi']) 
    },
    { 
      label: 'Entrega', 
      match: isEstadoActive('Entrega', ['entrega', 'terminado', 'listo', 'entregado']) 
    },
  ];

  // Comprobación de método de entrega
  const isRetiro = Boolean(
    localJob.retiroPorCliente ||
    (localJob.metodoEntrega || '').toLowerCase().includes('retiro') ||
    (localJob.metodoEntrega || '').toLowerCase().includes('taller')
  );
  const isEnvio = Boolean(
    !isRetiro &&
    ((localJob.metodoEntrega || '').toLowerCase().includes('env') ||
     (localJob.metodoEntrega || '').toLowerCase().includes('mensaj') ||
     (localJob.metodoEntrega || '').toLowerCase().includes('transp'))
  );

  // Comprobación de postprocesados
  const isCorte = Boolean(
    localJob.postprocesados?.some((p) => p.toLowerCase().includes('corte')) ||
    (localJob.notas || '').toLowerCase().includes('corte')
  );
  const isLaminadoMate = Boolean(
    localJob.postprocesados?.some((p) => p.toLowerCase().includes('mate')) ||
    (localJob.laminado && (localJob.notas || '').toLowerCase().includes('mate'))
  );
  const isLaminadoBrillante = Boolean(
    localJob.postprocesados?.some((p) => p.toLowerCase().includes('brillante')) ||
    (localJob.laminado && !(localJob.notas || '').toLowerCase().includes('mate'))
  );
  const isBarniz = Boolean(
    localJob.barnizado ||
    localJob.postprocesados?.some((p) => p.toLowerCase().includes('barniz')) ||
    localJob.laqueado
  );

  const displayPath = localJob.ubicacionArchivos || localJob.rutaArchivo || '//MAURICIOPC/My documents:';

  return (
    <div 
      id="modal-pdf-work-order"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-[8px] flex items-start justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="backdrop-blur-xl bg-neutral-950/95 rounded-2xl border border-neutral-800 shadow-2xl max-w-5xl w-full my-3 sm:my-5 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-150 print:border-none print:shadow-none print:max-w-none print:rounded-none print:max-h-none print:my-0">
        
        {/* Barra Superior con Controles */}
        <div 
          id="panel-exportacion-pdf-header"
          className="bg-black text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 shrink-0 print:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 shadow-sm">
              <MebLogo className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-red-600 text-white px-2.5 py-0.5 rounded shadow-xs">
                {localJob.id}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                Planilla de Taller y Procesos: <span className="text-neutral-200 font-normal">{localJob.kit}</span>
              </h2>
            </div>
          </div>

          {/* Controles de Zoom, Guardado y Acciones */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Indicador de cambios guardados */}
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md animate-pulse">
                <Check className="w-3 h-3" />
                Guardado
              </span>
            )}

            {/* Controles de Escala / Zoom */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs text-neutral-300">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 60}
                className="p-1.5 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Reducir zoom (-15%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleZoomReset}
                className="px-2 py-0.5 text-[11px] font-mono hover:text-white cursor-pointer"
                title="Restablecer al 100%"
              >
                {zoom}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 140}
                className="p-1.5 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Aumentar zoom (+15%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleZoomFit}
                className="px-2 py-0.5 text-[10px] text-neutral-400 hover:text-white border-l border-neutral-800 cursor-pointer"
                title="Ajustar hoja completa (80%)"
              >
                Ajustar
              </button>
            </div>

            {/* Botón Principal: Descargar PDF */}
            <button
              id="btn-descargar-pdf-trabajo"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 border border-red-500 transition-all cursor-pointer"
              title="Descargar archivo PDF con el formato exacto de la planilla base"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            {/* Botón Imprimir */}
            <button
              id="btn-imprimir-ficha-trabajo"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-red-600/50 transition-colors cursor-pointer"
              title="Imprimir directamente la planilla"
            >
              <Printer className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Badge indicador de edición directa activa en lugar del botón de editar ficha */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 select-none shadow-xs"
              title="Modo edición directa: Puedes modificar cualquier característica directamente sobre la hoja antes de imprimir o descargar"
            >
              <Edit3 className="w-3.5 h-3.5 text-red-500" />
              <span>Edición directa activa</span>
            </div>

            {/* Botón Borrar / Eliminar Trabajo */}
            {onDeleteJob && (
              <button
                type="button"
                onClick={() => onDeleteJob(localJob.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-600/50 transition-colors cursor-pointer"
                title="Eliminar este pedido permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Borrar</span>
              </button>
            )}

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer ml-1"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor de previsualización con scroll nativo y zoom responsive */}
        <div className="bg-neutral-900/95 p-3 sm:p-8 flex-1 overflow-auto print:max-h-none print:p-0 print:bg-white print:overflow-visible flex justify-center items-start">
          
          {/* HOJA DE TALLER Y PROCESOS - RÉPLICA EXACTA DE PLANILLA BASE */}
          <div 
            id="hoja-taller-imprimible"
            style={{ 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.12s ease-out',
              marginBottom: zoom > 100 ? `${(zoom - 100) * 8}px` : undefined
            }}
            className="bg-white text-black w-full max-w-[800px] border border-slate-300 rounded-sm shadow-2xl print:border-none print:shadow-none print:p-0 overflow-hidden relative select-text"
          >
            {/* CABECERA CON FONDO BLANCO, BANDA ROJA Y TÍTULOS EN NEGRO (EDITABLE DIRECTAMENTE) */}
            <div className="relative bg-white px-6 sm:px-8 py-5 border-b-2 border-red-600 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600"></div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={localJob.empresaNombre || config.parametros.empresaNombre || 'Meb Estudio Gráfico'}
                  onChange={(e) => updateField('empresaNombre', e.target.value)}
                  className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/30 outline-none w-full max-w-md px-1 py-0.5 rounded-xs transition-colors print:border-none"
                  title="Haga clic para editar el nombre de la empresa"
                />
                <p className="text-xs sm:text-sm font-semibold text-neutral-600 mt-1 px-1">
                  Planilla de taller y procesos
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1 font-medium text-xs sm:text-sm shrink-0">
                <div className="flex items-center sm:justify-end gap-1">
                  <span className="font-bold text-black">Orden Nº: </span>
                  <input
                    type="text"
                    value={localJob.id || ''}
                    onChange={(e) => updateField('id', e.target.value)}
                    className="font-black text-red-600 font-mono text-sm sm:text-base bg-transparent border-b border-dashed border-transparent hover:border-red-400 focus:border-red-600 focus:bg-red-50/40 outline-none w-28 text-left sm:text-right px-1 py-0.5 rounded-xs transition-colors print:border-none"
                    title="Haga clic para editar el número de orden"
                  />
                </div>
                <div className="flex items-center sm:justify-end gap-1">
                  <span className="font-bold text-black">Fecha emisión: </span>
                  <input
                    type="text"
                    value={localJob.fechaEmision || new Date().toLocaleDateString('es-ES')}
                    onChange={(e) => updateField('fechaEmision', e.target.value)}
                    className="text-neutral-700 font-medium text-xs sm:text-sm bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none w-28 text-left sm:text-right px-1 py-0.5 rounded-xs transition-colors print:border-none"
                    title="Haga clic para editar la fecha de emisión"
                  />
                </div>
              </div>
            </div>

            {/* CONTENIDO DE LA PLANILLA */}
            <div className="p-6 sm:p-8 space-y-4 text-black bg-white">

              {/* SECCIÓN: ESTADO DEL TRABAJO (INTERACTIVO Y DIRECTAMENTE TILDABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                  Estado del trabajo
                </h2>
                <div className="border border-black rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 bg-white">
                  {estadosPills.map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectEstado(st.label)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        st.match 
                          ? 'bg-neutral-950 text-white shadow-xs' 
                          : 'hover:bg-neutral-100 text-black'
                      }`}
                      title={`Haga clic para tildar o destildar "${st.label}"`}
                    >
                      <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        st.match ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                      }`}>
                        {st.match && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="whitespace-nowrap">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 1: 1_ Especificaciones técnicas y producción (TOTALMENTE EDITABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  1_ Especificaciones técnicas y producción
                </h2>
                {/* Doble línea horizontal */}
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white">
                  {/* Columna Izquierda */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Materiales / soporte:</span>
                      <input
                        list="pdf-datalist-materiales"
                        type="text"
                        value={localJob.material || ''}
                        onChange={(e) => updateField('material', e.target.value)}
                        placeholder="Escribir material..."
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar material o soporte"
                      />
                      <datalist id="pdf-datalist-materiales">
                        {config.materiales?.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Tipo y color:</span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          list="pdf-datalist-vinilos"
                          type="text"
                          value={localJob.tipoVinilo || ''}
                          onChange={(e) => updateField('tipoVinilo', e.target.value)}
                          placeholder="Tipo de vinilo..."
                          className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                          title="Haga clic para editar tipo de vinilo"
                        />
                        <span className="text-neutral-400 font-bold">·</span>
                        <input
                          type="text"
                          value={localJob.color || ''}
                          onChange={(e) => updateField('color', e.target.value)}
                          placeholder="Color..."
                          className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none w-24 sm:w-32 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                          title="Haga clic para editar color"
                        />
                      </div>
                      <datalist id="pdf-datalist-vinilos">
                        {config.tiposVinilo?.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Máquina asignada:</span>
                      <input
                        list="pdf-datalist-maquinas"
                        type="text"
                        value={localJob.maquina || ''}
                        onChange={(e) => updateField('maquina', e.target.value)}
                        placeholder="Seleccionar máquina..."
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar máquina asignada"
                      />
                      <datalist id="pdf-datalist-maquinas">
                        {config.maquinas?.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Tamaños:</span>
                      <input
                        type="text"
                        value={localJob.dimensiones || ''}
                        onChange={(e) => updateField('dimensiones', e.target.value)}
                        placeholder="Dimensiones (ej: 120 x 80 cm)..."
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar las dimensiones o tamaños"
                      />
                    </div>

                    <div>
                      <span className="font-bold text-black block mb-1">Metodo de entrega:</span>
                      <div className="flex items-center gap-6 mt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleRetiroEnvio(true)}
                          className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                            isRetiro ? 'bg-neutral-100 text-black' : 'text-neutral-700 hover:text-black'
                          }`}
                        >
                          <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isRetiro ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                          }`}>
                            {isRetiro && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>Retiro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRetiroEnvio(false)}
                          className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                            isEnvio ? 'bg-neutral-100 text-black' : 'text-neutral-700 hover:text-black'
                          }`}
                        >
                          <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isEnvio ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                          }`}>
                            {isEnvio && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>Envío</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: 2_ Ubicación del archivo (TOTALMENTE EDITABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  2_ Ubicación del archivo
                </h2>
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 bg-white">
                  <input
                    list="pdf-datalist-ubicaciones"
                    type="text"
                    value={displayPath}
                    onChange={(e) => handleUpdateUbicacion(e.target.value)}
                    placeholder="//MAURICIOPC/My documents/..."
                    className="font-mono text-xs font-bold text-black w-full bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none px-1 py-0.5 rounded-xs transition-colors print:border-none"
                    title="Haga clic para editar directamente la ruta del archivo"
                  />
                  <datalist id="pdf-datalist-ubicaciones">
                    {config.ubicaciones?.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>

                  <div className="flex items-center gap-1 shrink-0 print:hidden">
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600 hover:text-red-600 cursor-pointer transition-colors"
                      title="Copiar ruta al portapapeles"
                    >
                      {copiedPath ? <CheckCheck className="w-4 h-4 text-red-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: 3_ Identificación del trabajo (TOTALMENTE EDITABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  3_ Identificación del trabajo
                </h2>
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 justify-between items-stretch bg-white">
                  {/* Columnas de información */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Producto / kit:</span>
                      <input
                        type="text"
                        value={localJob.kit || ''}
                        onChange={(e) => updateField('kit', e.target.value)}
                        placeholder="Nombre producto o kit..."
                        className="font-bold text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar el producto o kit"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Cliente:</span>
                      <input
                        type="text"
                        value={localJob.clienteNombre || ''}
                        onChange={(e) => updateField('clienteNombre', e.target.value)}
                        placeholder="Nombre del cliente..."
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar el cliente"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Modelo / Nº Serie:</span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={localJob.modelo || ''}
                          onChange={(e) => updateField('modelo', e.target.value)}
                          placeholder="Modelo..."
                          className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                          title="Haga clic para editar modelo"
                        />
                        <span className="text-neutral-400">/</span>
                        <input
                          type="text"
                          value={localJob.numSerie || ''}
                          onChange={(e) => updateField('numSerie', e.target.value)}
                          placeholder="Nº Serie..."
                          className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none w-24 sm:w-28 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                          title="Haga clic para editar número de serie"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Fecha inicio:</span>
                      <input
                        type="date"
                        value={localJob.fechaInicio || ''}
                        onChange={(e) => updateField('fechaInicio', e.target.value)}
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none px-1 py-0.5 rounded-xs text-xs cursor-pointer print:border-none"
                        title="Haga clic para editar la fecha de inicio"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Tipo de trabajo:</span>
                      <input
                        list="pdf-datalist-tipos"
                        type="text"
                        value={localJob.tipo || ''}
                        onChange={(e) => updateField('tipo', e.target.value)}
                        placeholder="Tipo de trabajo..."
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none flex-1 min-w-0 px-1 py-0.5 rounded-xs transition-colors print:border-none"
                        title="Haga clic para editar el tipo de trabajo"
                      />
                      <datalist id="pdf-datalist-tipos">
                        {config.tipos?.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black shrink-0">Fecha límite:</span>
                      <input
                        type="date"
                        value={localJob.fechaVencimiento || ''}
                        onChange={(e) => updateField('fechaVencimiento', e.target.value)}
                        className="font-medium text-black bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 focus:bg-red-50/40 outline-none px-1 py-0.5 rounded-xs text-xs cursor-pointer print:border-none"
                        title="Haga clic para editar la fecha límite"
                      />
                    </div>
                  </div>

                  {/* Recuadro Destacado de Cantidad (DIRECTAMENTE EDITABLE) */}
                  <div className="flex sm:flex-col items-center justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-neutral-200 pt-3 sm:pt-0 sm:pl-6">
                    <span className="text-xs font-bold text-black mb-1.5 mr-3 sm:mr-0">Cantidad</span>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-xs focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/20">
                      <input
                        type="number"
                        min={1}
                        value={localJob.cantidad || 1}
                        onChange={(e) => updateField('cantidad', Math.max(1, parseInt(e.target.value) || 1))}
                        className="text-2xl sm:text-3xl font-black text-black text-center w-full bg-transparent border-none outline-none focus:text-red-600"
                        title="Haga clic para editar la cantidad a producir"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: 4_ Postprocesados que lleva (TILDABLE DIRECTAMENTE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  4_ Postprocesados que lleva
                </h2>
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => handleTogglePostprocesado('Corte')}
                    className="flex items-center gap-1.5 cursor-pointer font-semibold px-2 py-0.5 rounded hover:bg-neutral-100 text-black transition-colors"
                  >
                    <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isCorte ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                    }`}>
                      {isCorte && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>Corte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePostprocesado('Laminado Mate')}
                    className="flex items-center gap-1.5 cursor-pointer font-semibold px-2 py-0.5 rounded hover:bg-neutral-100 text-black transition-colors"
                  >
                    <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isLaminadoMate ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                    }`}>
                      {isLaminadoMate && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>Laminado Mate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePostprocesado('Laminado brillante')}
                    className="flex items-center gap-1.5 cursor-pointer font-semibold px-2 py-0.5 rounded hover:bg-neutral-100 text-black transition-colors"
                  >
                    <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isLaminadoBrillante ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                    }`}>
                      {isLaminadoBrillante && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>Laminado brillante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePostprocesado('Barniz')}
                    className="flex items-center gap-1.5 cursor-pointer font-semibold px-2 py-0.5 rounded hover:bg-neutral-100 text-black transition-colors"
                  >
                    <span className={`w-4 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isBarniz ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                    }`}>
                      {isBarniz && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>Barniz</span>
                  </button>
                </div>
              </div>

              {/* SECCIÓN 5: 5_ Observaciones (DIRECTAMENTE EDITABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  5_ Observaciones
                </h2>
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl p-3 bg-white relative">
                  <textarea
                    rows={3}
                    value={localJob.notas || ''}
                    onChange={(e) => updateField('notas', e.target.value)}
                    placeholder="Instrucciones especiales para el taller (haga clic para escribir notas o comentarios)..."
                    className="w-full text-xs text-black bg-transparent outline-none resize-none placeholder:text-neutral-400 font-medium leading-relaxed border-b border-dashed border-transparent hover:border-neutral-300 focus:border-red-600 focus:bg-red-50/20 px-1 py-1 rounded-xs transition-colors"
                    title="Haga clic para editar las observaciones"
                  />
                  {/* Líneas punteadas decorativas de fondo para formato papel */}
                  <div className="pointer-events-none mt-1 space-y-4">
                    <div className="border-b border-dotted border-black/40 w-full"></div>
                    <div className="border-b border-dotted border-black/40 w-full"></div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: 6_ Control de calidad (TOTALMENTE EDITABLE) */}
              <div>
                <h2 className="text-sm font-bold text-black leading-tight">
                  6_ Control de calidad
                </h2>
                <div className="mt-1 mb-2 space-y-0.5">
                  <div className="h-[1.5px] bg-black w-full"></div>
                  <div className="h-[1.5px] bg-black w-full"></div>
                </div>

                <div className="border border-black rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-white">
                  {/* Columna 1: Firma operador */}
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="font-bold text-xs text-black">Firma operador</span>
                    <input
                      type="text"
                      value={localJob.firmaOperador || ''}
                      onChange={(e) => updateField('firmaOperador', e.target.value)}
                      placeholder="Nombre del operador..."
                      className="text-center font-semibold text-xs text-black w-36 bg-transparent border-b border-dashed border-neutral-300 hover:border-neutral-500 focus:border-red-600 outline-none px-1 py-0.5 rounded-xs transition-colors print:border-none"
                      title="Escribir nombre o firma del operador"
                    />
                    <div className="border-b border-dotted border-black w-36 my-1"></div>
                    <div className="flex items-center gap-1 text-xs text-neutral-800">
                      <span>Fecha:</span>
                      <input
                        type="text"
                        value={localJob.fechaOperador || ''}
                        onChange={(e) => updateField('fechaOperador', e.target.value)}
                        placeholder="DD / MM / 26"
                        className="text-center text-xs text-neutral-800 w-24 bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 outline-none px-1 print:border-none"
                        title="Fecha firma operador"
                      />
                    </div>
                  </div>

                  {/* Columna 2: Control */}
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="font-bold text-xs text-black">Control</span>
                    <input
                      type="text"
                      value={localJob.firmaControl || ''}
                      onChange={(e) => updateField('firmaControl', e.target.value)}
                      placeholder="Nombre revisor..."
                      className="text-center font-semibold text-xs text-black w-36 bg-transparent border-b border-dashed border-neutral-300 hover:border-neutral-500 focus:border-red-600 outline-none px-1 py-0.5 rounded-xs transition-colors print:border-none"
                      title="Escribir responsable de control"
                    />
                    <div className="border-b border-dotted border-black w-36 my-1"></div>
                    <button
                      type="button"
                      onClick={() => updateField('controlConforme', !localJob.controlConforme)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        localJob.controlConforme ? 'bg-neutral-100 text-black' : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                      title="Tildar o destildar conformidad de control de calidad"
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        localJob.controlConforme ? 'border-red-600 bg-red-600 text-white' : 'border-black bg-white'
                      }`}>
                        {localJob.controlConforme && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>Conforme</span>
                    </button>
                  </div>

                  {/* Columna 3: Entrega / Retiro */}
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="font-bold text-xs text-black">Entrega / Retiro</span>
                    <input
                      type="text"
                      value={localJob.firmaEntrega || ''}
                      onChange={(e) => updateField('firmaEntrega', e.target.value)}
                      placeholder="Quien entrega/retira..."
                      className="text-center font-semibold text-xs text-black w-36 bg-transparent border-b border-dashed border-neutral-300 hover:border-neutral-500 focus:border-red-600 outline-none px-1 py-0.5 rounded-xs transition-colors print:border-none"
                      title="Escribir responsable de entrega o retiro"
                    />
                    <div className="border-b border-dotted border-black w-36 my-1"></div>
                    <div className="flex items-center gap-1 text-xs text-neutral-800">
                      <span>Fecha:</span>
                      <input
                        type="text"
                        value={localJob.fechaEntrega || ''}
                        onChange={(e) => updateField('fechaEntrega', e.target.value)}
                        placeholder="DD / MM / 26"
                        className="text-center text-xs text-neutral-800 w-24 bg-transparent border-b border-dashed border-transparent hover:border-neutral-400 focus:border-red-600 outline-none px-1 print:border-none"
                        title="Fecha de entrega o retiro"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Pie de página con detalle rojo MEB */}
            <div className="border-t border-neutral-200 px-6 py-2.5 text-center text-[10px] text-neutral-600 font-semibold tracking-wide bg-neutral-50/60">
              <span className="text-red-600 font-black mr-1">MEB</span> ESTUDIO GRÁFICO · ROTULACIÓN & GRAN FORMATO · PLANILLA INTERNA DE PROCESOS
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
