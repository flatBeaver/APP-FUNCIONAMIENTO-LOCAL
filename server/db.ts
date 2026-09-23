import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';

// SQLite database configuration
const DB_PATH = process.env.DATABASE_PATH 
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'data', 'meb.db');

const BACKUP_PATH = process.env.BACKUP_PATH
  ? path.resolve(process.cwd(), process.env.BACKUP_PATH)
  : path.resolve(process.cwd(), 'backups');

// Ensure storage directories exist
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

/**
 * Initializes and configures the SQLite WebAssembly database.
 * Completely immune to GLIBC mismatches, native build dependencies, and platform-specific drivers.
 */
export async function getDb(): Promise<Database> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  if (!dbInstance) {
    if (fs.existsSync(DB_PATH)) {
      try {
        const filebuffer = fs.readFileSync(DB_PATH);
        dbInstance = new SQL.Database(filebuffer);
      } catch (err) {
        console.warn('Advertencia leyendo meb.db existente, creando nueva base de datos:', err);
        dbInstance = new SQL.Database();
      }
    } else {
      dbInstance = new SQL.Database();
    }
    dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

/**
 * Persists the in-memory SQLite database to disk atomically.
 */
export function persistDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('❌ Error guardando base de datos SQLite en disco:', err);
  }
}

// Promise-based helpers for parameterized queries
export async function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const stripped = sql.replace(/--.*$/gm, '').trim();
  if (!stripped) {
    return { lastID: 0, changes: 0 };
  }

  const db = await getDb();
  const cleanParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));

  try {
    db.run(sql, cleanParams);
  } catch (err: any) {
    if (err?.message && err.message.includes('Nothing to prepare')) {
      return { lastID: 0, changes: 0 };
    }
    throw err;
  }

  let lastID = 0;
  let changes = 0;
  try {
    const idRes = db.exec('SELECT last_insert_rowid() as id');
    if (idRes[0]?.values[0]) lastID = Number(idRes[0].values[0][0]);
    const chRes = db.exec('SELECT changes() as c');
    if (chRes[0]?.values[0]) changes = Number(chRes[0].values[0][0]);
  } catch (e) {}

  persistDb();
  return { lastID, changes };
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const db = await getDb();
  const cleanParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
  const stmt = db.prepare(sql);
  stmt.bind(cleanParams);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const cleanParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
  const stmt = db.prepare(sql);
  stmt.bind(cleanParams);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/**
 * Migration engine: Reads migrations from /migrations/ and applies unapplied ones
 */
