import { pool } from '../../../db/pool';

export async function DELETE({ params, locals }) {
  try {
    // Verificar autenticación
    if (!locals.auth) {
      return new Response(JSON.stringify({ error: 'Error de configuración en autenticación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const authData = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
    
    if (!authData?.userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;

    // Verificar si el usuario es administrador o el autor del post
    const userResult = await pool.query(
      `SELECT r.nombre as rol 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.clerk_id = $1`,
      [authData.userId]
    );

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isAdmin = userResult.rows[0].rol === 'administrador';

    // Si no es admin, verificar si es el autor
    if (!isAdmin) {
      const postResult = await pool.query(
        `SELECT 1 FROM posts p 
         JOIN usuarios u ON p.usuario_id = u.id 
         WHERE p.id = $1 AND u.clerk_id = $2`,
        [id, authData.userId]
      );

      if (postResult.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'No tienes permiso para eliminar este post' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Eliminar el post
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    return new Response(JSON.stringify({ message: 'Post eliminado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar el post: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 