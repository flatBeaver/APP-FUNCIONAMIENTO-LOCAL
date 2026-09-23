import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  getDb, 
  dbRun, 
  dbGet, 
  dbAll, 
  runMigrations, 
  createDatabaseBackup, 
  getBackupsList, 
  restoreDatabaseBackup,
  getLocalIpAddresses,
  getDatabasePathInfo
} from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const HOST = '0.0.0.0';

  // Middlewares
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for local LAN workstations
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Run database migrations on startup
  try {
    await runMigrations();
    console.log('✅ SQLite conectado con éxito (WAL activo).');
  } catch (err) {
    console.error('❌ Error ejecutando migraciones de SQLite:', err);
  }

  // --- API REST ROUTES ---

  // Health / Status endpoint
  app.get('/api/status', async (req, res) => {
    try {
      const { dbPath, backupPath } = getDatabasePathInfo();
      const localIps = getLocalIpAddresses();
      const jobsCount = await dbGet<{ c: number }>('SELECT COUNT(*) as c FROM jobs');
      const clientsCount = await dbGet<{ c: number }>('SELECT COUNT(*) as c FROM clients');
      const walMode = await dbGet<{ journal_mode: string }>('PRAGMA journal_mode;');

      res.json({
        status: 'online',
        app: 'MEB Estudio Gráfico - Control de Producción',
        serverTime: new Date().toISOString(),
        port: PORT,
        host: HOST,
        dbPath,
        backupPath,
        journalMode: walMode?.journal_mode || 'wal',
        localIps,
        totalJobs: jobsCount?.c || 0,
        totalClients: clientsCount?.c || 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- JOBS CRUD ---

  // GET /api/jobs: List all jobs
  app.get('/api/jobs', async (req, res) => {
    try {
      const rows = await dbAll('SELECT * FROM jobs ORDER BY fechaVencimiento ASC, id DESC');
      // Parse postprocesados JSON
      const jobs = rows.map(j => ({
        ...j,
        postprocesados: typeof j.postprocesados === 'string' 
          ? JSON.parse(j.postprocesados || '[]') 
          : (j.postprocesados || []),
        capaBlanca: Boolean(j.capaBlanca),
        laqueado: Boolean(j.laqueado),
        laminado: Boolean(j.laminado),
        impresionUV: Boolean(j.impresionUV),
        barnizado: Boolean(j.barnizado),
        retiroPorCliente: Boolean(j.retiroPorCliente),
      }));
      res.json(jobs);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      res.status(500).json({ error: 'Error al consultar trabajos en SQLite: ' + err.message });
    }
  });

  // GET /api/jobs/:id: Get job by ID
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
      if (!row) {
        return res.status(404).json({ error: 'Trabajo no encontrado' });
      }
      res.json({
        ...row,
        postprocesados: typeof row.postprocesados === 'string' 
          ? JSON.parse(row.postprocesados || '[]') 
          : (row.postprocesados || []),
        capaBlanca: Boolean(row.capaBlanca),
        laqueado: Boolean(row.laqueado),
        laminado: Boolean(row.laminado),
        impresionUV: Boolean(row.impresionUV),
        barnizado: Boolean(row.barnizado),
        retiroPorCliente: Boolean(row.retiroPorCliente),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/jobs: Create new job
  app.post('/api/jobs', async (req, res) => {
    try {
      const j = req.body;
      if (!j.kit || !j.id) {
        return res.status(400).json({ error: 'ID y Kit/Producto son campos obligatorios.' });
      }

      const postprocesadosJson = Array.isArray(j.postprocesados) 
        ? JSON.stringify(j.postprocesados) 
        : JSON.stringify([]);

      const now = new Date().toISOString();

      await dbRun(`
        INSERT INTO jobs (
          id, kit, tipo, clienteId, clienteNombre, modelo, numSerie, codigoKit,
          cantidad, material, tipoVinilo, dimensiones, maquina, ubicacionArchivos,
          metodoEntrega, prioridad, estado, postprocesados, fechaInicio, diasAsignados,
          fechaVencimiento, avance, responsable, notas, fechaCreacion, fechaArchivo,
          color, capaBlanca, laqueado, laminado, impresionUV, barnizado,
          nombreArchivo, rutaArchivo, retiroPorCliente, fechaModificacion
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `, [
        j.id,
        j.kit || '',
        j.tipo || 'Kit Completo',
        j.clienteId || '',
        j.clienteNombre || '',
        j.modelo || '',
        j.numSerie || '',
        j.codigoKit || '',
        Number(j.cantidad) || 1,
        j.material || '',
        j.tipoVinilo || '',
        j.dimensiones || '',
        j.maquina || '',
        j.ubicacionArchivos || '',
        j.metodoEntrega || '',
        j.prioridad || 'Media',
        j.estado || 'Ingresado',
        postprocesadosJson,
        j.fechaInicio || now.split('T')[0],
        Number(j.diasAsignados) || 5,
        j.fechaVencimiento || now.split('T')[0],
        Number(j.avance) || 0,
        j.responsable || 'Sin asignar',
        j.notas || '',
        j.fechaCreacion || now.split('T')[0],
        j.fechaArchivo || null,
        j.color || '',
        j.capaBlanca ? 1 : 0,
        j.laqueado ? 1 : 0,
        j.laminado ? 1 : 0,
        j.impresionUV ? 1 : 0,
        j.barnizado ? 1 : 0,
        j.nombreArchivo || '',
        j.rutaArchivo || j.ubicacionArchivos || '',
        j.retiroPorCliente ? 1 : 0,
        now
      ]);

      const saved = await dbGet('SELECT * FROM jobs WHERE id = ?', [j.id]);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Error creating job:', err);
      res.status(500).json({ error: 'Error guardando trabajo en SQLite: ' + err.message });
    }
  });

  // PUT /api/jobs/:id: Update existing job
  app.put('/api/jobs/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const j = req.body;

      const postprocesadosJson = Array.isArray(j.postprocesados) 
        ? JSON.stringify(j.postprocesados) 
        : JSON.stringify([]);

      const now = new Date().toISOString();

      await dbRun(`
        UPDATE jobs SET
          kit = ?, tipo = ?, clienteId = ?, clienteNombre = ?, modelo = ?, numSerie = ?, codigoKit = ?,
          cantidad = ?, material = ?, tipoVinilo = ?, dimensiones = ?, maquina = ?, ubicacionArchivos = ?,
          metodoEntrega = ?, prioridad = ?, estado = ?, postprocesados = ?, fechaInicio = ?, diasAsignados = ?,
          fechaVencimiento = ?, avance = ?, responsable = ?, notas = ?, fechaArchivo = ?,
          color = ?, capaBlanca = ?, laqueado = ?, laminado = ?, impresionUV = ?, barnizado = ?,
          nombreArchivo = ?, rutaArchivo = ?, retiroPorCliente = ?, fechaModificacion = ?
        WHERE id = ?
      `, [
        j.kit || '',
        j.tipo || 'Kit Completo',
        j.clienteId || '',
        j.clienteNombre || '',
        j.modelo || '',
        j.numSerie || '',
        j.codigoKit || '',
        Number(j.cantidad) || 1,
        j.material || '',
        j.tipoVinilo || '',
        j.dimensiones || '',
        j.maquina || '',
        j.ubicacionArchivos || '',
        j.metodoEntrega || '',
        j.prioridad || 'Media',
        j.estado || 'Ingresado',
        postprocesadosJson,
        j.fechaInicio,
        Number(j.diasAsignados) || 5,
        j.fechaVencimiento,
        Number(j.avance) || 0,
        j.responsable || 'Sin asignar',
        j.notas || '',
        j.fechaArchivo || null,
        j.color || '',
        j.capaBlanca ? 1 : 0,
        j.laqueado ? 1 : 0,
        j.laminado ? 1 : 0,
        j.impresionUV ? 1 : 0,
        j.barnizado ? 1 : 0,
        j.nombreArchivo || '',
        j.rutaArchivo || j.ubicacionArchivos || '',
        j.retiroPorCliente ? 1 : 0,
        now,
        id
      ]);

      const updated = await dbGet('SELECT * FROM jobs WHERE id = ?', [id]);
      if (!updated) {
        return res.status(404).json({ error: 'Trabajo no encontrado para actualizar' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating job:', err);
      res.status(500).json({ error: 'Error actualizando trabajo: ' + err.message });
    }
  });

  // DELETE /api/jobs/:id: Delete job
  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await dbRun('DELETE FROM jobs WHERE id = ?', [id]);
      res.json({ success: true, message: `Trabajo ${id} eliminado de SQLite.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CLIENTS CRUD ---

  // GET /api/clients: List clients
  app.get('/api/clients', async (req, res) => {
    try {
      const clients = await dbAll('SELECT * FROM clients ORDER BY nombre ASC');
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/clients: Create client
  app.post('/api/clients', async (req, res) => {
    try {
      const c = req.body;
      if (!c.id || !c.nombre) {
        return res.status(400).json({ error: 'ID y Nombre de cliente son obligatorios.' });
      }
      await dbRun(`
        INSERT INTO clients (id, nombre, empresa, telefono, email, direccion, nifCif, notas, fechaAlta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.id,
        c.nombre,
        c.empresa || '',
        c.telefono || '',
        c.email || '',
        c.direccion || '',
        c.nifCif || '',
        c.notas || '',
        c.fechaAlta || new Date().toISOString().split('T')[0]
      ]);
      const saved = await dbGet('SELECT * FROM clients WHERE id = ?', [c.id]);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/clients/:id: Update client
  app.put('/api/clients/:id', async (req, res) => {
    try {
      const c = req.body;
      const id = req.params.id;
      await dbRun(`
        UPDATE clients SET
          nombre = ?, empresa = ?, telefono = ?, email = ?, direccion = ?, nifCif = ?, notas = ?
        WHERE id = ?
      `, [
        c.nombre,
        c.empresa || '',
        c.telefono || '',
        c.email || '',
        c.direccion || '',
        c.nifCif || '',
        c.notas || '',
        id
      ]);
      const updated = await dbGet('SELECT * FROM clients WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/clients/:id: Delete client
  app.delete('/api/clients/:id', async (req, res) => {
    try {
      await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CONFIG ---

  // GET /api/config: Get application configuration
  app.get('/api/config', async (req, res) => {
    try {
      const row = await dbGet<{ data: string }>('SELECT data FROM config WHERE id = "global"');
      if (row && row.data) {
        res.json(JSON.parse(row.data));
      } else {
        res.status(404).json({ error: 'Configuración no encontrada en base de datos.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/config: Update application configuration
  app.put('/api/config', async (req, res) => {
    try {
      const configData = req.body;
      const now = new Date().toISOString();
      await dbRun(`
        INSERT OR REPLACE INTO config (id, data, updated_at)
        VALUES ('global', ?, ?)
      `, [JSON.stringify(configData), now]);
      res.json({ success: true, message: 'Configuración guardada en SQLite.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SQLITE BACKUPS API ---

  // GET /api/backups: List backups
  app.get('/api/backups', async (req, res) => {
    try {
      const list = await getBackupsList();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/backup: Create hot-safe SQLite backup
  app.post('/api/backup', async (req, res) => {
    try {
      const { label, operator } = req.body || {};
      const backupResult = await createDatabaseBackup(label, operator);
      res.json({ success: true, backup: backupResult });
    } catch (err: any) {
      console.error('Error creating SQLite backup:', err);
      res.status(500).json({ error: 'Error generando backup de SQLite: ' + err.message });
    }
  });

  // POST /api/backups/restore/:filename: Restore backup
  app.post('/api/backups/restore/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      await restoreDatabaseBackup(filename);
      res.json({ success: true, message: `Base de datos restaurada desde ${filename}.` });
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      res.status(500).json({ error: 'Error restaurando backup: ' + err.message });
    }
  });

  // --- VITE MIDDLEWARE & STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listening on 0.0.0.0 (all network interfaces)
  app.listen(PORT, HOST, () => {
    const localIps = getLocalIpAddresses();
    const { dbPath } = getDatabasePathInfo();
    const primaryIp = localIps[0] || '192.168.1.X';

    console.log('\n' + '='.repeat(54));
    console.log('       MEB SERVER INICIADO - TALLER Y PRODUCCIÓN');
    console.log('='.repeat(54));
    console.log(`\nServidor:`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`\nRed local (Otras PCs de MEB):`);
    if (localIps.length > 0) {
      localIps.forEach(ip => {
        console.log(`  http://${ip}:${PORT}`);
      });
    } else {
      console.log(`  http://0.0.0.0:${PORT} (Compruebe su IP local con ipconfig)`);
    }
    console.log(`\nBase de datos SQLite:`);
    console.log(`  ${dbPath}`);
    console.log(`\nModo de concurrencia: SQLite WAL (Write-Ahead Logging)`);
    console.log('='.repeat(54) + '\n');
  });
}

startServer().catch((err) => {
  console.error('Error fatal iniciando servidor MEB:', err);
  process.exit(1);
});
