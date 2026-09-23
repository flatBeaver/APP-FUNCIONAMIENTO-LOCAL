import { ProductionJob, Client, AppConfig } from './types';

// En desarrollo o producción, la API está en el mismo host/puerto /api/*
const API_BASE = '/api';

export interface ServerStatus {
  status: string;
  app: string;
  serverTime: string;
  port: number;
  host: string;
  dbPath: string;
  backupPath: string;
  journalMode: string;
  localIps: string[];
  totalJobs: number;
  totalClients: number;
}

export interface SqliteBackupItem {
  id: string;
  filename: string;
  filepath: string;
  timestamp: string;
  size_bytes: number;
  label: string;
  operador: string;
  total_jobs: number;
  total_clients: number;
}

/**
 * Consulta el estado y las direcciones IP del servidor MEB
 */
export async function apiGetServerStatus(): Promise<ServerStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('No se pudo conectar con el servidor MEB');
  return res.json();
}

/**
 * Obtener todos los trabajos desde SQLite
 */
export async function apiGetJobs(): Promise<ProductionJob[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error(`Error al obtener trabajos: ${res.statusText}`);
  return res.json();
}

/**
 * Crear un nuevo trabajo en SQLite
 */
export async function apiCreateJob(job: ProductionJob): Promise<ProductionJob> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error creando trabajo: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Actualizar un trabajo existente en SQLite
 */
export async function apiUpdateJob(id: string, job: Partial<ProductionJob>): Promise<ProductionJob> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error actualizando trabajo: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Eliminar un trabajo de SQLite
 */
export async function apiDeleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error eliminando trabajo: ${res.statusText}`);
  }
}

/**
 * Obtener clientes desde SQLite
 */
export async function apiGetClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients`);
  if (!res.ok) throw new Error(`Error obteniendo clientes: ${res.statusText}`);
  return res.json();
}

/**
 * Crear cliente en SQLite
 */
export async function apiCreateClient(client: Client): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error creando cliente: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Actualizar cliente en SQLite
 */
export async function apiUpdateClient(id: string, client: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error actualizando cliente: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Eliminar cliente de SQLite
 */
export async function apiDeleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error eliminando cliente: ${res.statusText}`);
  }
}

/**
 * Obtener configuración global de SQLite
 */
export async function apiGetConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`Error obteniendo configuración: ${res.statusText}`);
  return res.json();
}

/**
 * Guardar configuración global en SQLite
 */
export async function apiSaveConfig(config: AppConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error guardando configuración: ${res.statusText}`);
  }
}

/**
 * Obtener lista de backups de SQLite
 */
export async function apiGetBackups(): Promise<SqliteBackupItem[]> {
  const res = await fetch(`${API_BASE}/backups`);
  if (!res.ok) throw new Error(`Error listando copias de seguridad: ${res.statusText}`);
  return res.json();
}

/**
 * Crear una copia de seguridad SQLite en caliente (VACUUM INTO)
 */
export async function apiCreateBackup(label?: string, operator?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/backup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, operator }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error generando backup: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Restaurar una copia de seguridad SQLite
 */
export async function apiRestoreBackup(filename: string): Promise<any> {
  const res = await fetch(`${API_BASE}/backups/restore/${encodeURIComponent(filename)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error restaurando backup: ${res.statusText}`);
  }
  return res.json();
}
