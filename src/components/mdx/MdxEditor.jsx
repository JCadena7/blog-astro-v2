import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import '@mdxeditor/editor/style.css';
import { MDXEditor } from '@mdxeditor/editor';
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  diffSourcePlugin,
  markdownShortcutPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
  UndoRedo,
  InsertFrontmatter,
  StrikeThroughSupSubToggles,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  ChangeCodeMirrorLanguage,
  ConditionalContents
} from '@mdxeditor/editor';

/**
 * @typedef {Object} MdxEditorProps
 * @property {string} [initialContent=''] - Contenido inicial del editor
 * @property {function} onChange - Función que se llama cuando cambia el contenido
 * @property {string} id - ID único para el editor
 */

/**
 * Componente del editor MDX
 * @param {MdxEditorProps} props
 */
export default function MdxEditor({ initialContent = '', onChange, id }) {
  const handleChange = useCallback((content) => {
    // console.log('Editor content changed:', content);
    if (onChange) {
      onChange(content);
    }
  }, [onChange]);

  const handleEditorError = (error) => {
    // console.error('Editor error:', error);
  };

  // Agregar log para verificar el contenido inicial
  // console.log('Initial content received:', initialContent);

  return (
    <div className="mdx-editor-wrapper" id={id}>
      <style>{`
        .mdx-editor-wrapper {
          --editor-toolbar-bg: #f8fafc;
          --editor-toolbar-border: #e2e8f0;
          border: 1px solid var(--editor-toolbar-border);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .dark .mdx-editor-wrapper {
          --editor-toolbar-bg: #1e293b;
          --editor-toolbar-border: #334155;
        }

        .mdx-toolbar {
          background: var(--editor-toolbar-bg) !important;
          border-bottom: 1px solid var(--editor-toolbar-border) !important;
          padding: 0.5rem !important;
          gap: 0.5rem !important;
        }

        .mdx-editor {
          padding: 1rem;
          min-height: 200px;
          background-color: white;
          color: #1a1a1a !important;
        }

        .dark .mdx-editor {
          background-color: #1e293b;
          color: #e5e7eb !important;
        }

        /* Estilos para el área editable */
        [contenteditable="true"] {
          outline: none !important;
          cursor: text;
          min-height: 150px;
          padding: 1rem;
          line-height: 1.5;
          font-size: 1rem;
          color: inherit !important;
          white-space: pre-wrap;
          word-break: break-word;
          -webkit-user-modify: read-write-plaintext-only;
        }

        /* Estilos para el contenedor del editor */
        .prose {
          max-width: none !important;
          width: 100%;
        }

        /* Estilos para el texto con formato */
        [data-mdx-editor] {
          font-family: system-ui, -apple-system, sans-serif;
          color: inherit !important;
        }

        /* Estilos para el placeholder */
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        /* Estilos para el texto seleccionado */
        ::selection {
          background-color: #60a5fa;
          color: white;
        }

        /* Estilos para los botones de la barra de herramientas */
        button[data-active="true"] {
          background-color: #e2e8f0;
          color: #1a1a1a;
        }

        .dark button[data-active="true"] {
          background-color: #334155;
          color: #e5e7eb;
        }

        /* Asegurar que el texto sea visible */
        .mdx-editor p,
        .mdx-editor h1,
        .mdx-editor h2,
        .mdx-editor h3,
        .mdx-editor h4,
        .mdx-editor h5,
        .mdx-editor h6,
        .mdx-editor ul,
        .mdx-editor ol,
        .mdx-editor li {
          color: inherit !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
      <MDXEditor
        onChange={handleChange}
        markdown={initialContent}
        contentEditableClassName="prose dark:prose-invert max-w-none mdx-editor"
        onError={handleEditorError}
        suppressHtmlProcessing={false}
        placeholder="Escribe tu contenido aquí..."
        readOnly={false}
        autoFocus
        onMount={(editor) => {
          // console.log('Editor mounted, current content:', editor.getMarkdown());
        }}
        plugins={[
          // Plugins de estructura
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          
          // Plugins de contenido enriquecido
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          
          // Plugins de código
          codeBlockPlugin({
            defaultCodeBlockLanguage: 'javascript'
          }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              javascript: 'JavaScript',
              typescript: 'TypeScript',
              python: 'Python',
              html: 'HTML',
              css: 'CSS'
            }
          }),
          
          // Plugins de utilidad
          frontmatterPlugin(),
          diffSourcePlugin(),
          markdownShortcutPlugin(),
          
          // Plugin de la barra de herramientas (debe ir al final)
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap gap-2 p-2">
                <div className="flex items-center gap-1 border-r pr-2">
                  <BlockTypeSelect />
                </div>
                
                <div className="flex items-center gap-1 border-r pr-2">
                  <BoldItalicUnderlineToggles />
                  <StrikeThroughSupSubToggles />
                </div>
                
                <div className="flex items-center gap-1 border-r pr-2">
                  <ListsToggle />
                </div>
                
                <div className="flex items-center gap-1 border-r pr-2">
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                </div>

                <div className="flex items-center gap-1 border-r pr-2">
                  <ConditionalContents
                    options={[
                      {
                        when: (editor) => editor?.editorType === 'codeblock',
                        contents: () => <ChangeCodeMirrorLanguage />
                      },
                      {
                        fallback: () => <InsertCodeBlock />
                      }
                    ]}
                  />
                </div>

                <div className="flex items-center gap-1 border-r pr-2">
                  <InsertFrontmatter />
                </div>
                
                <div className="flex items-center gap-1">
                  <DiffSourceToggleWrapper />
                  <UndoRedo />
                </div>
              </div>
            )
          })
        ]}
      />
    </div>
  );
}

MdxEditor.propTypes = {
  initialContent: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string.isRequired
}; 