import type { APIRoute } from 'astro';
import { pool } from '../../../db/pool';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const clerk_id = url.searchParams.get('clerk_id');
  if (!clerk_id) {
    return new Response(JSON.stringify({ error: 'clerk_id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const client = await pool.connect();
  try {
    // Obtener rol del usuario
    const userRes = await client.query(
      'SELECT rol_id FROM usuarios WHERE clerk_id = $1',
      [clerk_id]
    );
    if (userRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { rol_id } = userRes.rows[0];

    // Obtener permisos del rol
    const permRes = await client.query(
      `SELECT p.nombre AS permiso
       FROM permisos p
       JOIN roles_permisos rp ON rp.permiso_id = p.id
       WHERE rp.rol_id = $1`,
      [rol_id]
    );
    const permisos = permRes.rows.map((r: { permiso: string }) => r.permiso);

    return new Response(JSON.stringify({ permisos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error al obtener permisos:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    client.release();
  }
};