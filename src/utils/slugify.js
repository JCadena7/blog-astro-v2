/**
 * Convierte un string en un slug URL-friendly.
 * - Convierte a minúsculas
 * - Elimina caracteres especiales
 * - Reemplaza espacios con guiones
 * - Elimina guiones duplicados
 * @param {string} text - El texto a convertir en slug
 * @returns {string} - El slug generado
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normaliza los caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .replace(/[^\w\s-]/g, '') // Elimina los caracteres especiales
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/--+/g, '-') // Elimina guiones duplicados
    .replace(/^-+/, '') // Elimina guiones al principio
    .replace(/-+$/, ''); // Elimina guiones al final
} 