import pg from 'pg';
import { ENV, getDatabaseConfig } from '../config/env.js';
const { Pool } = pg;

// Extraer el nombre de la base de datos de la URL de conexión
function extractDatabaseInfoFromURL(url) {
  try {
    const dbUrl = new URL(url);
    
    // Obtener el nombre de la base de datos desde la URL
    const database = dbUrl.pathname.replace('/', '');
    
    // Crear una URL para conectarse a la base de datos "postgres" (default)
    const defaultDbUrl = new URL(url);
    defaultDbUrl.pathname = '/postgres';
    
    return {
      database,
      connectionStringWithoutDb: defaultDbUrl.toString()
    };
  } catch (error) {
    console.error('Error al analizar la URL de la base de datos:', error);
    return null;
  }
}

/**
 * Crea la base de datos si no existe
 */
async function createDatabaseIfNotExists() {
  // Usar exclusivamente URL de conexión
  const dbInfo = extractDatabaseInfoFromURL(ENV.DATABASE_URL);
  
  if (!dbInfo) {
    return { 
      success: false, 
      message: 'No se pudo analizar la URL de la base de datos'
    };
  }
  
  const dbName = dbInfo.database;
  const poolConfig = {
    connectionString: dbInfo.connectionStringWithoutDb,
    ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
  
  console.log(`🔍 Verificando si la base de datos '${dbName}' existe...`);
  
  // Conectar a la base de datos "postgres" por defecto
  const defaultPool = new Pool(poolConfig);
  
  try {
    // Verificar si la base de datos existe
    const result = await defaultPool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    // Si la base de datos no existe, crearla
    if (result.rows.length === 0) {
      console.log(`⏳ Creando base de datos '${dbName}'...`);
      
      // Escapar el nombre de la base de datos para evitar inyección SQL
      // En PostgreSQL, los identificadores entre comillas dobles son case-sensitive
      const safeDbName = dbName.replace(/"/g, '""');
      
      await defaultPool.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`✅ Base de datos '${dbName}' creada correctamente.`);
      return { success: true, message: `Base de datos '${dbName}' creada correctamente.` };
    } else {
      console.log(`✅ La base de datos '${dbName}' ya existe.`);
      return { success: true, message: `La base de datos '${dbName}' ya existe.` };
    }
  } catch (error) {
    console.error('❌ Error al verificar/crear la base de datos:', error);
    return { 
      success: false, 
      message: 'Error al verificar/crear la base de datos', 
      error: error.message
    };
  } finally {
    await defaultPool.end();
  }
}

export default createDatabaseIfNotExists; 