import { clerkClient } from '@clerk/clerk-sdk-node';
import db from '../../../db/pgHelper.js';
import { pool } from '../../../db/pool.js';

export const GET = async ({ params }) => {
  try {
    const { id } = params;
    
    // Obtener el comentario por ID
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT c.*, u.nombre as autor, p.titulo as post_titulo, p.slug as post_slug
        FROM comentarios c
        JOIN usuarios u ON c.usuario_id = u.id
        JOIN posts p ON c.post_id = p.id
        WHERE c.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({
          error: 'Comentario no encontrado'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Obtener respuestas a este comentario si es un comentario padre
      const respuestasResult = await client.query(`
        SELECT c.*, u.nombre as autor
        FROM comentarios c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.parent_id = $1
        ORDER BY c.created_at ASC
      `, [id]);
      
      return new Response(JSON.stringify({
        comentario: result.rows[0],
        respuestas: respuestasResult.rows
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener el comentario:', error);
    return new Response(JSON.stringify({
      error: 'Error al obtener el comentario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const PUT = async ({ request, params }) => {
  try {
    // Verificar autenticación
    const auth = request.locals?.auth;
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
    
    const { id } = params;
    const data = await request.json();
    const { contenido } = data;
    
    if (!contenido) {
      return new Response(JSON.stringify({
        error: 'El contenido es requerido'
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
    
    // Actualizar el comentario
    try {
      await db.comentarios.updateComentario(id, contenido, usuario[0].id);
      
      return new Response(JSON.stringify({
        mensaje: 'Comentario actualizado exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error al actualizar el comentario:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al actualizar el comentario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE = async ({ request, params }) => {
  try {
    // Verificar autenticación
    const auth = request.locals?.auth;
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
    
    const { id } = params;
    
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
    
    // Eliminar el comentario
    try {
      await db.comentarios.deleteComentario(id, usuario[0].id);
      
      return new Response(JSON.stringify({
        mensaje: 'Comentario eliminado exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error al eliminar el comentario:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al eliminar el comentario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
        }
      });
  }
};