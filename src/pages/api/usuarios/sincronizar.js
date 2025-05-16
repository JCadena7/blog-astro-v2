import { clerkClient } from '@clerk/clerk-sdk-node';
import { pgQuery } from '../../../db/pgHelper';

/**
 * Endpoint API para sincronizar manualmente un usuario de Clerk con la base de datos local
 * Útil para depuración y resolución de problemas
 * POST /api/usuarios/sincronizar
 */
export async function POST({ locals }) {
  try {
    // Verificar autenticación
    const auth = locals.auth;
    console.log('Auth recibido:', auth);
    
    const authData = typeof auth === 'function' ? auth() : auth;
    console.log('AuthData procesado:', authData);
    
    if (!authData?.userId) {
      console.log('No se encontró userId en authData');
      return new Response(JSON.stringify({
        error: 'No autorizado'
      }), { status: 401 });
    }
    
    // Obtener información del usuario desde Clerk
    const user = await clerkClient.users.getUser(authData.userId);
    console.log('Usuario de Clerk:', user);

    // Verificar si el usuario ya existe en la base de datos
    const existingUser = await pgQuery(
      'SELECT * FROM usuarios WHERE clerk_id = $1',
      [user.id]
    );

    if (existingUser.length > 0) {
      // El usuario ya existe, actualizamos sus datos
      const result = await pgQuery(
        'UPDATE usuarios SET email = $2, nombre = $3 WHERE clerk_id = $1 RETURNING *',
        [
          user.id,
          user.emailAddresses[0]?.emailAddress || '',
          `${user.firstName || ''} ${user.lastName || ''}`.trim()
        ]
      );

      return new Response(JSON.stringify({
        message: 'Usuario actualizado correctamente',
        user: result[0],
        wasSync: false
      }), { status: 200 });
    }
    
    // El usuario no existe, lo creamos
    const result = await pgQuery(
      'INSERT INTO usuarios (clerk_id, email, nombre, rol_id) VALUES ($1, $2, $3, 3) RETURNING *',
      [
        user.id,
        user.emailAddresses[0]?.emailAddress || '',
        `${user.firstName || ''} ${user.lastName || ''}`.trim()
      ]
    );
    
    return new Response(JSON.stringify({
      message: 'Usuario sincronizado correctamente',
      user: result[0],
      wasSync: true,
      debug: {
        authType: typeof auth,
        authData: authData
      }
    }), { status: 201 });
  } catch (error) {
    console.error('Error al sincronizar usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error al sincronizar usuario',
      details: error.message,
      needsSync: true
    }), { status: 500 });
  }
} 