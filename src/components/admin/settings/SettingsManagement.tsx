import React, { useState, useEffect } from 'react';

interface SiteSettings {
  id: number;
  site_title: string;
  site_description: string;
  contact_email: string;
  posts_per_page: number;
  allow_comments: boolean;
  social_media: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  theme_options: {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  };
}

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<SiteSettings>({ 
    id: 1,
    site_title: '',
    site_description: '',
    contact_email: '',
    posts_per_page: 10,
    allow_comments: true,
    social_media: {},
    theme_options: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }
      const data = await response.json();
      setSettings(data.settings);
      setFormData(data.settings);
    } catch (err) {
      setError('Error al cargar la configuración');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Manejar checkboxes
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // Manejar campos numéricos
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
      return;
    }
    
    // Manejar campos sociales
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [socialKey]: value
        }
      }));
      return;
    }
    
    // Manejar opciones de tema
    if (name.startsWith('theme_')) {
      const themeKey = name.replace('theme_', '');
      setFormData(prev => ({
        ...prev,
        theme_options: {
          ...prev.theme_options,
          [themeKey]: value
        }
      }));
      return;
    }
    
    // Manejar campos normales
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Error al guardar la configuración' });
      console.error('Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="settings-management">
      <div className="header-actions">
        <h2>Configuración General</h2>
        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-button ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Redes Sociales
        </button>
        <button 
          className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Apariencia
        </button>
        <button 
          className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comentarios
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Pestaña General */}
        <div className={`tab-content ${activeTab === 'general' ? 'active' : ''}`}>
          <div className="form-group">
            <label htmlFor="site_title">Título del Sitio</label>
            <input
              type="text"
              id="site_title"
              name="site_title"
              value={formData.site_title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="site_description">Descripción del Sitio</label>
            <textarea
              id="site_description"
              name="site_description"
              value={formData.site_description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact_email">Email de Contacto</label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="posts_per_page">Posts por Página</label>
            <input
              type="number"
              id="posts_per_page"
              name="posts_per_page"
              value={formData.posts_per_page}
              onChange={handleInputChange}
              min="1"
              max="50"
              required
            />
          </div>
        </div>

        {/* Pestaña Redes Sociales */}
        <div className={`tab-content ${activeTab === 'social' ? 'active' : ''}`}>
          <div className="form-group">
            <label htmlFor="social_facebook">Facebook</label>
            <input
              type="url"
              id="social_facebook"
              name="social_facebook"
              value={formData.social_media.facebook || ''}
              onChange={handleInputChange}
              placeholder="https://facebook.com/tu-pagina"
            />
          </div>
          <div className="form-group">
            <label htmlFor="social_twitter">Twitter</label>
            <input
              type="url"
              id="social_twitter"
              name="social_twitter"
              value={formData.social_media.twitter || ''}
              onChange={handleInputChange}
              placeholder="https://twitter.com/tu-usuario"
            />
          </div>
          <div className="form-group">
            <label htmlFor="social_instagram">Instagram</label>
            <input
              type="url"
              id="social_instagram"
              name="social_instagram"
              value={formData.social_media.instagram || ''}
              onChange={handleInputChange}
              placeholder="https://instagram.com/tu-usuario"
            />
          </div>
          <div className="form-group">
            <label htmlFor="social_linkedin">LinkedIn</label>
            <input
              type="url"
              id="social_linkedin"
              name="social_linkedin"
              value={formData.social_media.linkedin || ''}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/tu-perfil"
            />
          </div>
        </div>

        {/* Pestaña Apariencia */}
        <div className={`tab-content ${activeTab === 'appearance' ? 'active' : ''}`}>
          <div className="form-group">
            <label htmlFor="theme_primary_color">Color Primario</label>
            <div className="color-picker-container">
              <input
                type="color"
                id="theme_primary_color"
                name="theme_primary_color"
                value={formData.theme_options.primary_color || '#007bff'}
                onChange={handleInputChange}
              />
              <input
                type="text"
                value={formData.theme_options.primary_color || '#007bff'}
                onChange={handleInputChange}
                name="theme_primary_color"
                className="color-text-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="theme_secondary_color">Color Secundario</label>
            <div className="color-picker-container">
              <input
                type="color"
                id="theme_secondary_color"
                name="theme_secondary_color"
                value={formData.theme_options.secondary_color || '#6c757d'}
                onChange={handleInputChange}
              />
              <input
                type="text"
                value={formData.theme_options.secondary_color || '#6c757d'}
                onChange={handleInputChange}
                name="theme_secondary_color"
                className="color-text-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="theme_font_family">Fuente Principal</label>
            <select
              id="theme_font_family"
              name="theme_font_family"
              value={formData.theme_options.font_family || 'Poppins'}
              onChange={handleInputChange}
            >
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
            </select>
          </div>
        </div>

        {/* Pestaña Comentarios */}
        <div className={`tab-content ${activeTab === 'comments' ? 'active' : ''}`}>
          <div className="form-group checkbox-group">
            <label htmlFor="allow_comments" className="checkbox-label">
              <input
                type="checkbox"
                id="allow_comments"
                name="allow_comments"
                checked={formData.allow_comments}
                onChange={handleInputChange}
              />
              <span>Permitir comentarios en los posts</span>
            </label>
          </div>
          <div className="comments-info">
            <p>Configuración adicional de comentarios:</p>
            <ul>
              <li>Los comentarios nuevos requieren aprobación antes de ser publicados.</li>
              <li>Los usuarios deben proporcionar nombre y correo electrónico para comentar.</li>
              <li>Los comentarios pueden ser moderados desde la sección de Comentarios.</li>
            </ul>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManagement;