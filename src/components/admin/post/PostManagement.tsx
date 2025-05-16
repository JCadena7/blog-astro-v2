import React, { useState, useEffect } from 'react';
import { AdminTable } from '../AdminTable';
import MdxPreview from '../../MdxPreview';

interface Post {
  id: number;
  titulo: string;
  autor_nombre: string;
  estado_nombre: string;
  categorias: string[];
  created_at: Date;
  imagen_destacada?: string;
  contenido: string;
  usuario_id: number; // ID del autor para comparar permisos
}

interface Estado {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

const PostManagement: React.FC<{permissions: string[]; user: any}> = ({ permissions, user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    estado_id: '',
    categorias: [] as number[],
    imagen_destacada: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Estados para filtros UI
  const [filterAutorNombre, setFilterAutorNombre] = useState('');
  const [filterEstadoNombre, setFilterEstadoNombre] = useState('');
  const [filterCategorias, setFilterCategorias] = useState<string[]>([]);

  const isAdmin = permissions.includes('asignar_roles');
  const isEscritor = !isAdmin && permissions.includes('crear_post');
  const writerPerms = ['crear_post', 'editar_post_propio', 'reaccionar', 'comentar'];
  const displayPerms = isAdmin ? permissions : isEscritor ? writerPerms : [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Construir URL con filtros según permisos
      let apiUrl = '/api/posts';
      const params = new URLSearchParams();
      // Si solo puede editar sus propios posts, filtrar por usuario
      if (permissions.includes('editar_post_propio') && !permissions.includes('editar_post_cualquiera') && !isAdmin) {
        params.set('usuario_id', String(user.id));
      }
      // Filtros UI adicionales
      if (filterAutorNombre && (permissions.includes('editar_post_cualquiera') || isAdmin)) {
        params.set('autor_nombre', filterAutorNombre);
      }
      if (filterEstadoNombre) {
        params.set('estado_nombre', filterEstadoNombre);
      }
      if (filterCategorias.length) {
        params.set('categorias', filterCategorias.join(','));
      }
      if ([...params].length) {
        apiUrl += `?${params.toString()}`;
      }
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Error al cargar los posts');
      }
      const data = await response.json();
      setPosts(data.posts);
      setEstados(data.estados);
      setCategorias(data.categorias);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = () => {
    window.location.href = '/admin/posts/nuevo';
  };

  const handleEditPost = (post: Post) => {
    window.location.href = `/admin/posts/editar/${post.id}`;
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este post?')) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: postId })
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        throw new Error('Error al eliminar el post');
      }
    } catch (err) {
      setError('Error al eliminar el post');
      console.error('Error:', err);
    }
  };

  const handleViewPost = (post: Post) => {
    setPreviewContent(post.contenido);
    setPreviewTitle(post.titulo);
    setShowPreview(true);
  };

