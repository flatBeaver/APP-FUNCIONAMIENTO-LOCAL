import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  HardDrive,
  Sun,
  Moon,
  Cloud,
  LogIn,
  LogOut,
  KeyRound,
  Database,
  Crown,
  HardHat
} from 'lucide-react';
import { AppConfig, ProductionJob, ThemeMode, AuthUser } from '../types';
import { exportJobsToCSV } from '../utils/storage';
import { MebLogo } from './MebLogo';
import { PlanningModal } from './PlanningModal';

interface HeaderProps {
  config: AppConfig;
  jobs: ProductionJob[];
  onOpenNewJob: () => void;
  activeTab: 'principal' | 'clientes' | 'config' | 'ayuda';
  setActiveTab: (tab: 'principal' | 'clientes' | 'config' | 'ayuda') => void;
  lastSavedTime: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenWelcome: () => void;
  operatorName: string;
  onUpdateOperatorName: (name: string) => void;
  onOpenCloudBackups: () => void;
  onOpenServerBackups?: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  jobs,
  onOpenNewJob,
  activeTab,
  setActiveTab,
  lastSavedTime,
  theme,
  onToggleTheme,
  onOpenWelcome,
  operatorName,
  onUpdateOperatorName,
  onOpenCloudBackups,
  onOpenServerBackups,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [isEditingOperator, setIsEditingOperator] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);

  const handlePrintPlanning = () => {
    setIsPlanningModalOpen(true);
  };

  const handleExportCSV = () => {
    exportJobsToCSV(jobs);
  };

  return (
    <header className="backdrop-blur-[8px] bg-black/90 dark:bg-black/80 text-white border-b border-neutral-800/80 shadow-xl sticky top-0 z-30 transition-all">
      {/* Top Banner: Workstation, Security Notice & Firebase Authentication */}
      <div className="bg-neutral-950/80 backdrop-blur-md px-4 sm:px-6 py-1.5 border-b border-neutral-900/80 text-xs flex flex-wrap items-center justify-between gap-2 text-neutral-400">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 text-red-400 border border-red-950/80 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Acceso Interno Autorizado
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          
          {/* Operador de Turno / Nombre de puesto */}
          <div className="flex items-center gap-1 text-neutral-300">
            <UserCheck className="w-3.5 h-3.5 text-red-500" />
            {isEditingOperator ? (
              <input
                type="text"
                value={operatorName}
                onChange={(e) => onUpdateOperatorName(e.target.value)}
                onBlur={() => setIsEditingOperator(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingOperator(false)}
                autoFocus
                className="bg-neutral-900 text-white px-1.5 py-0.5 rounded border border-red-600 text-xs outline-none"
              />
            ) : (
              <button
                onClick={() => setIsEditingOperator(true)}
                className="hover:text-white underline decoration-dashed cursor-pointer font-medium"
                title="Haga clic para cambiar el nombre del puesto u operador"
              >
                {operatorName}
              </button>
            )}
          </div>

          <span className="text-neutral-600 hidden md:inline">•</span>
          <span className="text-neutral-400 font-mono hidden md:inline">Nodo: Workstation-{window.location.hostname || 'Local'}</span>
        </div>

        {/* Firebase Authentication & Cloud State */}
        <div className="flex items-center flex-wrap gap-2.5">
          {currentUser ? (
            <div className={`flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] border ${
              currentUser.isAdmin 
                ? 'bg-red-950/50 border-red-800/80 text-red-300 font-bold' 
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 font-medium'
            }`}>
              {currentUser.isAdmin ? (
                <Crown className="w-3.5 h-3.5 text-red-400 shrink-0" />
              ) : (
                <HardHat className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="max-w-[140px] truncate" title={currentUser.username}>
                {currentUser.displayName || currentUser.username}
                {currentUser.isAdmin && ' (Admin)'}
              </span>
              <button
                onClick={onLogout}
                className="text-neutral-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer ml-1"
                title="Cerrar sesión activa"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              id="btn-login-header"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-600/60 px-2.5 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
              title="Iniciar sesión con usuario y contraseña"
            >
              <KeyRound className="w-3 h-3 text-red-500" />
              <span className="font-semibold text-neutral-200">Acceso / Login</span>
            </button>
          )}

          {/* SQLite y Firebase solo para el Administrador (lauti) */}
          {currentUser?.isAdmin && onOpenServerBackups && (
            <button
              onClick={onOpenServerBackups}
              id="btn-header-sqlite-server"
              className="inline-flex items-center gap-1.5 text-neutral-200 hover:text-white text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-600 px-2.5 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
              title="Panel Admin: Servidor MEB y copias de seguridad SQLite"
            >
              <Database className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-neutral-200">SQLite Red Local</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          {currentUser?.isAdmin && (
            <button
              onClick={onOpenCloudBackups}
              id="btn-header-firebase-status"
              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-[11px] bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-red-600/50 px-2.5 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
              title="Panel Admin: Copias de seguridad y sincronización en la nube Firebase"
            >
              <Cloud className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-neutral-200">Firebase Nube</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          <span className="flex items-center gap-1 text-neutral-400 font-mono text-[11px] hidden sm:inline-flex">
            <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
            {lastSavedTime ? `Guardado ${lastSavedTime}` : 'Guardado local'}
          </span>
          <span className="inline-flex items-center gap-1 text-neutral-400 text-[11px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded hidden lg:inline-flex">
            <ShieldCheck className="w-3 h-3 text-neutral-500" />
            No indexable
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenWelcome}
              id="meb-logo-container"
              className="w-10 h-10 rounded-xl bg-black border border-neutral-800 hover:border-red-600/70 flex items-center justify-center p-1 shadow-lg shadow-black/80 transition-all group cursor-pointer"
              title="Abrir página de inicio y aviso del sistema"
            >
              <MebLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-red-600 flex items-center gap-2">
                  MEB Estudio Gráfico
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block shadow-xs shadow-red-500/50"></span>
                </h1>
                <button
                  onClick={onOpenWelcome}
                  className="text-[10px] text-neutral-400 hover:text-white underline decoration-dotted cursor-pointer hidden sm:inline-block ml-1"
                  title="Ver aviso y descripción del sistema"
                >
                  [Inicio / Info]
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                {config.parametros.empresaSubtitulo || 'Kits y productos individuales · Parámetros técnicos, plazos y órdenes de taller'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón de Cambio de Tema (Oscuro / Claro) */}
          <button
            onClick={onToggleTheme}
            id="btn-cambiar-tema-header"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-red-900/60 transition-colors shadow-sm cursor-pointer"
            title={
              theme === 'dark'
                ? 'Tema actual: Oscuro. Clic para cambiar a Claro'
                : 'Tema actual: Claro. Clic para cambiar a Oscuro'
            }
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Claro</span>
              </>
            )}
          </button>

          {/* Botón Acceso / Autenticación Firebase */}
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              id="btn-iniciar-sesion-header-principal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-red-600/60 transition-colors shadow-sm cursor-pointer"
              title="Iniciar sesión en Firebase con usuario y contraseña"
            >
              <LogIn className="w-3.5 h-3.5 text-red-500" />
              <span>Acceso Taller</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors shadow-sm cursor-pointer"
              title="Cerrar sesión activa"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}

          {/* Botón Firebase solo para Administrador */}
          {currentUser?.isAdmin && (
            <button
              onClick={onOpenCloudBackups}
              id="btn-abrir-firebase-modal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-red-400 hover:text-white border border-neutral-800 hover:border-red-600/50 transition-colors shadow-sm cursor-pointer"
              title="Copias de seguridad y sincronización de base de datos en Firebase"
            >
              <Cloud className="w-3.5 h-3.5 text-red-500" />
              <span>Firebase / Nube</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors shadow-sm"
            title="Exportar base de datos a archivo CSV para Excel"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintPlanning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-red-900/40 transition-colors shadow-sm"
            title="Generar PDF resumen del planning de trabajo para el taller"
          >
            <Printer className="w-3.5 h-3.5 text-red-500" />
            <span>PDF Planning</span>
          </button>

          {/* Solo el Administrador (lauti) puede dar de alta nuevos trabajos */}
          {currentUser?.isAdmin && (
            <button
              onClick={onOpenNewJob}
              id="btn-nuevo-trabajo"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 border border-red-500/50 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nuevo Trabajo
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="px-4 sm:px-6 flex items-center gap-1 border-t border-neutral-900 bg-neutral-950 overflow-x-auto">
        <button
          onClick={() => setActiveTab('principal')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'principal'
              ? 'border-red-600 text-white bg-neutral-900/90 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
          }`}
        >
          Hoja Principal de Trabajos
        </button>

        {/* Clientes y Configuración solo accesibles para el Administrador (lauti) */}
        {currentUser?.isAdmin && (
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'clientes'
                ? 'border-red-600 text-white bg-neutral-900/90 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
            }`}
          >
            Clientes y Empresas
          </button>
        )}

        {currentUser?.isAdmin && (
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'config'
                ? 'border-red-600 text-white bg-neutral-900/90 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
            }`}
          >
            Configuración y Parámetros
          </button>
        )}

        <button
          onClick={() => setActiveTab('ayuda')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'ayuda'
              ? 'border-red-600 text-white bg-neutral-900/90 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
          }`}
        >
          Fórmulas y Ayuda de Taller
        </button>

        {/* Indicador de Modo en la barra de navegación */}
        <div className="ml-auto hidden md:flex items-center pr-2">
          {currentUser?.isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-950/60 border border-red-800/80 text-red-300">
              <Crown className="w-3.5 h-3.5 text-red-400" />
              <span>Modo Administrador Total</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-400">
              <HardHat className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Taller Limpio</span>
            </span>
          )}
        </div>
      </nav>

      {/* Panel de Exportación y Previsualización de Planning PDF */}
      <PlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        jobs={jobs}
        config={config}
      />
    </header>
  );
};
