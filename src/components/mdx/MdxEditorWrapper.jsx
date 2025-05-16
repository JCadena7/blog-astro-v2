import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MdxEditor from './MdxEditor';

/**
 * @typedef {Object} MdxEditorWrapperProps
 * @property {string} id - ID único para el editor
 * @property {string} [initialContent=''] - Contenido inicial del editor
 */

/**
 * Componente wrapper para el editor MDX
 * @param {MdxEditorWrapperProps} props
 */
export default function MdxEditorWrapper({ id, initialContent = '' }) {
  const contentRef = useRef(initialContent);

  // Agregar log para verificar el contenido inicial en el wrapper
  // console.log('MdxEditorWrapper - Initial content:', initialContent);

  useEffect(() => {
    // console.log('MdxEditorWrapper - Setting up getEditorContent');
    // Exponer la función getEditorContent al objeto window
    window.getEditorContent = (editorId) => {
      // console.log('getEditorContent called for id:', editorId);
      if (editorId === id) {
        // console.log('Returning content:', contentRef.current);
        return contentRef.current;
      }
      return '';
    };

    // Limpiar al desmontar
    return () => {
      if (window.getEditorContent && window.getEditorContent.name === id) {
        delete window.getEditorContent;
      }
    };
  }, [id]);

  const handleChange = (content) => {
    // console.log('MdxEditorWrapper - Content changed:', content);
    contentRef.current = content;
  };

  return (
    <MdxEditor
      id={id}
      initialContent={initialContent}
      onChange={handleChange}
    />
  );
}

MdxEditorWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  initialContent: PropTypes.string
}; 