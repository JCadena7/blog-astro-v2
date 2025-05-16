// Configuración de Cloudinary
// Estos valores deberían estar en variables de entorno
// para seguridad en un entorno de producción

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'tu-cloud-name',
  uploadPreset: import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
};

// Utilidades para trabajar con Cloudinary
export const uploadImageToCloudinary = async (file) => {
  try {
    // Crear un FormData para subir el archivo
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Enviar el archivo a Cloudinary usando la API de Upload
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }
    
    const data = await response.json();
    
    // Retornar la URL segura de la imagen
    return data.secure_url;
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    throw new Error('No se pudo subir la imagen. Por favor, inténtelo de nuevo.');
  }
}; 