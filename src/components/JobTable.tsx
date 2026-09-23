import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Copy, 
  Archive, 
  Trash2, 
  Edit, 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { ProductionJob, AppConfig } from '../types';
import { calcularJob, formatDayMonth } from '../utils/dateCalculations';
import { generateWorkOrderPDF } from '../utils/pdfGenerator';

interface JobTableProps {
  jobs: ProductionJob[];
  config: AppConfig;
  onEditJob: (job: ProductionJob) => void;
  onDuplicateJob: (id: string) => void;
  onArchiveJob: (id: string) => void;
  onDeleteJob: (id: string) => void;
  onUpdateJobField: (id: string, field: keyof ProductionJob, value: any) => void;
  onViewWorkOrder: (job: ProductionJob) => void;
  isAdmin?: boolean;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  config,
  onEditJob,
  onDuplicateJob,
  onArchiveJob,
  onDeleteJob,
  onUpdateJobField,
  onViewWorkOrder,
  isAdmin = true,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  if (jobs.length === 0) {
    return (
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200 dark:border-neutral-800/80 rounded-xl p-12 text-center shadow-lg transition-colors">
        <Clock className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-neutral-200 mb-1">No se encontraron trabajos</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
          No hay órdenes de producción que coincidan con los criterios de búsqueda o filtros seleccionados. Pruebe a limpiar los filtros.
        </p>
      </div>
    );
  }

