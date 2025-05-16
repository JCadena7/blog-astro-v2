import React, { useState, useEffect } from 'react';
import { AdminTable } from "../AdminTable";
import AdminModal from "../AdminModal";

interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  slug: string;
  created_at: Date;
  color: string;
  icono: string;
}

const CategoryManagement: React.FC<{permissions: string[]; user: any}> = ({ permissions, user }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    slug: '',
    color: '',
    icono: '' 
  });

  const isAdmin = permissions.includes('asignar_roles');
  const canCreate = isAdmin || permissions.includes('crear_categoria');
  const canEdit = isAdmin || permissions.includes('editar_categoria');
  const canDelete = isAdmin || permissions.includes('eliminar_categoria');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categorias');
      // console.log('Categorías obtenidas v1:', response);
      if (!response.ok) {
        throw new Error('Error al cargar las categorías');
      }
      const data = await response.json();
      // console.log('Categorías obtenidas v2:', data);
      setCategories(data.categorias || []);
      // console.log("las categorias: ", data.categorias);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Generar slug automáticamente si se está editando el nombre
    if (name === 'nombre') {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase()
          .replace(/\s+/g, '-')           // Reemplazar espacios con guiones
          .replace(/[^\w\-]+/g, '')       // Eliminar caracteres no alfanuméricos
          .replace(/\-\-+/g, '-')         // Reemplazar múltiples guiones con uno solo
          .replace(/^-+/, '')             // Eliminar guiones del inicio
          .replace(/-+$/, '')             // Eliminar guiones del final
          .normalize('NFD')               // Normalizar caracteres acentuados
          .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
      }));
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      nombre: '',
      descripcion: '',
      slug: '',
      color: '',
      icono: ''
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion,
      slug: category.slug,
      color: category.color,
      icono: category.icono
    });
    setShowModal(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
      const response = await fetch(`/api/categorias/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId));
      } else {
        throw new Error('Error al eliminar la categoría');
      }
    } catch (err) {
      setError('Error al eliminar la categoría');
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory 
        ? `/api/categorias/${editingCategory.id}` 
        : '/api/categorias';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al guardar la categoría');
      }

      // Actualizar la lista de categorías
      await fetchCategories();
      setShowModal(false);
    } catch (err) {
      setError('Error al guardar la categoría');
      console.error('Error:', err);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className='user-management bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mt-8'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">Gestión de Categorías</h1>
        {canCreate && (
          <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-xl shadow transition" onClick={handleAddCategory}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Nueva Categoría
          </button>
        )}
      </div>
      <AdminTable
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'slug', label: 'Slug' }
        ]}
        data={categories}
        loading={loading}
        error={error}
        emptyMessage="No hay categorías."
        rowKey={cat => cat.id}
        renderActions={cat => (
          <>
            {canEdit && (
              <button onClick={() => handleEditCategory(cat)} className="px-4 py-2 border border-primary-500 text-primary-500 rounded-lg bg-transparent hover:bg-primary-500 hover:text-white transition font-semibold">Editar</button>
            )}
            {canDelete && (
              <button onClick={() => handleDeleteCategory(cat.id)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg bg-transparent hover:bg-red-500 hover:text-white transition font-semibold">Eliminar</button>
            )}
          </>
        )}
      />
      <AdminModal
        open={showModal}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">Cancelar</button>
            <button type="submit" form="category-form" className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition">{editingCategory ? 'Actualizar' : 'Crear'}</button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">Nombre</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full mt-1 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} className="w-full mt-1 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">Slug</label>
            <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} className="w-full mt-1 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">Color</label>
            <input type="text" name="color" value={formData.color} onChange={handleInputChange} className="w-full mt-1 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">Icono</label>
            <input type="text" name="icono" value={formData.icono} onChange={handleInputChange} className="w-full mt-1 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" required />
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default CategoryManagement;