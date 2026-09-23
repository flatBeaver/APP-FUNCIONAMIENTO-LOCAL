import React from 'react';
import { HelpCircle, BookOpen, Lightbulb, CheckCircle2, ShieldAlert } from 'lucide-react';

export const HelpSection: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-red-600 dark:text-red-500" />
          Fórmulas de Cálculo y Manual del Taller
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Documentación técnica del cálculo automático de fechas, días hábiles de producción y semáforos de aviso.
        </p>
      </div>

      {/* Table of calculations */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Cómo se calcula cada columna en la aplicación
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 dark:bg-neutral-950 text-slate-700 dark:text-neutral-300 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Columna</th>
                <th className="px-4 py-2.5">Cálculo en la Aplicación</th>
                <th className="px-4 py-2.5">Equivalente en Hoja de Cálculo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 text-slate-700 dark:text-neutral-300">
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Días restantes (naturales)</td>
                <td className="px-4 py-3">Fecha de vencimiento menos la fecha de hoy</td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=Vencimiento - HOY()</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Está vencido</td>
                <td className="px-4 py-3">Días restantes menor que 0</td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=Vencimiento &lt; HOY()</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Próximo a vencer</td>
                <td className="px-4 py-3">Días restantes entre 0 y el umbral configurado (ej. 7 días)</td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=Y(Vencimiento&gt;=HOY(), Vencimiento-HOY()&lt;=7)</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Semáforo de Plazo</td>
                <td className="px-4 py-3">Clasificación automática en Vencido, Próximo a vencer o En curso</td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=SI(B4&lt;HOY(),"Vencido",SI(B4-HOY()&lt;=7,"Próximo","En curso"))</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Fecha de vencimiento automática</td>
                <td className="px-4 py-3">
                  Fecha de inicio + días asignados, saltando automáticamente sábados, domingos y la lista de festivos configurada
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=DIA.LAB(Inicio, Dias, Festivos)</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Días en producción (naturales)</td>
                <td className="px-4 py-3">Hoy menos la fecha de inicio del trabajo</td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=HOY() - Inicio</code></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-neutral-100">Días laborables consumidos</td>
                <td className="px-4 py-3">
                  Días laborables transcurridos desde el inicio hasta hoy, excluyendo fines de semana y festivos
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-neutral-950"><code>=DIAS.LAB(Inicio, HOY(), Festivos) - 1</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop best practices */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-5 shadow-lg shadow-black/20 transition-all">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Buenas Prácticas para el Equipo de Taller
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-neutral-300">
          <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Priorización de Trabajos
            </h4>
            <p className="text-slate-600 dark:text-neutral-400">
              Ordene siempre por «Días restantes (urgentes primero)» y mantenga desmarcado «Mostrar archivados» para visualizar de un vistazo la cola crítica de fabricación del día.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Impresión de Orden de Trabajo (Traveler Sheet)
            </h4>
            <p className="text-slate-600 dark:text-neutral-400">
              Cada vez que inicie un trabajo o kit, descargue el PDF o imprima la ficha de taller usando el botón <PrinterIcon className="w-3.5 h-3.5 inline text-red-500" />. Acompañe el producto físico con esta hoja (diseñada con fondo blanco, letras negras y paneles sin relleno para ahorrar tinta y máxima legibilidad) para asegurar que los operadores firmen cada paso.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Ruta en Servidor NAS
            </h4>
            <p className="text-slate-600 dark:text-neutral-400">
              Copie la ruta de red en el campo «Ubicación de archivos» para que el operario del plotter pueda abrir directamente el archivo RIP sin tener que buscar en carpetas compartidas.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              Copias de Seguridad Semanales
            </h4>
            <p className="text-slate-600 dark:text-neutral-400">
              Como la aplicación guarda los datos de forma local y fiable en el navegador de su puesto de trabajo, exporte un archivo de respaldo JSON todos los viernes desde la sección «Configuración».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function PrinterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
