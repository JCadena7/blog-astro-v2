import type { APIRoute } from 'astro';
import { pool } from '../../db/pool';

export const GET: APIRoute = async () => {
  try {
    const client = await pool.connect();
    try {
      // Obtener usuarios con rol y permisos
      const users = await client.query(`
        SELECT u.*, r.nombre as rol_nombre,
          (
            SELECT array_agg(p.nombre)
            FROM roles_permisos rp
            JOIN permisos p ON rp.permiso_id = p.id
            WHERE rp.rol_id = u.rol_id
          ) AS permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        ORDER BY u.created_at DESC
      `);

      // Obtener roles con sus permisos
      const roles = await client.query(`
        SELECT r.*, array_agg(p.nombre) AS permisos
        FROM roles r
        LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
        LEFT JOIN permisos p ON rp.permiso_id = p.id
        GROUP BY r.id
        ORDER BY r.nombre
      `);

      return new Response(JSON.stringify({
        users: users.rows,
        roles: roles.rows
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
    console.error('Error al obtener los datos:', error);
    return new Response(JSON.stringify({
      error: 'Error al obtener los datos'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO usuarios (nombre, email, rol_id) VALUES ($1, $2, $3) RETURNING *`,
        [data.nombre, data.email, data.rol_id]
      );

      return new Response(JSON.stringify(result.rows[0]), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error al crear el usuario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `UPDATE usuarios SET nombre = $1, email = $2, rol_id = $3 WHERE id = $4 RETURNING *`,
        [data.nombre, data.email, data.rol_id, data.id]
      );

      return new Response(JSON.stringify(result.rows[0]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error al actualizar el usuario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query(
        `DELETE FROM usuarios WHERE id = $1`,
        [data.id]
      );

      return new Response(null, {
        status: 204
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error al eliminar el usuario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 