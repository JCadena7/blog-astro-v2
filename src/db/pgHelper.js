import pg from 'pg';
import { ENV } from '../config/env.js';
const { Pool } = pg;

// Configuración para la conexión PostgreSQL
const poolConfig = {
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log(' Usando DATABASE_URL para conexión PostgreSQL');

// Crear el pool de conexiones
const pool = new Pool(poolConfig);

// Helper para ejecutar consultas con mejor manejo de errores
export const pgQuery = async (text, params = []) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Error en conexión a PostgreSQL:', error);
    // Proporcionar información más detallada sobre el error
    if (error.message.includes('SASL')) {
      throw new Error('Error de autenticación en PostgreSQL: Verifica tu contraseña en DATABASE_URL');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      throw new Error('No se pudo conectar a PostgreSQL: Verifica que el servidor esté en ejecución');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      throw new Error('La base de datos no existe: Necesitas crearla primero');
    } else {
      // Agregar información contextual al error
      throw new Error(`Error de base de datos: ${error.message}`);
    }
  } finally {
    if (client) client.release();
  }
};

// Funciones específicas para posts
export const postsHelper = {
  /**
   * Obtener todos los posts con filtros, estados y categorías.
   * @param {{usuario_id?: string, autor_nombre?: string, estado_nombre?: string, categorias?: string[]}} options
   * @returns {Promise<{posts: any[], estados: any[], categorias: any[]}>}
   */
  getAllPosts: async ({ usuario_id, autor_nombre, estado_nombre, categorias = [] } = {}) => {
    let baseQuery = `
      SELECT p.*, u.nombre as autor_nombre, e.nombre as estado_nombre,
             array_agg(DISTINCT c.nombre) as categorias
      FROM posts p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN estados_publicacion e ON p.estado_id = e.id
      LEFT JOIN posts_categorias pc ON p.id = pc.post_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
    `;
    const whereClauses = [];
    const values = [];
    let idx = 1;
    if (usuario_id) { whereClauses.push(`p.usuario_id = $${idx}`); values.push(usuario_id); idx++; }
    if (autor_nombre) { whereClauses.push(`u.nombre ILIKE $${idx}`); values.push(`%${autor_nombre}%`); idx++; }
    if (estado_nombre) { whereClauses.push(`e.nombre = $${idx}`); values.push(estado_nombre); idx++; }
    if (categorias.length) { whereClauses.push(`c.nombre = ANY($${idx})`); values.push(categorias); idx++; }
    if (whereClauses.length) baseQuery += ` WHERE ` + whereClauses.join(' AND ');
    baseQuery += `
      GROUP BY p.id, u.nombre, e.nombre
      ORDER BY p.created_at DESC
    `;
    const posts = await pgQuery(baseQuery, values);
    const estados = await pgQuery('SELECT * FROM estados_publicacion ORDER BY nombre');
    const categoriasList = await pgQuery('SELECT * FROM categorias ORDER BY nombre');
    return { posts, estados, categorias: categoriasList };
  },

  // Obtener todos los posts publicados
  getPublishedPosts: async () => {
    return await pgQuery(`
      SELECT p.*, u.nombre as autor, array_agg(c.nombre) as categorias
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN estados_publicacion e ON p.estado_id = e.id
      LEFT JOIN posts_categorias pc ON p.id = pc.post_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE e.nombre = 'publicado'
      GROUP BY p.id, u.nombre
      ORDER BY p.fecha_publicacion DESC
    `);
  },

  // Obtener posts por usuario con estado
  getPostsByUserId: async (usuarioId) => {
    return await pgQuery(`
      SELECT p.*, e.nombre as estado
      FROM posts p
      JOIN estados_publicacion e ON p.estado_id = e.id
      WHERE p.usuario_id = $1
      ORDER BY p.created_at DESC
    `, [usuarioId]);
  },

  // Obtener post por slug
  getPostBySlug: async (slug) => {
    const posts = await pgQuery(`
      SELECT p.*, u.nombre as autor, e.nombre as estado,
        array_agg(DISTINCT c.nombre) as categorias,
        array_agg(DISTINCT jsonb_build_object(
          'id', com.id,
          'contenido', com.contenido,
          'usuario', comu.nombre,
          'fecha', com.created_at
        )) as comentarios
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN estados_publicacion e ON p.estado_id = e.id
      LEFT JOIN posts_categorias pc ON p.id = pc.post_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      LEFT JOIN comentarios com ON p.id = com.post_id
      LEFT JOIN usuarios comu ON com.usuario_id = comu.id
      WHERE p.slug = $1 AND (e.nombre = 'publicado' OR u.id = $2)
      GROUP BY p.id, u.nombre, e.nombre
    `, [slug, usuarioId]);
    
    return posts.length > 0 ? posts[0] : null;
  },

  // Crear un nuevo post
  createPost: async (postData, usuarioId) => {
    const { titulo, slug, extracto, contenido, imagen_destacada, categorias, palabras_clave } = postData;
    
    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Insertar el post
      const estadoId = await client.query(
        'SELECT id FROM estados_publicacion WHERE nombre = $1',
        ['borrador']
      );
      
      const postResult = await client.query(
        `INSERT INTO posts (
          titulo, slug, extracto, contenido, imagen_destacada, 
          usuario_id, estado_id, palabras_clave
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          titulo, slug, extracto, contenido, imagen_destacada,
          usuarioId, estadoId.rows[0].id, palabras_clave || []
        ]
      );
      
      const postId = postResult.rows[0].id;
      
      // 2. Asignar categorías
      if (categorias && categorias.length > 0) {
        const categoriasValues = categorias.map((catId, index) => {
          return `($1, $${index + 2})`;
        }).join(', ');
        
        await client.query(
          `INSERT INTO posts_categorias (post_id, categoria_id) VALUES ${categoriasValues}`,
          [postId, ...categorias]
        );
      }
      
      await client.query('COMMIT');
      return postId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Actualizar un post existente
  updatePost: async (postId, postData, usuarioId) => {
    const { titulo, extracto, contenido, imagen_destacada, categorias, palabras_clave } = postData;
    
    // Verificar permiso
    const canEdit = await checkPostEditPermission(postId, usuarioId);
    if (!canEdit) {
      throw new Error('No tienes permiso para editar este post');
    }
    
    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Actualizar el post
      await client.query(`
        UPDATE posts 
        SET titulo = $1, extracto = $2, contenido = $3, 
            imagen_destacada = $4, palabras_clave = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [titulo, extracto, contenido, imagen_destacada, palabras_clave || [], postId]);
      
      // 2. Actualizar categorías
      if (categorias && categorias.length > 0) {
        // Eliminar categorías anteriores
        await client.query('DELETE FROM posts_categorias WHERE post_id = $1', [postId]);
        
        // Insertar nuevas categorías
        const categoriasValues = categorias.map((catId, index) => {
          return `($1, $${index + 2})`;
        }).join(', ');
        
        await client.query(
          `INSERT INTO posts_categorias (post_id, categoria_id) VALUES ${categoriasValues}`,
          [postId, ...categorias]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Cambiar estado de un post
  changePostStatus: async (clerkId, postId, newStatus, comentario = '') => {
    // Verificar permiso según el nuevo estado
    if (newStatus === 'publicado' || newStatus === 'rechazado') {
      const isAdmin = await checkUserRole(clerkId, 'administrador');
      if (!isAdmin) {
        throw new Error('Solo los administradores pueden publicar o rechazar posts');
      }
    }

    const usuarioId = await getUserIdByClerkId(clerkId)
    
    // Obtener el ID del estado
    const estadoResult = await pgQuery(
      'SELECT id FROM estados_publicacion WHERE nombre = $1',
      [newStatus]
    );
    
    if (estadoResult.length === 0) {
      throw new Error('Estado de publicación inválido');
    }
    
    const estadoId = estadoResult[0].id;
    
    // Obtener estado anterior para registrar cambio
    const postPrevio = await pgQuery(
      'SELECT estado_id, contenido FROM posts WHERE id = $1',
      [postId]
    );
    
    if (postPrevio.length === 0) {
      throw new Error('Post no encontrado');
    }
    
    // Actualizar estado con fecha de publicación adecuada
    if (newStatus === 'publicado') {
      await pgQuery(
        `UPDATE posts
         SET estado_id = $1,
             fecha_publicacion = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [estadoId, postId]
      );
    } else {
      await pgQuery(
        `UPDATE posts
         SET estado_id = $1,
             fecha_publicacion = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [estadoId, postId]
      );
    }
    
    // Registrar revisión
    await pgQuery(
      `INSERT INTO revisiones_posts (
        post_id, contenido_anterior, estado_anterior, 
        usuario_id, comentario
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        postId, 
        postPrevio[0].contenido, 
        postPrevio[0].estado_id,
        usuarioId,
        comentario
      ]
    );
    
    return true;
  },

  // Eliminar un post
  deletePost: async (postId, usuarioId) => {
    // Verificar permiso
    const isAdmin = await checkUserRole(usuarioId, 'administrador');
    const isAuthor = await pgQuery(
      'SELECT 1 FROM posts WHERE id = $1 AND usuario_id = $2',
      [postId, usuarioId]
    );
    
    if (!isAdmin && isAuthor.length === 0) {
      throw new Error('No tienes permiso para eliminar este post');
    }
    
    await pgQuery('DELETE FROM posts WHERE id = $1', [postId]);
    return true;
  }
};

// Funciones para categorías
export const categoriasHelper = {
  // Obtener todas las categorías
  getAllCategorias: async () => {
    return await pgQuery('SELECT * FROM categorias ORDER BY nombre');
  },
  
  // Crear una nueva categoría
  createCategoria: async (categoriaData, usuarioId) => {
    // console.log("usuarioId pg: ", usuarioId);
    // console.log("categoriaData pg: ", categoriaData);
    // Verificar permiso
    const isAdmin = await checkUserRole(usuarioId, 'administrador');
    // console.log("isAdmin: ", isAdmin);
    // console.log("usuarioId: ", usuarioId);
    // console.log("categoriaData: ", categoriaData);
    // console.log("usuarioId: ", usuarioId);
    if (!isAdmin) {
      throw new Error('Solo los administradores pueden crear categorías');
    }
    
    const { nombre, slug, descripcion, color, icono } = categoriaData;
    
    const result = await pgQuery(
      `INSERT INTO categorias (nombre, slug, descripcion, color, icono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [nombre, slug, descripcion, color, icono]
    );

    // console.log("result de createCategoria: ", result.rows);
    
    return result[0].id;
  },

  // Eliminar una categoría
  deleteCategoria: async (categoriaId, usuarioId) => {
    // console.log("usuarioId pg: ", usuarioId);
    // console.log("categoriaId pg: ", categoriaId);
    // Verificar permiso
    const isAdmin = await checkUserRole(usuarioId, 'administrador');
    if (!isAdmin) {
      throw new Error('Solo los administradores pueden eliminar categorías');
    }
    const result = await pgQuery(
      'DELETE FROM categorias WHERE id = $1 RETURNING id',
      [categoriaId]
    );
    // console.log("result de deleteCategoria: ", result);
    if (result.length === 0) {
      throw new Error('Categoría no encontrada');
    }
    return result[0].id;
  },

  // Actualizar una categoría
  updateCategoria: async (categoriaId, categoriaData, usuarioId) => {
    // console.log("usuarioId pg: ", usuarioId);
    // console.log("categoriaId pg: ", categoriaId);
    // console.log("categoriaData pg: ", categoriaData);
    // Verificar permiso
    const isAdmin = await checkUserRole(usuarioId, 'administrador');
    if (!isAdmin) {
      throw new Error('Solo los administradores pueden actualizar categorías');
    }
    const { nombre, slug, descripcion, color, icono } = categoriaData;
    const result = await pgQuery(
      `UPDATE categorias
       SET nombre = $1, slug = $2, descripcion = $3, color = $4, icono = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nombre, slug, descripcion, color, icono, categoriaId]
    );
    // console.log("result de updateCategoria: ", result);
    if (result.length === 0) {
      throw new Error('Categoría no encontrada');
    }
    return result[0];
  }
};

// Funciones para roles
export const rolesHelper = {
  // Obtener todos los roles
  getAllRoles: async () => {
    return await pgQuery('SELECT * FROM roles ORDER BY id');
  },
  
  // Asignar rol a usuario
  assignRoleToUser: async (usuarioId, rolId, adminId) => {
    // Verificar permiso
    const isAdmin = await checkUserRole(adminId, 'administrador');
    if (!isAdmin) {
      throw new Error('Solo los administradores pueden asignar roles');
    }
    
    await pgQuery(
      'UPDATE usuarios SET rol_id = $1 WHERE id = $2',
      [rolId, usuarioId]
    );
    
    return true;
  }
};

// Funciones para comentarios
export const comentariosHelper = {
  // Obtener todos los comentarios de un post
  getComentariosByPostId: async (postId) => {
    return await pgQuery(`
      SELECT c.*, u.nombre as autor
      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `, [postId]);
  },
  
  // Obtener comentarios por usuario
  getComentariosByUserId: async (usuarioId) => {
    return await pgQuery(`
      SELECT c.*, p.titulo as post_titulo, p.slug as post_slug
      FROM comentarios c
      JOIN posts p ON c.post_id = p.id
      WHERE c.usuario_id = $1
      ORDER BY c.created_at DESC
    `, [usuarioId]);
  },
  
  // Crear un nuevo comentario
  createComentario: async (comentarioData, usuarioId) => {
    const { contenido, postId, parentId } = comentarioData;
    
    // Verificar que el post existe
    const postExists = await pgQuery(
      'SELECT 1 FROM posts p JOIN estados_publicacion e ON p.estado_id = e.id WHERE p.id = $1 AND e.nombre = $2',
      [postId, 'publicado']
    );
    
    if (postExists.length === 0) {
      throw new Error('El post no existe o no está publicado');
    }
    
    // Verificar que el comentario padre existe si se proporciona
    if (parentId) {
      const parentExists = await pgQuery(
        'SELECT 1 FROM comentarios WHERE id = $1',
        [parentId]
      );
      
      if (parentExists.length === 0) {
        throw new Error('El comentario padre no existe');
      }
    }
    
    const result = await pgQuery(
      `INSERT INTO comentarios (contenido, post_id, usuario_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [contenido, postId, usuarioId, parentId || null]
    );
    
    return result[0].id;
  },
  
  // Actualizar un comentario existente
  updateComentario: async (comentarioId, contenido, usuarioId) => {
    // Verificar permiso
    const comentario = await pgQuery(
      'SELECT 1 FROM comentarios WHERE id = $1 AND usuario_id = $2',
      [comentarioId, usuarioId]
    );
    
    if (comentario.length === 0) {
      throw new Error('No tienes permiso para editar este comentario');
    }
    
    await pgQuery(
      `UPDATE comentarios 
       SET contenido = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [contenido, comentarioId]
    );
    
    return true;
  },
  
  // Eliminar un comentario
  deleteComentario: async (comentarioId, usuarioId) => {
    // Verificar permiso (usuario que creó el comentario o administrador)
    const isAdmin = await checkUserRole(usuarioId, 'administrador');
    const isAuthor = await pgQuery(
      'SELECT 1 FROM comentarios WHERE id = $1 AND usuario_id = $2',
      [comentarioId, usuarioId]
    );
    
    if (!isAdmin && isAuthor.length === 0) {
      throw new Error('No tienes permiso para eliminar este comentario');
    }
    
    await pgQuery('DELETE FROM comentarios WHERE id = $1', [comentarioId]);
    return true;
  }
};

// Funciones CRUD para usuarios
export const usuariosHelper = {
  // Obtener todos los usuarios con rol y permisos
  getAllUsers: async () => {
    const users = await pgQuery(
      `SELECT u.*, r.nombre AS rol_nombre,
         (
           SELECT array_agg(p.nombre)
           FROM roles_permisos rp
           JOIN permisos p ON rp.permiso_id = p.id
           WHERE rp.rol_id = u.rol_id
         ) AS permisos
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       ORDER BY u.created_at DESC`
    );
    return users;
  },

  // Obtener usuario por ID
  getUserById: async (id) => {
    const users = await pgQuery(
      `SELECT u.*, r.nombre AS rol_nombre,
         (
           SELECT array_agg(p.nombre)
           FROM roles_permisos rp
           JOIN permisos p ON rp.permiso_id = p.id
           WHERE rp.rol_id = u.rol_id
         ) AS permisos
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return users.length > 0 ? users[0] : null;
  },

  // Crear un nuevo usuario
  createUsuario: async (userData) => {
    const { nombre, email, rol_id } = userData;
    const result = await pgQuery(
      `INSERT INTO usuarios (nombre, email, rol_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, email, rol_id]
    );
    return result[0];
  },

  // Actualizar datos de un usuario
  updateUsuario: async (id, userData) => {
    const { nombre, email, rol_id } = userData;
    const result = await pgQuery(
      `UPDATE usuarios
       SET nombre = $1, email = $2, rol_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [nombre, email, rol_id, id]
    );
    return result.length > 0 ? result[0] : null;
  },

  // Eliminar un usuario
  deleteUsuario: async (id) => {
    const result = await pgQuery(
      `DELETE FROM usuarios WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    return result[0].id;
  }
};

// Funciones auxiliares
async function checkUserRole(clerkId, rolNombre) {
  const result = await pgQuery(
    `SELECT u.nombre AS usuario_nombre, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.clerk_id = $1 AND r.nombre = $2`,
    [clerkId, rolNombre]
  );
  
  console.log("result completo: ", result);
  console.log("clerkId: ", clerkId);
  console.log("rolNombre: ", rolNombre);
  console.log("result de checkUserRole: ", result);
  console.log("largo de result rows length: ", result.length);

  return result.length > 0 ? result[0] : null;
}



async function checkPostEditPermission(postId, usuarioId) {
  // Verificar si es administrador
  const isAdmin = await checkUserRole(usuarioId, 'administrador');
  if (isAdmin) return true;
  
  // Verificar si es el autor
  const isAuthor = await pgQuery(
    'SELECT 1 FROM posts WHERE id = $1 AND usuario_id = $2',
    [postId, usuarioId]
  );
  
  return isAuthor.length > 0;
}

async function getUserIdByClerkId(clerkId) {
  const result = await pgQuery(
    `SELECT id FROM usuarios WHERE clerk_id = $1`,
    [clerkId]
  );

  console.log("Resultado completo:", result);
  console.log("clerkId:", clerkId);
  console.log("Filas encontradas:", result.length);

  return result.length > 0 ? result[0].id : null;
}


export default {
  query: pgQuery,
  posts: postsHelper,
  categorias: categoriasHelper,
  roles: rolesHelper,
  usuarios: usuariosHelper,
  comentarios: comentariosHelper
};