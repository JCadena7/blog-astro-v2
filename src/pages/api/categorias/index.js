import { pool } from '../../../db/pool.js';
import db from '../../../db/pgHelper.js';

export const GET = async () => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM categorias ORDER BY nombre ASC');
      return new Response(JSON.stringify({
        categorias: result.rows
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
    console.error('Error al obtener las categorías:', error);
    return new Response(JSON.stringify({
      error: 'Error al obtener las categorías'
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
    // console.log("es esta el usuario v1", auth);
    // console.log("es esta el usuario v2", locals);
    // console.log("es esta el usuario v3", locals.auth().userId);
    const authData = auth ? (typeof auth === 'function' ? auth() : auth) : undefined;
    // console.log("es esta el usuario v4", authData);
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
    const { nombre, slug, descripcion, color, icono } = data;

    // console.log("Datos del usuario", data);
    
    // Validar datos requeridos
    if (!nombre || !slug) {
      return new Response(JSON.stringify({
        error: 'Nombre y slug son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // console.log("Datos del usuario de authData.userid", authData.userId);
    // Crear la categoría
    const categoriaId = await db.categorias.createCategoria(
      { nombre, slug, descripcion, color, icono }, 
      authData.userId
    );
    
    return new Response(JSON.stringify({
      id: categoriaId,
      mensaje: 'Categoría creada exitosamente'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al crear la categoría:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al crear la categoría'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};