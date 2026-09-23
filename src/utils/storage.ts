import { AppConfig, Client, ProductionJob } from '../types';
import { calcularVencimiento, hoyISO } from './dateCalculations';

export const DEFAULT_CONFIG: AppConfig = {
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
    { nombre: 'Archivado', color: '#94a3b8', bgColor: '#f8fafc', esFinal: true },
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
    'NAS://Produccion/2025/Impresion/',
    'NAS://Produccion/2025/Kits/',
    'Nube Drive / Proyectos Taller',
    'PC Taller Plotter 1',
    'PC Taller CNC',
    'Pendiente de recepción de archivos',
  ],
  festivos: ['2025-01-01', '2025-01-06', '2025-04-18', '2025-05-01', '2025-08-15', '2025-10-12', '2025-11-01', '2025-12-06', '2025-12-25'],
  parametros: {
    prefijoId: 'PRD-',
    umbralAvisoDias: 7,
    usarDiasLaborables: true,
    diasProduccionPorDefecto: 5,
    ordenPorDefecto: 'diasRestantes',
    pinAdmin: '1234',
    empresaNombre: 'MEB Estudio Gráfico',
    empresaSubtitulo: 'Taller de Fabricación, Impresión Digital y Acabados',
  },
};

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'CLI-001',
    nombre: 'Carlos Mendoza',
    empresa: 'Retail Solutions Iberia',
    telefono: '+34 612 345 678',
    email: 'carlos.m@retailsolutions.com',
    direccion: 'Polígono Industrial Las Palmeras, Nave 12, Madrid',
    nifCif: 'B-87654321',
    notas: 'Cliente prioritario. Siempre exige laminado mate y empaque reforzado.',
    fechaAlta: '2025-01-10',
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
    fechaAlta: '2025-02-01',
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
    fechaAlta: '2025-02-15',
  },
];

