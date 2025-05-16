import pg from 'pg';
import { ENV, getDatabaseConfig } from '../config/env.js';
const { Pool } = pg;

// Configuración del pool basada en variables de entorno
const poolConfig = {
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Crear el pool con la configuración apropiada
const pool = new Pool(poolConfig);

async function initDatabase() {
  // Mostrar información de diagnóstico
  const dbConfig = getDatabaseConfig();
  console.log('📊 Configuración de base de datos:');
  if (dbConfig) {
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Contraseña: ${dbConfig.password ? 'Configurada' : 'No configurada'}`);
  } else {
    console.log('   ❌ No se pudo analizar DATABASE_URL');
  }

  const client = await pool.connect();
  try {
    console.log('⏳ Iniciando creación de tablas...');
    
    await client.query('BEGIN');
    
    // 1. Crear tabla roles si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla roles creada/verificada');
    
    // 2. Crear tabla usuarios si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        rol_id INTEGER REFERENCES roles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla usuarios creada/verificada');
    
    // 3. Crear tabla estados_publicacion si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS estados_publicacion (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla estados_publicacion creada/verificada');
    
    // 4. Crear tabla categorias si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla categorias creada/verificada');
    
    // 5. Crear tabla posts si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        extracto TEXT,
        contenido TEXT,
        imagen_destacada VARCHAR(500),
        usuario_id INTEGER REFERENCES usuarios(id),
        estado_id INTEGER REFERENCES estados_publicacion(id),
        fecha_publicacion TIMESTAMP,
        palabras_clave TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla posts creada/verificada');
    
    // 6. Crear tabla posts_categorias (relación muchos a muchos) si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts_categorias (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, categoria_id)
      );
    `);
    
    console.log('✅ Tabla posts_categorias creada/verificada');
    
    // 7. Crear tabla comentarios si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        contenido TEXT NOT NULL,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id),
        parent_id INTEGER REFERENCES comentarios(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla comentarios creada/verificada');
    
    // 8. Crear tabla revisiones_posts si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS revisiones_posts (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        contenido_anterior TEXT,
        estado_anterior INTEGER REFERENCES estados_publicacion(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        comentario TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabla revisiones_posts creada/verificada');
    
    // 9. Crear tabla permisos si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla permisos creada/verificada');

    // 10. Crear tabla roles_permisos si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles_permisos (
        rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permiso_id INTEGER REFERENCES permisos(id) ON DELETE CASCADE,
        PRIMARY KEY (rol_id, permiso_id)
      );
    `);
    console.log('✅ Tabla roles_permisos creada/verificada');
    
    // Verificar e insertar datos iniciales si es necesario
    
    // 1. Insertar roles por defecto si no existen
    const rolesDefault = [
      { nombre: 'administrador', descripcion: 'Control total del sistema' },
      { nombre: 'editor', descripcion: 'Puede crear y editar contenido, pero no administrar usuarios' },
      { nombre: 'autor', descripcion: 'Puede crear contenido pero necesita aprobación' },
      { nombre: 'comentador', descripcion: 'Solo puede comentar en posts publicados' }
    ];
    
    for (const rol of rolesDefault) {
      // Usar tipado explícito en la consulta para evitar deducciones inconsistentes de tipos
      await client.query(`
        INSERT INTO roles (nombre, descripcion)
        SELECT $1::VARCHAR, $2::TEXT
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = $1);
      `, [rol.nombre, rol.descripcion]);
    }
    
    console.log('✅ Roles por defecto insertados/verificados');
    
    // 2. Insertar estados de publicación por defecto si no existen
    const estadosDefault = [
      { nombre: 'borrador', descripcion: 'Post en edición' },
      { nombre: 'en_revision', descripcion: 'Post en espera de aprobación' },
      { nombre: 'publicado', descripcion: 'Post publicado y visible' },
      { nombre: 'rechazado', descripcion: 'Post rechazado por los editores' },
      { nombre: 'archivado', descripcion: 'Post archivado (no visible)' }
    ];
    
    for (const estado of estadosDefault) {
      // Usar tipado explícito en la consulta para evitar deducciones inconsistentes de tipos
      await client.query(`
        INSERT INTO estados_publicacion (nombre, descripcion)
        SELECT $1::VARCHAR, $2::TEXT
        WHERE NOT EXISTS (SELECT 1 FROM estados_publicacion WHERE nombre = $1);
      `, [estado.nombre, estado.descripcion]);
    }
    
    console.log('✅ Estados de publicación por defecto insertados/verificados');
    
    await client.query('COMMIT');
    console.log('✅ Inicialización de base de datos completada con éxito');
    
    return { success: true, message: 'Base de datos inicializada correctamente' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al inicializar la base de datos:', error);
    return { 
      success: false, 
      message: 'Error al inicializar la base de datos', 
      error: error.message 
    };
  } finally {
    client.release();
    // No cerramos el pool aquí para permitir que sea usado en otras partes de la aplicación
  }
}

// Exportar la función para poder usarla desde otros archivos
export default initDatabase; 