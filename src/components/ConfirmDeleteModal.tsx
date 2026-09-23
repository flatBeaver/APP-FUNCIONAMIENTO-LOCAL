import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfirmDeleteData {
  isOpen: boolean;
  type: 'job' | 'client' | 'clearAll' | 'sampleData' | 'custom';
  id?: string;
  title: string;
  subtitle?: string;
  details?: { label: string; value: string }[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDeleteModalProps {
  data: ConfirmDeleteData | null;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ data, onClose }) => {
  const isOpen = !!data && data.isOpen;

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!data || !isOpen) return null;

  const isDestructive = data.isDestructive !== false;

  const handleConfirm = async () => {
    try {
      await data.onConfirm();
    } finally {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-[8px] transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md backdrop-blur-xl bg-white/95 dark:bg-black/90 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header con acento de color */}
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive 
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' 
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
            }`}>
              {isDestructive ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                {data.title}
              </h3>
              {data.subtitle && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">
                  {data.subtitle}
                </p>
              )}
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Detalles del elemento a eliminar (si se proporcionan) */}
          {data.details && data.details.length > 0 && (
            <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1.5 text-xs">
                {data.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-2">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                      {item.label}:
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-semibold truncate max-w-[240px] text-right font-mono">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerta explicativa */}
          <div className="p-5">
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              isDestructive
                ? 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {isDestructive
                  ? 'Esta acción es irreversible y eliminará el registro de la base de datos de MEB.'
                  : 'Por favor verifique la acción antes de continuar.'}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              {data.cancelLabel || 'Cancelar'}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-600/20'
                  : 'bg-neutral-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700'
              }`}
            >
              {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
              <span>{data.confirmLabel || (isDestructive ? 'Eliminar Definitivamente' : 'Confirmar')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
