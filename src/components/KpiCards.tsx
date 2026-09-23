import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Archive, 
  Activity, 
  AlertTriangle,
  Layers
} from 'lucide-react';
import { ProductionJob, AppConfig } from '../types';
import { calcularJob } from '../utils/dateCalculations';

interface KpiCardsProps {
  jobs: ProductionJob[];
  config: AppConfig;
  selectedSemaforoFilter: string;
  onSelectSemaforoFilter: (sem: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  jobs,
  config,
  selectedSemaforoFilter,
  onSelectSemaforoFilter,
  showArchived,
  onToggleShowArchived,
}) => {
  const umbral = Number(config.parametros.umbralAvisoDias) || 7;
  const activos = jobs.filter((j) => j.estado !== 'Archivado');
  const archivados = jobs.filter((j) => j.estado === 'Archivado');

  let vencidos = 0;
  let proximos = 0;
  let enCurso = 0;
  let sinFecha = 0;

  activos.forEach((j) => {
    const c = calcularJob(j, config);
    if (c.diasRestantes === null) {
      sinFecha++;
    } else if (c.diasRestantes < 0) {
      vencidos++;
    } else if (c.diasRestantes <= umbral) {
      proximos++;
    } else {
      enCurso++;
    }
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {/* 1. Trabajos Activos */}
      <div 
        onClick={() => onSelectSemaforoFilter('')}
        className={`backdrop-blur-[8px] border rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:border-red-600/60 ${
          selectedSemaforoFilter === '' && !showArchived 
            ? 'ring-2 ring-red-500/50 border-red-500 bg-red-50 dark:bg-red-950/30 shadow-red-950/20' 
            : 'bg-white/85 dark:bg-black/70 border-slate-200/90 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-black/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">Activos</span>
          <Layers className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{activos.length}</div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          En taller
        </div>
      </div>

      {/* 2. Vencidos */}
      <div 
        onClick={() => onSelectSemaforoFilter('Vencido')}
        className={`backdrop-blur-[8px] border rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:border-red-500 ${
          selectedSemaforoFilter === 'Vencido' 
            ? 'ring-2 ring-red-500/60 border-red-500 bg-red-50 dark:bg-red-950/40 shadow-red-950/30' 
            : 'bg-white/85 dark:bg-black/70 border-slate-200/90 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-black/80'
        }`}
      >
        <div className="flex items-center justify-between text-red-500 dark:text-red-400 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Vencidos</span>
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-black text-red-600 dark:text-red-500 leading-tight">{vencidos}</div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">Plazo superado</div>
      </div>

      {/* 3. Próximos a vencer */}
      <div 
        onClick={() => onSelectSemaforoFilter('Próximo a vencer')}
        className={`backdrop-blur-[8px] border rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:border-amber-500/60 ${
          selectedSemaforoFilter === 'Próximo a vencer' 
            ? 'ring-2 ring-amber-500/50 border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-amber-950/20' 
            : 'bg-white/85 dark:bg-black/70 border-slate-200/90 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-black/80'
        }`}
      >
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Próximos</span>
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-300 leading-tight">{proximos}</div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">≤ {umbral} días restantes</div>
      </div>

      {/* 4. En curso */}
      <div 
        onClick={() => onSelectSemaforoFilter('En curso')}
        className={`backdrop-blur-[8px] border rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:border-emerald-500/60 ${
          selectedSemaforoFilter === 'En curso' 
            ? 'ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-emerald-950/20' 
            : 'bg-white/85 dark:bg-black/70 border-slate-200/90 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-black/80'
        }`}
      >
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">En Curso</span>
          <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 leading-tight">{enCurso}</div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">En fecha programada</div>
      </div>

      {/* 5. Archivados */}
      <div 
        onClick={onToggleShowArchived}
        className={`backdrop-blur-[8px] border rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:border-neutral-700 ${
          showArchived 
            ? 'ring-2 ring-red-500/40 border-red-500/60 bg-red-50 dark:bg-red-950/25 shadow-red-950/20' 
            : 'bg-white/85 dark:bg-black/70 border-slate-200/90 dark:border-neutral-800/80 hover:bg-white dark:hover:bg-black/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">Archivados</span>
          <Archive className="w-4 h-4 text-slate-400 dark:text-neutral-400" />
        </div>
        <div className="text-2xl font-black text-slate-800 dark:text-neutral-200 leading-tight">{archivados.length}</div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
          {showArchived ? '✓ Mostrándose' : 'Ocultos'}
        </div>
      </div>
    </div>
  );
};
