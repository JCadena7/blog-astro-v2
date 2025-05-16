import db from '../db/pgHelper.js';
import { validateUser, sanitizeData } from './validators.js';

/**
 * Helper para operaciones CRUD con usuarios
 */
export const usuariosHelper = {
  /**
   * Obtiene todos los usuarios con paginación
   * @param {number} page Número de página
   * @param {number} limit Límite de resultados por página
   * @returns {Promise<Array>} Lista de usuarios
   */
  getUsuarios: async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const usuarios = await db.query(`
      SELECT u.id, u.clerk_id, u.nombre, u.email, r.nombre as rol, u.created_at, u.updated_at
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.nombre
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const total = await db.query(`
      SELECT COUNT(*) as total FROM usuarios
    `);
    
    return {
      usuarios,
      pagination: {
        total: parseInt(total[0].total),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total[0].total) / limit)
      }
    };
  },
  
  /**
   * Obtiene un usuario por su ID
   * @param {number} id ID del usuario
   * @returns {Promise<Object>} Datos del usuario o null si no existe
   */
  getUsuarioById: async (id) => {
    if (!id || isNaN(Number(id))) {
      throw new Error('ID de usuario inválido');
    }
    
    const usuarios = await db.query(`
      SELECT u.id, u.clerk_id, u.nombre, u.email, r.nombre as rol, u.created_at, u.updated_at
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [id]);
    
    return usuarios.length > 0 ? usuarios[0] : null;
  },
  
  /**
   * Obtiene un usuario por su Clerk ID
   * @param {string} clerkId ID de Clerk
   * @returns {Promise<Object>} Datos del usuario o null si no existe
   */
  getUsuarioByClerkId: async (clerkId) => {
    if (!clerkId || typeof clerkId !== 'string') {
      throw new Error('Clerk ID inválido');
    }
    
    const usuarios = await db.query(`
      SELECT u.id, u.clerk_id, u.nombre, u.email, r.nombre as rol, u.created_at, u.updated_at
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.clerk_id = $1
    `, [clerkId]);
    
    return usuarios.length > 0 ? usuarios[0] : null;
  },
  
  /**
   * Crea un nuevo usuario
   * @param {Object} userData Datos del usuario a crear
   * @returns {Promise<Object>} Usuario creado
   */
  createUsuario: async (userData) => {
    // Validar datos
    const sanitizedData = sanitizeData(userData);
    const validation = validateUser(sanitizedData);
    
    if (!validation.isValid) {
      throw new Error(`Error de validación: ${validation.errors.join(', ')}`);
    }
    
    // Verificar rol
    const rolResult = await db.query('SELECT id FROM roles WHERE id = $1', [sanitizedData.rol_id]);
    if (rolResult.length === 0) {
      throw new Error('El rol especificado no existe');
    }
    
    // Verificar si el email ya existe
    const existingEmail = await db.query('SELECT id FROM usuarios WHERE email = $1', [sanitizedData.email]);
    if (existingEmail.length > 0) {
      throw new Error('Ya existe un usuario con este email');
    }
    
    // Crear usuario
    const result = await db.query(
      `INSERT INTO usuarios (clerk_id, nombre, email, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, clerk_id, nombre, email, created_at`,
      [
        sanitizedData.clerk_id || null,
        sanitizedData.nombre,
        sanitizedData.email,
        sanitizedData.rol_id
      ]
    );
    
    return result[0];
  },
  
  /**
   * Actualiza un usuario existente
   * @param {number} id ID del usuario a actualizar
   * @param {Object} userData Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  updateUsuario: async (id, userData) => {
    if (!id || isNaN(Number(id))) {
      throw new Error('ID de usuario inválido');
    }
    
    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (existingUser.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    // Validar datos
    const sanitizedData = sanitizeData(userData);
    const validation = validateUser(sanitizedData);
    
    if (!validation.isValid) {
      throw new Error(`Error de validación: ${validation.errors.join(', ')}`);
    }
    
    // Verificar rol si se está actualizando
    if (sanitizedData.rol_id) {
      const rolResult = await db.query('SELECT id FROM roles WHERE id = $1', [sanitizedData.rol_id]);
      if (rolResult.length === 0) {
        throw new Error('El rol especificado no existe');
      }
    }
    
    // Verificar si el email ya está en uso por otro usuario
    if (sanitizedData.email) {
      const existingEmail = await db.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2', 
        [sanitizedData.email, id]
      );
      if (existingEmail.length > 0) {
        throw new Error('Ya existe otro usuario con este email');
      }
    }
    
    // Construir consulta dinámica de actualización
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (sanitizedData.nombre) {
      updates.push(`nombre = $${paramCount}`);
      values.push(sanitizedData.nombre);
      paramCount++;
    }
    
    if (sanitizedData.email) {
      updates.push(`email = $${paramCount}`);
      values.push(sanitizedData.email);
      paramCount++;
    }
    
    if (sanitizedData.rol_id) {
      updates.push(`rol_id = $${paramCount}`);
      values.push(sanitizedData.rol_id);
      paramCount++;
    }
    
    if (updates.length === 0) {
      throw new Error('No se proporcionaron datos para actualizar');
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Añadir ID a los valores
    values.push(id);
    
    // Ejecutar actualización
    const result = await db.query(
      `UPDATE usuarios 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, clerk_id, nombre, email, updated_at`,
      values
    );
    
    return result[0];
  },
  
  /**
   * Elimina un usuario
   * @param {number} id ID del usuario a eliminar
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  deleteUsuario: async (id) => {
    if (!id || isNaN(Number(id))) {
      throw new Error('ID de usuario inválido');
    }
    
    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (existingUser.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    // Eliminar usuario (podría ser necesario manejar restricciones de clave foránea)
    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    
    return true;
  },
  
  /**
   * Cambia el rol de un usuario
   * @param {number} usuarioId ID del usuario
   * @param {number} rolId ID del nuevo rol
   * @returns {Promise<Object>} Usuario actualizado
   */
  cambiarRolUsuario: async (usuarioId, rolId) => {
    if (!usuarioId || isNaN(Number(usuarioId))) {
      throw new Error('ID de usuario inválido');
    }
    
    if (!rolId || isNaN(Number(rolId))) {
      throw new Error('ID de rol inválido');
    }
    
    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id FROM usuarios WHERE id = $1', [usuarioId]);
    if (existingUser.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar que el rol existe
    const rolResult = await db.query('SELECT id FROM roles WHERE id = $1', [rolId]);
    if (rolResult.length === 0) {
      throw new Error('El rol especificado no existe');
    }
    
    // Actualizar rol
    const result = await db.query(
      `UPDATE usuarios 
       SET rol_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, nombre, updated_at`,
      [rolId, usuarioId]
    );
    
    return result[0];
  }
}; 