export function generateSampleJobs(clients: Client[], config: AppConfig): ProductionJob[] {
  const hoy = hoyISO();
  const c1 = clients[0]?.nombre || 'Retail Solutions Iberia';
  const c1Id = clients[0]?.id || 'CLI-001';
  const c2 = clients[1]?.nombre || 'Señalética & Franquicias Express';
  const c2Id = clients[1]?.id || 'CLI-002';
  const c3 = clients[2]?.nombre || 'Stand Design & Eventos Globales';
  const c3Id = clients[2]?.id || 'CLI-003';

  return [
    {
      id: 'PRD-0001',
      kit: 'Kit Rótulo Corpóreo Retroiluminado',
      tipo: 'Kit Completo',
      clienteId: c1Id,
      clienteNombre: c1,
      modelo: 'LUMINA-PRO-120',
      numSerie: 'SN-2025-0891',
      codigoKit: 'KIT-ROT-LUM-01',
      cantidad: 2,
      material: 'Aluminio Dibond 3mm',
      tipoVinilo: 'Vinilo Traslúcido / Backlight',
      dimensiones: '2400 x 600 mm',
      maquina: 'Mimaki JFX200 UV Mesa Plana',
      ubicacionArchivos: 'NAS://Produccion/2025/Kits/PRD-0001-LUMINA/',
      metodoEntrega: 'Transporte propio / Reparto local',
      prioridad: 'Urgente',
      estado: 'En producción',
      postprocesados: ['Troquelado de forma personalizada', 'Canteado y pulido de cantos', 'Embalaje reforzado en caja individual'],
      fechaInicio: hoy,
      diasAsignados: 3,
      fechaVencimiento: calcularVencimiento(hoy, 3, config.festivos),
      avance: 45,
      responsable: 'Operador 1 - Taller Impresión',
      notas: 'Verificar alineación de LED perimetrales y prueba de luz antes del cierre.',
      fechaCreacion: hoy,
    },
    {
      id: 'PRD-0002',
      kit: 'PLV Display Mostrador Desmontable',
      tipo: 'Kit Completo',
      clienteId: c2Id,
      clienteNombre: c2,
      modelo: 'DISP-DESK-M3',
      numSerie: 'SN-2025-0892',
      codigoKit: 'KIT-PLV-FOAM-50',
      cantidad: 50,
      material: 'Forex PVC 5mm',
      tipoVinilo: 'Polimérico Alta Adherencia',
      dimensiones: '450 x 300 x 200 mm',
      maquina: 'Mesa de Corte Digital Kongsberg C',
      ubicacionArchivos: 'NAS://Produccion/2025/Impresion/PRD-0002-PLV/',
      metodoEntrega: 'Envío paletizado / Agencia estándar',
      prioridad: 'Alta',
      estado: 'Postprocesado',
      postprocesados: ['Corte recto a sangre', 'Laminado protector mate', 'Plegado / Hendido térmico'],
      fechaInicio: hoy,
      diasAsignados: 5,
      fechaVencimiento: calcularVencimiento(hoy, 5, config.festivos),
      avance: 80,
      responsable: 'Operador 2 - Mesa de Corte',
      notas: 'Incluir instrucciones de montaje serigrafiadas en el sobre interior.',
      fechaCreacion: hoy,
    },
    {
      id: 'PRD-0003',
      kit: 'Pancarta Microperforada Fachada',
      tipo: 'Producto Individual',
      clienteId: c3Id,
      clienteNombre: c3,
      modelo: 'MESH-EXTRA-W',
      numSerie: 'SN-2025-0893',
      codigoKit: 'LONA-EXT-03',
      cantidad: 1,
      material: 'Lona Microperforada Mesh',
      tipoVinilo: 'Sin vinilo / Impresión directa',
      dimensiones: '6000 x 3000 mm',
      maquina: 'HP Latex 365 (Gran Formato)',
      ubicacionArchivos: 'Nube Drive / Proyectos Taller/PRD-0003-MESH/',
      metodoEntrega: 'Instalación técnica in situ',
      prioridad: 'Media',
      estado: 'Control de calidad',
      postprocesados: ['Ollaos de policarbonato cada 50cm', 'Vaina perimetral superior e inferior', 'Confección con velcro adhesivo'],
      fechaInicio: hoy,
      diasAsignados: 4,
      fechaVencimiento: calcularVencimiento(hoy, 4, config.festivos),
      avance: 90,
      responsable: 'Operador 3 - Acabados y Montaje',
      notas: 'Comprobar refuerzo termosellado de las esquinas superiores.',
      fechaCreacion: hoy,
    },
    {
      id: 'PRD-0004',
      kit: 'Señalética de Seguridad Fotoluminiscente',
      tipo: 'Serie Corta',
      clienteId: c2Id,
      clienteNombre: c2,
      modelo: 'SIG-ISO-7010',
      numSerie: 'SN-2025-0894',
      codigoKit: 'KIT-SEN-EMERG',
      cantidad: 20,
      material: 'Aluminio Dibond 3mm',
      tipoVinilo: 'Monomérico Blanco Mate',
      dimensiones: '297 x 210 mm (A4)',
      maquina: 'Roland TrueVIS VG3-640 (Impresión y Corte)',
      ubicacionArchivos: 'PC Taller Plotter 1/PRD-0004-SEN/',
      metodoEntrega: 'Mensajería urgente 24h',
      prioridad: 'Baja',
      estado: 'Pendiente',
      postprocesados: ['Corte recto a sangre', 'Laminado protector mate'],
      fechaInicio: hoy,
      diasAsignados: 7,
      fechaVencimiento: calcularVencimiento(hoy, 7, config.festivos),
      avance: 10,
      responsable: 'Sin asignar',
      notas: 'Normativa UNE-23035 categoría A.',
      fechaCreacion: hoy,
    },
  ];
}

const STORAGE_KEYS = {
  CONFIG: 'gp_prod_config_v2',
  CLIENTS: 'gp_prod_clients_v2',
  JOBS: 'gp_prod_jobs_v2',
  STATION: 'gp_prod_station_v2',
};

