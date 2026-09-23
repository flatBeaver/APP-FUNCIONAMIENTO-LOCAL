import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';
import { ProductionJob, AppConfig } from '../types';
import { generateBatchSchedulePDF } from '../utils/pdfGenerator';
import { formatDayMonth } from '../utils/dateCalculations';
import { MebLogo } from './MebLogo';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: ProductionJob[];
  config: AppConfig;
}

export const PlanningModal: React.FC<PlanningModalProps> = ({
  isOpen,
  onClose,
  jobs,
  config,
}) => {
  const [filterState, setFilterState] = useState<'activos' | 'todos' | 'hoy'>('activos');
  const [zoom, setZoom] = useState<number>(100);

  if (!isOpen) return null;

  const filteredJobs = jobs.filter((j) => {
    if (filterState === 'activos') return j.estado !== 'Archivado' && j.estado !== 'Entregado';
    if (filterState === 'hoy') {
      const todayStr = new Date().toISOString().slice(0, 10);
      return j.fechaInicio === todayStr || j.fechaVencimiento === todayStr;
    }
    return true;
  });

  const handleDownloadPDF = () => {
    generateBatchSchedulePDF(
      filteredJobs,
      config,
      filterState === 'activos'
        ? 'PLANNING DE PRODUCCIÓN ACTIVA'
        : filterState === 'hoy'
        ? 'PLANNING DE PRODUCCIÓN DEL DÍA'
        : 'PLANNING COMPLETO DE PRODUCCIÓN'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoom(100);
  const handleZoomFit = () => setZoom(80);

  return (
    <div 
      id="modal-pdf-planning"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-[8px] flex items-start justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="backdrop-blur-xl bg-neutral-950/95 rounded-2xl border border-neutral-800 shadow-2xl max-w-6xl w-full my-3 sm:my-5 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-150 print:border-none print:shadow-none print:max-w-none print:rounded-none print:max-h-none print:my-0">
        
        {/* Panel Superior de Exportación y Filtros */}
        <div 
          id="panel-exportacion-planning-header"
          className="bg-black text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 shrink-0 print:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 shadow-sm">
              <MebLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-red-600 text-white px-2 py-0.5 rounded shadow-xs">
                  PDF PLANNING
                </span>
                <h2 className="text-sm font-bold text-white">
                  Planning de Producción en Taller
                </h2>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {filteredJobs.length} órdenes listadas para supervisión y fabricación
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Selector de filtro para el planning */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs text-neutral-300">
              <button
                onClick={() => setFilterState('activos')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterState === 'activos'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'hover:text-white'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilterState('todos')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterState === 'todos'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterState('hoy')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterState === 'hoy'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'hover:text-white'
                }`}
              >
                De Hoy
              </button>
            </div>

            {/* Controles de Zoom para ver la tabla completa sin recortes */}
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
                title="Ajustar tabla (80%)"
              >
                Ajustar
              </button>
            </div>

            {/* Botón Descargar PDF en Rojo Corporativo */}
            <button
              id="btn-descargar-pdf-planning"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 border border-red-500 transition-all cursor-pointer"
              title="Descargar archivo PDF apaisado con estética de marca MEB"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            {/* Botón Imprimir */}
            <button
              id="btn-imprimir-planning"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-red-600/50 transition-colors cursor-pointer"
              title="Imprimir hoja de planning"
            >
              <Printer className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

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

        {/* Contenedor de visualización previa de la hoja de Planning */}
        <div className="bg-neutral-900/90 p-3 sm:p-8 flex-1 overflow-auto print:max-h-none print:p-0 print:bg-white print:overflow-visible flex justify-center items-start">
          
          {/* HOJA IMPRIMIBLE DEL PLANNING:
              - Banda roja corporativa
              - Emblema MEB
              - Fondo blanco (bg-white)
              - Letras negras (text-black)
              - Tabla limpia con líneas delgadas
          */}
          <div 
            id="hoja-planning-imprimible"
            style={{ 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.12s ease-out',
              marginBottom: zoom > 100 ? `${(zoom - 100) * 8}px` : undefined
            }}
            className="bg-white text-black w-full min-w-[700px] max-w-5xl p-6 sm:p-8 space-y-4 border border-slate-300 rounded-sm print:border-none print:p-0 shadow-2xl print:shadow-none relative"
          >
            {/* Banda Roja Superior de Marca */}
            <div className="h-1.5 bg-red-600 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-4 rounded-t-sm"></div>

            {/* Cabecera del Planning */}
            <div className="border-b border-black pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black border border-neutral-800 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                    <MebLogo className="w-full h-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black block">
                        {config.parametros.empresaNombre || 'MEB ESTUDIO GRÁFICO'}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-black mt-0.5 tracking-tight">
                      PLANNING DIARIO DE PRODUCCIÓN EN TALLER
                    </h1>
                    <p className="text-xs text-neutral-600 font-normal">
                      Emisión: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')} · Total trabajos listados: <b>{filteredJobs.length}</b>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-red-600 text-white font-bold font-mono px-3 py-1 text-xs rounded shadow-xs">
                    CONTROL TALLER
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-1 font-medium">
                    Filtro activo: <b>{filterState.toUpperCase()}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Instrucción visual para el operario */}
            <div className="bg-neutral-50 border border-neutral-300 p-2 text-[11px] text-neutral-700 flex items-center justify-between">
              <span><b>Control en planta:</b> Marcar a lápiz las casillas [ Prep ] [ Imp ] [ Lam/Acab ] en cada fila conforme avance el trabajo.</span>
              <span className="font-mono text-[10px] text-neutral-500">Hoja oficial de taller</span>
            </div>

            {/* Tabla de Trabajos */}
            <div className="overflow-x-auto border border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black bg-neutral-100 font-bold text-[11px] text-black">
                    <th className="p-2 border-r border-black w-20">ID</th>
                    <th className="p-2 border-r border-black w-14">Prioridad</th>
                    <th className="p-2 border-r border-black">Kit / Producto</th>
                    <th className="p-2 border-r border-black">Cliente</th>
                    <th className="p-2 border-r border-black">Material / Vinilo</th>
                    <th className="p-2 border-r border-black w-24">Máquina</th>
                    <th className="p-2 border-r border-black w-14 text-center">Vence</th>
                    <th className="p-2 border-r border-black w-16 text-center">Restantes</th>
                    <th className="p-2 border-r border-black w-20">Estado</th>
                    <th className="p-2 w-32 text-center">Firma / Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-neutral-500 font-medium">
                        No hay trabajos con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job, idx) => {
                      const esVinilo = (job.material || '').toLowerCase().includes('vinilo') || job.tipoVinilo;
                      const materialDisplay = esVinilo
                        ? (job.tipoVinilo ? `Vinilo · ${job.tipoVinilo}` : 'Vinilo')
                        : job.material || '—';

                      return (
                        <tr 
                          key={job.id} 
                          className={`border-b border-neutral-300 text-black hover:bg-neutral-50 ${
                            idx % 2 === 1 ? 'bg-neutral-50/50' : 'bg-white'
                          }`}
                        >
                          <td className="p-2 border-r border-black font-mono font-bold text-[11px]">
                            {job.id}
                          </td>
                          <td className="p-2 border-r border-black">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              job.prioridad === 'Urgente'
                                ? 'bg-red-100 text-red-700 font-black'
                                : job.prioridad === 'Alta'
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-neutral-700'
                            }`}>
                              {job.prioridad}
                            </span>
                          </td>
                          <td className="p-2 border-r border-black">
                            <b className="block font-bold text-black">{job.kit}</b>
                            <span className="text-[10px] text-neutral-600 block">
                              {job.modelo} {job.numSerie ? `(S/N: ${job.numSerie})` : ''} · Cant: {job.cantidad}
                            </span>
                          </td>
                          <td className="p-2 border-r border-black font-medium">
                            {job.clienteNombre || '—'}
                          </td>
                          <td className="p-2 border-r border-black text-[11px]">
                            {materialDisplay}
                            {job.dimensiones && (
                              <span className="text-[10px] text-neutral-600 block font-mono">
                                {job.dimensiones}
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-black text-[11px]">
                            {job.maquina || '—'}
                          </td>
                          <td className="p-2 border-r border-black font-mono text-[11px] text-center">
                            {formatDayMonth(job.fechaVencimiento)}
                          </td>
                          <td className="p-2 border-r border-black font-mono font-bold text-[11px] text-center">
                            {job.diasAsignados ? `${job.diasAsignados}d` : '—'}
                          </td>
                          <td className="p-2 border-r border-black text-[10px]">
                            <span className="border border-neutral-400 px-1 py-0.5 font-medium rounded-xs">
                              {job.estado}
                            </span>
                          </td>
                          {/* Casilleros de Fases para rellenar a lápiz */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-3.5 h-3.5 border border-black inline-block" title="Prep / RIP"></span>
                              <span className="w-3.5 h-3.5 border border-black inline-block" title="Impresión"></span>
                              <span className="w-3.5 h-3.5 border border-black inline-block" title="Acabados"></span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen y Firmas del Planning */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-black text-xs">
              <div className="border border-black p-2 bg-transparent flex flex-col justify-between h-20">
                <span className="font-bold text-[11px]">ENCARGADO DE PRODUCCIÓN:</span>
                <span className="text-[10px] border-t border-black pt-1">Firma: ________________________</span>
              </div>
              <div className="border border-black p-2 bg-transparent flex flex-col justify-between h-20">
                <span className="font-bold text-[11px]">REVISIÓN CONTROL CALIDAD:</span>
                <span className="text-[10px] border-t border-black pt-1">VºBº: [ &nbsp; ] Inspeccionado</span>
              </div>
              <div className="border border-black p-2 bg-transparent flex flex-col justify-between h-20">
                <span className="font-bold text-[11px]">FECHA / TURNO:</span>
                <span className="text-[10px] border-t border-black pt-1">Turno: Mañana [ &nbsp; ] / Tarde [ &nbsp; ]</span>
              </div>
            </div>

            {/* Pie con acento corporativo */}
            <div className="text-center text-[10px] text-neutral-600 pt-2 border-t border-black flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
              <span>MEB Estudio Gráfico · Planning Diario de Taller · Uso Interno de Fabricación</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