  return (
    <div id="contenedor-tabla-pedidos" className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl shadow-xl shadow-black/30 overflow-hidden transition-all">
      {/* Contenedor optimizado: sin scroll horizontal forzado en pantallas de escritorio */}
      <div className="overflow-x-auto max-h-[75vh]">
        <table className="w-full text-left border-collapse min-w-full">
          {/* Encabezado limpio y compacto de una sola fila */}
          <thead>
            <tr className="bg-slate-100/95 dark:bg-black/90 backdrop-blur-[8px] text-slate-800 dark:text-white text-xs font-semibold select-none sticky top-0 z-20 shadow-xs border-b border-slate-200 dark:border-neutral-800/90">
              <th className="px-2 py-2.5 w-8 text-center text-neutral-400"></th>
              <th className="px-3 py-2.5 w-24">ID</th>
              <th className="px-3 py-2.5">Kit / Producto</th>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Modelo / Serie</th>
              <th className="px-3 py-2.5 w-14 text-center">Cant.</th>
              <th className="px-3 py-2.5">Material / Soporte</th>
              <th className="px-3 py-2.5 w-28">Medidas</th>
              <th className="px-3 py-2.5 w-28">Máquina</th>
              <th className="px-3 py-2.5 w-44">Plazos (Día/Mes)</th>
              <th className="px-3 py-2.5 text-right pr-4 w-28">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo de la tabla */}
          <tbody className="divide-y divide-slate-200/80 dark:divide-neutral-800/80 text-xs">
            {jobs.map((job) => {
              const calc = calcularJob(job, config);
              const isExpanded = expandedRowId === job.id;

              // Obtener descripción de material unificada
              const esVinilo = (job.material || '').toLowerCase().includes('vinilo') || Boolean(job.tipoVinilo);
              const materialTexto = esVinilo 
                ? (job.tipoVinilo ? `Vinilo · ${job.tipoVinilo}` : 'Vinilo')
                : (job.material || '—');

              return (
                <React.Fragment key={job.id}>
                  <tr
                    className={`hover:bg-slate-50/80 dark:hover:bg-neutral-800/80 transition-colors group ${calc.claseFila} ${
                      isExpanded ? 'bg-slate-50/90 dark:bg-neutral-800/90' : ''
                    }`}
                  >
                    {/* Expand Toggle */}
                    <td className="px-2 py-2 text-center cursor-pointer" onClick={() => toggleExpand(job.id)}>
                      <button className="text-slate-400 dark:text-neutral-500 hover:text-red-600 cursor-pointer p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* ID con acceso rápido a PDF */}
                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">
                      <button
                        onClick={() => onViewWorkOrder(job)}
                        className="hover:text-red-600 hover:underline cursor-pointer flex items-center gap-1 text-slate-900 dark:text-neutral-100"
                        title="Ver hoja de taller y descargar PDF"
                      >
                        <span className="bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-900 dark:text-neutral-100 hover:text-red-600 px-1.5 py-0.5 rounded border border-slate-300 dark:border-neutral-700 font-mono text-[11px]">
                          {job.id}
                        </span>
                      </button>
                    </td>

                    {/* Kit / Producto */}
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-neutral-100 max-w-[220px] truncate" title={job.kit}>
                          {job.kit || <span className="text-slate-400 dark:text-neutral-500 italic">Sin nombre</span>}
                        </span>
                        {job.tipo && (
                          <span className="text-[10px] text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-neutral-700">
                            {job.tipo}
                          </span>
                        )}
                      </div>
                      {job.codigoKit && (
                        <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                          SKU: {job.codigoKit}
                        </div>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">
                      <span className="max-w-[140px] truncate block font-medium" title={job.clienteNombre}>
                        {job.clienteNombre || <span className="text-slate-400 dark:text-neutral-500">—</span>}
                      </span>
                    </td>

                    {/* Modelo / Serie Unificados (Requisito 5) */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {job.modelo ? (
                        <div className="font-mono text-slate-900 dark:text-neutral-100 font-medium leading-tight">
                          {job.modelo}
                        </div>
                      ) : null}
                      {job.numSerie ? (
                        <div className="font-mono text-[10px] text-slate-500 dark:text-neutral-400 leading-tight">
                          S/N: {job.numSerie}
                        </div>
                      ) : !job.modelo ? (
                        <span className="text-slate-400 dark:text-neutral-500">—</span>
                      ) : null}
                    </td>

                    {/* Cantidad */}
                    <td className="px-3 py-2 text-center font-bold font-mono text-slate-900 dark:text-neutral-100 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs">
                        {job.cantidad}
                      </span>
                    </td>

                    {/* Material / Soporte Unificado (Requisito 1) */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          esVinilo 
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium border border-neutral-300 dark:border-neutral-700' 
                            : 'bg-slate-50 dark:bg-neutral-800/60 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700'
                        }`}
                        title={materialTexto}
                      >
                        {materialTexto}
                      </span>
                    </td>

                    {/* Dimensiones */}
                    <td className="px-3 py-2 text-slate-600 dark:text-neutral-300 font-mono text-[11px] whitespace-nowrap">
                      {job.dimensiones || '—'}
                    </td>

                    {/* Máquina */}
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300 text-xs whitespace-nowrap">
                      <span className="truncate max-w-[110px] inline-block" title={job.maquina}>
                        {job.maquina || '—'}
                      </span>
                    </td>

                    {/* Plazos Resumidos: Solo Día y Mes (DD/MM) + Indicador de Colores (Requisito 4) */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Indicador de Colores del Semáforo */}
                        <div 
                          className="flex items-center"
                          title={`Semáforo: ${calc.semaforo} (Plazo restante: ${calc.restantesTxt})`}
                        >
                          <span 
                            className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ${
                              calc.semaforo === 'Vencido'
                                ? 'bg-red-600 ring-2 ring-red-300 animate-pulse'
                                : calc.semaforo === 'Próximo a vencer'
                                ? 'bg-amber-500 ring-2 ring-amber-200'
                                : calc.semaforo === 'En curso'
                                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                                : 'bg-slate-400 dark:bg-neutral-600'
                            }`} 
                          />
                        </div>

                        {/* Fechas solo Día y Mes */}
                        <div className="flex flex-col text-[11px] font-mono leading-tight">
                          <span className="text-slate-500 dark:text-neutral-400">
                            Ini: <b className="text-slate-700 dark:text-neutral-200 font-bold">{formatDayMonth(job.fechaInicio)}</b>
                          </span>
                          <span className="text-slate-900 dark:text-neutral-100">
                            Fin: <b className={`font-bold ${calc.semaforo === 'Vencido' ? 'text-red-600' : 'text-slate-900 dark:text-neutral-100'}`}>{formatDayMonth(job.fechaVencimiento)}</b>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2 text-right pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* 1. Descargar PDF Hoja de Taller */}
                        <button
                          onClick={() => generateWorkOrderPDF(job, config)}
                          className="p-1.5 rounded-md text-slate-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-800 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                          title="Descargar PDF Orden de Trabajo (Fondo blanco, casilleros a lápiz)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Ver Ficha / Panel de Exportación */}
                        <button
                          onClick={() => onViewWorkOrder(job)}
                          className="p-1.5 rounded-md text-slate-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-800 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                          title="Abrir Hoja de Taller e Imprimir"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Editar */}
                        <button
                          onClick={() => onEditJob(job)}
                          className="p-1.5 rounded-md text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                          title="Editar pedido"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Editar detalles de pedido */}
                        <button
                          onClick={() => onEditJob(job)}
                          className="p-1.5 rounded-md text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                          title="Modificar datos y casillas del trabajo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Botones administrativos: solo para Admin (lauti) */}
                        {isAdmin && (
                          <>
                            {/* 4. Duplicar */}
                            <button
                              onClick={() => onDuplicateJob(job.id)}
                              className="p-1.5 rounded-md text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                              title="Duplicar trabajo (Admin)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* 5. Archivar */}
                            <button
                              onClick={() => onArchiveJob(job.id)}
                              className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                                job.estado === 'Archivado'
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                  : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 border-slate-200 dark:border-neutral-700'
                              }`}
                              title={job.estado === 'Archivado' ? 'Desarchivar (Admin)' : 'Archivar (Admin)'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            {/* 6. Borrar */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteJob(job.id);
                              }}
                              className="p-1.5 rounded-md text-slate-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                              title="Eliminar trabajo permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Fila Expandida con casillas operativas de taller y detalles */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80 dark:bg-neutral-950/80 border-b border-slate-200 dark:border-neutral-800">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Col 1: Casillas de taller y tratamientos directos */}
                          <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-lg border border-slate-200 dark:border-neutral-800 shadow-2xs">
                            <span className="font-semibold text-slate-700 dark:text-neutral-300 block mb-2 uppercase text-[10px] tracking-wider">
                              Casillas y Tratamientos de Taller:
                            </span>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.capaBlanca}
                                  onChange={(e) => onUpdateJobField(job.id, 'capaBlanca', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Capa Blanca UV</span>
                              </label>

                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.laqueado}
                                  onChange={(e) => onUpdateJobField(job.id, 'laqueado', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Laqueado</span>
                              </label>

                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.laminado}
                                  onChange={(e) => onUpdateJobField(job.id, 'laminado', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Laminado</span>
                              </label>

                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.impresionUV}
                                  onChange={(e) => onUpdateJobField(job.id, 'impresionUV', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Impresión UV</span>
                              </label>

                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.barnizado}
                                  onChange={(e) => onUpdateJobField(job.id, 'barnizado', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Barnizado</span>
                              </label>

                              <label className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 cursor-pointer hover:border-red-500/50">
                                <input
                                  type="checkbox"
                                  checked={!!job.retiroPorCliente}
                                  onChange={(e) => onUpdateJobField(job.id, 'retiroPorCliente', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-neutral-200">Retiro Cliente</span>
                              </label>
                            </div>

                            {/* Control rápido de estado y avance */}
                            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 dark:text-neutral-400 font-medium mb-1">Estado de Pedido:</label>
                                <select
                                  value={job.estado}
                                  onChange={(e) => onUpdateJobField(job.id, 'estado', e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded px-2 py-1 text-xs cursor-pointer"
                                >
                                  {config.estados.map((st) => (
                                    <option key={st.nombre} value={st.nombre}>{st.nombre}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 dark:text-neutral-400 font-medium mb-1">Avance ({job.avance}%):</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={job.avance}
                                  onChange={(e) => onUpdateJobField(job.id, 'avance', Number(e.target.value))}
                                  className="w-full accent-red-600 cursor-pointer mt-1"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Ubicación de Archivos en Red */}
                          <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-lg border border-slate-200 dark:border-neutral-800 shadow-2xs">
                            <span className="font-semibold text-slate-700 dark:text-neutral-300 block mb-2 uppercase text-[10px] tracking-wider flex items-center gap-1">
                              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                              Ruta de Archivos en Red (NAS):
                            </span>
                            <div className="bg-slate-50 dark:bg-neutral-950 p-2 rounded border border-slate-200 dark:border-neutral-800 font-mono text-[11px] text-slate-800 dark:text-neutral-200 break-all select-all">
                              {job.ubicacionArchivos || 'Pendiente de ruta en red'}
                            </div>
                            <div className="mt-3 text-slate-600 dark:text-neutral-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Operador Asignado:</span>
                                <b className="text-slate-800 dark:text-neutral-200">{job.responsable || 'Sin asignar'}</b>
                              </div>
                              <div className="flex justify-between">
                                <span>Método de Entrega:</span>
                                <b className="text-slate-800 dark:text-neutral-200">{job.metodoEntrega || 'Estándar'}</b>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Instrucciones Especiales & Acceso a Hoja */}
                          <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-lg border border-slate-200 dark:border-neutral-800 shadow-2xs flex flex-col justify-between">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-neutral-300 block mb-2 uppercase text-[10px] tracking-wider">
                                Instrucciones Especiales & Notas:
                              </span>
                              <div className="text-slate-700 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-950 p-2 rounded border border-slate-200 dark:border-neutral-800 min-h-[50px] whitespace-pre-wrap">
                                {job.notas && job.notas.trim().length > 0 ? (
                                  job.notas
                                ) : (
                                  <span className="text-slate-400 dark:text-neutral-500 italic">Sin observaciones añadidas.</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                              <button
                                onClick={() => onEditJob(job)}
                                className="text-slate-600 dark:text-neutral-300 hover:text-red-500 font-medium inline-flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Edit className="w-3 h-3" /> Modificar Trabajo
                              </button>
                              <button
                                onClick={() => onViewWorkOrder(job)}
                                className="text-red-600 hover:text-red-500 font-medium inline-flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                Abrir Hoja de Taller <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 dark:bg-neutral-950 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          Tabla optimizada: fechas en formato Día/Mes, semáforo visual de plazo y acceso rápido a órdenes de producción.
        </span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-400 font-bold">
          {jobs.length} trabajos mostrados
        </span>
      </div>
    </div>
  );
};
