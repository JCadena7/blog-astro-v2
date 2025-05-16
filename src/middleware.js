import { clerkMiddleware, createRouteMatcher, createClerkClient } from '@clerk/astro/server'
import db from './db/pgHelper'
import { syncUserWithClerk } from './utils/syncUserWithClerk'
import { ENV } from './config/env'

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/blog/*', '/about', '/api/*']

// Matcher para rutas de admin
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

export const onRequest = clerkMiddleware(
  async (auth, context) => {
    const { request, locals } = context
    const path = new URL(request.url).pathname
    // console.log('path', path);
    const { userId, redirectToSignIn } = auth()

    // Si la ruta no es admin, dejar pasar
    if (!isAdminRoute(request)) {
      return
    }

    // Redirigir a sign-in si no autenticado
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: path })
    }

    // Usuarios autenticados: sincronizar y verificar rol
    const clerkClient = createClerkClient({ secretKey: ENV.CLERK_SECRET_KEY })
    const clerkUser = await clerkClient.users.getUser(userId)
    await syncUserWithClerk(clerkUser)

    const users = await db.query(
      'SELECT u.*, r.nombre AS role_name FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.clerk_id = $1',
      [userId]
    )
    const dbUser = users[0]
    locals.user = dbUser;
    // console.log('user loaded de middleware', dbUser);

    // Obtener permisos desde API interna según clerk_id
    const origin = new URL(request.url).origin;
    const permResponse = await fetch(
      `${origin}/api/user/permiso?clerk_id=${dbUser.clerk_id}`
    );
    if (!permResponse.ok) {
      console.error('Error fetching permisos de API interna:', permResponse.statusText);
      locals.permissions = [];
    } else {
      const { permisos } = await permResponse.json();
      locals.permissions = permisos;
      // console.log('permissions loaded from API interna', permisos);

      // Restringir acceso a secciones de admin solo a administradores
      if (
        path.startsWith('/admin/users') ||
        path.startsWith('/admin/comments') ||
        path.startsWith('/admin/roles')
      ) {
        if (dbUser.role_name !== 'administrador') {
          return new Response(null, {
            status: 302,
            headers: { Location: '/admin' }
          })
        }
      }

      // Validar roles permitidos
      const allowedRoles = ['administrador', 'escritor', 'editor', 'autor']
      if (!allowedRoles.includes(dbUser.role_name)) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/' }
        })
      }

      return
    }
  },
  { publicRoutes, debug: ENV.NODE_ENV === 'development' }
)