/**
 * Utilidades para validación de datos en el sistema
 */

/**
 * Valida un objeto de usuario
 * @param {Object} userData - Datos del usuario a validar
 * @returns {Object} Resultado de la validación con isValid y errores
 */
export function validateUser(userData) {
  const errors = [];

  // Validar nombre
  if (!userData.nombre || typeof userData.nombre !== 'string' || userData.nombre.trim() === '') {
    errors.push('El nombre es requerido');
  } else if (userData.nombre.length > 100) {
    errors.push('El nombre no puede exceder los 100 caracteres');
  }

  // Validar email
  if (!userData.email || typeof userData.email !== 'string' || userData.email.trim() === '') {
    errors.push('El email es requerido');
  } else {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.push('Formato de email inválido');
    }
  }

  // Validar rol_id si está presente
  if (userData.rol_id !== undefined) {
    if (!userData.rol_id || isNaN(Number(userData.rol_id))) {
      errors.push('El ID de rol debe ser un número válido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un objeto de post
 * @param {Object} postData - Datos del post a validar
 * @returns {Object} Resultado de la validación con isValid y errores
 */
export function validatePost(postData) {
  const errors = [];

  // Validar título
  if (!postData.titulo || typeof postData.titulo !== 'string' || postData.titulo.trim() === '') {
    errors.push('El título es requerido');
  } else if (postData.titulo.length > 200) {
    errors.push('El título no puede exceder los 200 caracteres');
  }

  // Validar slug si está presente
  if (postData.slug !== undefined) {
    if (typeof postData.slug !== 'string' || postData.slug.trim() === '') {
      errors.push('El slug no puede estar vacío');
    } else if (!/^[a-z0-9-]+$/.test(postData.slug)) {
      errors.push('El slug solo puede contener letras minúsculas, números y guiones');
    }
  }

  // Validar contenido
  if (!postData.contenido || typeof postData.contenido !== 'string' || postData.contenido.trim() === '') {
    errors.push('El contenido es requerido');
  }

  // Validar usuario_id
  if (!postData.usuario_id || isNaN(Number(postData.usuario_id))) {
    errors.push('El ID de usuario es requerido y debe ser un número');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un objeto de comentario
 * @param {Object} commentData - Datos del comentario a validar
 * @returns {Object} Resultado de la validación con isValid y errores
 */
export function validateComment(commentData) {
  const errors = [];

  // Validar contenido
  if (!commentData.contenido || typeof commentData.contenido !== 'string' || commentData.contenido.trim() === '') {
    errors.push('El contenido del comentario es requerido');
  } else if (commentData.contenido.length > 1000) {
    errors.push('El comentario no puede exceder los 1000 caracteres');
  }

  // Validar post_id
  if (!commentData.post_id || isNaN(Number(commentData.post_id))) {
    errors.push('El ID del post es requerido y debe ser un número');
  }

  // Validar usuario_id
  if (!commentData.usuario_id || isNaN(Number(commentData.usuario_id))) {
    errors.push('El ID de usuario es requerido y debe ser un número');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza datos de entrada para evitar inyecciones y problemas de seguridad
 * @param {Object} data - Objeto con datos a sanitizar
 * @returns {Object} Objeto con datos sanitizados
 */
export function sanitizeData(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Sanitizar strings eliminando posibles códigos maliciosos
      sanitized[key] = value.trim().replace(/[<>]/g, '');
    } else if (Array.isArray(value)) {
      // Sanitizar arrays recursivamente
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeData(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Sanitizar objetos recursivamente
      sanitized[key] = sanitizeData(value);
    } else {
      // Mantener otros tipos de datos sin cambios
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Valida los parámetros de paginación
 * @param {Object} params - Parámetros de paginación (page, limit)
 * @returns {Object} Parámetros validados y normalizados
 */
export function validatePaginationParams(params) {
  let page = parseInt(params.page) || 1;
  let limit = parseInt(params.limit) || 10;
  
  // Asegurar valores razonables
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), 100); // entre 1 y 100
  
  return { page, limit };
} 