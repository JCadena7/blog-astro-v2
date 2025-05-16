import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MdxPreview from './MdxPreview';

/**
 * Componente que maneja la funcionalidad de vista previa para el editor MDX
 * @param {Object} props
 * @param {string} props.editorId - ID del editor MDX
 */
export default function PreviewButton({ editorId }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const handlePreviewClick = () => {
    // Obtener el contenido del editor MDX
    if (window.getEditorContent) {
      const content = window.getEditorContent(editorId);
      // Obtener el título del formulario
      const titleInput = document.getElementById('title');
      const title = titleInput?.value || '';
      
      setPreviewContent(content);
      setPreviewTitle(title);
      setShowPreview(true);
    } else {
      console.error('La función getEditorContent no está disponible');
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <>
      <button 
        type="button" 
        onClick={handlePreviewClick}
        className="btn btn-secondary"
      >
        Vista Previa
      </button>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Vista Previa</h2>
              <button 
                onClick={handleClosePreview}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </>
  );
}

PreviewButton.propTypes = {
  editorId: PropTypes.string.isRequired
};