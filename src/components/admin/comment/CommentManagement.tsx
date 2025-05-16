import React, { useState, useEffect } from 'react';
import { AdminTable } from "../AdminTable";
import AdminModal from "../AdminModal";

interface Comment {
  id: number;
  contenido: string;
  autor: string;
  post_titulo: string;
  post_slug: string;
  estado: string;
  created_at: string;
  parent_id?: number;
}

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [formData, setFormData] = useState({
    contenido: ''
  });
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterPost, setFilterPost] = useState('');

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/comentarios');
      console.log("comentarios", response);
      if (!response.ok) {
        throw new Error('Error al cargar los comentarios');
      }
      const data = await response.json();
      // console.log("data", data);
      setComments(data.comentarios || []);
      // console.log("comments -v2", comments);
    } catch (err) {
      setError('Error al cargar los comentarios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setFormData({
      contenido: comment.contenido
    });
    setShowModal(true);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    try {
      const response = await fetch(`/api/comentarios/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        throw new Error('Error al eliminar el comentario');
      }
    } catch (err) {
      setError('Error al eliminar el comentario');
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingComment) return;
      
      const response = await fetch(`/api/comentarios/${editingComment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el comentario');
      }

      // Actualizar la lista de comentarios
      await fetchComments();
      setShowModal(false);
    } catch (err) {
      setError('Error al actualizar el comentario');
      console.error('Error:', err);
    }
  };

  const handleApproveComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comentarios/${commentId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al aprobar el comentario');
      }

      // Actualizar la lista de comentarios
      await fetchComments();
    } catch (err) {
      setError('Error al aprobar el comentario');
      console.error('Error:', err);
    }
  };

  const handleRejectComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comentarios/${commentId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al rechazar el comentario');
      }

      // Actualizar la lista de comentarios
      await fetchComments();
    } catch (err) {
      setError('Error al rechazar el comentario');
      console.error('Error:', err);
    }
  };

  const filteredComments = comments.filter(comment => {
    // Filtrar por estado
    if (filterStatus !== 'todos' && comment.estado !== filterStatus) {
      return false;
    }
    
    // Filtrar por post
    if (filterPost && !comment.post_titulo.toLowerCase().includes(filterPost.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="comment-management bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mt-8">
      <div className="header-actions">
        <h2>Gestión de Comentarios</h2>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="filterStatus">Estado:</label>
          <select 
            id="filterStatus" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filterPost">Post:</label>
          <input 
            type="text" 
            id="filterPost" 
            value={filterPost} 
            onChange={(e) => setFilterPost(e.target.value)}
            placeholder="Buscar por título de post"
            className="filter-input"
          />
        </div>
      </div>

      <AdminTable
        columns={[
          { key: 'contenido', label: 'Comentario', render: c => <span className="comment-content">{c.contenido}</span> },
          { key: 'autor', label: 'Autor' },
          { key: 'post_titulo', label: 'Post', render: c => <a href={`/blog/${c.post_slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{c.post_titulo}</a> },
          {
            key: 'estado', label: 'Estado', render: c => {
              const classes: Record<string,string> = { aprobado: 'bg-green-100 text-green-600', pendiente: 'bg-yellow-100 text-yellow-600', rechazado: 'bg-red-100 text-red-600' };
              return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes[c.estado]}`}>{c.estado}</span>;
            }
          },
          { key: 'created_at', label: 'Fecha', render: c => <span className="text-gray-400">{new Date(c.created_at).toLocaleDateString('es-ES')}</span> }
        ]}
        data={filteredComments}
        loading={false}
        error={null}
        emptyMessage="No hay comentarios disponibles con los filtros seleccionados."
        rowKey={c => c.id}
        renderActions={c => (
          <>
            {c.estado === 'pendiente' && (
              <>
                <button onClick={() => handleApproveComment(c.id)} className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg bg-transparent hover:bg-blue-500 hover:text-white transition font-semibold">Aprobar</button>
                <button onClick={() => handleRejectComment(c.id)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg bg-transparent hover:bg-red-500 hover:text-white transition font-semibold">Rechazar</button>
              </>
            )}
            <button onClick={() => handleEditComment(c)} className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg bg-transparent hover:bg-yellow-500 hover:text-white transition font-semibold">Editar</button>
            <button onClick={() => handleDeleteComment(c.id)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg bg-transparent hover:bg-red-500 hover:text-white transition font-semibold">Eliminar</button>
          </>
        )}
      />
      <AdminModal
        open={showModal}
        title={editingComment ? 'Editar Comentario' : 'Nuevo Comentario'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-[#23263A] border border-[#23262C] text-white font-semibold rounded-xl hover:bg-[#2d3143] transition cursor-pointer">Cancelar</button>
            <button type="submit" form="comment-form" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer">Guardar</button>
          </>
        }
      >
        <form id="comment-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium">Contenido</label>
            <textarea
              name="contenido"
              value={formData.contenido}
              onChange={handleInputChange}
              rows={5}
              className="w-full mt-1 p-4 bg-[#23263A] border border-[#23262C] text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </form>
      </AdminModal>

      <style>{`
        .comment-management {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 
            4px 4px 8px var(--neu-shadow-dark),
            -4px -4px 8px var(--neu-shadow-light);
        }

        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-actions h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-select, .filter-input {
          padding: 0.5rem;
          border-radius: 8px;
          border: none;
          background-color: var(--input-bg);
          color: var(--text-color);
          box-shadow: inset 2px 2px 5px var(--neu-shadow-dark),
                    inset -2px -2px 5px var(--neu-shadow-light);
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--text-color-muted);
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 600px;
          box-shadow: 4px 4px 10px var(--neu-shadow-dark),
                    -4px -4px 10px var(--neu-shadow-light);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
          background-color: var(--input-bg);
          color: var(--text-color);
          box-shadow: inset 2px 2px 5px var(--neu-shadow-dark),
                    inset -2px -2px 5px var(--neu-shadow-light);
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: var(--primary-color);
          color: white;
          box-shadow: 2px 2px 5px var(--neu-shadow-dark),
                    -2px -2px 5px var(--neu-shadow-light);
        }

        .btn-secondary {
          background-color: var(--card-bg);
          color: var(--text-color);
          box-shadow: 2px 2px 5px var(--neu-shadow-dark),
                    -2px -2px 5px var(--neu-shadow-light);
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn:active {
          box-shadow: inset 2px 2px 5px var(--neu-shadow-dark),
                    inset -2px -2px 5px var(--neu-shadow-light);
        }

        .error {
          color: #721c24;
          background-color: #f8d7da;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CommentManagement;