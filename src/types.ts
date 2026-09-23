export type SemaphoreStatus = 'Vencido' | 'Próximo a vencer' | 'En curso' | 'Sin fecha' | 'Archivado';

export type ThemeMode = 'light' | 'dark';

export interface PriorityOption {
  nombre: string;
  color: string;
  peso: number;
}

export interface StatusOption {
  nombre: string;
  color: string;
  bgColor: string;
  esFinal?: boolean;
}

export interface Client {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  direccion: string;
  nifCif?: string;
  notas?: string;
  fechaAlta: string;
}

export interface ProductionJob {
  id: string;                 // e.g. "PRD-0001" or "KIT-0001"
  kit: string;                // Product / Kit name (Producto o Kit)
  tipo: string;               // Kit, Producto, Prototipo, etc.
  clienteId: string;          // Associated client ID
  clienteNombre: string;      // Denormalized client name for quick search/export
  modelo: string;             // Model (Modelo)
  numSerie: string;           // Serial number (Nº de Serie)
  codigoKit: string;          // Kit code / SKU (Código Kit / Ref. SKU)
  cantidad: number;           // Quantity (Cantidad)
  material: string;           // Material (Forex, Dibond, Acrílico, etc.)
  tipoVinilo: string;         // Vinyl type (Monomérico, Polimérico, etc.)
  dimensiones: string;        // Dimensions (e.g. 1200 x 800 mm)
  maquina: string;            // Machine (Roland, Mimaki, HP Latex, etc.)
  ubicacionArchivos: string;  // File location (Ruta en red, NAS, etc.)
  metodoEntrega: string;      // Delivery method (Recogida, Mensajería, etc.)
  prioridad: string;          // Baja, Media, Alta, Urgente
  estado: string;             // Pendiente, En producción, Terminado, etc.
  postprocesados: string[];   // Selected post-processing options
  fechaInicio: string;        // YYYY-MM-DD
  diasAsignados: number;      // Assigned production days
  fechaVencimiento: string;   // YYYY-MM-DD (auto-calculated or overridden)
  avance: number;             // 0 - 100%
  responsable: string;        // Assigned operator or workstation
  notas: string;              // Technical notes & production comments
  fechaCreacion: string;      // YYYY-MM-DD
  fechaArchivo?: string;      // YYYY-MM-DD
  // Campos técnicos de taller y rotulación MEB
  color?: string;             // Color principal / referencia
  capaBlanca?: boolean;       // Tinta blanca UV / base
  laqueado?: boolean;         // Tratamiento de laca protectora
  laminado?: boolean;         // Película de laminación
  impresionUV?: boolean;      // Impresión directa UV
  barnizado?: boolean;        // Barniz selectivo / brillo
  nombreArchivo?: string;     // Nombre del archivo de diseño (ej: diseno.ai)
  rutaArchivo?: string;       // Ruta compartida en red Windows (ej: \\MEB-SERVER\Trabajos\...)
  retiroPorCliente?: boolean; // Retiro directo en taller
  fechaModificacion?: string; // Fecha y hora de último cambio
  estadosSeleccionados?: string[]; // Fases/estados tildados en la planilla de taller
  fechaEmision?: string;      // Fecha de emisión personalizada para la planilla
  empresaNombre?: string;     // Nombre de empresa / encabezado personalizado
  firmaOperador?: string;     // Nombre o firma del operador
  fechaOperador?: string;     // Fecha firma operador
  firmaControl?: string;      // Nombre o firma de control de calidad
  controlConforme?: boolean;  // Estado conforme de control de calidad
  firmaEntrega?: string;      // Nombre de quien entrega o retira
  fechaEntrega?: string;      // Fecha de entrega o retiro
}

export interface AppConfig {
  estados: StatusOption[];
  prioridades: PriorityOption[];
  materiales: string[];
  tiposVinilo: string[];
  maquinas: string[];
  metodosEntrega: string[];
  postprocesados: string[];
  responsables: string[];
  tipos: string[];
  ubicaciones: string[];
  festivos: string[];
  parametros: {
    prefijoId: string;
    umbralAvisoDias: number;
    usarDiasLaborables: boolean;
    diasProduccionPorDefecto: number;
    ordenPorDefecto: string;
    pinAdmin: string;
    empresaNombre: string;
    empresaSubtitulo: string;
  };
}

export interface JobCalculation {
  enProdN: number | null;
  enProdLab: number | null;
  enProduccionTxt: string;
  diasRestantes: number | null;
  diasLabRestantes: number | null;
  restantesTxt: string;
  semaforo: SemaphoreStatus;
  claseSemaforo: string;
  claseFila: string;
  colorRestantes: string;
  avance: number;
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
  isAdmin: boolean;
  loginTime?: string;
}

export interface StoredUserAccount {
  username: string;
  displayName: string;
  passwordHash: string; // Stored password or hash
  role: UserRole;
  email?: string;
  securityAnswer?: string;
  createdAt: string;
}

