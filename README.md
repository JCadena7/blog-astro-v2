# GEAB Blog Management System

Este proyecto es un sistema de gestión de blog construido con Astro, Tailwind CSS, React y una API REST en Node.js + PostgreSQL.

Características principales:

- Creación, edición y eliminación de posts vía formulario con FormData
- API endpoints en `src/pages/api/posts.ts` para GET, POST, PUT, DELETE
- Contenido Markdown renderizado en cliente con **marked** y resaltado de sintaxis (`highlight.js`)
- Diseño responsivo & Modo claro/oscuro con Tailwind CSS y plugin Typography
- Almacenamiento de imágenes vía Cloudinary
- Gestión de estados y asignación de múltiples categorías mediante UI de chips multi-select
- API de categorías: `GET /api/categorias` para obtener la lista de categorías

Requisitos:

- Node.js >=16
- PostgreSQL en ejecución y configuración de variables de entorno:
  - `DATABASE_URL` (connection string)
  - `CLOUDINARY_URL` (opcional para imágenes)

Instalación y ejecución:

```bash
# Clonar el repositorio
git clone <repo-url>
cd tailwind

# Instalar dependencias
npm install

# Crear archivo .env en la raíz:
# DATABASE_URL="postgres://user:pass@localhost:5432/dbname"
# CLOUDINARY_URL="cloudinary://..."

# Iniciar servidor de desarrollo
env-cmd .env npm run dev
# Visitar http://localhost:4321
```

Scripts disponibles:

| Comando            | Acción                                     |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Inicia servidor en modo desarrollo         |
| `npm run build`    | Compila el sitio para producción en `dist` |
| `npm run preview`  | Previsualiza la compilación                |

Estructura del proyecto:

```text
├── public/           # Archivos estáticos
├── src/
│  ├── pages/
│  │   ├── api/posts.ts     # Endpoints de API (incluye `categorias[]` en POST)
│  │   ├── api/categorias/index.js  # Endpoint GET para categorías
│  │   ├── admin/           # Formularios de administración
│  │   └── blog/            # Páginas de listado y post
│  ├── components/         # Componentes Astro/React
│  ├── layouts/            # Layouts base
│  ├── db/                 # Pool de conexión PostgreSQL
│  └── utils/              # Helpers (slugify, etc.)
├── astro.config.mjs    # Config Astro
├── tailwind.config.mjs # Config Tailwind
├── package.json
└── README.md
```

Más información y documentación:

- Astro: https://docs.astro.build
- Tailwind CSS Typography: https://github.com/tailwindlabs/tailwindcss-typography
- marked: https://github.com/markedjs/marked
- highlight.js: https://highlightjs.org
