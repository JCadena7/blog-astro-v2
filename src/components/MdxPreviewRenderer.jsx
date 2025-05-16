import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MDXProvider } from '@mdx-js/react';
import * as runtime from 'react/jsx-runtime';
import { compile } from '@mdx-js/mdx';

/**
 * Componente para renderizar contenido MDX en la vista previa
 * @param {Object} props
 * @param {string} props.content - Contenido MDX a renderizar
 */
export default function MdxPreviewRenderer({ content }) {
  const [Component, setComponent] = useState(() => () => null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function renderMdx() {
      if (!content) {
        setComponent(() => () => <p>Sin contenido</p>);
        return;
      }

      try {
        // Compilar el MDX a un componente React
        const code = await compile(content, {
          outputFormat: 'function-body',
          development: false,
          jsx: true,
        });

        // Crear un componente a partir del código compilado
        const { default: MDXContent } = await evaluate(String(code), runtime);
        setComponent(() => MDXContent);
        setError(null);
      } catch (err) {
        console.error('Error al renderizar MDX:', err);
        setError(`Error al renderizar: ${err.message}`);
        setComponent(() => () => <p>Error al renderizar el contenido</p>);
      }
    }

    renderMdx();
  }, [content]);

  // Función para evaluar el código compilado
  async function evaluate(code, { Fragment, jsx, jsxs }) {
    const fn = new Function('React', 'Fragment', 'jsx', 'jsxs', `${code}\nreturn MDXContent;`);
    return { default: fn(React, Fragment, jsx, jsxs) };
  }

  // Componentes personalizados para el MDX
  const components = {
    h1: (props) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
    h2: (props) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
    h3: (props) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
    p: (props) => <p className="my-3" {...props} />,
    ul: (props) => <ul className="list-disc pl-5 my-3" {...props} />,
    ol: (props) => <ol className="list-decimal pl-5 my-3" {...props} />,
    li: (props) => <li className="my-1" {...props} />,
    a: (props) => <a className="text-blue-600 hover:underline" {...props} />,
    blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
    code: (props) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} />,
    pre: (props) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto my-4" {...props} />,
    img: (props) => <img className="max-w-full h-auto my-4" {...props} />,
    table: (props) => <table className="min-w-full border-collapse my-4" {...props} />,
    th: (props) => <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800" {...props} />,
    td: (props) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />,
  };

  return (
    <div className="mdx-preview">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <MDXProvider components={components}>
          <Component />
        </MDXProvider>
      )}
    </div>
  );
}

MdxPreviewRenderer.propTypes = {
  content: PropTypes.string.isRequired
};