  // Handler para actualizar el estado del post usando PATCH
  const handleEstadoChange = async (postId: number, newEstadoId: number) => {
    try {
      const estadoObj = estados.find(e => e.id === newEstadoId);
      const newStatus = estadoObj ? estadoObj.nombre : '';
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, newStatus })
      });
      if (!res.ok) throw new Error('Error actualizando estado');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error actualizando estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPost ? '/api/posts' : '/api/posts';
      const method = editingPost ? 'PUT' : 'POST';
      const body = editingPost 
        ? { ...formData, id: editingPost.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        throw new Error('Error al guardar el post');
      }
    } catch (err) {
      setError('Error al guardar el post');
      console.error('Error:', err);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchData();
  };

  const handleReset = () => {
    setFilterAutorNombre('');
    setFilterEstadoNombre('');
    setFilterCategorias([]);
    setLoading(true);
    fetchData();
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className='post-management bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mt-8'>
      {/* {(isAdmin || isEscritor) && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-white text-xl font-semibold">
            {isAdmin
              ? 'Administrador: Acceso completo al sistema'
              : 'Escritor: Puede crear y editar sus propios posts'}
          </h2>
          <ul className="list-disc list-inside text-white mt-2">
            {displayPerms.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )} */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight">Gestión de Posts</h1>
        {permissions.includes('crear_post') && (
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow transition" onClick={handleAddPost}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Nuevo Post
          </button>
        )}
      </div>
      
      {/* Filtros de posts */}
      <div className="mb-6 flex flex-wrap gap-4">
        {(permissions.includes('editar_post_cualquiera') || isAdmin) && (
          <input
            type="text"
            placeholder="Filtrar por autor"
            value={filterAutorNombre}
            onChange={e => setFilterAutorNombre(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#23263A] text-white focus:outline-none"
          />
        )}
        <select
          value={filterEstadoNombre}
          onChange={e => setFilterEstadoNombre(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#23263A] text-white focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {estados.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
        </select>
        <select
          multiple
          value={filterCategorias}
          onChange={e => setFilterCategorias(Array.from(e.target.selectedOptions, o => o.value))}
          className="px-3 py-2 rounded-lg bg-[#23263A] text-white focus:outline-none"
        >
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <button onClick={handleFilter} className="bg-blue-600 px-4 py-2 rounded-lg text-white">Filtrar</button>
        <button onClick={handleReset} className="bg-gray-600 px-4 py-2 rounded-lg text-white">Limpiar</button>
      </div>
      <AdminTable
        columns={[
          { key: 'titulo', label: 'Título', render: p => (
              <div className="post-title">
                {p.imagen_destacada && <img src={p.imagen_destacada!} alt="" className="post-thumbnail" />}
                <span>{p.titulo}</span>
              </div>
            )
          },
          { key: 'autor_nombre', label: 'Autor' },
          { key: 'estado_id', label: 'Estado', render: p => (
              <select
                value={(p as any).estado_id}
                onChange={e => handleEstadoChange(p.id, Number(e.target.value))}
                disabled={!permissions.includes('publicar_post')}
                className="bg-[#23263A] border border-[#23262C] text-white rounded-xl p-2 focus:outline-none"
              >
                {estados.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            )
          },
          { key: 'categorias', label: 'Categorías', render: p => (
              <div className="categories">
                {p.categorias.map(c => <span key={c} className="category-badge">{c}</span>)}
              </div>
            )
          },
          { key: 'created_at', label: 'Fecha', render: p => new Date(p.created_at).toLocaleDateString() },
        ]}
        data={posts}
        loading={loading}
        error={error}
        emptyMessage="No hay posts disponibles"
        rowKey={p => p.id}
        renderActions={p => (
          <>
            {(permissions.includes('editar_post_cualquiera') || (permissions.includes('editar_post_propio') && p.usuario_id === user.id)) && (
              <button onClick={() => handleEditPost(p)} className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-white transition font-semibold">Editar</button>
            )}
            {(permissions.includes('editar_post_cualquiera') || (permissions.includes('editar_post_propio') && p.usuario_id === user.id)) && (
              <button onClick={() => handleDeletePost(p.id)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-semibold">Eliminar</button>
            )}
            <button onClick={() => handleViewPost(p)} className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-white transition font-semibold">Ver</button>
          </>
        )}
      />

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingPost ? 'Editar Post' : 'Nuevo Post'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="titulo">Título</label>
                <input
                  type="text"
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contenido">Contenido</label>
                <textarea
                  id="contenido"
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={formData.estado_id}
                  onChange={(e) => setFormData({ ...formData, estado_id: e.target.value })}
                  required
                >
                  <option value="">Seleccionar estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Categorías</label>
                <div className="checkbox-group">
                  {categorias.map((categoria) => (
                    <label key={categoria.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(categoria.id)}
                        onChange={(e) => {
                          const newCategorias = e.target.checked
                            ? [...formData.categorias, categoria.id]
                            : formData.categorias.filter(id => id !== categoria.id);
                          setFormData({ ...formData, categorias: newCategorias });
                        }}
                      />
                      {categoria.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="imagen">URL de la imagen destacada</label>
                <input
                  type="url"
                  id="imagen"
                  value={formData.imagen_destacada}
                  onChange={(e) => setFormData({ ...formData, imagen_destacada: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPost ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">{previewTitle}</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <MdxPreview content={previewContent} title={previewTitle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;