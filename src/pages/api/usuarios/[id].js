import { usuariosHelper } from '../../../utils/usuariosHelper.js';
import { sanitizeData } from '../../../utils/validators.js';

/**
 * Endpoint API para gestionar usuarios individuales:
 * - GET: Obtener un usuario por ID
 * - PUT: Actualizar un usuario
 * - DELETE: Eliminar un usuario
 */

export async function GET({ request, params, locals }) {
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
    
    // Obtener ID desde los parámetros de ruta
    const { id } = params;
    
    // Validar ID
    if (!id || isNaN(Number(id))) {
      return new Response(JSON.stringify({ error: 'ID de usuario inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener usuario
    const usuario = await usuariosHelper.getUsuarioById(id);
    
    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(usuario), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({ error: `Error al obtener usuario: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request, params, locals }) {
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
    const userData = await request.json();
    
    // Sanitizar datos
    const sanitizedData = sanitizeData(userData);
    
    // Actualizar usuario
    const usuario = await usuariosHelper.updateUsuario(id, sanitizedData);
    
    return new Response(JSON.stringify(usuario), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const status = 
      errorMessage.includes('validación') ? 400 :
      errorMessage.includes('no encontrado') ? 404 : 500;
    
    return new Response(JSON.stringify({ error: `Error al actualizar usuario: ${errorMessage}` }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request, params, locals }) {
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
    
    // Eliminar usuario
    await usuariosHelper.deleteUsuario(id);
    
    return new Response(JSON.stringify({ message: 'Usuario eliminado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const status = errorMessage.includes('no encontrado') ? 404 : 500;
    
    return new Response(JSON.stringify({ error: `Error al eliminar usuario: ${errorMessage}` }), {
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