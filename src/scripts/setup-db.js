import { ENV, checkRequiredEnvVars, getDatabaseConfig } from '../config/env.js';
import createDatabaseIfNotExists from '../db/createDB.js';
import initDatabase from '../db/initDB.js';

async function setupDatabase() {
  console.log('🔧 Iniciando configuración de la base de datos...');
  
  // Verificar las variables de entorno requeridas
  const envOk = checkRequiredEnvVars();
  if (!envOk) {
    console.warn('❗ Algunas variables de entorno importantes no están configuradas.');
    console.warn('   La configuración podría no funcionar correctamente.');
  }
  
  // Mostrar información sobre la configuración de la base de datos
  const dbConfig = getDatabaseConfig();
  if (dbConfig) {
    console.log('📄 Configuración de conexión:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Usuario: ${dbConfig.user}`);
  } else {
    console.error('❌ Error: No se pudo analizar la cadena de conexión DATABASE_URL');
    console.error(`   Valor actual: ${ENV.DATABASE_URL || 'No configurado'}`);
    process.exit(1);
  }
  
  try {
    // Paso 1: Verificar y crear la base de datos si no existe
    const createDbResult = await createDatabaseIfNotExists();
    if (!createDbResult.success) {
      console.error('❌ Error al crear la base de datos:', createDbResult.message);
      if (createDbResult.error) console.error('   Detalle:', createDbResult.error);
      process.exit(1);
    }
    
    // Paso 2: Inicializar las tablas de la base de datos
    console.log('\n📋 Iniciando configuración de tablas...');
    const initResult = await initDatabase();
    
    if (initResult.success) {
      console.log('\n🎉 Proceso completado exitosamente!');
      process.exit(0);
    } else {
      console.error('❌ Error durante la configuración de tablas:', initResult.message);
      console.error('   Detalle:', initResult.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error inesperado durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar la función de configuración
setupDatabase(); 