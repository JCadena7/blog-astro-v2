import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { evaluate } from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/**
 * Componente para mostrar la vista previa del contenido MDX
 */
export default function MdxPreview({ content, title }) {
  const [MDXContent, setMDXContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!content) {
        setMDXContent(() => () => <p>Sin contenido</p>);
        return;
      }
      try {
        const { default: Content } = await evaluate(content, {
          ...runtime,
          providerImportSource: '@mdx-js/react',
          outputFormat: 'function-body',
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
        });
        setMDXContent(() => Content);
        setError(null);
      } catch (err) {
        console.error('Error al evaluar MDX:', err);
        setError(err.message);
      }
    }
    load();
  }, [content]);

  if (error) {
    return <div className="text-red-500 py-4">Error al renderizar: {error}</div>;
  }
  if (!MDXContent) {
    return <div className="text-center py-4">Cargando vista previa...</div>;
  }

  const components = {
    h1: props => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
    h2: props => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
    h3: props => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
    p: props => <p className="my-3" {...props} />,
    ul: props => <ul className="list-disc pl-5 my-3" {...props} />,
    ol: props => <ol className="list-decimal pl-5 my-3" {...props} />,
    li: props => <li className="my-1" {...props} />,
    a: props => <a className="text-blue-600 hover:underline" {...props} />,
    blockquote: props => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
    code: props => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} />,
    pre: props => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto my-4" {...props} />,
    img: props => <img className="max-w-full h-auto my-4" {...props} />,
    table: props => <table className="min-w-full border-collapse my-4" {...props} />,
    th: props => <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800" {...props} />,
    td: props => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />
  };

  return (
    <div className="mdx-preview">
      <h1 className="text-3xl font-bold mb-6">{title || 'Sin título'}</h1>
      <div className="prose dark:prose-invert max-w-none">
        <MDXProvider components={components}>
          <MDXContent components={components} />
        </MDXProvider>
      </div>
    </div>
  );
}

MdxPreview.propTypes = {
  content: PropTypes.string,
  title: PropTypes.string
};

MdxPreview.defaultProps = {
  content: '',
  title: ''
};