import db from '../db/pgHelper.js';
import { ENV } from '../config/env.js';

// Función de validación de datos de usuario
function validateUserData(clerkUser) {
  const errors = [];

  // Validar ID de Clerk
  if (!clerkUser.id || typeof clerkUser.id !== 'string' || clerkUser.id.trim() === '') {
    errors.push('ID de Clerk inválido o vacío');
  }

  // Validar nombre
  if (!clerkUser.firstName || typeof clerkUser.firstName !== 'string') {
    errors.push('Nombre inválido o vacío');
  }

  // Validar apellido
  if (!clerkUser.lastName || typeof clerkUser.lastName !== 'string') {
    errors.push('Apellido inválido o vacío');
  }

  // Validar email
  if (!clerkUser.emailAddresses || 
      !Array.isArray(clerkUser.emailAddresses) || 
      clerkUser.emailAddresses.length === 0 ||
      !clerkUser.emailAddresses[0].emailAddress ||
      typeof clerkUser.emailAddresses[0].emailAddress !== 'string') {
    errors.push('Email inválido o vacío');
  } else {
    // Validar formato de email utilizando expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clerkUser.emailAddresses[0].emailAddress)) {
      errors.push('Formato de email inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function syncUserWithClerk(clerkUser) {
  // Verificar que tenemos las variables de entorno necesarias para sincronizar
  if (!ENV.CLERK_SECRET_KEY) {
    console.warn('⚠️ CLERK_SECRET_KEY no está configurada. La sincronización podría fallar.');
  }

  // Validar datos antes de proceder
  const validation = validateUserData(clerkUser);
  if (!validation.isValid) {
    throw new Error(`Error de validación: ${validation.errors.join(', ')}`);
  }

  // Sanitizar datos
  const firstName = clerkUser.firstName.trim();
  const lastName = clerkUser.lastName.trim();
  const email = clerkUser.emailAddresses[0].emailAddress.trim().toLowerCase();
  const nombreCompleto = `${firstName} ${lastName}`;
  
  try {
    // Verificar si el usuario ya existe
    const existingUsers = await db.query(
      'SELECT * FROM usuarios WHERE clerk_id = $1',
      [clerkUser.id]
    );
    
    if (existingUsers.length > 0) {
      // Actualizar usuario existente
      const updatedUser = await db.query(
        `UPDATE usuarios 
         SET nombre = $1, email = $2, updated_at = CURRENT_TIMESTAMP
         WHERE clerk_id = $3
         RETURNING *`,
        [nombreCompleto, email, clerkUser.id]
      );
      return updatedUser[0];
    } else {
      // Crear nuevo usuario con rol por defecto (comentador)
      const rolComentador = await db.query(
        'SELECT id FROM roles WHERE nombre = $1',
        ['comentador']
      );
      
      if (!rolComentador.length) {
        throw new Error('Rol de comentador no encontrado en la base de datos');
      }
      
      const result = await db.query(
        `INSERT INTO usuarios (clerk_id, nombre, email, rol_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          clerkUser.id, 
          nombreCompleto, 
          email,
          rolComentador[0].id
        ]
      );
      
      return result[0];
    }
  } catch (error) {
    console.error('Error en sincronización de usuario con Clerk:', error);
    throw new Error(`Error al sincronizar usuario: ${error.message}`);
  }
}