import { pool } from '../../../db/pool';
import { validatePost } from '../../../utils/validators';
import { slugify } from '../../../utils/slugify';

export async function POST({ request, locals }) {
  try {
    // Verificar autenticación
    if (!locals.auth) {
      return new Response(JSON.stringify({ error: 'Error de configuración en autenticación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const authData = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
    
    if (!authData?.userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    
    // Obtener los datos del formulario
    const postId = formData.get('id');
    const titulo = formData.get('title');
    const extracto = formData.get('description');
    const imagen_destacada = formData.get('heroImage') || null;
    const contenido = formData.get('content');
    const categorias = formData.getAll('categorias[]').map(Number) || [];
    const palabras_clave = formData.getAll('palabras_clave[]') || [];
    
    // Validar datos requeridos
    if (!titulo || !extracto || !contenido || !postId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el usuario_id usando el clerk_id
    const userResult = await pool.query(
      'SELECT id, rol_id FROM usuarios WHERE clerk_id = $1',
      [authData.userId]
    );

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const usuario_id = userResult.rows[0].id;

    // Verificar permisos de edición
    const postResult = await pool.query(
      `SELECT p.usuario_id, r.nombre as rol
       FROM posts p
       JOIN usuarios u ON p.usuario_id = u.id
       JOIN roles r ON u.rol_id = r.id
       WHERE p.id = $1`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isAdmin = userResult.rows[0].rol_id === 1; // Asumiendo que 1 es el ID del rol administrador
    const isAuthor = postResult.rows[0].usuario_id === usuario_id;

    if (!isAdmin && !isAuthor) {
      return new Response(JSON.stringify({ error: 'No tienes permiso para editar este post' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear slug a partir del título
    const slug = slugify(titulo);

    // Calcular tiempo de lectura (aproximadamente 200 palabras por minuto)
    const palabras = contenido.trim().split(/\s+/).length;
    const tiempo_lectura = Math.ceil(palabras / 200);

    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Actualizar el post
      await client.query(
        `UPDATE posts SET 
          titulo = $1,
          slug = $2,
          extracto = $3,
          contenido = $4,
          imagen_destacada = $5,
          tiempo_lectura = $6,
          palabras_clave = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8`,
        [titulo, slug, extracto, contenido, imagen_destacada, tiempo_lectura, palabras_clave, postId]
      );
      
      // Actualizar categorías
      if (categorias.length > 0) {
        // Eliminar categorías anteriores
        await client.query('DELETE FROM posts_categorias WHERE post_id = $1', [postId]);
        
        // Insertar nuevas categorías
        const categoriasValues = categorias.map((_, index) => `($1, $${index + 2})`).join(', ');
        await client.query(
          `INSERT INTO posts_categorias (post_id, categoria_id) VALUES ${categoriasValues}`,
          [postId, ...categorias]
        );
      }
      
      await client.query('COMMIT');
      
      return new Response(JSON.stringify({ message: 'Post actualizado correctamente' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar post:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar el post: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 