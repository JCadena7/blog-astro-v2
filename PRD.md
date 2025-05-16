# Product Requirements Document (PRD)

## 1. Overview

**Project:** GEAB Blog Management System  
**Description:** Una aplicación web para gestionar entradas de blog con creación, edición, publicación y renderizado de contenido Markdown.

## 2. Goals & Objectives

- Proveer una interfaz para que autores creen y publiquen posts.
- Mostrar posts publicados de forma dinámica en un sitio público.
- Soportar contenido en Markdown con resaltado de sintaxis.
- Permitir modo claro/oscuro y diseño responsivo.

## 3. User Personas

| Persona        | Descripción                                                |
| -------------- | ---------------------------------------------------------- |
| Autor          | Crea y edita contenido de blog.                            |
| Lector         | Navega y lee posts publicados en la web.                  |
| Administrador  | Gestiona estados (borrador, publicado) y moderación.      |

## 4. User Stories

1. **Como Autor**, quiero crear un nuevo post con título, extracto, contenido Markdown e imagen destacada.
2. **Como Autor**, quiero editar un post existente antes de publicarlo.
3. **Como Administrador**, quiero cambiar el estado de un post (borrador/publicado).
4. **Como Lector**, quiero ver la lista de posts publicados ordenados por fecha.
5. **Como Lector**, quiero ver el contenido de un post renderizado en HTML con resaltado de sintaxis.

## 5. Functional Requirements

1. **Autenticación** (opcional futura integración)
2. **CRUD de Posts** vía formularios que envían FormData.
3. **API REST** en `src/pages/api/posts.ts` con métodos GET, POST, PUT, DELETE.
4. **Renderizado de Markdown** en cliente usando `marked` y `highlight.js`.
5. **Filtrado** de posts por estado (solo `publicado`).
6. **Diseño** responsivo usando Tailwind CSS.
7. **Modo oscuro/claro** con estilos adaptativos.
8. **Categorías:** Permitir asignar múltiples categorías al crear un post mediante UI de chips.

## 6. Non-functional Requirements

- **Performance:** Lighthouse 90+ en PWA.
- **SEO:** Meta tags, Open Graph, sitemap.
- **Seguridad:** Validación de inputs y sanitización de Markdown.
- **Escalabilidad:** Código modular y API REST.

## 7. Technical Stack

- **Frontend:** Astro + Tailwind CSS + React
- **Backend:** Astro Server API + Node.js
- **Database:** PostgreSQL
- **Markdown:** marked + highlight.js
- **Imágenes:** Cloudinary

## 8. UX & UI Requirements

- Navegación clara entre listado y detalle.
- Formularios de creación/edición con validación.
- Contenedor `.prose` para contenido con tipografía legible.
- Botones de compartir y guardar.

## 9. Data & API Contract

### GET /api/posts
- Respuesta: `{ posts: PostAPI[] }`  
- `PostAPI` fields: `id, titulo, extracto, contenido, slug, imagen_destacada, estado_nombre, fecha_publicacion, autor_nombre`

### POST /api/posts
- Recibe FormData con campos del post, incluyendo `categorias[]` con los IDs de categorías seleccionadas.
- Respuesta: `{ success: true, post: PostAPI }`

### PUT /api/posts/:id
- Actualiza estado y/o contenido.

### DELETE /api/posts/:id
- Elimina un post.

## 10. Acceptance Criteria

- [ ] Se puede crear, editar y borrar posts.
- [ ] Solo posts con `estado_nombre === 'publicado'` aparecen en listado.
- [ ] Markdown se renderiza con estilos y resaltado.
- [ ] Diseño responsivo funcionando en móvil y desktop.
- [ ] Modo oscuro y claro adaptativo.
- [ ] Se pueden asignar una o más categorías a un post al crearlo.

## 11. Timeline & Milestones

| Fase             | Tiempo estimado       |
| ---------------- | --------------------- |
| Diseño & PRD     | 1 día                 |
| API & DB Schema  | 1 día                 |
| Frontend básico  | 2 días                |
| Markdown & UI    | 1 día                 |
| Testing & Deploy | 1 día                 |

## 12. Risks & Mitigations

- **Validación de Markdown:** Sanitizar con `DOMPurify` (futura mejora).
- **Escalabilidad del API:** Paginación (segunda fase).

---

*Documento generado automáticamente.*