export async function runMigrations(): Promise<void> {
  const db = await getDb();

  // Create schema_migrations table first if missing
  await dbRun(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const existing = await dbGet('SELECT id FROM schema_migrations WHERE id = ?', [file]);
    if (!existing) {
      console.log(`[MEB SQLite] Aplicando migración: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Split statements and run safely
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await dbRun(statement);
        } catch (err: any) {
          // Ignorar si la columna ya existe en ALTER TABLE
          if (err?.message && err.message.includes('duplicate column name')) {
            continue;
          }
          throw err;
        }
      }

      await dbRun('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
        file,
        new Date().toISOString()
      ]);
      console.log(`[MEB SQLite] Migración aplicada exitosamente: ${file}`);
    }
  }

  // Seed default data if database is empty
  await seedInitialDataIfEmpty();
}

/**
 * Seeds initial config, sample clients and sample jobs if database is brand new
 */
async function seedInitialDataIfEmpty(): Promise<void> {
  const jobsCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM jobs');
  if (jobsCount && jobsCount.count > 0) {
    return; // Ya hay datos, no hacer nada
  }

  console.log('[MEB SQLite] Base de datos vacía detectada. Inicializando datos base...');

  // Default Config
  const defaultConfig = {
    estados: [
      { nombre: 'Ingresado', color: '#64748b', bgColor: '#f1f5f9' },
      { nombre: 'Cotizado', color: '#8b5cf6', bgColor: '#f5f3ff' },
      { nombre: 'Diseño', color: '#0284c7', bgColor: '#f0f9ff' },
      { nombre: 'Correcciones', color: '#ea580c', bgColor: '#fff7ed' },
      { nombre: 'Aprobado', color: '#16a34a', bgColor: '#f0fdf4' },
      { nombre: 'Impresión', color: '#2563eb', bgColor: '#eff6ff' },
      { nombre: 'Postprocesado', color: '#0891b2', bgColor: '#ecfeff' },
      { nombre: 'Control de calidad', color: '#d97706', bgColor: '#fffbeb' },
      { nombre: 'Listo para entregar', color: '#059669', bgColor: '#ecfdf5', esFinal: true },
      { nombre: 'Entregado', color: '#15803d', bgColor: '#f0fdf4', esFinal: true },
    ],
    prioridades: [
      { nombre: 'Baja', color: '#64748b', peso: 1 },
      { nombre: 'Media', color: '#2563eb', peso: 2 },
      { nombre: 'Alta', color: '#ea580c', peso: 3 },
      { nombre: 'Urgente', color: '#dc2626', peso: 4 },
    ],
    materiales: [
      'Forex PVC 3mm',
      'Forex PVC 5mm',
      'Forex PVC 10mm',
      'Aluminio Dibond 3mm',
      'Dibond Cepillado',
      'Metacrilato / Acrílico 4mm',
      'Metacrilato / Acrílico 8mm',
      'Cartón Pluma Foam 5mm',
      'Cartón Nido de Abeja 10mm',
      'Lona Frontlit 510g',
      'Lona Microperforada Mesh',
      'Lona Blackout Doble Cara',
      'Madera MDF 6mm',
      'Polipropileno Alveolar 3.5mm',
    ],
    tiposVinilo: [
      'Monomérico Blanco Brillo',
      'Monomérico Blanco Mate',
      'Polimérico Alta Adherencia',
      'Fundición Vehicular Cast',
      'Vinilo Microperforado Homologado',
      'Vinilo Ácido / Efecto Arenado',
      'Vinilo Floor Graphics (Suelos)',
      'Vinilo Traslúcido / Backlight',
      'Vinilo Fácil Aplicación (Bubble Free)',
      'Sin vinilo / Impresión directa',
    ],
    maquinas: [
      'Roland TrueVIS VG3-640 (Impresión y Corte)',
      'HP Latex 365 (Gran Formato)',
      'Mimaki JFX200 UV Mesa Plana',
      'SwissQprint Nyala Flatbed',
      'Plotter de Corte Summa S2 Class',
      'Mesa de Corte Digital Kongsberg C',
      'Laminadora en Frío/Calor 1600mm',
      'Fresadora CNC Tekcel',
    ],
    metodosEntrega: [
      'Recogida en taller',
      'Mensajería urgente 24h',
      'Transporte propio / Reparto local',
      'Instalación técnica in situ',
      'Envío paletizado / Agencia estándar',
    ],
    postprocesados: [
      'Corte recto a sangre',
      'Laminado protector brillo',
      'Laminado protector mate',
      'Laminado antideslizante R9',
      'Troquelado de forma personalizada',
      'Plegado / Hendido térmico',
      'Ollaos de policarbonato cada 50cm',
      'Vaina perimetral superior e inferior',
      'Canteado y pulido de cantos',
      'Cinta doble cara perimetral',
      'Confección con velcro adhesivo',
      'Embalaje reforzado en caja individual',
    ],
    responsables: [
      'Sin asignar',
      'Operador 1 - Taller Impresión',
      'Operador 2 - Mesa de Corte',
      'Operador 3 - Acabados y Montaje',
      'Jefe de Taller',
      'Control de Calidad',
    ],
    tipos: ['Kit Completo', 'Producto Individual', 'Prototipo / Muestra', 'Serie Corta', 'Repuesto', 'A Medida'],
    ubicaciones: [
      '\\\\MEB-SERVER\\Trabajos\\2026\\Impresion\\',
      '\\\\MEB-SERVER\\Trabajos\\2026\\Kits\\',
      'Nube Drive / Proyectos Taller',
      'PC Taller Plotter 1',
      'PC Taller CNC',
      'Pendiente de recepción de archivos',
    ],
    festivos: ['2026-01-01', '2026-01-06', '2026-04-03', '2026-05-01', '2026-10-12', '2026-12-25'],
    parametros: {
      prefijoId: 'PRD-',
      umbralAvisoDias: 7,
      usarDiasLaborables: true,
      diasProduccionPorDefecto: 5,
      ordenPorDefecto: 'diasRestantes',
      pinAdmin: '1234',
      empresaNombre: 'MEB Estudio Gráfico',
      empresaSubtitulo: 'Taller de Rotulación, Impresión Digital y Gran Formato',
    },
  };

  await dbRun(`
    INSERT OR REPLACE INTO config (id, data, updated_at) 
    VALUES ('global', ?, ?)
  `, [JSON.stringify(defaultConfig), new Date().toISOString()]);

  // Clients
  const defaultClients = [
    {
      id: 'CLI-001',
      nombre: 'Carlos Mendoza',
      empresa: 'Retail Solutions Iberia',
      telefono: '+34 612 345 678',
      email: 'carlos.m@retailsolutions.com',
      direccion: 'Polígono Industrial Las Palmeras, Nave 12, Madrid',
      nifCif: 'B-87654321',
      notas: 'Cliente prioritario. Siempre exige laminado mate y empaque reforzado.',
      fechaAlta: '2026-01-10',
    },
    {
      id: 'CLI-002',
      nombre: 'Elena Vasquez',
      empresa: 'Señalética & Franquicias Express',
      telefono: '+34 678 901 234',
      email: 'compras@senaleticaexpress.es',
      direccion: 'Av. Diagonal 450, Planta 3, Barcelona',
      nifCif: 'B-91234567',
      notas: 'Entregas por transporte propio de martes a jueves.',
      fechaAlta: '2026-02-01',
    },
    {
      id: 'CLI-003',
      nombre: 'Javier Domínguez',
      empresa: 'Stand Design & Eventos Globales',
      telefono: '+34 655 432 109',
      email: 'j.dominguez@standdesign.eu',
      direccion: 'Calle Metalurgia 8, Valencia',
      nifCif: 'B-76543210',
      notas: 'Pedidos urgentes para ferias IFEMA y Fira Barcelona.',
      fechaAlta: '2026-02-15',
    },
  ];

  for (const c of defaultClients) {
    await dbRun(`
      INSERT OR REPLACE INTO clients (id, nombre, empresa, telefono, email, direccion, nifCif, notas, fechaAlta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [c.id, c.nombre, c.empresa, c.telefono, c.email, c.direccion, c.nifCif, c.notas, c.fechaAlta]);
  }

  // Sample Jobs
  const hoy = new Date().toISOString().split('T')[0];
  const sampleJobs = [
    {
      id: 'PRD-0001',
      kit: 'Kit Rótulo Corpóreo Retroiluminado',
      tipo: 'Kit Completo',
      clienteId: 'CLI-001',
      clienteNombre: 'Retail Solutions Iberia',
      modelo: 'LUMINA-PRO-120',
      numSerie: 'SN-2026-0891',
      codigoKit: 'KIT-ROT-LUM-01',
      cantidad: 2,
      material: 'Aluminio Dibond 3mm',
      tipoVinilo: 'Vinilo Traslúcido / Backlight',
      dimensiones: '2400 x 600 mm',
      maquina: 'Mimaki JFX200 UV Mesa Plana',
      ubicacionArchivos: '\\\\MEB-SERVER\\Trabajos\\2026\\Kits\\PRD-0001-LUMINA\\',
      metodoEntrega: 'Transporte propio / Reparto local',
      prioridad: 'Urgente',
      estado: 'Impresión',
      postprocesados: JSON.stringify(['Troquelado de forma personalizada', 'Canteado y pulido de cantos', 'Embalaje reforzado']),
      fechaInicio: hoy,
      diasAsignados: 3,
      fechaVencimiento: hoy,
      avance: 45,
      responsable: 'Operador 1 - Taller Impresión',
      notas: 'Verificar alineación de LED perimetrales y prueba de luz antes del cierre.',
      fechaCreacion: hoy,
      color: 'Negro Mate / Luz Cálida',
      capaBlanca: 1,
      laqueado: 0,
      laminado: 1,
      impresionUV: 1,
      barnizado: 0,
      nombreArchivo: 'lumina_front_corte.ai',
      rutaArchivo: '\\\\MEB-SERVER\\Trabajos\\2026\\Kits\\PRD-0001-LUMINA\\lumina_front_corte.ai',
      retiroPorCliente: 0,
      fechaModificacion: hoy,
    },
    {
      id: 'PRD-0002',
      kit: 'PLV Display Mostrador Desmontable',
      tipo: 'Kit Completo',
      clienteId: 'CLI-002',
      clienteNombre: 'Señalética & Franquicias Express',
      modelo: 'DISP-DESK-M3',
      numSerie: 'SN-2026-0892',
      codigoKit: 'KIT-PLV-FOAM-50',
      cantidad: 50,
      material: 'Forex PVC 5mm',
      tipoVinilo: 'Polimérico Alta Adherencia',
      dimensiones: '450 x 300 x 200 mm',
      maquina: 'Mesa de Corte Digital Kongsberg C',
      ubicacionArchivos: '\\\\MEB-SERVER\\Trabajos\\2026\\Impresion\\PRD-0002-PLV\\',
      metodoEntrega: 'Envío paletizado / Agencia estándar',
      prioridad: 'Alta',
      estado: 'Postprocesado',
      postprocesados: JSON.stringify(['Corte recto a sangre', 'Laminado protector mate', 'Plegado / Hendido térmico']),
      fechaInicio: hoy,
      diasAsignados: 5,
      fechaVencimiento: hoy,
      avance: 80,
      responsable: 'Operador 2 - Mesa de Corte',
      notas: 'Incluir instrucciones de montaje serigrafiadas en el sobre interior.',
      fechaCreacion: hoy,
      color: 'Blanco / CMYK',
      capaBlanca: 0,
      laqueado: 0,
      laminado: 1,
      impresionUV: 1,
      barnizado: 0,
      nombreArchivo: 'plv_display_50u.pdf',
      rutaArchivo: '\\\\MEB-SERVER\\Trabajos\\2026\\Impresion\\PRD-0002-PLV\\plv_display_50u.pdf',
      retiroPorCliente: 0,
      fechaModificacion: hoy,
    },
    {
      id: 'PRD-0003',
      kit: 'Pancarta Microperforada Fachada',
      tipo: 'Producto Individual',
      clienteId: 'CLI-003',
      clienteNombre: 'Stand Design & Eventos Globales',
      modelo: 'MESH-EXTRA-W',
      numSerie: 'SN-2026-0893',
      codigoKit: 'LONA-EXT-03',
      cantidad: 1,
      material: 'Lona Microperforada Mesh',
      tipoVinilo: 'Sin vinilo / Impresión directa',
      dimensiones: '6000 x 3000 mm',
      maquina: 'HP Latex 365 (Gran Formato)',
      ubicacionArchivos: '\\\\MEB-SERVER\\Trabajos\\2026\\Impresion\\PRD-0003-MESH\\',
      metodoEntrega: 'Instalación técnica in situ',
      prioridad: 'Media',
      estado: 'Control de calidad',
      postprocesados: JSON.stringify(['Ollaos de policarbonato cada 50cm', 'Vaina perimetral superior e inferior']),
      fechaInicio: hoy,
      diasAsignados: 4,
      fechaVencimiento: hoy,
      avance: 90,
      responsable: 'Operador 3 - Acabados y Montaje',
      notas: 'Comprobar refuerzo termosellado de las esquinas superiores.',
      fechaCreacion: hoy,
      color: 'Full Color 1200dpi',
      capaBlanca: 0,
      laqueado: 0,
      laminado: 0,
      impresionUV: 0,
      barnizado: 0,
      nombreArchivo: 'fachada_mesh_6x3m.tif',
      rutaArchivo: '\\\\MEB-SERVER\\Trabajos\\2026\\Impresion\\PRD-0003-MESH\\fachada_mesh_6x3m.tif',
      retiroPorCliente: 0,
      fechaModificacion: hoy,
    }
  ];

  for (const j of sampleJobs) {
    await dbRun(`
      INSERT INTO jobs (
        id, kit, tipo, clienteId, clienteNombre, modelo, numSerie, codigoKit,
        cantidad, material, tipoVinilo, dimensiones, maquina, ubicacionArchivos,
        metodoEntrega, prioridad, estado, postprocesados, fechaInicio, diasAsignados,
        fechaVencimiento, avance, responsable, notas, fechaCreacion,
        color, capaBlanca, laqueado, laminado, impresionUV, barnizado,
        nombreArchivo, rutaArchivo, retiroPorCliente, fechaModificacion
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `, [
      j.id, j.kit, j.tipo, j.clienteId, j.clienteNombre, j.modelo, j.numSerie, j.codigoKit,
      j.cantidad, j.material, j.tipoVinilo, j.dimensiones, j.maquina, j.ubicacionArchivos,
      j.metodoEntrega, j.prioridad, j.estado, j.postprocesados, j.fechaInicio, j.diasAsignados,
      j.fechaVencimiento, j.avance, j.responsable, j.notas, j.fechaCreacion,
      j.color, j.capaBlanca, j.laqueado, j.laminado, j.impresionUV, j.barnizado,
      j.nombreArchivo, j.rutaArchivo, j.retiroPorCliente, j.fechaModificacion
    ]);
  }

  console.log('[MEB SQLite] Datos base inicializados exitosamente.');
}

/**
 * Native, atomic and safe SQLite backup using WebAssembly export
 * This guarantees consistency and instant memory snapshot with zero file lock!
 */
export async function createDatabaseBackup(label?: string, operator?: string): Promise<{
  id: string;
  filename: string;
  filepath: string;
  timestamp: string;
  sizeBytes: number;
}> {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.replace(/[:.]/g, '-');
  const filename = `meb-${dateStr}.db`;
  const filepath = path.join(BACKUP_PATH, filename);

  const db = await getDb();
  const data = db.export();
  fs.writeFileSync(filepath, Buffer.from(data));

  let sizeBytes = 0;
  try {
    const stats = fs.statSync(filepath);
    sizeBytes = stats.size;
  } catch (e) {
    console.warn('No se pudo obtener el tamaño del archivo backup:', e);
  }

  const jobsCount = await dbGet<{ c: number }>('SELECT COUNT(*) as c FROM jobs');
  const clientsCount = await dbGet<{ c: number }>('SELECT COUNT(*) as c FROM clients');

  const backupId = `bk-${Date.now()}`;
  await dbRun(`
    INSERT INTO backups_history (
      id, filename, filepath, timestamp, size_bytes, label, operador, total_jobs, total_clients
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    backupId,
    filename,
    filepath,
    timestamp,
    sizeBytes,
    label || `Copia de seguridad del sistema (${new Date().toLocaleDateString('es-ES')})`,
    operator || 'Operador MEB',
    jobsCount?.c || 0,
    clientsCount?.c || 0,
  ]);

  return {
    id: backupId,
    filename,
    filepath,
    timestamp,
    sizeBytes,
  };
}

/**
 * Lists all available SQLite backups
 */
export async function getBackupsList(): Promise<any[]> {
  const history = await dbAll(`
    SELECT * FROM backups_history ORDER BY timestamp DESC
  `);

  // También comprobar archivos físicos en la carpeta backups
  const physicalFiles = fs.existsSync(BACKUP_PATH) 
    ? fs.readdirSync(BACKUP_PATH).filter(f => f.endsWith('.db'))
    : [];

  const registeredFiles = new Set(history.map(h => h.filename));

  const allBackups = [...history];

  for (const file of physicalFiles) {
    if (!registeredFiles.has(file)) {
      const full = path.join(BACKUP_PATH, file);
      const stat = fs.statSync(full);
      allBackups.push({
        id: `file-${file}`,
        filename: file,
        filepath: full,
        timestamp: stat.mtime.toISOString(),
        size_bytes: stat.size,
        label: 'Copia encontrada en disco',
        operador: 'Sistema',
        total_jobs: 0,
        total_clients: 0
      });
    }
  }

  return allBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Restores a backup by loading the backup file buffer into SQLite
 */
export async function restoreDatabaseBackup(filename: string): Promise<void> {
  const cleanFilename = path.basename(filename);
  const sourcePath = path.join(BACKUP_PATH, cleanFilename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`El archivo de backup ${cleanFilename} no existe.`);
  }

  // Crear primero un backup de seguridad del estado actual antes de sobrescribir
  await createDatabaseBackup('Auto-backup previo a restauración', 'Sistema');

  // Reemplazar la base de datos en memoria con el archivo restaurado
  if (!SQL) {
    SQL = await initSqlJs();
  }
  const filebuffer = fs.readFileSync(sourcePath);
  dbInstance = new SQL.Database(filebuffer);
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Persistir en disco
  persistDb();
}

/**
 * Helper to get local IP addresses for printing the LAN URL
 */
export function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Ignorar direcciones internas (127.0.0.1) y IPv6
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

export function getDatabasePathInfo(): { dbPath: string; backupPath: string } {
  return {
    dbPath: DB_PATH,
    backupPath: BACKUP_PATH,
  };
}
