import './AdminTable.css';

interface Post {
  id: string;
  titulo: string;
  fecha_creacion: string;
  estado: string;
}

interface AdminTableProps {
  posts: Post[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AdminTable({ posts, onEdit, onDelete }: AdminTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id}>
            <td>{post.titulo}</td>
            <td>{formatDate(post.fecha_creacion)}</td>
            <td>
              <span className={`estado estado-${post.estado.toLowerCase()}`}>
                {post.estado}
              </span>
            </td>
            <td>
              <div className="acciones">
                <button 
                  className="btn btn-editar"
                  onClick={() => onEdit(post.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Editar</span>
                </button>
                <button 
                  className="btn btn-eliminar"
                  onClick={() => onDelete(post.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 