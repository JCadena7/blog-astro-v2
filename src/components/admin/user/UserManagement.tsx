import React, { useState, useEffect } from 'react';
import { AdminTable } from '../AdminTable';
import AdminModal from '../AdminModal';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol_nombre: string;
  created_at: string;
}

interface Role {
  id: number;
  nombre: string;
}

const UserManagement: React.FC<{permissions: string[]; user: any}> = ({ permissions, user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ nombre: string; email: string; password: string; rol_id: string }>(
    { nombre: '', email: '', password: '', rol_id: '' }
  );

  const isAdmin = permissions.includes('asignar_roles');
  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  const fetchData = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users);
      setRoles(data.roles);
    } catch {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ nombre: '', email: '', password: '', rol_id: '' });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({ nombre: user.nombre, email: user.email, password: '', rol_id: roles.find(r => r.nombre === user.rol_nombre)?.id.toString() || '' });
    setShowModal(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Seguro de que deseas eliminar este usuario?')) return;
    try {
      const res = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) setUsers(users.filter(u => u.id !== id));
      else throw new Error();
    } catch {
      setError('Error al eliminar usuario');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const body = editingUser ? { ...formData, id: editingUser.id } : formData;
    try {
      const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else throw new Error();
    } catch {
      setError('Error al guardar usuario');
    }
  };

  return (
    <div className="user-management bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">Gestión de Usuarios</h1>
        {canCreate && (
          <button onClick={handleAddUser} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow transition dark:bg-blue-700 dark:hover:bg-blue-800">
            Nuevo Usuario
          </button>
        )}
      </div>

      <AdminTable
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'email', label: 'Email' },
          {
            key: 'rol_nombre',
            label: 'Rol',
            render: (user: User) => (
              <span className="inline-block px-5 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold text-base tracking-tight">
                {user.rol_nombre}
              </span>
            ),
          },
          {
            key: 'created_at',
            label: 'Fecha',
            render: (user: User) => (
              <span className="text-neutral-500 dark:text-neutral-400">{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
            ),
          },
        ]}
        renderActions={(user: User) => (
          <>
            {canEdit && (
              <button onClick={() => handleEditUser(user)} className="px-4 py-2 border border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 rounded-lg bg-transparent hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition font-semibold">Editar</button>
            )}
            {canDelete && (
              <button onClick={() => handleDeleteUser(user.id)} className="px-4 py-2 border border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 rounded-lg bg-transparent hover:bg-red-500 dark:hover:bg-red-600 hover:text-white dark:hover:text-white transition font-semibold">Eliminar</button>
            )}
          </>
        )}
        data={users}
        loading={loading}
        error={error}
        emptyMessage="No hay usuarios."
        rowKey={user => user.id}
      />

      <AdminModal
        open={showModal}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">Cancelar</button>
            <button type="submit" form="user-form" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition">{editingUser ? 'Actualizar' : 'Crear'}</button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit}>
  <div className="max-w-xs mx-auto space-y-2">
    <div>
      <label className="block text-xs font-medium text-neutral-800 dark:text-neutral-100 mb-1">Nombre</label>
      <input
        type="text"
        value={formData.nombre}
        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
        required
        className="w-full px-3 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-400"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-neutral-800 dark:text-neutral-100 mb-1">Email</label>
      <input
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
        className="w-full px-3 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-400"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-neutral-800 dark:text-neutral-100 mb-1">Rol</label>
      <select
        value={formData.rol_id}
        onChange={e => setFormData({ ...formData, rol_id: e.target.value })}
        required
        className="w-full px-3 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Seleccione rol</option>
        {roles.map((role: Role) => (
          <option key={role.id} value={role.id}>{role.nombre}</option>
        ))}
      </select>
    </div>
  </div>
</form>
      </AdminModal>
    </div>
  );
};

export default UserManagement;