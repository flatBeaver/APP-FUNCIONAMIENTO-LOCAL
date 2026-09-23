import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  HardDrive, 
  RefreshCw, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Wifi, 
  Copy, 
  Check, 
  FolderSync, 
  Cloud,
  FileCheck
} from 'lucide-react';
import { 
  apiGetServerStatus, 
  apiGetBackups, 
  apiCreateBackup, 
  apiRestoreBackup, 
  ServerStatus, 
  SqliteBackupItem 
} from '../api';

interface ServerBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorName: string;
  onDataRestored?: () => void;
  onOpenCloudBackupModal?: () => void;
}

export const ServerBackupModal: React.FC<ServerBackupModalProps> = ({
  isOpen,
  onClose,
  operatorName,
  onDataRestored,
  onOpenCloudBackupModal,
}) => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [backups, setBackups] = useState<SqliteBackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [backupLabel, setBackupLabel] = useState('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [confirmRestoreFilename, setConfirmRestoreFilename] = useState<string | null>(null);

  const loadInfo = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [serverStatus, backupsList] = await Promise.all([
        apiGetServerStatus().catch(() => null),
        apiGetBackups().catch(() => []),
      ]);
      setStatus(serverStatus);
      setBackups(backupsList);
    } catch (err: any) {
      setMessage({ text: 'Error al conectar con la base de datos SQLite: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await apiCreateBackup(
        backupLabel || `Copia manual por ${operatorName}`,
        operatorName
      );
      setMessage({
        text: `Copia de seguridad creada correctamente: ${res.backup?.filename || 'meb.db'}`,
        type: 'success',
      });
      setBackupLabel('');
      await loadInfo();
    } catch (err: any) {
      setMessage({ text: 'Error creando backup: ' + err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filename: string) => {
    setConfirmRestoreFilename(null);
    setRestoringId(filename);
    setMessage(null);
    try {
      await apiRestoreBackup(filename);
      setMessage({ text: `Base de datos restaurada con éxito desde ${filename}`, type: 'success' });
      await loadInfo();
      if (onDataRestored) onDataRestored();
    } catch (err: any) {
      setMessage({ text: 'Error al restaurar: ' + err.message, type: 'error' });
    } finally {
      setRestoringId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(id);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-[8px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="backdrop-blur-xl bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl max-w-3xl w-full text-neutral-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-black px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-red-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Servidor MEB & Base de Datos SQLite</h2>
                <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  WAL Activo
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Red local (LAN) · Concurrencia multiusuario · Copias de seguridad atómicas en caliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/80 text-red-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1: Network & Server Status */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-red-500" />
                Acceso desde otras PCs de la Red Local (MEB)
              </h3>
              <button
                onClick={loadInfo}
                disabled={loading}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} />
                Actualizar
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">
              Cualquier computadora conectada a la red de MEB puede ingresar abriendo Chrome o Edge con las siguientes direcciones:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Localhost */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Esta PC (Servidor Local)</span>
                  <span className="font-mono text-xs text-white font-semibold">http://localhost:3000</span>
                </div>
                <button
                  onClick={() => copyToClipboard('http://localhost:3000', 'local')}
                  className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                  title="Copiar URL"
                >
                  {copiedIp === 'local' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* LAN IPs */}
              {status?.localIps && status.localIps.length > 0 ? (
                status.localIps.map((ip) => {
                  const url = `http://${ip}:${status.port || 3000}`;
                  return (
                    <div key={ip} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-red-400 block font-medium">Otras computadoras de MEB</span>
                        <span className="font-mono text-xs text-white font-semibold">{url}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(url, ip)}
                        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                        title="Copiar dirección de red"
                      >
                        {copiedIp === ip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-400">
                  <span className="text-[10px] text-neutral-400 block">Dirección de Red</span>
                  <span className="font-mono text-xs text-neutral-300">http://0.0.0.0:3000</span>
                </div>
              )}
            </div>

            {/* Technical Database stats */}
            <div className="mt-3 pt-3 border-t border-neutral-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-neutral-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-neutral-400 block">Total Trabajos</span>
                <span className="font-bold text-sm text-white">{status?.totalJobs ?? '...'}</span>
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-neutral-400 block">Total Clientes</span>
                <span className="font-bold text-sm text-white">{status?.totalClients ?? '...'}</span>
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-neutral-400 block">Ubicación DB</span>
                <span className="font-mono text-[11px] text-neutral-300 truncate block" title={status?.dbPath}>
                  data/meb.db
                </span>
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-neutral-400 block">Concurrencia</span>
                <span className="font-semibold text-[11px] text-emerald-400 block">WAL (5-10 PCs)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Hot Backups in SQLite */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-red-500" />
                  Copias de Seguridad del Sistema (/backups/)
                </h3>
                <p className="text-xs text-neutral-400">
                  Generadas mediante <code className="text-neutral-300 font-mono">VACUUM INTO</code> para asegurar consistencia atómica sin interrumpir el taller.
                </p>
              </div>

              {onOpenCloudBackupModal && (
                <button
                  type="button"
                  onClick={onOpenCloudBackupModal}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Ver también Firebase Nube
                </button>
              )}
            </div>

            {/* Create Backup Box */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                placeholder="Etiqueta opcional (ej: Cierre semanal / Previo a entrega Stand)"
                className="w-full sm:flex-1 bg-neutral-900 border border-neutral-800 focus:border-red-600 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
              <button
                onClick={handleCreateBackup}
                disabled={creating}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Database className="w-3.5 h-3.5" />
                {creating ? 'Generando Copia...' : 'Crear Copia SQLite (.db)'}
              </button>
            </div>

            {/* Backups List */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
              <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 flex items-center justify-between">
                <span>Archivo y Fecha</span>
                <span>Acciones</span>
              </div>

              {backups.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  <Database className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  No hay copias guardadas aún en la carpeta <code className="text-neutral-400">/backups/</code>.
                  Haga clic en &quot;Crear Copia SQLite&quot; para registrar la primera.
                </div>
              ) : (
                <div className="divide-y divide-neutral-900 max-h-60 overflow-y-auto">
                  {backups.map((b) => (
                    <div
                      key={b.id || b.filename}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-xs font-bold text-white">{b.filename}</span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                            {formatBytes(b.size_bytes)}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{new Date(b.timestamp).toLocaleString('es-ES')}</span>
                          {b.label && <span className="text-neutral-300 italic">&quot;{b.label}&quot;</span>}
                          {b.operador && <span className="text-neutral-400">Por: {b.operador}</span>}
                          {b.total_jobs > 0 && <span className="text-red-400 font-mono">{b.total_jobs} trabajos</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {confirmRestoreFilename === b.filename ? (
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 p-1 rounded-lg border border-amber-300 dark:border-amber-800">
                            <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold px-1">¿Restaurar?</span>
                            <button
                              onClick={() => handleRestore(b.filename)}
                              disabled={restoringId === b.filename}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmRestoreFilename(null)}
                              className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-[11px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestoreFilename(b.filename)}
                            disabled={restoringId === b.filename}
                            className="px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 hover:text-red-400 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Restaurar base de datos a este punto en el tiempo"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${restoringId === b.filename ? 'animate-spin' : ''}`} />
                            Restaurar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Shared Folder Instructions */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 text-xs text-neutral-400">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-red-500" />
              Archivos de Producción en Red Windows (Carpetas Compartidas)
            </h4>
            <p className="leading-relaxed">
              La base de datos SQLite almacena las rutas de los archivos (ej: <code className="text-neutral-300 font-mono">\\MEB-SERVER\Trabajos\2026\Clientes\...</code>) sin saturar la base con archivos pesados. Cualquier máquina autorizada de MEB puede abrir los archivos de corte e impresión directamente desde el Explorador de Windows.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black px-6 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>MEB Estudio Gráfico · Arquitectura Local-First</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
