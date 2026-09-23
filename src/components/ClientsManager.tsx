import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  FileText, 
  X, 
  Briefcase 
} from 'lucide-react';
import { Client, ProductionJob } from '../types';
import { hoyISO } from '../utils/dateCalculations';

interface ClientsManagerProps {
  clients: Client[];
  jobs: ProductionJob[];
  onAddClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onFilterByClient: (clientName: string) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  jobs,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onFilterByClient,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    direccion: '',
    nifCif: '',
    notas: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredClients = clients.filter((c) => {
    const query = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(query) ||
      c.empresa.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.nifCif && c.nifCif.toLowerCase().includes(query))
    );
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      nombre: '',
      empresa: '',
      telefono: '',
      email: '',
      direccion: '',
      nifCif: '',
      notas: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setFormData(c);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.nombre || !formData.nombre.trim()) {
      errs.nombre = 'El nombre o persona de contacto es obligatorio.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    if (editingClient) {
      onEditClient({
        ...editingClient,
        ...formData,
      } as Client);
    } else {
      const newId = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
      onAddClient({
        id: newId,
        nombre: formData.nombre?.trim() || '',
        empresa: formData.empresa?.trim() || '',
        telefono: formData.telefono?.trim() || '',
        email: formData.email?.trim() || '',
        direccion: formData.direccion?.trim() || '',
        nifCif: formData.nifCif?.trim() || '',
        notas: formData.notas?.trim() || '',
        fechaAlta: hoyISO(),
      });
    }

    setIsModalOpen(false);
  };

  const getClientJobCount = (clientName: string) => {
    const active = jobs.filter((j) => j.clienteNombre === clientName && j.estado !== 'Archivado').length;
    const total = jobs.filter((j) => j.clienteNombre === clientName).length;
    return { active, total };
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-black/20 transition-all">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600 dark:text-red-500" />
            Gestión de Clientes y Empresas
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Administre las empresas y cuentas asociadas a las órdenes de rotulación, kits y producción.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm shadow-red-600/30 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Añadir Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa, email o CIF..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none shadow-2xs transition-all"
        />
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const stats = getClientJobCount(client.nombre);

          return (
            <div
              key={client.id}
              className="backdrop-blur-[8px] bg-white/90 dark:bg-black/75 border border-slate-200/90 dark:border-neutral-800/80 rounded-xl p-4 shadow-lg shadow-black/20 hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-neutral-800">
                  <div>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      {client.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{client.nombre}</h3>
                    {client.empresa && (
                      <p className="text-xs text-slate-600 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
                        {client.empresa}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClient(client.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-neutral-400 mb-3">
                  {client.telefono && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                      <span>{client.telefono}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.direccion && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                      <span className="truncate">{client.direccion}</span>
                    </div>
                  )}
                  {client.nifCif && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-neutral-500">
                      <span>CIF/NIF:</span>
                      <b className="text-slate-800 dark:text-neutral-300">{client.nifCif}</b>
                    </div>
                  )}
                  {client.notas && (
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 italic bg-slate-50 dark:bg-neutral-950 p-2 rounded mt-2 border border-slate-100 dark:border-neutral-800">
                      "{client.notas}"
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Job stats and filter link */}
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                  <span className="font-bold text-red-600 dark:text-red-400">{stats.active}</span> activos de {stats.total} pedidos
                </div>

                <button
                  onClick={() => onFilterByClient(client.nombre)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold inline-flex items-center gap-1 text-xs cursor-pointer transition-colors"
                >
                  <Briefcase className="w-3 h-3" />
                  Ver Trabajos
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-500 dark:text-neutral-400 text-xs">
          No se encontraron clientes con el criterio de búsqueda "{search}".
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
            <div className="bg-black text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                {editingClient ? `Editar Cliente: ${editingClient.nombre}` : 'Nuevo Cliente o Empresa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Nombre o Persona de Contacto *
                </label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Carlos Mendoza"
                  className={`w-full px-3 py-2 text-xs border rounded-lg outline-none bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-neutral-100 ${
                    formErrors.nombre 
                      ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' 
                      : 'border-slate-300 dark:border-neutral-800 focus:border-red-500'
                  }`}
                />
                {formErrors.nombre && (
                  <span className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 block">{formErrors.nombre}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Razón Social / Empresa
                </label>
                <input
                  type="text"
                  value={formData.empresa || ''}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Ej. Retail Solutions Iberia S.L."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">Dirección Postal</label>
                  <input
                    type="text"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, Polígono, Ciudad"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">NIF / CIF</label>
                  <input
                    type="text"
                    value={formData.nifCif || ''}
                    onChange={(e) => setFormData({ ...formData, nifCif: e.target.value })}
                    placeholder="B-12345678"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">Notas del Cliente</label>
                <textarea
                  rows={2}
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Horarios de entrega, preferencias técnicas o requisitos..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg outline-none text-slate-800 dark:text-neutral-100 focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-500 rounded-lg shadow-sm shadow-red-600/30 transition-colors cursor-pointer active:scale-95"
                >
                  {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
