import { clerkClient } from '@clerk/clerk-sdk-node';
import db from '../../../db/pgHelper.js';

export const GET = async ({ request, locals }) => {
  // Verificar autenticación
  const auth = locals.auth;
  const authData = typeof auth === 'function' ? auth() : auth;
  try {
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const usuarioId = url.searchParams.get('usuarioId');
    
    let comentarios = [];
    
    // Filtrar por post o por usuario
    if (postId) {
      comentarios = await db.comentarios.getComentariosByPostId(postId);
    } else if (usuarioId) {
      // Verificar autenticación para ver comentarios de un usuario
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
      
      // Verificar si es el mismo usuario o un administrador
      const isAdmin = await db.query(
        `SELECT 1 FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.clerk_id = $1 AND r.nombre = $2`,
        [authData.userId, 'administrador']
      );
      
      const isUser = await db.query(
        'SELECT 1 FROM usuarios WHERE clerk_id = $1 AND id = $2',
        [authData.userId, usuarioId]
      );
      
      if (isAdmin.length === 0 && isUser.length === 0) {
        return new Response(JSON.stringify({
          error: 'No tienes permiso para ver estos comentarios'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      comentarios = await db.comentarios.getComentariosByUserId(usuarioId);
    } else {
      // Si no hay filtros, verificar si es administrador
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
      
      const isAdmin = await db.query(
        `SELECT 1 FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.clerk_id = $1 AND r.nombre = $2`,
        [authData.userId, 'administrador']
      );
      
      if (isAdmin.length === 0) {
        return new Response(JSON.stringify({
          error: 'Solo los administradores pueden ver todos los comentarios'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Obtener todos los comentarios (solo para administradores)
      comentarios = await db.query(
        `SELECT c.*, u.nombre as autor, p.titulo as post_titulo, p.slug as post_slug
         FROM comentarios c
         JOIN usuarios u ON c.usuario_id = u.id
         JOIN posts p ON c.post_id = p.id
         ORDER BY c.created_at DESC`
      );
    }
    
    return new Response(JSON.stringify({
      comentarios
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al obtener los comentarios:', error);
    return new Response(JSON.stringify({
      error: 'Error al obtener los comentarios'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST = async ({ request, locals }) => {
  try {
    // Verificar autenticación
    const auth = locals.auth;
    const authData = typeof auth === 'function' ? auth() : auth;
    
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
    const { contenido, postId, parentId } = data;
    
    // Validar datos requeridos
    if (!contenido || !postId) {
      return new Response(JSON.stringify({
        error: 'Contenido y postId son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Obtener el ID del usuario a partir del clerk_id
    const usuario = await db.query(
      'SELECT id FROM usuarios WHERE clerk_id = $1',
      [authData.userId]
    );
    
    if (usuario.length === 0) {
      return new Response(JSON.stringify({
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Crear el comentario
    const comentarioId = await db.comentarios.createComentario(
      { contenido, postId, parentId },
      usuario[0].id
    );
    
    return new Response(JSON.stringify({
      id: comentarioId,
      mensaje: 'Comentario creado exitosamente'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al crear el comentario:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al crear el comentario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};