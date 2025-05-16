import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configuración para encontrar la ruta correcta del archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);

// Cargar variables de entorno desde .env
dotenv.config({ path: join(rootDir, '.env') });

// Verificar que las variables requeridas estén presentes
if (!process.env.PUBLIC_CLERK_PUBLISHABLE_KEY) {
  console.error('PUBLIC_CLERK_PUBLISHABLE_KEY no está configurada en .env');
}

export default defineConfig({
  define: {
    'process.env.PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.PUBLIC_CLERK_PUBLISHABLE_KEY),
    'process.env.PUBLIC_CLOUDINARY_CLOUD_NAME': JSON.stringify(process.env.PUBLIC_CLOUDINARY_CLOUD_NAME),
    'process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET),
    'import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.PUBLIC_CLERK_PUBLISHABLE_KEY),
    'import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME': JSON.stringify(process.env.PUBLIC_CLOUDINARY_CLOUD_NAME),
    'import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET),
    'window.PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.PUBLIC_CLERK_PUBLISHABLE_KEY)
  }
}); 