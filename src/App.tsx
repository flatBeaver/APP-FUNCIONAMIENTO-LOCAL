/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, Client, ProductionJob, ThemeMode, AuthUser } from './types';
import { 
  loadStoredData, 
  saveAllData, 
  generateSampleJobs, 
  DEFAULT_CONFIG, 
  DEFAULT_CLIENTS 
} from './utils/storage';
import { calcularJob, hoyISO } from './utils/dateCalculations';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { JobTable } from './components/JobTable';
import { JobModal } from './components/JobModal';
import { JobDetailModal } from './components/JobDetailModal';
import { ClientsManager } from './components/ClientsManager';
import { ConfigSection } from './components/ConfigSection';
import { HelpSection } from './components/HelpSection';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CloudBackupModal } from './components/CloudBackupModal';
import { ServerBackupModal } from './components/ServerBackupModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmDeleteModal, ConfirmDeleteData } from './components/ConfirmDeleteModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { testConnection, subscribeToAuth, extractUsernameFromEmail } from './firebase';
import { getCurrentAuthUser, setCurrentAuthUser, logoutUserSession } from './auth';
import {
  apiGetJobs,
  apiCreateJob,
  apiUpdateJob,
  apiDeleteJob,
  apiGetClients,
  apiCreateClient,
  apiUpdateClient,
  apiDeleteClient,
  apiGetConfig,
  apiSaveConfig,
} from './api';

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [clients, setClients] = useState<Client[]>(DEFAULT_CLIENTS);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // In-app Confirmation and Notification States (evita bloqueos de iframe con window.confirm/alert)
  const [confirmModalData, setConfirmModalData] = useState<ConfirmDeleteData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subscribe to Auth state changes
  useEffect(() => {
    const local = getCurrentAuthUser();
    if (local) {
      setCurrentUser(local);
      if (local.displayName) {
        setOperatorName(local.displayName);
      }
    }

    const unsubscribe = subscribeToAuth((fbUser) => {
      if (fbUser) {
        const currentLocal = getCurrentAuthUser();
        if (!currentLocal) {
          const username = fbUser.email ? extractUsernameFromEmail(fbUser.email) : 'operador';
          const isLauti = username.toLowerCase() === 'lauti';
          const authUser: AuthUser = {
            username,
            displayName: fbUser.displayName || username,
            role: isLauti ? 'admin' : 'user',
            isAdmin: isLauti,
            email: fbUser.email || undefined,
            loginTime: new Date().toISOString(),
          };
          setCurrentUser(authUser);
          setCurrentAuthUser(authUser);
          if (authUser.displayName) {
            setOperatorName(authUser.displayName);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Cierre de sesión unificado
  const handleLogout = async () => {
    await logoutUserSession();
    setCurrentUser(null);
  };

  // Theme state ('dark' or 'light')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('meb_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Modo oscuro por defecto acorde a la marca
  });

  // Welcome / Splash screen state (inicia abierto al abrir la app)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  // Operator name state (persists across sessions)
  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem('meb_operator') || 'Operador 1 - Taller Principal';
  });

  useEffect(() => {
    if (operatorName) {
      localStorage.setItem('meb_operator', operatorName);
    }
  }, [operatorName]);

  // Synchronize theme with HTML document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('meb_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'principal' | 'clientes' | 'config' | 'ayuda'>('principal');

  // Modals state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ProductionJob | null>(null);
  const [detailJob, setDetailJob] = useState<ProductionJob | null>(null);
  const [isCloudBackupModalOpen, setIsCloudBackupModalOpen] = useState(false);
  const [isServerBackupModalOpen, setIsServerBackupModalOpen] = useState(false);

  // Filters state
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [semaphoreFilter, setSemaphoreFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('diasRestantes');
  const [showArchived, setShowArchived] = useState(false);

  // Carga inicial: Conectar con SQLite y asegurar persistencia
  const loadFromBackend = async () => {
    try {
      const [backendConfig, backendClients, backendJobs] = await Promise.all([
        apiGetConfig().catch(() => null),
        apiGetClients().catch(() => null),
        apiGetJobs().catch(() => null),
      ]);

      if (backendConfig) {
        setConfig(backendConfig);
      }
      if (backendClients && backendClients.length > 0) {
        setClients(backendClients);
      }
      if (backendJobs && backendJobs.length > 0) {
        setJobs(backendJobs);
      }
      setDataLoaded(true);
      setLastSavedTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('SQLite no disponible en este momento, utilizando almacenamiento local de respaldo:', err);
      const loaded = loadStoredData();
      setConfig(loaded.config);
      setClients(loaded.clients);
      setJobs(loaded.jobs);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    loadFromBackend();

    // Test Firebase connection silently in background
    testConnection().then((connected) => {
      if (connected) {
        console.log('Firebase Firestore online y listo para persistencia secundaria.');
      }
    });
  }, []);

  // Sincronización continua de red local (multi-usuario para 5-10 puestos de MEB)
  useEffect(() => {
    const syncLan = async () => {
      try {
        const [latestJobs, latestClients] = await Promise.all([
          apiGetJobs().catch(() => null),
          apiGetClients().catch(() => null),
        ]);
        if (latestJobs) {
          setJobs((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(latestJobs)) {
              return latestJobs;
            }
            return prev;
          });
        }
        if (latestClients) {
          setClients((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(latestClients)) {
              return latestClients;
            }
            return prev;
          });
        }
      } catch (e) {
        // Ignorar interrupciones momentáneas de red
      }
    };

    // Polling cada 8 segundos para reflejar cambios de otros puestos
    const interval = setInterval(syncLan, 8000);
    const onFocus = () => syncLan();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Guardar copia local de respaldo offline
  useEffect(() => {
    if (!dataLoaded) return;
    saveAllData(config, clients, jobs);
    setLastSavedTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
  }, [config, clients, jobs, dataLoaded]);

  // Generador de ID para nuevos trabajos
  const getNextJobId = (): string => {
    const prefix = config.parametros.prefijoId || 'PRD-';
    let max = 0;
    jobs.forEach((j) => {
      const match = String(j.id || '').match(/(\d+)\s*$/);
      if (match) {
        max = Math.max(max, parseInt(match[1], 10));
      }
    });
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  };

  // Proteger pestañas administrativas (Clientes y Configuración) para usuarios no administradores
  useEffect(() => {
    if (!currentUser?.isAdmin && (activeTab === 'clientes' || activeTab === 'config')) {
      setActiveTab('principal');
    }
  }, [currentUser, activeTab]);

  // Crear o actualizar trabajo en SQLite
  const handleSaveJob = async (jobData: ProductionJob) => {
    if (editingJob) {
      const updatedJob = { ...jobData, id: editingJob.id, fechaModificacion: new Date().toISOString() };
      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? updatedJob : j)));
      try {
        await apiUpdateJob(editingJob.id, updatedJob);
      } catch (err) {
        console.error('Error guardando en SQLite:', err);
      }
    } else {
      if (!currentUser?.isAdmin) {
        addToast('error', 'Solo el administrador "lauti" puede dar de alta nuevos trabajos de producción.');
        return;
      }
      const newJob: ProductionJob = {
        ...jobData,
        id: getNextJobId(),
        fechaCreacion: hoyISO(),
        fechaModificacion: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      try {
        await apiCreateJob(newJob);
      } catch (err) {
        console.error('Error creando en SQLite:', err);
      }
    }
  };

  // Actualización rápida de campo (ej. estado o casillas en tabla)
  const handleUpdateJobField = (id: string, field: keyof ProductionJob, value: any) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: value } : j))
    );
    apiUpdateJob(id, { [field]: value }).catch((err) => {
      console.error('Error actualizando campo en SQLite:', err);
    });
  };

  // Actualización directa de trabajo completo (usado desde la planilla interactiva de taller)
  const handleUpdateJobDirectly = async (updatedJob: ProductionJob) => {
    const withMod = { ...updatedJob, fechaModificacion: new Date().toISOString() };
    setJobs((prev) => prev.map((j) => (j.id === withMod.id ? withMod : j)));
    if (detailJob?.id === withMod.id) {
      setDetailJob(withMod);
    }
    try {
      await apiUpdateJob(withMod.id, withMod);
    } catch (err) {
      console.error('Error actualizando trabajo desde la planilla:', err);
    }
  };

  // Duplicar trabajo (solo Admin)
  const handleDuplicateJob = async (id: string) => {
    if (!currentUser?.isAdmin) {
      addToast('error', 'Acción restringida: solo el administrador "lauti" puede duplicar trabajos.');
      return;
    }
    const original = jobs.find((j) => j.id === id);
    if (!original) return;
    const copy: ProductionJob = {
      ...original,
      id: getNextJobId(),
      kit: `${original.kit || ''} (Copia)`,
      estado: config.estados[0]?.nombre || 'Ingresado',
      fechaCreacion: hoyISO(),
      fechaArchivo: undefined,
      avance: 0,
      fechaModificacion: new Date().toISOString(),
    };
    setJobs((prev) => [copy, ...prev]);
    try {
      await apiCreateJob(copy);
      addToast('success', `Trabajo duplicado como ${copy.id}`);
    } catch (err) {
      console.error('Error duplicando en SQLite:', err);
    }
  };

  // Archivar / Desarchivar (solo Admin)
  const handleArchiveJob = (id: string) => {
    if (!currentUser?.isAdmin) {
      addToast('error', 'Acción restringida: solo el administrador "lauti" puede archivar trabajos.');
      return;
    }
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const isArchived = job.estado === 'Archivado';
    const nextState = isArchived ? config.estados[0]?.nombre || 'Ingresado' : 'Archivado';
    const nextFecha = isArchived ? undefined : hoyISO();

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        return {
          ...j,
          estado: nextState,
          fechaArchivo: nextFecha,
        };
      })
    );

    apiUpdateJob(id, {
      estado: nextState,
      fechaArchivo: nextFecha,
    }).catch(console.error);
  };

  // Eliminar trabajo permanentemente
  const handleDeleteJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    const jobName = job?.kit || id;
    const clientName = job?.clienteNombre || 'Sin cliente';

    setConfirmModalData({
      isOpen: true,
      type: 'job',
      id,
      title: `¿Eliminar trabajo ${id}?`,
      subtitle: `Se borrará permanentemente la orden de producción "${jobName}".`,
      details: [
        { label: 'Orden Nº', value: id },
        { label: 'Producto / Kit', value: jobName },
        { label: 'Cliente', value: clientName },
        { label: 'Cantidad', value: String(job?.cantidad || 1) },
      ],
      confirmLabel: 'Sí, Eliminar Trabajo',
      isDestructive: true,
      onConfirm: async () => {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        if (detailJob?.id === id) {
          setDetailJob(null);
        }
        try {
          await apiDeleteJob(id);
          addToast('success', `El trabajo ${id} (${jobName}) ha sido eliminado permanentemente de SQLite.`, 'Trabajo Eliminado');
        } catch (err: any) {
          console.error('Error eliminando de SQLite:', err);
          addToast('error', `Error al eliminar de SQLite: ${err.message || 'Error desconocido'}`);
        }
      },
    });
  };

  // Gestión de Clientes en SQLite
  const handleAddClient = async (newClient: Client) => {
    setClients((prev) => [...prev, newClient]);
    try {
      await apiCreateClient(newClient);
      addToast('success', `Cliente "${newClient.nombre}" creado exitosamente.`);
    } catch (err) {
      console.error('Error creando cliente en SQLite:', err);
      addToast('error', 'Error guardando cliente en la base de datos.');
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    setJobs((prev) =>
      prev.map((j) =>
        j.clienteId === updatedClient.id ? { ...j, clienteNombre: updatedClient.nombre } : j
      )
    );
    try {
      await apiUpdateClient(updatedClient.id, updatedClient);
      addToast('success', `Datos de "${updatedClient.nombre}" actualizados.`);
    } catch (err) {
      console.error('Error actualizando cliente en SQLite:', err);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const clientName = client?.nombre || clientId;

    setConfirmModalData({
      isOpen: true,
      type: 'client',
      id: clientId,
      title: `¿Eliminar cliente "${clientName}"?`,
      subtitle: 'El cliente se dará de baja del listado de contactos.',
      details: [
        { label: 'ID Cliente', value: clientId },
        { label: 'Nombre', value: clientName },
        { label: 'Empresa', value: client?.empresa || '—' },
        { label: 'Teléfono', value: client?.telefono || '—' },
      ],
      confirmLabel: 'Sí, Eliminar Cliente',
      isDestructive: true,
      onConfirm: async () => {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        try {
          await apiDeleteClient(clientId);
          addToast('success', `El cliente "${clientName}" ha sido eliminado del sistema.`, 'Cliente Eliminado');
        } catch (err: any) {
          console.error('Error eliminando cliente de SQLite:', err);
          addToast('error', `Error al eliminar cliente: ${err.message || 'Error desconocido'}`);
        }
      },
    });
  };

  const handleQuickCreateClient = (clientName: string): Client => {
    const newId = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
    const newClient: Client = {
      id: newId,
      nombre: clientName,
      empresa: '',
      telefono: '',
      email: '',
      direccion: '',
      fechaAlta: hoyISO(),
    };
    setClients((prev) => [...prev, newClient]);
    apiCreateClient(newClient).catch(console.error);
    return newClient;
  };

  // Filter by client directly from clients manager tab
  const handleFilterByClient = (clientName: string) => {
    setClientFilter(clientName);
    setActiveTab('principal');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setClientFilter('');
    setMachineFilter('');
    setPriorityFilter('');
    setSemaphoreFilter('');
    setDateFrom('');
    setDateTo('');
    setShowArchived(false);
    setSortBy(config.parametros.ordenPorDefecto || 'diasRestantes');
  };

  // Load sample data
  const handleLoadSampleData = () => {
    setConfirmModalData({
      isOpen: true,
      type: 'sampleData',
      title: '¿Cargar datos de prueba de ejemplo?',
      subtitle: 'Esto cargará órdenes y clientes demostrativos para el taller.',
      confirmLabel: 'Cargar Datos de Muestra',
      isDestructive: false,
      onConfirm: () => {
        const sampleClients = DEFAULT_CLIENTS;
        const sampleJobs = generateSampleJobs(sampleClients, config);
        setClients(sampleClients);
        setJobs(sampleJobs);
        addToast('info', 'Datos de prueba cargados en el sistema.', 'Muestra Cargada');
      },
    });
  };

  // Clear all data
  const handleClearAllData = () => {
    setConfirmModalData({
      isOpen: true,
      type: 'clearAll',
      title: '¿Borrar TODOS los trabajos y clientes?',
      subtitle: 'Esta acción limpiará todo el taller. Asegúrese de contar con un respaldo.',
      confirmLabel: 'Borrar Todo',
      isDestructive: true,
      onConfirm: () => {
        setJobs([]);
        setClients([]);
        addToast('error', 'Se han borrado todos los trabajos y clientes locales.', 'Datos Eliminados');
      },
    });
  };

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const list = jobs.filter((j) => {
      const isArchived = j.estado === 'Archivado';
      if (isArchived && !showArchived) return false;

      if (statusFilter && j.estado !== statusFilter) return false;
      if (clientFilter && j.clienteNombre !== clientFilter) return false;
      if (machineFilter && j.maquina !== machineFilter) return false;
      if (priorityFilter && j.prioridad !== priorityFilter) return false;

      if (dateFrom && (!j.fechaVencimiento || j.fechaVencimiento < dateFrom)) return false;
      if (dateTo && (!j.fechaVencimiento || j.fechaVencimiento > dateTo)) return false;

      const calc = calcularJob(j, config);
      if (semaphoreFilter && calc.semaforo !== semaphoreFilter) return false;

      if (query) {
        const textBlob = [
          j.id,
          j.kit,
          j.clienteNombre,
          j.modelo,
          j.numSerie,
          j.codigoKit,
          j.material,
          j.tipoVinilo,
          j.maquina,
          j.metodoEntrega,
          j.responsable,
          j.ubicacionArchivos,
          j.notas,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textBlob.includes(query)) return false;
      }

      return true;
    });

    // Sorting
    const priorityWeight = (p: string) => {
      const found = config.prioridades.find((x) => x.nombre === p);
      return found ? found.peso : 0;
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case 'vencimiento':
          return (a.fechaVencimiento || '9999-12-31').localeCompare(b.fechaVencimiento || '9999-12-31');
        case 'prioridad':
          return priorityWeight(b.prioridad) - priorityWeight(a.prioridad);
        case 'inicio':
          return (a.fechaInicio || '9999-12-31').localeCompare(b.fechaInicio || '9999-12-31');
        case 'estado':
          return (a.estado || '').localeCompare(b.estado || '', 'es');
        case 'kit':
          return (a.kit || '').localeCompare(b.kit || '', 'es');
        case 'cliente':
          return (a.clienteNombre || '').localeCompare(b.clienteNombre || '', 'es');
        case 'id':
          return (a.id || '').localeCompare(b.id || '', 'es');
        case 'diasRestantes':
        default: {
          const ca = calcularJob(a, config).diasRestantes;
          const cb = calcularJob(b, config).diasRestantes;
          const va = ca === null ? 999999 : ca;
          const vb = cb === null ? 999999 : cb;
          return va - vb;
        }
      }
    });

    return list;
  }, [
    jobs,
    searchText,
    statusFilter,
    clientFilter,
    machineFilter,
    priorityFilter,
    semaphoreFilter,
    dateFrom,
    dateTo,
    showArchived,
    sortBy,
    config,
  ]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-red-600 selection:text-white ${
      theme === 'dark' 
        ? 'bg-[#060606] text-neutral-100 bg-[radial-gradient(ellipse_85%_55%_at_50%_-10%,rgba(195,28,28,0.12),transparent_75%)]' 
        : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Header */}
      <Header
        config={config}
        jobs={jobs}
        onOpenNewJob={() => {
          setEditingJob(null);
          setIsJobModalOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastSavedTime={lastSavedTime}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        operatorName={operatorName}
        onUpdateOperatorName={setOperatorName}
        onOpenCloudBackups={() => setIsCloudBackupModalOpen(true)}
        onOpenServerBackups={() => setIsServerBackupModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 max-w-[1600px] w-full mx-auto">
        {/* Tab 1: Hoja Principal de Trabajos */}
        {activeTab === 'principal' && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <KpiCards
              jobs={jobs}
              config={config}
              selectedSemaforoFilter={semaphoreFilter}
              onSelectSemaforoFilter={(sem) => setSemaphoreFilter(sem)}
              showArchived={showArchived}
              onToggleShowArchived={() => setShowArchived(!showArchived)}
            />

            {/* Filter and Search Bar */}
            <FilterBar
              config={config}
              clients={clients}
              searchText={searchText}
              setSearchText={setSearchText}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              machineFilter={machineFilter}
              setMachineFilter={setMachineFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              semaphoreFilter={semaphoreFilter}
              setSemaphoreFilter={setSemaphoreFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              onResetFilters={handleResetFilters}
              totalFiltered={filteredJobs.length}
              totalJobs={jobs.length}
            />

            {/* Main Production Jobs Table */}
            <JobTable
              jobs={filteredJobs}
              config={config}
              onEditJob={(job) => {
                setEditingJob(job);
                setIsJobModalOpen(true);
              }}
              onDuplicateJob={handleDuplicateJob}
              onArchiveJob={handleArchiveJob}
              onDeleteJob={handleDeleteJob}
              onUpdateJobField={handleUpdateJobField}
              onViewWorkOrder={(job) => setDetailJob(job)}
              isAdmin={currentUser ? currentUser.isAdmin : true}
            />
          </div>
        )}

        {/* Tab 2: Clientes (Solo para el Administrador) */}
        {activeTab === 'clientes' && (currentUser ? currentUser.isAdmin : true) && (
          <ClientsManager
            clients={clients}
            jobs={jobs}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onFilterByClient={handleFilterByClient}
          />
        )}

        {/* Tab 3: Configuración (Solo para el Administrador) */}
        {activeTab === 'config' && (currentUser ? currentUser.isAdmin : true) && (
          <ConfigSection
            config={config}
            onSaveConfig={(updated) => {
              setConfig(updated);
              apiSaveConfig(updated).catch(console.error);
            }}
            clients={clients}
            jobs={jobs}
            onImportData={(imported) => {
              if (imported.config) {
                setConfig(imported.config);
                apiSaveConfig(imported.config).catch(console.error);
              }
              if (imported.clients) {
                setClients(imported.clients);
              }
              if (imported.jobs) {
                setJobs(imported.jobs);
              }
            }}
            onLoadSampleData={handleLoadSampleData}
            onClearAllData={handleClearAllData}
            onOpenCloudBackups={() => setIsCloudBackupModalOpen(true)}
          />
        )}

        {/* Tab 4: Fórmulas y Ayuda */}
        {activeTab === 'ayuda' && <HelpSection />}
      </main>

      {/* Footer */}
      <footer className={`border-t py-3.5 px-4 sm:px-6 text-xs text-center sm:flex sm:justify-between sm:items-center transition-colors ${
        theme === 'dark' 
          ? 'bg-black border-neutral-850 text-neutral-400' 
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div>
          <b className={theme === 'dark' ? 'text-neutral-200' : 'text-slate-800'}>
            {config.parametros.empresaNombre || 'Sistema de Producción'}
          </b> · Portal interno de fabricación y kits.
        </div>
        <div className={`mt-1 sm:mt-0 text-[11px] ${theme === 'dark' ? 'text-neutral-500' : 'text-slate-400'}`}>
          Datos almacenados de forma local y persistente en su estación de trabajo.
        </div>
      </footer>

      {/* Welcome / Landing Screen on app startup or when opened */}
      {isWelcomeOpen && (
        <WelcomeScreen
          onEnter={() => setIsWelcomeOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          operatorName={operatorName}
          onUpdateOperatorName={setOperatorName}
          currentUser={currentUser}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user?.displayName) {
              setOperatorName(user.displayName);
            }
          }}
          onLogoutSuccess={handleLogout}
        />
      )}

      {/* New / Edit Job Modal */}
      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
        initialJob={editingJob}
        config={config}
        clients={clients}
        onQuickCreateClient={handleQuickCreateClient}
        isAdmin={!!currentUser?.isAdmin}
      />

      {/* Work Order / Traveler Slip Detail Modal */}
      <JobDetailModal
        job={detailJob}
        config={config}
        onClose={() => setDetailJob(null)}
        onEdit={(job) => {
          setEditingJob(job);
          setIsJobModalOpen(true);
        }}
        onUpdateJob={handleUpdateJobDirectly}
        onDeleteJob={handleDeleteJob}
      />

      {/* Firebase Cloud Backups & Persistence Modal */}
      <CloudBackupModal
        isOpen={isCloudBackupModalOpen}
        onClose={() => setIsCloudBackupModalOpen(false)}
        jobs={jobs}
        clients={clients}
        config={config}
        operatorName={operatorName}
        onRestoreData={(restored) => {
          if (restored.jobs) setJobs(restored.jobs);
          if (restored.clients) setClients(restored.clients);
          if (restored.config) setConfig(restored.config);
        }}
      />

      {/* SQLite Server Local Network & Hot Backups Modal */}
      <ServerBackupModal
        isOpen={isServerBackupModalOpen}
        onClose={() => setIsServerBackupModalOpen(false)}
        onRestoreData={() => {
          loadFromBackend();
        }}
      />

      {/* Firebase Authentication Modal (Login / Registro / Recuperación) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user?.displayName) {
            setOperatorName(user.displayName);
          } else if (user?.email) {
            const namePart = user.email.split('@')[0];
            setOperatorName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
          }
        }}
      />

      {/* Modal de confirmación estilizado para eliminar trabajos, clientes o datos */}
      <ConfirmDeleteModal
        data={confirmModalData}
        onClose={() => setConfirmModalData(null)}
      />

      {/* Notificaciones Toast flotantes no bloqueantes */}
      <ToastNotification
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}
