import type { APIRoute } from 'astro';
import { pool } from '../../db/pool';

export const GET: APIRoute = async () => {
  try {
    const client = await pool.connect();
    try {
      // Obtener roles con sus permisos
      const roles = await client.query(`
        SELECT r.*, 
               array_agg(DISTINCT p.nombre) as permisos
        FROM roles r
        LEFT JOIN roles_permisos rp ON r.id = rp.rol_id
        LEFT JOIN permisos p ON rp.permiso_id = p.id
        GROUP BY r.id
        ORDER BY r.nombre
      `);

      // Obtener todos los permisos disponibles
      const permisos = await client.query(`
        SELECT * FROM permisos
        ORDER BY nombre
      `);

      return new Response(JSON.stringify({
        roles: roles.rows,
        permisos: permisos.rows
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
        `INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *`,
        [data.nombre, data.descripcion]
      );

      // Si hay permisos, insertarlos
      if (data.permisos && data.permisos.length > 0) {
        const rolId = result.rows[0].id;
        for (const permiso of data.permisos) {
          let permisoIdValue = permiso;
          if (typeof permiso === 'string') {
            const permisoRes = await client.query(
              `SELECT id FROM permisos WHERE nombre = $1`,
              [permiso]
            );
            if (permisoRes.rowCount === 0) {
              throw new Error(`Permiso no encontrado: ${permiso}`);
            }
            permisoIdValue = permisoRes.rows[0].id;
          }
          await client.query(
            `INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
            [rolId, permisoIdValue]
          );
        }
      }

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
    console.error('Error al crear el rol:', error);
    return new Response(JSON.stringify({
      error: 'Error al crear el rol'
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
    console.log('data de rol', data);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `UPDATE roles SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *`,
        [data.nombre, data.descripcion, data.id]
      );

      // Actualizar permisos
      if (data.permisos) {
        // Eliminar permisos existentes
        await client.query(
          `DELETE FROM roles_permisos WHERE rol_id = $1`,
          [data.id]
        );

        // Insertar nuevos permisos
        if (data.permisos.length > 0) {
          for (const permiso of data.permisos) {
            let permisoIdValue = permiso;
            if (typeof permiso === 'string') {
              const permisoRes = await client.query(
                `SELECT id FROM permisos WHERE nombre = $1`,
                [permiso]
              );
              if (permisoRes.rowCount === 0) {
                throw new Error(`Permiso no encontrado: ${permiso}`);
              }
              permisoIdValue = permisoRes.rows[0].id;
            }
            await client.query(
              `INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
              [data.id, permisoIdValue]
            );
          }
        }
      }

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
    console.error('Error al actualizar el rol:', error);
    return new Response(JSON.stringify({
      error: 'Error al actualizar el rol'
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
      // Eliminar permisos asociados
      await client.query(
        `DELETE FROM roles_permisos WHERE rol_id = $1`,
        [data.id]
      );

      // Eliminar el rol
      await client.query(
        `DELETE FROM roles WHERE id = $1`,
        [data.id]
      );

      return new Response(null, {
        status: 204
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar el rol:', error);
    return new Response(JSON.stringify({
      error: 'Error al eliminar el rol'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 