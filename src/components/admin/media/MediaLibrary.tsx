import React, { useState, useEffect } from 'react';

interface Media {
  id: number;
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  usuario_id: number;
  usuario_nombre: string;
  created_at: Date;
}

const MediaLibrary: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error('Error al cargar la biblioteca de medios');
      }
      const data = await response.json();
      setMedia(data.media || []);
    } catch (err) {
      setError('Error al cargar la biblioteca de medios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/media/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          fetchMedia();
          setShowModal(false);
          setSelectedFile(null);
          setUploadProgress(0);
        } else {
          throw new Error('Error al subir el archivo');
        }
      };

      xhr.onerror = () => {
        throw new Error('Error de red al subir el archivo');
      };

      xhr.send(formData);
    } catch (err) {
      setError('Error al subir el archivo');
      console.error('Error:', err);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMedia(media.filter(item => item.id !== mediaId));
      } else {
        throw new Error('Error al eliminar el archivo');
      }
    } catch (err) {
      setError('Error al eliminar el archivo');
      console.error('Error:', err);
    }
  };

  const filteredMedia = media.filter(item => {
    // Filtrar por tipo
    if (filter !== 'all' && item.tipo !== filter) return false;
    
    // Filtrar por término de búsqueda
    if (searchTerm && !item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="media-library">
      <div className="header-actions">
        <h2>Biblioteca de Medios</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Subir Archivo
        </button>
      </div>

      <div className="filter-controls">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Buscar archivos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select 
          className="filter-select" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos los archivos</option>
          <option value="image">Imágenes</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="document">Documentos</option>
          <option value="other">Otros</option>
        </select>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="empty-state">
          <p>No hay archivos disponibles. ¡Sube un archivo para empezar!</p>
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <div key={item.id} className="media-card">
              <div className="media-preview">
                {item.tipo.startsWith('image') ? (
                  <img src={item.url} alt={item.nombre} />
                ) : item.tipo.startsWith('video') ? (
                  <div className="video-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                      <line x1="7" y1="2" x2="7" y2="22"></line>
                      <line x1="17" y1="2" x2="17" y2="22"></line>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <line x1="2" y1="7" x2="7" y2="7"></line>
                      <line x1="2" y1="17" x2="7" y2="17"></line>
                      <line x1="17" y1="17" x2="22" y2="17"></line>
                      <line x1="17" y1="7" x2="22" y2="7"></line>
                    </svg>
                  </div>
                ) : item.tipo.startsWith('audio') ? (
                  <div className="audio-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                ) : (
                  <div className="document-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              <div className="media-info">
                <h3 className="media-name">{item.nombre}</h3>
                <p className="media-meta">
                  <span className="media-type">{item.tipo.split('/')[1]}</span>
                  <span className="media-size">{formatFileSize(item.tamaño)}</span>
                </p>
              </div>
              <div className="media-actions">
                <button 
                  className="btn-icon" 
                  title="Copiar URL"
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    alert('URL copiada al portapapeles');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button 
                  className="btn-icon btn-delete" 
                  title="Eliminar"
                  onClick={() => handleDeleteMedia(item.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Subir Archivo</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowModal(false);
                  setSelectedFile(null);
                  setUploadProgress(0);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label htmlFor="file">Seleccionar archivo</label>
                <input 
                  type="file" 
                  id="file" 
                  onChange={handleFileChange} 
                  required 
                />
              </div>
              {selectedFile && (
                <div className="selected-file">
                  <p>Archivo seleccionado: {selectedFile.name}</p>
                  <p>Tamaño: {formatFileSize(selectedFile.size)}</p>
                </div>
              )}
              {uploadProgress > 0 && (
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <span className="progress-text">{uploadProgress}%</span>
                </div>
              )}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!selectedFile || uploadProgress > 0}
                >
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;