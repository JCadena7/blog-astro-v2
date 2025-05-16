import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración para encontrar la ruta correcta del archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

// Cargar variables de entorno desde .env
dotenv.config({ path: join(rootDir, '.env') });

// Priorizar DATABASE_URL sobre variables individuales
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.PGHOST) {
  // Sólo construir si DATABASE_URL no está configurado
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD ? encodeURIComponent(process.env.PGPASSWORD) : '';
  const database = process.env.PGDATABASE || 'postgres';
  
  databaseUrl = `postgres://${user}:${password}@${host}:${port}/${database}`;
  console.log(`🔧 DATABASE_URL construida a partir de variables individuales`);
} else if (databaseUrl) {
  console.log(`🔧 Usando DATABASE_URL configurada directamente en variables de entorno`);
}

// Exportar las variables de entorno comunes con valores por defecto
export const ENV = {
  DATABASE_URL: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/blog',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLERK_PUBLISHABLE_KEY: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET: process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  
  // Variables individuales de PostgreSQL (mantenidas para retrocompatibilidad)
  PGHOST: process.env.PGHOST,
  PGPORT: process.env.PGPORT,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD ? '********' : undefined, // Ocultar contraseña
  PGDATABASE: process.env.PGDATABASE
};

// Función para verificar que las variables requeridas estén presentes
export function checkRequiredEnvVars() {
  const missingVars = [];
  
  // Verificar DATABASE_URL
  if (!ENV.DATABASE_URL) missingVars.push('DATABASE_URL');
  if (!ENV.CLERK_PUBLISHABLE_KEY) missingVars.push('PUBLIC_CLERK_PUBLISHABLE_KEY');
  if (!ENV.CLERK_SECRET_KEY) missingVars.push('CLERK_SECRET_KEY');
  if (!ENV.CLERK_WEBHOOK_SECRET) missingVars.push('CLERK_WEBHOOK_SECRET');
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Variables de entorno faltantes: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

// Exportar una función para verificar la URL de la base de datos
export function getDatabaseConfig() {
  // Extraer componentes de la URL de conexión para diagnóstico
  try {
    const url = new URL(ENV.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace('/', ''),
      user: url.username,
      password: url.password ? '******' : undefined, // No mostrar la contraseña real
      ssl: ENV.NODE_ENV === 'production'
    };
  } catch (error) {
    console.error('Error al analizar DATABASE_URL:', error.message);
    return null;
  }
}

export default ENV; 