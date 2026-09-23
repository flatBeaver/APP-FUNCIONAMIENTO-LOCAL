import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  Trash2, 
  X, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Download,
  Server
} from 'lucide-react';
import { 
  createCloudBackup, 
  listCloudBackups, 
  restoreCloudBackupById, 
  deleteCloudBackupById, 
  pushAllToCloud, 
  pullAllFromCloud, 
  testConnection,
  CloudBackupMeta 
} from '../firebase';
import { ProductionJob, Client, AppConfig } from '../types';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: ProductionJob[];
  clients: Client[];
  config: AppConfig;
  operatorName: string;
  onRestoreData: (data: { jobs?: ProductionJob[]; clients?: Client[]; config?: AppConfig }) => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  jobs,
  clients,
  config,
  operatorName,
  onRestoreData,
}) => {
  const [backups, setBackups] = useState<CloudBackupMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [newBackupLabel, setNewBackupLabel] = useState('');
  const [isCloudOnline, setIsCloudOnline] = useState<boolean | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPull, setConfirmPull] = useState(false);

  const checkConnection = useCallback(async () => {
    const ok = await testConnection();
    setIsCloudOnline(ok);
  }, []);

  const loadBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listCloudBackups();
      setBackups(list);
    } catch (err) {
      console.error('Error cargando backups de Firebase:', err);
      setStatusMsg({
        text: 'No se pudieron listar los backups de Firebase. Verifique su conexión.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
      loadBackups();
      setStatusMsg(null);
    }
  }, [isOpen, checkConnection, loadBackups]);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setStatusMsg({ text: 'Creando copia de seguridad en Firebase...', type: 'info' });
    try {
      const created = await createCloudBackup(
        jobs, 
        clients, 
        config, 
        operatorName, 
        newBackupLabel || undefined
      );
      setNewBackupLabel('');
      setStatusMsg({
        text: `¡Copia de seguridad guardada con éxito en la nube! (${created.totalJobs} órdenes, ${created.totalClients} clientes).`,
        type: 'success'
      });
      await loadBackups();
    } catch (err) {
      console.error('Error creando backup:', err);
      setStatusMsg({
        text: 'Error al subir la copia a Firebase. Revise los permisos o conexión.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushAllToCloud = async () => {
    setIsLoading(true);
    setStatusMsg({ text: 'Sincronizando todas las órdenes y clientes con Firestore...', type: 'info' });
    try {
      const res = await pushAllToCloud(jobs, clients, config);
      setStatusMsg({
        text: `¡Sincronización completada! ${res.countJobs} órdenes y ${res.countClients} clientes subidos a Firestore.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error sincronizando con Firebase:', err);
      setStatusMsg({
        text: 'Error en la sincronización con la nube.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullAllFromCloud = async () => {
    setConfirmPull(false);
    setIsLoading(true);
    setStatusMsg({ text: 'Descargando datos desde Firestore...', type: 'info' });
    try {
      const data = await pullAllFromCloud();
      onRestoreData({
        jobs: data.jobs.length > 0 ? data.jobs : undefined,
        clients: data.clients.length > 0 ? data.clients : undefined,
        config: data.config || undefined,
      });
      setStatusMsg({
        text: `Datos recuperados de Firestore: ${data.jobs.length} órdenes y ${data.clients.length} clientes cargados.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error descargando datos:', err);
      setStatusMsg({
        text: 'Error al descargar datos de Firebase.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setIsLoading(true);
    setStatusMsg({ text: 'Recuperando snapshot de la copia desde Firebase...', type: 'info' });
    try {
      const full = await restoreCloudBackupById(backupId);
      onRestoreData({
        jobs: full.jobs,
        clients: full.clients,
        config: full.config,
      });
      setConfirmRestoreId(null);
      setStatusMsg({
        text: `¡Backup restaurado con éxito! Se han cargado ${full.jobs.length} órdenes de trabajo y ${full.clients.length} clientes.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error restaurando backup:', err);
      setStatusMsg({
        text: 'Error al restaurar la copia de seguridad.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    setConfirmDeleteId(null);
    setIsLoading(true);
    try {
      await deleteCloudBackupById(backupId);
      setBackups((prev) => prev.filter((b) => b.id !== backupId));
      setStatusMsg({
        text: 'Copia de seguridad eliminada de la nube.',
        type: 'info'
      });
    } catch (err) {
      console.error('Error eliminando backup:', err);
      setStatusMsg({
        text: 'No se pudo eliminar el backup en Firebase.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackupJSON = async (backupId: string) => {
    try {
      const full = await restoreCloudBackupById(backupId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(full, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const datePart = full.timestamp ? String(full.timestamp).slice(0, 10) : new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("download", `MEB_Cloud_Backup_${datePart}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error descargando JSON:', err);
    }
  };

  return (
    <div 
      id="modal-cloud-firebase"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-[8px] flex items-center justify-center p-3 sm:p-4"
    >
      <div className="backdrop-blur-xl bg-white/95 dark:bg-black/90 text-slate-900 dark:text-white rounded-2xl border border-slate-300 dark:border-neutral-800/90 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 dark:bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Enlace Firebase & Copias en la Nube</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  Firestore Activo
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Almacenamiento persistente, sincronización de órdenes y backups automáticos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Estado / Notificación */}
        {statusMsg && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Tarjeta de Estado del Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Base de Datos</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">Cloud Firestore</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-slate-500 dark:text-neutral-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Proyecto Firebase</span>
                <span className="font-mono text-xs text-slate-700 dark:text-neutral-300">concentrated-rex-0lxdt</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Conectado</span>
              </div>
              <button
                onClick={checkConnection}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 cursor-pointer"
                title="Comprobar latencia"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sección 1: Crear Nueva Copia de Seguridad */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
              <CloudUpload className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>Crear Nueva Copia de Seguridad en Firebase</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-3">
              Guarda una instantánea completa en Firestore con todas las órdenes ({jobs.length}), clientes ({clients.length}), máquina y configuraciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Descripción opcional (ej: Cierre de jornada, Previo a actualización)"
                value={newBackupLabel}
                onChange={(e) => setNewBackupLabel(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-red-600 outline-none text-xs text-slate-900 dark:text-white"
              />
              <button
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <CloudCheck className="w-4 h-4" />
                <span>Guardar Copia Ahora</span>
              </button>
            </div>
          </div>

          {/* Sección 2: Acciones Rápidas de Sincronización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/50">
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-2">
                <CloudUpload className="w-3.5 h-3.5 text-red-600" />
                <span>Sincronizar Todo a Firestore</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-3">
                Sube las colecciones completas para que queden registradas directamente en Firebase.
              </p>
              <button
                onClick={handlePushAllToCloud}
                disabled={isLoading}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Subir Órdenes y Clientes</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/50">
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-2">
                <CloudDownload className="w-3.5 h-3.5 text-blue-600" />
                <span>Cargar Datos desde Firestore</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-3">
                Recupera los datos actualmente almacenados en Firestore para trabajar con ellos.
              </p>
              {confirmPull ? (
                <div className="flex items-center gap-1.5 p-1 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-300 dark:border-amber-800">
                  <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold px-1">¿Sobrescribir datos locales?</span>
                  <button
                    onClick={handlePullAllFromCloud}
                    disabled={isLoading}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    Sí, Cargar
                  </button>
                  <button
                    onClick={() => setConfirmPull(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded text-[11px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPull(true)}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Descargar de la Nube</span>
                </button>
              )}
            </div>
          </div>

          {/* Sección 3: Historial de Copias en Firebase */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600 dark:text-red-500" />
                <span>Copias de Seguridad Disponibles en Firebase ({backups.length})</span>
              </h3>
              <button
                onClick={loadBackups}
                className="text-xs text-red-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Actualizar lista
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-xl">
                <Cloud className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Aún no hay copias de seguridad guardadas en Firebase.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
                  Haga clic en "Guardar Copia Ahora" arriba para registrar la primera versión.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div 
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-red-600/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">
                          {b.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                          {new Date(b.timestamp).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {b.operador}
                        </span>
                        <span>•</span>
                        <span>{b.totalJobs} órdenes</span>
                        <span>•</span>
                        <span>{b.totalClients} clientes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {confirmRestoreId === b.id ? (
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 p-1 rounded-lg border border-amber-300 dark:border-amber-800">
                          <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold px-1">¿Restaurar?</span>
                          <button
                            onClick={() => handleRestoreBackup(b.id)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmRestoreId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded text-[11px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRestoreId(b.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Restaurar datos de esta copia en el sistema"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadBackupJSON(b.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 cursor-pointer transition-colors"
                        title="Descargar archivo JSON offline"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === b.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-lg border border-red-300 dark:border-red-800">
                          <span className="text-[11px] text-red-900 dark:text-red-200 font-semibold px-1">¿Eliminar?</span>
                          <button
                            onClick={() => handleDeleteBackup(b.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded text-[11px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                          title="Eliminar de Firebase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encriptado en tránsito y en reposo mediante Google Cloud</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-800 font-medium text-slate-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
