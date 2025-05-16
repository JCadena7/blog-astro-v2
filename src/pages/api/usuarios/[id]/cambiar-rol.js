import { usuariosHelper } from '../../../../utils/usuariosHelper.js';

/**
 * Endpoint API para cambiar el rol de un usuario
 * POST /api/usuarios/:id/cambiar-rol
 */
export async function POST({ request, params, locals }) {
  try {
    // Verificar autenticación ejecutando la función auth
    const auth = locals.auth;
    const authObject = auth(); // Obtenemos el objeto de autenticación
    
    if (!authObject?.userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar rol administrador
    const isAdmin = await checkUserIsAdmin(authObject.userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acceso prohibido. Se requiere rol de administrador.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener ID desde los parámetros de ruta
    const { id } = params;
    
    // Validar ID
    if (!id || isNaN(Number(id))) {
      return new Response(JSON.stringify({ error: 'ID de usuario inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar rol_id
    if (!data.rol_id || isNaN(Number(data.rol_id))) {
      return new Response(JSON.stringify({ error: 'ID de rol inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Cambiar rol del usuario
    const usuario = await usuariosHelper.cambiarRolUsuario(id, data.rol_id);
    
    return new Response(JSON.stringify({
      message: 'Rol actualizado correctamente',
      usuario
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const status = 
      errorMessage.includes('inválido') ? 400 :
      errorMessage.includes('no encontrado') ? 404 : 500;
    
    return new Response(JSON.stringify({ error: `Error al cambiar rol: ${errorMessage}` }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función auxiliar para verificar si un usuario es administrador
async function checkUserIsAdmin(clerkId) {
  try {
    const usuario = await usuariosHelper.getUsuarioByClerkId(clerkId);
    return usuario && usuario.rol === 'administrador';
  } catch (error) {
    console.error('Error al verificar rol de usuario:', error);
    return false;
  }
} 