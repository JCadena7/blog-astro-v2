// Variables de entorno disponibles en el cliente
const CLIENT_ENV = {
  CLERK_PUBLISHABLE_KEY: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET: process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET
};

// Verificar que las variables requeridas estén presentes
if (!CLIENT_ENV.CLERK_PUBLISHABLE_KEY) {
  console.error('CLERK_PUBLISHABLE_KEY no está configurada');
}

export { CLIENT_ENV }; 