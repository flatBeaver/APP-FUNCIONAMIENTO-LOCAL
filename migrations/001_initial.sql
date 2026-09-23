-- Migración inicial para MEB Estudio Gráfico
-- Sistema de Base de Datos SQLite para Gestión de Producción

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  nifCif TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  fechaAlta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  kit TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Kit Completo',
  clienteId TEXT NOT NULL DEFAULT '',
  clienteNombre TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  numSerie TEXT NOT NULL DEFAULT '',
  codigoKit TEXT NOT NULL DEFAULT '',
  cantidad INTEGER NOT NULL DEFAULT 1,
  material TEXT NOT NULL DEFAULT '',
  tipoVinilo TEXT NOT NULL DEFAULT '',
  dimensiones TEXT NOT NULL DEFAULT '',
  maquina TEXT NOT NULL DEFAULT '',
  ubicacionArchivos TEXT NOT NULL DEFAULT '',
  metodoEntrega TEXT NOT NULL DEFAULT '',
  prioridad TEXT NOT NULL DEFAULT 'Media',
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  postprocesados TEXT NOT NULL DEFAULT '[]',
  fechaInicio TEXT NOT NULL,
  diasAsignados INTEGER NOT NULL DEFAULT 5,
  fechaVencimiento TEXT NOT NULL,
  avance INTEGER NOT NULL DEFAULT 0,
  responsable TEXT NOT NULL DEFAULT 'Sin asignar',
  notas TEXT NOT NULL DEFAULT '',
  fechaCreacion TEXT NOT NULL,
  fechaArchivo TEXT,
  -- Campos técnicos específicos de rotulación y acabados MEB
  color TEXT DEFAULT '',
  capaBlanca INTEGER DEFAULT 0,
  laqueado INTEGER DEFAULT 0,
  laminado INTEGER DEFAULT 0,
  impresionUV INTEGER DEFAULT 0,
  barnizado INTEGER DEFAULT 0,
  nombreArchivo TEXT DEFAULT '',
  rutaArchivo TEXT DEFAULT '',
  retiroPorCliente INTEGER DEFAULT 0,
  fechaModificacion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backups_history (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  operador TEXT NOT NULL DEFAULT 'Sistema',
  total_jobs INTEGER NOT NULL DEFAULT 0,
  total_clients INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_jobs_cliente ON jobs(clienteId);
CREATE INDEX IF NOT EXISTS idx_jobs_estado ON jobs(estado);
CREATE INDEX IF NOT EXISTS idx_jobs_prioridad ON jobs(prioridad);
CREATE INDEX IF NOT EXISTS idx_jobs_vencimiento ON jobs(fechaVencimiento);
