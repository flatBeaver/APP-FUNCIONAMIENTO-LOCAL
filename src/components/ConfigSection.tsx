import React, { useState } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Calculator, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Palette,
  CheckCircle2,
  Calendar,
  Layers,
  Cloud,
  Database
} from 'lucide-react';
import { AppConfig, StatusOption, PriorityOption, Client, ProductionJob } from '../types';
import { calcularVencimiento, parseISO, toISO } from '../utils/dateCalculations';
import { exportFullBackupJSON } from '../utils/storage';

interface ConfigSectionProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  clients: Client[];
  jobs: ProductionJob[];
  onImportData: (data: { config?: AppConfig; clients?: Client[]; jobs?: ProductionJob[] }) => void;
  onLoadSampleData: () => void;
  onClearAllData: () => void;
  onOpenCloudBackups?: () => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  config,
  onSaveConfig,
  clients,
  jobs,
  onImportData,
  onLoadSampleData,
  onClearAllData,
  onOpenCloudBackups,
}) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(JSON.parse(JSON.stringify(config)));
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');

  // Admin PIN Protection State
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // New item inputs
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#2563eb');
  const [newMaterial, setNewMaterial] = useState('');
  const [newVinyl, setNewVinyl] = useState('');
  const [newMachine, setNewMachine] = useState('');
  const [newDelivery, setNewDelivery] = useState('');
  const [newPostProcess, setNewPostProcess] = useState('');
  const [newHoliday, setNewHoliday] = useState('');

  // Date Calculator Verifier tool state (from user's original HTML)
  const [vInicio, setVInicio] = useState('2021-04-01');
  const [vDias, setVDias] = useState(5);
  const [vFestivos, setVFestivos] = useState('2021-04-02');
  const [vResultado, setVResultado] = useState('');

  const handleTestCalculation = () => {
    const festivosArr = vFestivos
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));

    const res = calcularVencimiento(vInicio, vDias, festivosArr);
    setVResultado(res);
  };

  const handleSaveAll = () => {
    onSaveConfig(localConfig);
    setSaveSuccessMsg('¡Configuración guardada y trabajos recalculados con éxito!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Status handlers
  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    setLocalConfig((prev) => ({
      ...prev,
      estados: [
        ...prev.estados,
        {
          nombre: newStatusName.trim(),
          color: newStatusColor,
          bgColor: '#f1f5f9',
        },
      ],
    }));
    setNewStatusName('');
  };

  const handleRemoveStatus = (index: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      estados: prev.estados.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateStatusColor = (index: number, color: string) => {
    setLocalConfig((prev) => {
      const updated = [...prev.estados];
      updated[index] = { ...updated[index], color };
      return { ...prev, estados: updated };
    });
  };

  // Generic list helpers
  const handleAddToList = (
    key: 'materiales' | 'tiposVinilo' | 'maquinas' | 'metodosEntrega' | 'postprocesados' | 'tipos' | 'ubicaciones',
    value: string,
    clearFn: () => void
  ) => {
    if (!value.trim()) return;
    setLocalConfig((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value.trim()],
    }));
    clearFn();
  };

  const handleRemoveFromList = (
    key: 'materiales' | 'tiposVinilo' | 'maquinas' | 'metodosEntrega' | 'postprocesados' | 'tipos' | 'ubicaciones',
    index: number
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index),
    }));
  };

  // Holiday handlers
  const handleAddHoliday = () => {
    if (!newHoliday || !/^\d{4}-\d{2}-\d{2}$/.test(newHoliday)) return;
    if (localConfig.festivos.includes(newHoliday)) return;
    setLocalConfig((prev) => ({
      ...prev,
      festivos: [...prev.festivos, newHoliday].sort(),
    }));
    setNewHoliday('');
  };

  const handleRemoveHoliday = (h: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      festivos: prev.festivos.filter((x) => x !== h),
    }));
  };

  // Import / Export JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportData(parsed);
        if (parsed.config) setLocalConfig(parsed.config);
        setSaveSuccessMsg('Copia de seguridad importada correctamente.');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } catch (err) {
        setUploadErrorMsg('Error al leer el archivo JSON. Verifique que el formato sea válido.');
        setTimeout(() => setUploadErrorMsg(''), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-black/20 transition-all">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-600 dark:text-red-500" />
            Configuración y Parámetros del Taller
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Añada o modifique materiales, tipos de vinilo, máquinas, estados, festivos y cálculo de plazos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {uploadErrorMsg && (
            <span className="text-xs font-semibold text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-950/50 border border-rose-200 dark:border-red-800 px-3 py-1.5 rounded-lg animate-in fade-in">
              {uploadErrorMsg}
            </span>
          )}
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg animate-in fade-in">
              {saveSuccessMsg}
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* 1. Estados de Producción y Colores */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-red-600 dark:text-red-500" />
          1. Estados de Producción y Colores Asociados
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
          Cada estado define el flujo de la orden en el taller y su color característico en la hoja principal.
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs text-left border border-slate-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2 w-16">Color</th>
                <th className="px-3 py-2">Nombre del Estado</th>
                <th className="px-3 py-2 w-28 text-center">Finaliza Trabajo</th>
                <th className="px-3 py-2 w-16 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {localConfig.estados.map((st, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                  <td className="px-3 py-2">
                    <input
                      type="color"
                      value={st.color}
                      onChange={(e) => handleUpdateStatusColor(idx, e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer p-0.5"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${st.color}15`,
                        color: st.color,
                        border: `1px solid ${st.color}35`,
                      }}
                    >
                      {st.nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {st.esFinal ? (
                      <span className="text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-0.5 rounded">Sí</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500">En curso</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleRemoveStatus(idx)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Eliminar este estado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Status Form */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
          <input
            type="color"
            value={newStatusColor}
            onChange={(e) => setNewStatusColor(e.target.value)}
            className="w-7 h-7 rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            placeholder="Nombre del nuevo estado (Ej. Verificación de Arte)"
            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
          />
          <button
            onClick={handleAddStatus}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            + Añadir Estado
          </button>
        </div>
      </div>

      {/* 2. Parámetros Técnicos: Materiales, Vinilos, Máquinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Materiales */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 mb-2">
            Materiales Disponibles ({localConfig.materiales.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {localConfig.materiales.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs"
              >
                <span className="text-slate-800 dark:text-neutral-200">{m}</span>
                <button
                  onClick={() => handleRemoveFromList('materiales', idx)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              placeholder="Añadir material (ej. Forex 19mm)..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleAddToList('materiales', newMaterial, () => setNewMaterial(''))}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>

        {/* Tipos de Vinilo */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 mb-2">
            Tipos de Vinilo ({localConfig.tiposVinilo.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {localConfig.tiposVinilo.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs"
              >
                <span className="text-slate-800 dark:text-neutral-200">{v}</span>
                <button
                  onClick={() => handleRemoveFromList('tiposVinilo', idx)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVinyl}
              onChange={(e) => setNewVinyl(e.target.value)}
              placeholder="Añadir tipo de vinilo..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleAddToList('tiposVinilo', newVinyl, () => setNewVinyl(''))}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>

        {/* Máquinas */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 mb-2">
            Máquinas y Equipos ({localConfig.maquinas.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {localConfig.maquinas.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs"
              >
                <span className="text-slate-800 dark:text-neutral-200">{m}</span>
                <button
                  onClick={() => handleRemoveFromList('maquinas', idx)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMachine}
              onChange={(e) => setNewMachine(e.target.value)}
              placeholder="Añadir máquina o plotter..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleAddToList('maquinas', newMachine, () => setNewMachine(''))}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>

        {/* Opciones de Postprocesado */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 mb-2">
            Acabados y Postprocesados ({localConfig.postprocesados.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {localConfig.postprocesados.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs"
              >
                <span className="text-slate-800 dark:text-neutral-200">{p}</span>
                <button
                  onClick={() => handleRemoveFromList('postprocesados', idx)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPostProcess}
              onChange={(e) => setNewPostProcess(e.target.value)}
              placeholder="Añadir acabado (ej. Barniz UV sectorizado)..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleAddToList('postprocesados', newPostProcess, () => setNewPostProcess(''))}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* 3. Parámetros de Cálculo y Días Laborables */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-red-600 dark:text-red-500" />
          3. Parámetros de Cálculo Automático y Días Laborables
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
          Configure cómo se calculan las fechas de vencimiento y los días restantes hasta la entrega.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Umbral de Aviso (Días)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localConfig.parametros.umbralAvisoDias}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  parametros: {
                    ...localConfig.parametros,
                    umbralAvisoDias: Number(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
              Días para marcar el trabajo como "Próximo a vencer" (Ámbar).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Días de Producción por Defecto
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={localConfig.parametros.diasProduccionPorDefecto}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  parametros: {
                    ...localConfig.parametros,
                    diasProduccionPorDefecto: Number(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Prefijo del Identificador
            </label>
            <input
              type="text"
              value={localConfig.parametros.prefijoId}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  parametros: {
                    ...localConfig.parametros,
                    prefijoId: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">Ej. PRD- o KIT-</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Nombre de Empresa en PDF
            </label>
            <input
              type="text"
              value={localConfig.parametros.empresaNombre}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  parametros: {
                    ...localConfig.parametros,
                    empresaNombre: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="p-3 bg-red-50/50 dark:bg-neutral-950 border border-red-200 dark:border-red-950/60 rounded-lg mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-neutral-200 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.parametros.usarDiasLaborables}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  parametros: {
                    ...localConfig.parametros,
                    usarDiasLaborables: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-red-600 rounded border-slate-300 dark:border-neutral-700 focus:ring-red-500"
            />
            Calcular el vencimiento en días laborables (excluye fines de semana y la lista de festivos)
          </label>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 ml-6">
            Si está activado, un trabajo que empiece un viernes con 1 día asignado vencerá el lunes siguiente (o el martes si el lunes es festivo).
          </p>
        </div>

        {/* Festivos List */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
            <span>Calendario de Días Festivos ({localConfig.festivos.length} configurados)</span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-neutral-500">Formato AAAA-MM-DD</span>
          </label>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {localConfig.festivos.map((festivo) => (
              <span
                key={festivo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs font-mono text-slate-700 dark:text-neutral-300"
              >
                {festivo}
                <button
                  onClick={() => handleRemoveHoliday(festivo)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:border-red-500"
            />
            <button
              onClick={handleAddHoliday}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              + Añadir Festivo
            </button>
          </div>
        </div>
      </div>

      {/* 4. Verificador del Cálculo de Vencimiento */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
          4. Verificador del Algoritmo de Vencimiento
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
          Comprueba el caso documentado en el taller: Inicio <b>2021-04-01</b>, <b>5 días</b> laborables, festivo <b>2021-04-02</b> (Viernes Santo) → Vencimiento esperado: <b>2021-04-09</b>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={vInicio}
              onChange={(e) => setVInicio(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">Días Asignados</label>
            <input
              type="number"
              min="1"
              value={vDias}
              onChange={(e) => setVDias(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">Festivos a Simular (uno por línea)</label>
            <input
              type="text"
              value={vFestivos}
              onChange={(e) => setVFestivos(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:border-red-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleTestCalculation}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Calcular Vencimiento
          </button>

          {vResultado && (
            <div className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-neutral-950 border border-red-200 dark:border-red-900 px-3 py-1 rounded-lg">
              Resultado: <span className="font-mono text-sm">{vResultado}</span>
              {vResultado === '2021-04-09' && (
                <span className="ml-2 text-emerald-700 dark:text-emerald-400">✓ (Coincide con el resultado esperado del taller)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Base de Datos y Copias en la Nube con Firebase */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>5. Enlace con Firebase (Base de Datos & Backups en la Nube)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                Conectado
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Guarda instantáneas completas de trabajos, clientes y ajustes en Google Cloud Firestore para recuperarlas desde cualquier terminal o navegador.
            </p>
          </div>

          {onOpenCloudBackups && (
            <button
              onClick={onOpenCloudBackups}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-colors shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Gestionar Copias en la Nube</span>
            </button>
          )}
        </div>

        <div className="p-3 bg-slate-50/80 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore Database: <code className="font-mono text-slate-800 dark:text-neutral-200">ai-studio-gestindeproducci-3d610e59-fcff-4f31-bff4-ddd377a641b9</code></span>
          </div>
          <span>Colecciones: <code className="font-mono">jobs</code>, <code className="font-mono">clients</code>, <code className="font-mono">config</code>, <code className="font-mono">backups</code></span>
        </div>
      </div>

      {/* 6. Copias de Seguridad Locales */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Download className="w-4 h-4 text-red-600 dark:text-red-500" />
          6. Copias de Seguridad y Datos Locales
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
          Exporte periódicamente copias de seguridad de sus clientes y trabajos para almacenarlas de forma segura.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => exportFullBackupJSON(localConfig, clients, jobs)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Backup JSON
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-300 dark:border-neutral-700">
            <Upload className="w-3.5 h-3.5" />
            Importar Backup JSON
            <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-300 dark:border-neutral-700"
          >
            Cargar Datos de Ejemplo
          </button>

          <button
            onClick={onClearAllData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Borrar Todos los Datos
          </button>
        </div>
      </div>
    </div>
  );
};
