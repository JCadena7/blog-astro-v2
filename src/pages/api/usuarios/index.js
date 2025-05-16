import { usuariosHelper } from '../../../utils/usuariosHelper.js';
import { validatePaginationParams, sanitizeData } from '../../../utils/validators.js';

/**
 * Endpoint API para listar usuarios (GET) y crear usuarios (POST)
 */

export async function GET({ request, locals }) {
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
    
    // Obtener parámetros de consulta para paginación
    const url = new URL(request.url);
    const params = {
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit')
    };
    
    // Validar parámetros de paginación
    const { page, limit } = validatePaginationParams(params);
    
    // Obtener usuarios
    const result = await usuariosHelper.getUsuarios(page, limit);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({ error: `Error al obtener usuarios: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals }) {
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
    
    // Obtener datos del cuerpo de la solicitud
    const userData = await request.json();
    
    // Sanitizar y validar datos (la validación completa se hace en el helper)
    const sanitizedData = sanitizeData(userData);
    
    // Crear usuario
    const result = await usuariosHelper.createUsuario(sanitizedData);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const status = errorMessage.includes('validación') ? 400 : 500;
    
    return new Response(JSON.stringify({ error: `Error al crear usuario: ${errorMessage}` }), {
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