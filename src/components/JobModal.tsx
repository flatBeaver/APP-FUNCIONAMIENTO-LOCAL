import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  Calculator, 
  AlertCircle, 
  Check, 
  Folder, 
  Layers, 
  Printer 
} from 'lucide-react';
import { ProductionJob, AppConfig, Client } from '../types';
import { calcularVencimiento, hoyISO, addDays, parseISO, toISO } from '../utils/dateCalculations';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: ProductionJob) => void;
  initialJob?: ProductionJob | null;
  config: AppConfig;
  clients: Client[];
  onQuickCreateClient?: (clientName: string) => Client;
  isAdmin?: boolean;
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialJob,
  config,
  clients,
  onQuickCreateClient,
  isAdmin = true,
}) => {
  const [formData, setFormData] = useState<Partial<ProductionJob>>({
    kit: '',
    tipo: config.tipos[0] || 'Kit Completo',
    clienteId: clients[0]?.id || '',
    clienteNombre: clients[0]?.nombre || '',
    modelo: '',
    numSerie: '',
    codigoKit: '',
    cantidad: 1,
    material: config.materiales[0] || '',
    tipoVinilo: config.tiposVinilo[0] || '',
    dimensiones: '',
    maquina: config.maquinas[0] || '',
    ubicacionArchivos: config.ubicaciones[0] || '',
    metodoEntrega: config.metodosEntrega[0] || '',
    prioridad: config.prioridades[1]?.nombre || 'Media',
    estado: config.estados[0]?.nombre || 'Pendiente',
    postprocesados: [],
    fechaInicio: hoyISO(),
    diasAsignados: config.parametros.diasProduccionPorDefecto || 5,
    fechaVencimiento: '',
    avance: 0,
    responsable: config.responsables[0] || 'Sin asignar',
    notas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuickClientInput, setShowQuickClientInput] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  // Sincronizar ÚNICAMENTE al abrir el modal o cuando cambia el trabajo a editar
  // Esto evita que el sondeo en segundo plano (polling LAN/Firebase) borre lo que el usuario está escribiendo
  useEffect(() => {
    if (!isOpen) return;

    if (initialJob) {
      setFormData({
        ...initialJob,
        postprocesados: initialJob.postprocesados || [],
      });
    } else {
      const defaultStart = hoyISO();
      const defaultDays = config.parametros.diasProduccionPorDefecto || 5;
      const defaultDue = config.parametros.usarDiasLaborables
        ? calcularVencimiento(defaultStart, defaultDays, config.festivos)
        : toISO(addDays(parseISO(defaultStart) || new Date(), defaultDays));

      setFormData({
        kit: '',
        tipo: config.tipos[0] || 'Kit Completo',
        clienteId: clients[0]?.id || '',
        clienteNombre: clients[0]?.nombre || '',
        modelo: '',
        numSerie: '',
        codigoKit: '',
        cantidad: 1,
        material: config.materiales[0] || '',
        tipoVinilo: config.tiposVinilo[0] || '',
        dimensiones: '',
        maquina: config.maquinas[0] || '',
        ubicacionArchivos: config.ubicaciones[0] || '',
        metodoEntrega: config.metodosEntrega[0] || '',
        prioridad: config.prioridades[1]?.nombre || 'Media',
        estado: config.estados[0]?.nombre || 'Pendiente',
        postprocesados: [],
        fechaInicio: defaultStart,
        diasAsignados: defaultDays,
        fechaVencimiento: defaultDue,
        avance: 0,
        responsable: config.responsables[0] || 'Sin asignar',
        notas: '',
      });
    }
    setErrors({});
  }, [isOpen, initialJob?.id]);

  // Recalculate due date whenever fechaInicio or diasAsignados changes
  const handleRecalculateDue = (start: string, days: number) => {
    if (!start || !days || days <= 0) return '';
    if (config.parametros.usarDiasLaborables) {
      return calcularVencimiento(start, days, config.festivos);
    } else {
      const d = parseISO(start);
      return d ? toISO(addDays(d, days)) : '';
    }
  };

  const handleStartChange = (val: string) => {
    const days = Number(formData.diasAsignados) || 5;
    const due = handleRecalculateDue(val, days);
    setFormData((prev) => ({
      ...prev,
      fechaInicio: val,
      fechaVencimiento: due,
    }));
  };

  const handleDaysChange = (val: number) => {
    const days = Math.max(1, val);
    const start = formData.fechaInicio || hoyISO();
    const due = handleRecalculateDue(start, days);
    setFormData((prev) => ({
      ...prev,
      diasAsignados: days,
      fechaVencimiento: due,
    }));
  };

  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    setFormData((prev) => ({
      ...prev,
      clienteId: clientId,
      clienteNombre: found ? found.nombre : '',
    }));
  };

  const handleQuickAddClient = () => {
    if (!newClientName.trim()) return;
    if (onQuickCreateClient) {
      const created = onQuickCreateClient(newClientName.trim());
      setFormData((prev) => ({
        ...prev,
        clienteId: created.id,
        clienteNombre: created.nombre,
      }));
    }
    setNewClientName('');
    setShowQuickClientInput(false);
  };

  const togglePostprocesado = (item: string) => {
    setFormData((prev) => {
      const current = prev.postprocesados || [];
      const updated = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, postprocesados: updated };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.kit || !formData.kit.trim()) {
      errs.kit = 'El nombre del kit o producto es obligatorio.';
    }
    if (!formData.cantidad || Number(formData.cantidad) <= 0) {
      errs.cantidad = 'La cantidad debe ser mayor a 0.';
    }
    if (!formData.fechaInicio) {
      errs.fechaInicio = 'Indique una fecha de inicio.';
    }
    if (!formData.fechaVencimiento) {
      errs.fechaVencimiento = 'Indique una fecha de vencimiento.';
    }
    if (!formData.material) {
      errs.material = 'Seleccione un material principal.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(formData as ProductionJob);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-3 sm:p-4 overflow-y-auto">
      <div className="backdrop-blur-xl bg-white/95 dark:bg-black/90 rounded-2xl border border-neutral-200 dark:border-neutral-800/90 shadow-2xl max-w-4xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header con colores de la marca MEB: Negro y Rojo */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
              {initialJob 
                ? (isAdmin ? `Editar Trabajo: ${initialJob.id}` : `Modificar Pedido: ${initialJob.id}`)
                : (isAdmin ? 'Nuevo Trabajo de Producción' : 'Acceso Restringido')}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isAdmin 
                ? 'Complete los parámetros técnicos, plazos y especificaciones del producto o kit.'
                : 'Actualice el estado, avance, casillas técnicas y notas de taller para este pedido.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body adaptado a modo oscuro y claro con rojo de acento */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-neutral-900 dark:text-neutral-100">
          {/* Validation Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Por favor revise los campos destacados en rojo antes de guardar el trabajo.</span>
            </div>
          )}

          {/* Section 1: Identificación del Producto y Cliente */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 pb-1 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              1. Identificación del Producto / Kit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Kit / Producto Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre del Producto o Kit *
                </label>
                <input
                  type="text"
                  value={formData.kit || ''}
                  onChange={(e) => setFormData({ ...formData, kit: e.target.value })}
                  placeholder="Ej. Kit Rótulo Corpóreo Retroiluminado LED"
                  className={`w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors ${
                    errors.kit ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-neutral-300 dark:border-neutral-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                  }`}
                />
                {errors.kit && <span className="text-[11px] text-red-600 mt-0.5 block">{errors.kit}</span>}
              </div>

              {/* Tipo de Trabajo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
                <select
                  value={formData.tipo || ''}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                >
                  {config.tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                  <span>Cliente Asociado</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickClientInput(!showQuickClientInput)}
                    className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline font-normal cursor-pointer"
                  >
                    + Añadir nuevo cliente rápido
                  </button>
                </label>

                {showQuickClientInput ? (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Nombre del nuevo cliente o empresa"
                      className="flex-1 px-3 py-1.5 text-xs border border-red-500 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddClient}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickClientInput(false)}
                      className="px-2 py-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.clienteId || ''}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.empresa ? `(${c.empresa})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.cantidad ?? 1}
                  onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                  className={`w-full px-3 py-2 text-xs font-mono border rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors ${
                    errors.cantidad ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-neutral-300 dark:border-neutral-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                  }`}
                />
                {errors.cantidad && <span className="text-[11px] text-red-600 mt-0.5 block">{errors.cantidad}</span>}
              </div>

              {/* Modelo y Nº de Serie Unificados */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Modelo y Nº de Serie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Modelo (ej. LUMINA-PRO-120)"
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  />
                  <input
                    type="text"
                    value={formData.numSerie || ''}
                    onChange={(e) => setFormData({ ...formData, numSerie: e.target.value })}
                    placeholder="Nº Serie (ej. SN-2026-0891)"
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  />
                </div>
              </div>

              {/* Código Kit / SKU */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Código Kit / SKU</label>
                <input
                  type="text"
                  value={formData.codigoKit || ''}
                  onChange={(e) => setFormData({ ...formData, codigoKit: e.target.value })}
                  placeholder="Ej. KIT-ROT-LUM-01"
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Especificaciones Técnicas y Máquinas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 pb-1 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Printer className="w-4 h-4 text-red-600" />
              2. Parámetros Técnicos, Materiales y Máquinas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Desplegable Único: Material + Vinilo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Material / Soporte * 
                  <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 ml-1">
                    (Seleccione el tipo de vinilo o el material rígido)
                  </span>
                </label>
                <select
                  value={
                    formData.material === 'Vinilo' || formData.tipoVinilo
                      ? `vinilo:${formData.tipoVinilo || config.tiposVinilo[0] || 'Monomérico Brillo'}`
                      : `mat:${formData.material || config.materiales[0] || ''}`
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('vinilo:')) {
                      const vType = val.replace('vinilo:', '');
                      setFormData((prev) => ({
                        ...prev,
                        material: 'Vinilo',
                        tipoVinilo: vType,
                      }));
                    } else {
                      const mType = val.replace('mat:', '');
                      setFormData((prev) => ({
                        ...prev,
                        material: mType,
                        tipoVinilo: '',
                      }));
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium transition-colors ${
                    errors.material ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-neutral-300 dark:border-neutral-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                  }`}
                >
                  <optgroup label="── Vinilos (Rotulación & Gran Formato) ──">
                    {config.tiposVinilo.map((v) => (
                      <option key={v} value={`vinilo:${v}`}>
                        Vinilo · {v}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Materiales Rígidos & Soportes ──">
                    {config.materiales
                      .filter((m) => m.toLowerCase() !== 'vinilo')
                      .map((m) => (
                        <option key={m} value={`mat:${m}`}>
                          {m}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {errors.material && <span className="text-[11px] text-red-600 mt-0.5 block">{errors.material}</span>}
              </div>

              {/* Dimensiones */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Dimensiones (Ancho x Alto)</label>
                <input
                  type="text"
                  value={formData.dimensiones || ''}
                  onChange={(e) => setFormData({ ...formData, dimensiones: e.target.value })}
                  placeholder="Ej. 1200 x 800 mm"
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              {/* Máquina Asignada */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Máquina Asignada</label>
                <select
                  value={formData.maquina || ''}
                  onChange={(e) => setFormData({ ...formData, maquina: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                >
                  {config.maquinas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de Entrega */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Método de Entrega</label>
                <select
                  value={formData.metodoEntrega || ''}
                  onChange={(e) => setFormData({ ...formData, metodoEntrega: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                >
                  {config.metodosEntrega.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Responsable / Operador</label>
                <select
                  value={formData.responsable || ''}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                >
                  {config.responsables.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicación y Archivo de Red */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Color / Referencia Tinta</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ej. Blanco Mate / RAL 9010 / Negro"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre de Archivo de Diseño</label>
                <input
                  type="text"
                  value={formData.nombreArchivo || ''}
                  onChange={(e) => setFormData({ ...formData, nombreArchivo: e.target.value })}
                  placeholder="Ej. rotulo_fachada_v2.ai"
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              {/* Ubicación de Archivos en Red Windows */}
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Ruta de Archivos en Red Windows (Carpeta Compartida)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = '\\\\MEB-SERVER\\Trabajos\\2026\\';
                      setFormData((prev) => ({
                        ...prev,
                        ubicacionArchivos: prefix + (prev.clienteNombre ? `${prev.clienteNombre}\\` : '')
                      }));
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline cursor-pointer"
                  >
                    + Insertar ruta MEB-SERVER
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.ubicacionArchivos || ''}
                  onChange={(e) => setFormData({ ...formData, ubicacionArchivos: e.target.value })}
                  placeholder="\\\\MEB-SERVER\\Trabajos\\2026\\Kits\\PRD-XXXX\\"
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              {/* Acabados Técnicos Específicos MEB */}
              <div className="sm:col-span-3 bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Tratamientos y Especificaciones Técnicas Especiales
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.capaBlanca)}
                      onChange={(e) => setFormData({ ...formData, capaBlanca: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span>Capa Blanca UV</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.laqueado)}
                      onChange={(e) => setFormData({ ...formData, laqueado: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span>Laqueado</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.laminado)}
                      onChange={(e) => setFormData({ ...formData, laminado: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span>Laminado</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.impresionUV)}
                      onChange={(e) => setFormData({ ...formData, impresionUV: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span>Impresión UV</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.barnizado)}
                      onChange={(e) => setFormData({ ...formData, barnizado: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span>Barnizado</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.retiroPorCliente)}
                      onChange={(e) => setFormData({ ...formData, retiroPorCliente: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-700 focus:ring-red-500 accent-red-600"
                    />
                    <span className="font-semibold text-red-600 dark:text-red-400">Retiro en Taller</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Plazos y Fechas con Cálculo Automático */}
          <div className="bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              3. Plazos de Entrega y Control de Tiempos
              <span className="text-[11px] font-normal text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                {config.parametros.usarDiasLaborables ? 'Cálculo en días laborables (sin festivos/findes)' : 'Días naturales'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Fecha de Inicio *</label>
                <input
                  type="date"
                  value={formData.fechaInicio || ''}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-colors"
                />
              </div>

              {/* Días Asignados */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Días Asignados *</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.diasAsignados ?? 5}
                  onChange={(e) => handleDaysChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-colors"
                />
              </div>

              {/* Fecha Vencimiento (Recalculada o editable) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Fecha de Vencimiento (Calculada) *
                </label>
                <input
                  type="date"
                  value={formData.fechaVencimiento || ''}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 font-mono font-bold focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Postprocesados y Acabados (Checkboxes) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 pb-1 border-b border-neutral-100 dark:border-neutral-800">
              4. Opciones de Postprocesado y Acabados
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2.5">
              Marque los procesos que debe realizar el equipo de taller antes de la entrega:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {config.postprocesados.map((item) => {
                const isChecked = (formData.postprocesados || []).includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-200 font-medium'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePostprocesado(item)}
                      className="w-4 h-4 rounded text-red-600 border-neutral-300 dark:border-neutral-600 focus:ring-red-500 accent-red-600"
                    />
                    <span className="leading-tight text-[11px]">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: Observaciones e Instrucciones Especiales */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Instrucciones Especiales & Notas para el Taller
            </label>
            <textarea
              rows={3}
              value={formData.notas || ''}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Añada notas sobre tolerancias, instrucciones de empaquetado, avisos de montaje..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:border-red-600 focus:ring-1 focus:ring-red-600 resize-y transition-colors"
            />
          </div>

          {/* Footer Buttons con Negro y Rojo MEB */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isAdmin && !initialJob}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                !isAdmin && !initialJob
                  ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-md shadow-red-900/20'
              }`}
            >
              {initialJob 
                ? (isAdmin ? 'Guardar Cambios' : 'Guardar Modificaciones de Pedido') 
                : 'Crear Trabajo de Producción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
