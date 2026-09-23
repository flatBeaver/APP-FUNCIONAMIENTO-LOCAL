import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal 
} from 'lucide-react';
import { AppConfig, Client } from '../types';

interface FilterBarProps {
  config: AppConfig;
  clients: Client[];
  searchText: string;
  setSearchText: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  clientFilter: string;
  setClientFilter: (v: string) => void;
  machineFilter: string;
  setMachineFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  semaphoreFilter: string;
  setSemaphoreFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalJobs: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  config,
  clients,
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  machineFilter,
  setMachineFilter,
  priorityFilter,
  setPriorityFilter,
  semaphoreFilter,
  setSemaphoreFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  sortBy,
  setSortBy,
  showArchived,
  setShowArchived,
  onResetFilters,
  totalFiltered,
  totalJobs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    Boolean(searchText),
    Boolean(statusFilter),
    Boolean(clientFilter),
    Boolean(machineFilter),
    Boolean(priorityFilter),
    Boolean(semaphoreFilter),
    Boolean(dateFrom),
    Boolean(dateTo),
    showArchived,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-3 sm:p-3.5 mb-4 shadow-xl shadow-black/30 transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Title, Count & Active Badge */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 text-left group cursor-pointer"
            aria-expanded={isExpanded}
            title={isExpanded ? 'Ocultar filtros avanzados' : 'Expandir filtros avanzados'}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isExpanded || hasActiveFilters ? 'bg-neutral-950 text-red-500 border border-neutral-800 shadow-xs' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 group-hover:bg-slate-200 dark:group-hover:bg-neutral-700'}`}>
              <Filter className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 group-hover:text-red-600 transition-colors">
              Filtros de Búsqueda
            </span>
          </button>

          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            (Mostrando <b className="text-slate-900 dark:text-neutral-100">{totalFiltered}</b> de {totalJobs})
          </span>

          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/30 text-red-600 dark:text-red-400 border border-red-900/40">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
        </div>

        {/* Quick Search + Actions + Expand Toggle */}
        <div className="flex items-center flex-wrap gap-2 ml-auto">
          {/* Quick Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar trabajo o kit..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-black focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                title="Borrar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 rounded-lg font-medium transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}

          {/* Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isExpanded
                ? 'bg-black text-white border-neutral-900 hover:bg-neutral-900 shadow-xs'
                : 'bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-neutral-700'
            }`}
            aria-expanded={isExpanded}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
            <span>{isExpanded ? 'Ocultar filtros' : 'Expandir filtros'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Pills (Visible always when any filter is active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Filtros activos:
          </span>
          {searchText && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
              Texto: <b className="font-semibold">{searchText}</b>
              <button type="button" onClick={() => setSearchText('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {clientFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
              Cliente: <b className="font-semibold">{clientFilter}</b>
              <button type="button" onClick={() => setClientFilter('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
              Estado: <b className="font-semibold">{statusFilter}</b>
              <button type="button" onClick={() => setStatusFilter('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {machineFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
              Máquina: <b className="font-semibold">{machineFilter}</b>
              <button type="button" onClick={() => setMachineFilter('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {semaphoreFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-200">
              Semáforo: <b className="font-semibold">{semaphoreFilter}</b>
              <button type="button" onClick={() => setSemaphoreFilter('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
              Desde: <b className="font-mono font-semibold">{dateFrom}</b>
              <button type="button" onClick={() => setDateFrom('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
              Hasta: <b className="font-mono font-semibold">{dateTo}</b>
              <button type="button" onClick={() => setDateTo('')} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {showArchived && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
              <b className="font-semibold">Archivados incluidos</b>
              <button type="button" onClick={() => setShowArchived(false)} className="hover:text-rose-600 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Expanded Filter Controls */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-neutral-800 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {/* 1. Client Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Cliente
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              >
                <option value="">Todos los clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre} {c.empresa ? `(${c.empresa})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              >
                <option value="">Todos los estados</option>
                {config.estados.map((e) => (
                  <option key={e.nombre} value={e.nombre}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Machine Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Máquina
              </label>
              <select
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              >
                <option value="">Todas las máquinas</option>
                {config.maquinas.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Semáforo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Semáforo de Plazo
              </label>
              <select
                value={semaphoreFilter}
                onChange={(e) => setSemaphoreFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              >
                <option value="">Todos los semáforos</option>
                <option value="Vencido">⚠️ Vencidos</option>
                <option value="Próximo a vencer">⏳ Próximos a vencer</option>
                <option value="En curso">✅ En curso</option>
                <option value="Sin fecha">❓ Sin fecha</option>
              </select>
            </div>

            {/* 6. Date From */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Vence Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              />
            </div>

            {/* 7. Date To */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Vence Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              />
            </div>

            {/* 8. Sorting */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-black focus:border-red-500 outline-none"
              >
                <option value="diasRestantes">Días restantes (urgentes primero)</option>
                <option value="vencimiento">Fecha de vencimiento</option>
                <option value="inicio">Fecha de inicio</option>
                <option value="estado">Estado</option>
                <option value="kit">Kit / Producto (A-Z)</option>
                <option value="cliente">Cliente (A-Z)</option>
                <option value="id">Identificador ID</option>
              </select>
            </div>

            {/* 9. Checkbox Show Archived */}
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 border-slate-300 dark:border-neutral-700 focus:ring-red-500"
                />
                Mostrar archivados
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
