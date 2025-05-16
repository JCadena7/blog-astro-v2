import type { APIRoute } from 'astro';
import { slugify } from '../../utils/slugify';
import { postsHelper } from '../../db/pgHelper.js';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const usuario_id = url.searchParams.get('usuario_id') ?? undefined;
    const autor_nombre = url.searchParams.get('autor_nombre') ?? undefined;
    const estado_nombre = url.searchParams.get('estado_nombre') ?? undefined;
    const categoriasParam = url.searchParams.get('categorias') ?? undefined;
    const categoriasFilter = categoriasParam ? categoriasParam.split(',').map(s => s.trim()) : [];

    const { posts, estados, categorias } = await postsHelper.getAllPosts({ usuario_id, autor_nombre, estado_nombre, categorias: categoriasFilter });
    return new Response(JSON.stringify({ posts, estados, categorias }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener posts:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const postId = await postsHelper.createPost(
      { ...data, slug: slugify(data.titulo) },
      data.usuario_id
    );
    return new Response(JSON.stringify({ id: postId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear el post:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const updated = await postsHelper.updatePost(
      data.id,
      data,
      data.usuario_id
    );
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al actualizar el post:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    await postsHelper.deletePost(data.id, data.usuario_id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar el post:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Cambiar estado de publicación de un post
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth;
    const authData = auth ? (typeof auth === 'function' ? auth() : auth) : undefined;
    if (!authData?.userId) {
      return new Response(JSON.stringify({
        error: 'No autorizado'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const data = await request.json();
    console.log("data de post en patch de status: ",data)
    const { postId, newStatus, comentario } = data;
    await postsHelper.changePostStatus(authData?.userId, postId, newStatus, comentario);
    return new Response(JSON.stringify({ mensaje: 'Estado de publicación actualizado exitosamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al cambiar estado de publicación:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};