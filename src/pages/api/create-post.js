import { pool } from '../../db/pool';
import { slugify } from '../../utils/slugify.js';

export async function POST({ request, redirect, locals }) {
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
    const titulo = formData.get('title');
    const extracto = formData.get('description');
    const imagen_destacada = formData.get('heroImage') || null;
    const contenido = formData.get('content');
    const categorias = formData.getAll('categorias[]').map(Number) || [];
    const palabras_clave = formData.getAll('palabras_clave[]') || [];
    
    // Validar datos requeridos
    if (!titulo || !extracto || !contenido) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
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
      
      // Obtener el ID del estado 'borrador'
      const estadoResult = await client.query(
        'SELECT id FROM estados_publicacion WHERE nombre = $1',
        ['borrador']
      );
      
      if (estadoResult.rows.length === 0) {
        throw new Error('No se encontró el estado borrador');
      }
      
      const estado_id = estadoResult.rows[0].id;
      
      // Obtener el ID del usuario desde la base de datos usando el clerk_id
      const usuarioResult = await client.query(
        'SELECT id FROM usuarios WHERE clerk_id = $1',
        [authData.userId]
      );
      
      if (usuarioResult.rows.length === 0) {
        throw new Error('Usuario no encontrado en la base de datos');
      }
      
      const usuario_id = usuarioResult.rows[0].id;
      
      // Insertar el post en la base de datos
      const postResult = await client.query(
        `INSERT INTO posts (
          titulo, slug, extracto, contenido, imagen_destacada,
          usuario_id, estado_id, tiempo_lectura, palabras_clave,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          titulo,
          slug,
          extracto,
          contenido,
          imagen_destacada,
          usuario_id,
          estado_id,
          tiempo_lectura,
          palabras_clave
        ]
      );
      
      const post_id = postResult.rows[0].id;
      
      // Insertar relaciones con categorías si existen
      if (categorias.length > 0) {
        // console.log('Categorías recibidas:', categorias);
        // console.log('post_id:', post_id);
        const categoriasValues = categorias.map((_, index) => `($1, $${index + 2})`).join(', ');
        // console.log('Query values:', [post_id, ...categorias]);
        await client.query(
          `INSERT INTO posts_categorias (post_id, categoria_id) VALUES ${categoriasValues}`,
          [post_id, ...categorias]
        );
      }
      
      await client.query('COMMIT');
      
      // Redireccionar al panel de administración
      return redirect('/admin', 303);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear post:', error);
    return new Response(JSON.stringify({ error: 'Error al crear el post: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 