export function loadStoredData(): {
  config: AppConfig;
  clients: Client[];
  jobs: ProductionJob[];
} {
  let config: AppConfig = DEFAULT_CONFIG;
  let clients: Client[] = DEFAULT_CLIENTS;
  let jobs: ProductionJob[] = [];

  try {
    const rawConf = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (rawConf) {
      const parsed = JSON.parse(rawConf);
      config = {
        ...DEFAULT_CONFIG,
        ...parsed,
        parametros: { ...DEFAULT_CONFIG.parametros, ...(parsed.parametros || {}) },
      };
      if (!config.parametros.empresaNombre || config.parametros.empresaNombre === 'PRODUCCIÓN GRÁFICA & KITS S.L.') {
        config.parametros.empresaNombre = 'MEB Estudio Gráfico';
      }
    }
  } catch (e) {
    console.warn('Error reading config from localStorage', e);
  }

  try {
    const rawClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (rawClients) {
      clients = JSON.parse(rawClients);
    }
  } catch (e) {
    console.warn('Error reading clients from localStorage', e);
  }

  try {
    const rawJobs = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (rawJobs) {
      jobs = JSON.parse(rawJobs);
    } else {
      jobs = generateSampleJobs(clients, config);
    }
  } catch (e) {
    console.warn('Error reading jobs from localStorage', e);
    jobs = generateSampleJobs(clients, config);
  }

  return { config, clients, jobs };
}

export function saveAllData(config: AppConfig, clients: Client[], jobs: ProductionJob[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

export function exportFullBackupJSON(config: AppConfig, clients: Client[], jobs: ProductionJob[]) {
  const data = {
    app: 'GestionProduccionInterna',
    version: '2.0',
    timestamp: new Date().toISOString(),
    config,
    clients,
    jobs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-produccion-${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJobsToCSV(jobs: ProductionJob[]) {
  const headers = [
    'ID',
    'Kit / Producto',
    'Tipo',
    'Cliente',
    'Modelo',
    'Nº Serie',
    'Código Kit',
    'Cantidad',
    'Material',
    'Tipo de Vinilo',
    'Dimensiones',
    'Máquina',
    'Prioridad',
    'Estado',
    'Postprocesados',
    'Método Entrega',
    'Ubicación Archivos',
    'Responsable',
    'Fecha Inicio',
    'Días Asignados',
    'Fecha Vencimiento',
    'Avance (%)',
    'Notas',
  ];

  const rows = jobs.map((j) => [
    j.id,
    `"${(j.kit || '').replace(/"/g, '""')}"`,
    `"${(j.tipo || '').replace(/"/g, '""')}"`,
    `"${(j.clienteNombre || '').replace(/"/g, '""')}"`,
    `"${(j.modelo || '').replace(/"/g, '""')}"`,
    `"${(j.numSerie || '').replace(/"/g, '""')}"`,
    `"${(j.codigoKit || '').replace(/"/g, '""')}"`,
    j.cantidad,
    `"${(j.material || '').replace(/"/g, '""')}"`,
    `"${(j.tipoVinilo || '').replace(/"/g, '""')}"`,
    `"${(j.dimensiones || '').replace(/"/g, '""')}"`,
    `"${(j.maquina || '').replace(/"/g, '""')}"`,
    j.prioridad,
    j.estado,
    `"${(j.postprocesados || []).join('; ').replace(/"/g, '""')}"`,
    `"${(j.metodoEntrega || '').replace(/"/g, '""')}"`,
    `"${(j.ubicacionArchivos || '').replace(/"/g, '""')}"`,
    `"${(j.responsable || '').replace(/"/g, '""')}"`,
    j.fechaInicio,
    j.diasAsignados,
    j.fechaVencimiento,
    j.avance,
    `"${(j.notas || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `listado-produccion-${hoyISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
