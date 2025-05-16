import db from '../../../db/pgHelper.js';
import { pool } from '../../../db/pool.js';

export const GET = async ({ params }) => {
  try {
    const { id } = params;
    
    // Obtener la categoría por ID
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM categorias WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({
          error: 'Categoría no encontrada'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Obtener posts relacionados con esta categoría
      const postsResult = await client.query(`
        SELECT p.id, p.titulo, p.slug, p.extracto, p.imagen_destacada, p.fecha_publicacion
        FROM posts p
        JOIN posts_categorias pc ON p.id = pc.post_id
        JOIN estados_publicacion e ON p.estado_id = e.id
        WHERE pc.categoria_id = $1 AND e.nombre = 'publicado'
        ORDER BY p.fecha_publicacion DESC
      `, [id]);
      
      return new Response(JSON.stringify({
        categoria: result.rows[0],
        posts: postsResult.rows
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
    console.error('Error al obtener la categoría:', error);
    return new Response(JSON.stringify({
      error: 'Error al obtener la categoría'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const PUT = async ({ request, params, locals }) => {
  try {
    // Verificar autenticación
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
    
    const { id } = params;
    const data = await request.json();
    const { nombre, slug, descripcion, color, icono } = data;

    
    
    // if (!isAdmin) {
    //   return new Response(JSON.stringify({
    //     error: 'Solo los administradores pueden actualizar categorías'
    //   }), {
    //     status: 403,
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });
    // }
    
    // Actualizar la categoría usando helper
    const updatedCategoria = await db.categorias.updateCategoria(
      id,
      { nombre, slug, descripcion, color, icono },
      authData.userId
    );
    return new Response(JSON.stringify({
      categoria: updatedCategoria,
      mensaje: 'Categoría actualizada exitosamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al actualizar la categoría:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al actualizar la categoría'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE = async ({ params, locals }) => {
  try {
    // Verificar autenticación
    const auth = locals.auth;
    const authData = auth ? (typeof auth === 'function' ? auth() : auth) : undefined;
    console.log("Datos del usuario de authData.userid", authData.userId);
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
    // console.log("Datos de la categoria el id: ", id);

    const clerkId = authData.userId;
    // console.log("clerkId de id de categoria: ", clerkId);
      
      // Eliminar la categoría usando helper
      // console.log("clerkId de id de categoria: ", clerkId);
      // console.log("id de id de categoria: ", id);
      // const deletedId = await db.categoriasHelper.deleteCategoria(id, clerkId);
      const deletedId = await db.categorias.deleteCategoria(id, clerkId);
      // console.log("deletedId: ", deletedId);
      return new Response(JSON.stringify({
        id: deletedId,
        mensaje: 'Categoría eliminada exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
  } catch (error) { 
    console.error('Error al eliminar la categoría:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al eliminar la categoría'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};