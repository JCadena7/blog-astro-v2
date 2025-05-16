import fs from 'node:fs/promises';
import path from 'node:path';
import { getCollection } from 'astro:content';

export async function POST({ request, params, redirect }) {
  try {
    const { id } = params;
    const formData = await request.formData();
    
    // Obtener los datos del formulario
    const title = formData.get('title');
    const description = formData.get('description');
    const heroImage = formData.get('heroImage') || '';
    const content = formData.get('content');
    
    // Validar datos requeridos
    if (!title || !description || !content) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar el post existente para obtener la fecha de publicación original
    const posts = await getCollection('blog');
    const post = posts.find(p => p.id === id);
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Mantener la fecha de publicación original
    const pubDate = post.data.pubDate.toISOString();
    const updatedDate = new Date().toISOString();
    
    // Crear el frontmatter actualizado
    const frontmatter = `---
title: ${title}
description: ${description}
pubDate: ${pubDate}
updatedDate: ${updatedDate}${heroImage ? `\nheroImage: ${heroImage}` : ''}
---`;
    
    // Contenido completo del archivo actualizado
    const fileContent = `${frontmatter}\n\n${content}`;
    
    // Determinar la extensión del archivo original (.md o .mdx)
    const contentDir = path.join(process.cwd(), 'src', 'content', 'blog');
    let contentPath;
    
    // Intentar encontrar el archivo con extensión .mdx o .md
    try {
      const mdxPath = path.join(contentDir, `${id}.mdx`);
      await fs.access(mdxPath);
      contentPath = mdxPath;
    } catch (error) {
      try {
        const mdPath = path.join(contentDir, `${id}.md`);
        await fs.access(mdPath);
        contentPath = mdPath;
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Archivo de post no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Actualizar el archivo
    await fs.writeFile(contentPath, fileContent, 'utf-8');
    
    // Redireccionar al panel de administración
    return redirect('/admin', 303);
  } catch (error) {
    console.error('Error al actualizar post:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar el post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 