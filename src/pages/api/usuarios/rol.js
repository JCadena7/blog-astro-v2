import { pool } from '../../../db/pool.js';

export const GET = async ({ url, locals }) => {
  try {
    const clerk_id = url.searchParams.get('clerk_id');
    
    if (!clerk_id) {
      return new Response(JSON.stringify({ error: 'clerk_id es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = `
      SELECT r.nombre as rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.clerk_id = $1
    `;

    const result = await pool.query(query, [clerk_id]);
    // console.log(result.rows);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ rol: result.rows[0].rol }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener el rol:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}