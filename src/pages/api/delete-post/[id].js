import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET({ params, redirect }) {
  try {
    const { id } = params;
    
    // Definir la ruta del directorio de contenido
    const contentDir = path.join(process.cwd(), 'src', 'content', 'blog');
    let filePath = null;
    
    // Intentar encontrar el archivo con extensión .mdx o .md
    try {
      const mdxPath = path.join(contentDir, `${id}.mdx`);
      await fs.access(mdxPath);
      filePath = mdxPath;
    } catch (error) {
      try {
        const mdPath = path.join(contentDir, `${id}.md`);
        await fs.access(mdPath);
        filePath = mdPath;
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Archivo de post no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Eliminar el archivo
    if (filePath) {
      await fs.unlink(filePath);
    }
    
    // Redireccionar al panel de administración
    return redirect('/admin', 303);
  } catch (error) {
    console.error('Error al eliminar post:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar el post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 