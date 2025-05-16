import React, { useState, useEffect } from 'react';
import { AdminTable } from '../AdminTable';
import AdminModal from '../AdminModal';

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

interface Permiso {
  id: number;
  nombre: string;
  descripcion: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', permisos: [] as string[] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Error al cargar los datos');
      const data = await response.json();
      // console.log("data", data)
      setRoles(data.roles);
      // console.log("roles", data.roles)
      setPermisos(data.permisos);
      // console.log("permisos", data.permisos)
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '', permisos: [] });
    setShowModal(true);
  };

  const handleEditRole = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setEditingRole(role);
      setFormData({ nombre: role.nombre, descripcion: role.descripcion, permisos: role.permisos });
      setShowModal(true);
    }
  };

  const handleDeleteRole = (roleId: number) => {
    if (!confirm('¿Seguro que deseas eliminar este rol?')) return;
    fetch('/api/roles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: roleId }) })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar el rol');
        return fetchData();
      })
      .catch(err => {
        console.error(err);
        alert('Error al eliminar el rol');
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Alternar permisos tipo chip
  const handlePermisoToggle = (nombre: string) => {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(nombre)
        ? prev.permisos.filter(p => p !== nombre)
        : [...prev.permisos, nombre]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const payload = editingRole ? { id: editingRole.id, ...formData } : formData;
      console.log('payload de rol', payload);
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Error guardando el rol');
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Error guardando el rol');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    
    <div className='user-management bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mt-8'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">Gestión de Roles</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow transition dark:bg-blue-700 dark:hover:bg-blue-800" onClick={handleAddRole}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Nuevo Rol
        </button>
      </div>
      <AdminTable
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'permisos', label: 'Permisos', render: (r: Role) => (
              <div className="flex gap-2 flex-wrap max-w-xs">
                {r.permisos.map(p => <span key={p} className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-800 font-medium">{p}</span>)}
              </div>
            )
          }
        ]}
        data={roles}
        loading={loading}
        error={error}
        emptyMessage="No hay roles disponibles"
        rowKey={r => r.id}
        renderActions={r => (
          <>
            <button onClick={() => handleEditRole(r.id)} className="px-4 py-2 bg-transparent border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-white transition font-semibold  ">Editar</button>
            <button onClick={() => handleDeleteRole(r.id)} className="px-4 py-2 bg-transparent border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-semibold">Eliminar</button>
          </>
        )}
      />

      <AdminModal
        open={showModal}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">Cancelar</button>
            <button type="submit" form="role-form" className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition">{editingRole ? 'Actualizar' : 'Crear'}</button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full mt-1 p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3} className="w-full mt-1 p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Permisos</label>
            <div
              className="border border-neutral-300 dark:border-neutral-700 rounded-xl p-4 bg-white dark:bg-neutral-900 flex flex-wrap gap-2 mb-2 min-h-[56px] overflow-x-auto sm:overflow-x-visible max-w-full"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {permisos.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePermisoToggle(p.nombre)}
                  className={`px-3 py-1 rounded-full border transition whitespace-nowrap ${
                    formData.permisos.includes(p.nombre)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
            <div
              className="border border-[#23262C] rounded-xl p-4 bg-[#23263A] min-h-[40px] overflow-x-auto sm:overflow-x-visible max-w-full"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <span className="text-gray-400 mr-2">Seleccionados:</span>
              {formData.permisos.length === 0 ? (
                <span className="text-gray-500">Ninguno</span>
              ) : (
                formData.permisos.map(nombre => (
                  <span
                    key={nombre}
                    className="inline-flex items-center bg-blue-700 text-white px-2 py-1 rounded-full mr-2 mb-1 whitespace-nowrap"
                  >
                    {nombre}
                    <button
                      type="button"
                      onClick={() => handlePermisoToggle(nombre)}
                      className="ml-1 text-xs font-bold"
                      aria-label={`Quitar ${nombre}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default RoleManagement;